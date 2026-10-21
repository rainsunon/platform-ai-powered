package io.rydata.platform.financing.compliance;

import org.jspecify.annotations.Nullable;

public record UpdateFiscalPeriodRequest(@Nullable Boolean locked, @Nullable String entity) {
}
