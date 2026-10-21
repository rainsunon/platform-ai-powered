package io.rydata.platform.financing.ledger;

import jakarta.validation.constraints.NotBlank;

public record CreateLedgerTagRequest(@NotBlank String name) {
}
