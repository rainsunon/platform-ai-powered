package io.rydata.platform.financing.billing;

import io.rydata.platform.financing.common.BusinessIds;
import io.rydata.platform.financing.common.Texts;
import io.rydata.platform.financing.common.exception.ResourceNotFoundException;
import io.rydata.platform.financing.common.security.CurrentActor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);
    private static final BigDecimal DEFAULT_AMOUNT = new BigDecimal("25000.00");
    private static final DateTimeFormatter FULL_DATE = DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.US);
    private static final DateTimeFormatter MONTH_DAY = DateTimeFormatter.ofPattern("MMM dd", Locale.US);

    private final InvoiceRepository invoiceRepository;
    private final BusinessIds businessIds;
    private final CurrentActor currentActor;

    public InvoiceService(InvoiceRepository invoiceRepository, BusinessIds businessIds, CurrentActor currentActor) {
        this.invoiceRepository = invoiceRepository;
        this.businessIds = businessIds;
        this.currentActor = currentActor;
    }

    public List<InvoiceResponse> list() {
        boolean maskMargins = !currentActor.role().canViewMargins();
        boolean maskBank = !currentActor.role().canViewBanking();
        return invoiceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(invoice -> InvoiceResponse.from(invoice, maskMargins, maskBank))
                .toList();
    }

    public InvoiceResponse get(String id) {
        return present(load(id));
    }

    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest request) {
        BigDecimal amount = request.amount() == null ? DEFAULT_AMOUNT : request.amount();
        String client = Texts.orDefault(request.clientEntity(), "New Client Partner");
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate first = today.withDayOfMonth(1);
        LocalDate last = today.withDayOfMonth(today.lengthOfMonth());
        Invoice invoice = Invoice.issue(
                uniqueInvoiceId(),
                client,
                Texts.orDefault(request.clientSubUnit(), "Standard Account"),
                initials(client),
                Texts.orDefault(request.scopeRole(), "Client Admin"),
                FULL_DATE.format(today),
                FULL_DATE.format(today.plusDays(30)),
                amount,
                MONTH_DAY.format(first) + " - " + FULL_DATE.format(last),
                "US-EIN-99281033",
                amount.multiply(new BigDecimal("0.45")).setScale(2, RoundingMode.HALF_UP),
                amount.multiply(new BigDecimal("0.55")).setScale(2, RoundingMode.HALF_UP),
                new BigDecimal("55.00"),
                new BigDecimal("5000.00"),
                "J.P. Morgan Chase (•••• 8912)",
                "ACH Same-Day Verified");
        if (request.lineItems() == null || request.lineItems().isEmpty()) {
            invoice.addLine(businessIds.next("li-"), "Advisory Retainer Deliverable", "Standard monthly strategic consultation", amount);
        } else {
            request.lineItems().forEach(line ->
                    invoice.addLine(businessIds.next("li-"), line.title().trim(), line.description().trim(), line.amount()));
        }
        Invoice saved = invoiceRepository.save(invoice);
        log.info("Issued invoice {} for {}", saved.getId(), saved.getClientEntity());
        return present(saved);
    }

    @Transactional
    public InvoiceResponse authorize(String id) {
        Invoice invoice = load(id);
        if (invoice.getStatus() != InvoiceStatus.PAID_SETTLED) {
            invoice.settle();
            log.info("Settled invoice {}", invoice.getId());
        }
        return present(invoice);
    }

    @Transactional
    public InvoiceResponse dispute(String id, DisputeInvoiceRequest request) {
        Invoice invoice = load(id);
        invoice.dispute(Texts.orDefault(request.reason(), "Client audit inquiry"));
        return present(invoice);
    }

    @Transactional
    public List<InvoiceResponse> batchAuthorize() {
        List<Invoice> invoices = invoiceRepository.findAllByOrderByCreatedAtDesc();
        invoices.stream()
                .filter(invoice -> invoice.getStatus() == InvoiceStatus.PENDING_CLIENT_APPROVAL)
                .forEach(Invoice::settle);
        boolean maskMargins = !currentActor.role().canViewMargins();
        boolean maskBank = !currentActor.role().canViewBanking();
        return invoices.stream()
                .map(invoice -> InvoiceResponse.from(invoice, maskMargins, maskBank))
                .toList();
    }

    private InvoiceResponse present(Invoice invoice) {
        return InvoiceResponse.from(
                invoice,
                !currentActor.role().canViewMargins(),
                !currentActor.role().canViewBanking());
    }

    private Invoice load(String id) {
        return invoiceRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("INVOICE_NOT_FOUND", "Invoice " + id + " was not found"));
    }

    private String uniqueInvoiceId() {
        String id = businessIds.invoiceId();
        int guard = 0;
        while (invoiceRepository.existsById(id) && guard < 5) {
            id = businessIds.invoiceId();
            guard++;
        }
        return id;
    }

    private static String initials(String client) {
        String source = client.isBlank() ? "NC" : client.trim();
        if (source.length() < 2) {
            source = (source + "C").substring(0, 2);
        }
        return source.substring(0, 2).toUpperCase(Locale.ROOT);
    }
}
