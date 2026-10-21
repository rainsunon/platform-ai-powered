package io.rydata.platform.financing.identity;

public record CapabilitiesResponse(boolean invoicing, boolean banking, boolean planning, boolean audit) {

    public static CapabilitiesResponse from(MemberCapabilities capabilities) {
        return new CapabilitiesResponse(
                capabilities.isInvoicing(),
                capabilities.isBanking(),
                capabilities.isPlanning(),
                capabilities.isAudit());
    }
}
