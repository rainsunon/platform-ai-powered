package io.rydata.platform.financing.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI financingOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Financing API")
                .version("v1")
                .description("""
                        Ledger, billing, governance, vault, and access APIs for the talent platform.
                        Send X-Actor-Role (manager, member, client_admin, client_staff, client_planner) to match the UI lens.
                        When the header is omitted the call runs as manager.
                        """));
    }
}
