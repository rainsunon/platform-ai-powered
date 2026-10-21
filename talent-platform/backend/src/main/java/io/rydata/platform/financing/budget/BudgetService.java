package io.rydata.platform.financing.budget;

import io.rydata.platform.financing.common.BusinessIds;
import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import io.rydata.platform.financing.ledger.LedgerQueryMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class BudgetService {

    private final BudgetThresholdRepository budgetThresholdRepository;
    private final LedgerQueryMapper ledgerQueryMapper;
    private final BusinessIds businessIds;

    public BudgetService(
            BudgetThresholdRepository budgetThresholdRepository,
            LedgerQueryMapper ledgerQueryMapper,
            BusinessIds businessIds) {
        this.budgetThresholdRepository = budgetThresholdRepository;
        this.ledgerQueryMapper = ledgerQueryMapper;
        this.businessIds = businessIds;
    }

    public List<BudgetThresholdResponse> list() {
        return budgetThresholdRepository.findAllByOrderByIdAsc().stream()
                .map(BudgetThresholdResponse::from)
                .toList();
    }

    public List<BudgetReportResponse> reports() {
        List<BudgetMonitor.SpendFact> facts = ledgerQueryMapper.findSpendFacts();
        List<BudgetThreshold> thresholds = budgetThresholdRepository.findAllByOrderByIdAsc();
        var byId = thresholds.stream().collect(Collectors.toMap(BudgetThreshold::getId, Function.identity()));
        return BudgetMonitor.evaluate(facts, thresholds.stream().map(BudgetThreshold::toView).toList()).stream()
                .map(evaluation -> new BudgetReportResponse(
                        BudgetThresholdResponse.from(byId.get(evaluation.threshold().id())),
                        evaluation.currentSpend(),
                        evaluation.remainingBudget(),
                        evaluation.utilizationPercent(),
                        evaluation.status(),
                        evaluation.breached(),
                        evaluation.warning()))
                .toList();
    }

    @Transactional
    public BudgetThresholdResponse create(CreateBudgetThresholdRequest request) {
        BudgetThreshold threshold = BudgetThreshold.create(
                businessIds.next("bt-"),
                request.category().trim(),
                request.accountCode().trim(),
                request.monthlyBudget(),
                request.warningPercentage(),
                request.alertEnabled(),
                request.autoFlagTransactions(),
                request.notes());
        return BudgetThresholdResponse.from(budgetThresholdRepository.save(threshold));
    }

    @Transactional
    public BudgetThresholdResponse update(String id, UpdateBudgetThresholdRequest request) {
        BudgetThreshold threshold = load(id);
        threshold.apply(
                request.category(),
                request.accountCode(),
                request.monthlyBudget(),
                request.warningPercentage(),
                request.alertEnabled(),
                request.autoFlagTransactions(),
                request.notes(),
                request.notes() != null);
        return BudgetThresholdResponse.from(threshold);
    }

    @Transactional
    public void delete(String id) {
        if (!budgetThresholdRepository.existsById(id)) {
            throw new ResourceNotFoundException("BUDGET_NOT_FOUND", "Budget threshold " + id + " was not found");
        }
        budgetThresholdRepository.deleteById(id);
    }

    private BudgetThreshold load(String id) {
        return budgetThresholdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BUDGET_NOT_FOUND", "Budget threshold " + id + " was not found"));
    }
}
