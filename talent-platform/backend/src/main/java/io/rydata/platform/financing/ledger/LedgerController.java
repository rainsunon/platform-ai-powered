package io.rydata.platform.financing.ledger;

import jakarta.validation.Valid;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class LedgerController {

    private final LedgerService ledgerService;

    public LedgerController(LedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @GetMapping
    public List<LedgerTransactionResponse> list(
            @RequestParam(required = false) @Nullable String entity,
            @RequestParam(required = false) @Nullable String client,
            @RequestParam(required = false) @Nullable String accountCode,
            @RequestParam(required = false) @Nullable String tag,
            @RequestParam(required = false) @Nullable String q) {
        return ledgerService.list(entity, client, accountCode, tag, q);
    }

    @GetMapping("/{id}")
    public LedgerTransactionResponse get(@PathVariable String id) {
        return ledgerService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LedgerTransactionResponse create(@Valid @RequestBody CreateTransactionRequest request) {
        return ledgerService.create(request);
    }

    @PatchMapping("/{id}")
    public LedgerTransactionResponse update(@PathVariable String id, @Valid @RequestBody UpdateTransactionRequest request) {
        return ledgerService.update(id, request);
    }

    @PostMapping("/batch-approvals")
    public List<LedgerTransactionResponse> batchApprove() {
        return ledgerService.batchApprove();
    }

    @PostMapping("/{id}/approvals")
    public LedgerTransactionResponse approve(@PathVariable String id) {
        return ledgerService.approve(id);
    }
}
