package io.rydata.platform.financing.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FinancingPropertiesTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
            .withUserConfiguration(PropertiesConfiguration.class);

    @Test
    @DisplayName("Environment variable names bind the dual-sign threshold")
    void bindsEnvironmentOverride() {
        var source = new SystemEnvironmentPropertySource("env", Map.of(
                "FINANCING_DUAL_SIGN_THRESHOLD", "25000.00",
                "FINANCING_DEFAULT_ACTOR_NAME", "Elena Rostova (Executive VP)",
                "FINANCING_PROBLEM_TYPE_BASE_URI", "https://api.rydata.io/errors/"));
        FinancingProperties properties = new Binder(ConfigurationPropertySources.from(source))
                .bind("financing", Bindable.of(FinancingProperties.class))
                .get();

        assertThat(properties.dualSignThreshold()).isEqualByComparingTo(new BigDecimal("25000.00"));
        assertThat(properties.defaultActorName()).isEqualTo("Elena Rostova (Executive VP)");
    }

    @Test
    @DisplayName("A negative dual-sign threshold fails startup")
    void rejectsNegativeThreshold() {
        runner.withPropertyValues(
                        "financing.dual-sign-threshold=-1",
                        "financing.default-actor-name=Elena Rostova (Executive VP)",
                        "financing.problem-type-base-uri=https://api.rydata.io/errors/")
                .run(context -> assertThat(context).hasFailed());
    }

    @EnableConfigurationProperties(FinancingProperties.class)
    static class PropertiesConfiguration {
    }
}
