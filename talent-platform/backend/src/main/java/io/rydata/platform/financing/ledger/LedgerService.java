package io.rydata.platform.financing.ledger;

import io.rydata.platform.financing.budget.BudgetMonitor;
import io.rydata.platform.financing.budget.BudgetThresholdRepository;
import io.rydata.platform.financing.common.BusinessIds;
import io.rydata.platform.financing.common.Texts;
import io.rydata.platform.financing.common.exception.BusinessRuleViolationException;
import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import io.rydata.platform.financing.compliance.AuditCategory;
import io.rydata.platform.financing.compliance.AuditCommand;
import io.rydata.platform.financing.compliance.AuditDeltaResponse;
import io.rydata.platform.financing.compliance.AuditSeverity;
import io.rydata.platform.financing.compliance.AuditTrail;
import io.rydata.platform.financing.compliance.FiscalPeriodService;
import io.rydata.platform.financing.governance.GovernanceItemRepository;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class LedgerService {

    private static final Logger log = LoggerFactory.getLogger(LedgerService.class);
    private static final BigDecimal DEFAULT_AMOUNT = new BigDecimal("10000.00");

    private final LedgerTransactionRepository transactionRepository;
    private final LedgerQueryMapper ledgerQueryMapper;
    private final LedgerTagRepository ledgerTagRepository;
    private final BudgetThresholdRepository budgetThresholdRepository;
    private final GovernanceItemRepository governanceItemRepository;
    private final FiscalPeriodService fiscalPeriodService;
    private final AuditTrail auditTrail;
    private final BusinessIds businessIds;
    private final LedgerPostingPolicy postingPolicy;

    public LedgerService(
            LedgerTransactionRepository transactionRepository,
            LedgerQueryMapper ledgerQueryMapper,
            LedgerTagRepository ledgerTagRepository,
            BudgetThresholdRepository budgetThresholdRepository,
            GovernanceItemRepository governanceItemRepository,
            FiscalPeriodService fiscalPeriodService,
            AuditTrail auditTrail,
            BusinessIds businessIds,
            LedgerPostingPolicy postingPolicy) {
        this.transactionRepository = transactionRepository;
        this.ledgerQueryMapper = ledgerQueryMapper;
        this.ledgerTagRepository = ledgerTagRepository;
        this.budgetThresholdRepository = budgetThresholdRepository;
        this.governanceItemRepository = governanceItemRepository;
        this.fiscalPeriodService = fiscalPeriodService;
        this.auditTrail = auditTrail;
        this.businessIds = businessIds;
        this.postingPolicy = postingPolicy;
    }

    public List<LedgerTransactionResponse> list(
            @Nullable String entity,
            @Nullable String client,
            @Nullable String accountCode,
            @Nullable String tag,
            @Nullable String query) {
        return ledgerQueryMapper.search(
                        emptyIfBlank(entity),
                        emptyIfBlank(client),
                        emptyIfBlank(accountCode),
                        emptyIfBlank(tag),
                        emptyIfBlank(query))
                .stream()
                .map(LedgerSearchRow::toResponse)
                .toList();
    }

    public LedgerTransactionResponse get(String id) {
        return LedgerTransactionResponse.from(load(id));
    }

    @Transactional
    public LedgerTransactionResponse create(CreateTransactionRequest request) {
        fiscalPeriodService.requireOpen();
        BigDecimal amount = request.amount() == null || request.amount().signum() == 0 ? DEFAULT_AMOUNT : request.amount();
        LedgerPostingPolicy.PostingDecision decision = postingPolicy.decide(amount);
        List<String> tags = normalizeTags(request.tags());
        LedgerTransaction transaction = LedgerTransaction.post(
                businessIds.next("tx-"),
                businessIds.transactionRef(),
                "Today, Just now",
                Texts.orDefault(request.entity(), "Acme Global Holdings"),
                Texts.orDefault(request.client(), "New Client Account"),
                Texts.orDefault(request.accountCode(), "1200-AR"),
                Texts.orDefault(request.category(), "Consulting Retainer"),
                amount,
                decision.direction(),
                decision.status(),
                Texts.orDefault(request.method(), "Swift Wire"),
                decision.requiresDualSign(),
                decision.approved(),
                tags);

        BudgetAssessment assessment = assessBudget(transaction);
        if (assessment.breached() && assessment.autoFlag()) {
            transaction.flagForDualControl();
        }
        rememberTags(tags);
        LedgerTransaction saved = transactionRepository.save(transaction);
        auditTrail.record(postingAudit(saved, assessment));
        log.info("Posted ledger transaction {} amount {}", saved.getRef(), saved.getAmount());
        return LedgerTransactionResponse.from(saved);
    }

    @Transactional
    public LedgerTransactionResponse update(String id, UpdateTransactionRequest request) {
        fiscalPeriodService.requireOpen();
        LedgerTransaction transaction = load(id);
        List<AuditDeltaResponse> deltas = new ArrayList<>();
        if (request.entity() != null && !request.entity().isBlank() && !request.entity().equals(transaction.getEntityName())) {
            deltas.add(delta("Entity", transaction.getEntityName(), request.entity().trim()));
            transaction.renameEntity(request.entity().trim());
        }
        if (request.client() != null && !request.client().isBlank() && !request.client().equals(transaction.getClientName())) {
            deltas.add(delta("Counterparty", transaction.getClientName(), request.client().trim()));
            transaction.renameClient(request.client().trim());
        }
        if (request.category() != null && !request.category().isBlank() && !request.category().equals(transaction.getCategory())) {
            deltas.add(delta("Category", transaction.getCategory(), request.category().trim()));
            transaction.reclassify(
                    request.accountCode() == null || request.accountCode().isBlank()
                            ? transaction.getAccountCode()
                            : request.accountCode().trim(),
                    request.category().trim());
        } else if (request.accountCode() != null && !request.accountCode().isBlank()
                && !request.accountCode().equals(transaction.getAccountCode())) {
            deltas.add(delta("AccountCode", transaction.getAccountCode(), request.accountCode().trim()));
            transaction.reclassify(request.accountCode().trim(), transaction.getCategory());
        }
        if (request.amount() != null && request.amount().compareTo(transaction.getAmount()) != 0) {
            if (request.amount().signum() == 0) {
                throw new BusinessRuleViolationException("AMOUNT_REQUIRED", "Amount cannot be zero");
            }
            deltas.add(delta("Amount", money(transaction.getAmount()), money(request.amount())));
            transaction.changeAmount(request.amount(), CashDirection.fromAmountSign(request.amount().signum()));
            if (postingPolicy.crossesDualSignThreshold(request.amount())) {
                transaction.flagForDualControl();
            }
        }
        if (request.method() != null && !request.method().isBlank()) {
            transaction.changeMethod(request.method().trim());
        }
        if (request.tags() != null) {
            List<String> tags = normalizeTags(request.tags());
            deltas.add(delta("Tags", String.join("; ", transaction.getTags()), String.join("; ", tags)));
            transaction.replaceTags(tags);
            rememberTags(tags);
        }
        if (deltas.isEmpty()) {
            deltas.add(delta("Voucher", "Previous state", "Updated state"));
        }
        auditTrail.record(new AuditCommand(
                "MANUAL_ENTRY_MODIFIED",
                AuditCategory.MODIFICATION,
                transaction.getEntityName(),
                transaction.getRef() + " (" + transaction.getClientName() + ")",
                AuditSeverity.MEDIUM,
                Texts.orDefault(request.reason(), "Updated voucher parameters."),
                deltas));
        return LedgerTransactionResponse.from(transaction);
    }

    @Transactional
    public LedgerTransactionResponse approve(String id) {
        LedgerTransaction transaction = load(id);
        if (!transaction.isApproved()) {
            String previous = transaction.getStatus().wire();
            transaction.markVerified();
            auditTrail.record(new AuditCommand(
                    "TRANSACTION_APPROVED",
                    AuditCategory.APPROVAL,
                    transaction.getEntityName(),
                    transaction.getRef() + " (" + transaction.getClientName() + ")",
                    AuditSeverity.HIGH,
                    "Transaction marked verified and posted in the primary books.",
                    List.of(delta("LedgerStatus", previous, transaction.getStatus().wire()))));
        }
        return LedgerTransactionResponse.from(transaction);
    }

    @Transactional
    public List<LedgerTransactionResponse> batchApprove() {
        List<LedgerTransaction> transactions = transactionRepository.findAllByOrderByCreatedAtDesc();
        transactions.forEach(LedgerTransaction::markVerified);
        governanceItemRepository.findAllByOrderByCreatedAtDesc()
                .forEach(item -> item.sign("Elena Rostova (Executive VP)"));
        auditTrail.record(new AuditCommand(
                "BATCH_APPROVAL",
                AuditCategory.APPROVAL,
                fiscalPeriodService.current().entity(),
                "Ledger batch",
                AuditSeverity.HIGH,
                "Pending ledger statements and threshold items approved.",
                List.of(delta("Batch", "Pending", "Verified"))));
        return transactions.stream().map(LedgerTransactionResponse::from).toList();
    }

    private LedgerTransaction load(String id) {
        return transactionRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TRANSACTION_NOT_FOUND", "Transaction " + id + " was not found"));
    }

    private BudgetAssessment assessBudget(LedgerTransaction transaction) {
        if (transaction.getDirection() != CashDirection.OUTFLOW) {
            return BudgetAssessment.none();
        }
        List<BudgetMonitor.ThresholdView> thresholds = budgetThresholdRepository.findAllByOrderByIdAsc().stream()
                .map(threshold -> threshold.toView())
                .toList();
        var matched = BudgetMonitor.match(thresholds, transaction.getAccountCode(), transaction.getCategory());
        if (matched.isEmpty()) {
            return BudgetAssessment.none();
        }
        BudgetMonitor.ThresholdView threshold = matched.get();
        List<BudgetMonitor.SpendFact> facts = new ArrayList<>(ledgerQueryMapper.findSpendFacts());
        facts.add(new BudgetMonitor.SpendFact(
                transaction.getAccountCode(),
                transaction.getCategory(),
                transaction.getDirection().wire(),
                transaction.getAmount()));
        BigDecimal spend = BudgetMonitor.categorySpend(facts, threshold.accountCode(), threshold.category());
        boolean breached = spend.compareTo(threshold.monthlyBudget()) > 0;
        return new BudgetAssessment(breached, threshold.autoFlagTransactions(), threshold.category(), spend, threshold.monthlyBudget());
    }

    private AuditCommand postingAudit(LedgerTransaction transaction, BudgetAssessment assessment) {
        BigDecimal absolute = transaction.getAmount().abs();
        String tags = transaction.getTags().isEmpty() ? "General" : String.join("; ", transaction.getTags());
        List<AuditDeltaResponse> deltas = new ArrayList<>();
        deltas.add(delta("AccountCode", "Unallocated", transaction.getAccountCode()));
        deltas.add(delta("Amount", "$0.00", money(absolute)));
        deltas.add(delta("Direction", "None", transaction.getDirection().name()));
        deltas.add(delta("Tags", "None", tags));
        deltas.add(delta("Counterparty", "None", transaction.getClientName()));
        String details;
        String action = "MANUAL_ENTRY_POSTED";
        AuditSeverity severity = absolute.compareTo(new BigDecimal("10000")) > 0 ? AuditSeverity.HIGH : AuditSeverity.MEDIUM;
        if (assessment.breached()) {
            action = "BUDGET_CAP_EXCEEDED";
            severity = AuditSeverity.CRITICAL;
            deltas.add(delta(
                    "BudgetStatus",
                    "Within Cap",
                    "BREACHED (" + money(assessment.spend()) + " / " + money(assessment.budget()) + ")"));
            details = "Transaction exceeded monthly budget cap for " + assessment.category()
                    + " (Spent: " + money(assessment.spend()) + " / Budget: " + money(assessment.budget()) + ").";
        } else {
            String renderedTags = transaction.getTags().stream().map(tag -> "#" + tag).reduce((left, right) -> left + ", " + right).orElse("#General");
            details = "Manual general ledger voucher created with tags [" + renderedTags
                    + "]. Account: " + transaction.getAccountCode() + ". Rail: " + transaction.getMethod() + ".";
        }
        return new AuditCommand(
                action,
                AuditCategory.MANUAL_ENTRY,
                transaction.getEntityName(),
                transaction.getRef() + " (" + transaction.getClientName() + " • " + money(absolute) + ")",
                severity,
                details,
                deltas);
    }

    private void rememberTags(List<String> tags) {
        for (String tag : tags) {
            if (!ledgerTagRepository.existsById(tag)) {
                ledgerTagRepository.save(LedgerTag.of(tag));
            }
        }
    }

    private static String emptyIfBlank(@Nullable String value) {
        String normalized = Texts.blankToNull(value);
        return normalized == null ? "" : normalized;
    }

    private static List<String> normalizeTags(@Nullable List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of("General");
        }
        List<String> normalized = tags.stream()
                .filter(tag -> tag != null && !tag.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        return normalized.isEmpty() ? List.of("General") : normalized;
    }

    private static AuditDeltaResponse delta(String field, String previous, String current) {
        return new AuditDeltaResponse(field, previous, current);
    }

    private static String money(BigDecimal amount) {
        return NumberFormat.getCurrencyInstance(Locale.US).format(amount.abs());
    }

    private record BudgetAssessment(
            boolean breached,
            boolean autoFlag,
            @Nullable String category,
            @Nullable BigDecimal spend,
            @Nullable BigDecimal budget
    ) {
        static BudgetAssessment none() {
            return new BudgetAssessment(false, false, null, null, null);
        }
    }
}
