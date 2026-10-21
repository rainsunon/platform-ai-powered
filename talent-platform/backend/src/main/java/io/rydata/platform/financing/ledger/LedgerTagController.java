package io.rydata.platform.financing.ledger;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ledger-tags")
public class LedgerTagController {

    private final LedgerTagService ledgerTagService;

    public LedgerTagController(LedgerTagService ledgerTagService) {
        this.ledgerTagService = ledgerTagService;
    }

    @GetMapping
    public List<String> list() {
        return ledgerTagService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public String add(@Valid @RequestBody CreateLedgerTagRequest request) {
        return ledgerTagService.add(request);
    }
}
