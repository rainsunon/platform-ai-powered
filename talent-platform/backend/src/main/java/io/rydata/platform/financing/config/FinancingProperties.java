package io.rydata.platform.financing.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

@Validated
@ConfigurationProperties(prefix = "financing")
public record FinancingProperties(
        @NotNull @DecimalMin("0.00") BigDecimal dualSignThreshold,
        @NotBlank String defaultActorName,
        @NotBlank String problemTypeBaseUri
) {
}
