package io.rydata.platform.financing.compliance;

public record FiscalPeriodResponse(boolean locked, String entity) {

    public static FiscalPeriodResponse from(FiscalPeriod period) {
        return new FiscalPeriodResponse(period.isLocked(), period.getEntityName());
    }
}
