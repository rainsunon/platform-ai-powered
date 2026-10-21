package io.rydata.platform.financing.billing;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<InvoiceResponse> list() {
        return invoiceService.list();
    }

    @GetMapping("/{id}")
    public InvoiceResponse get(@PathVariable String id) {
        return invoiceService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse create(@Valid @RequestBody CreateInvoiceRequest request) {
        return invoiceService.create(request);
    }

    @PostMapping("/batch-authorizations")
    public List<InvoiceResponse> batchAuthorize() {
        return invoiceService.batchAuthorize();
    }

    @PostMapping("/{id}/authorizations")
    public InvoiceResponse authorize(@PathVariable String id) {
        return invoiceService.authorize(id);
    }

    @PostMapping("/{id}/disputes")
    public InvoiceResponse dispute(@PathVariable String id, @RequestBody(required = false) DisputeInvoiceRequest request) {
        return invoiceService.dispute(id, request == null ? new DisputeInvoiceRequest(null) : request);
    }
}
