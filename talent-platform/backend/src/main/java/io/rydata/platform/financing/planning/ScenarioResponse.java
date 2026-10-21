package io.rydata.platform.financing.planning;

public record ScenarioResponse(
        String id,
        String label,
        String arr,
        String burn,
        String capex,
        String runway,
        int fte,
        int gtm,
        String chartPath,
        String chartArea
) {
}
