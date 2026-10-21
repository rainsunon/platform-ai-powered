package io.rydata.platform.financing.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final ActorRoleAuthenticationFilter actorRoleAuthenticationFilter;
    private final CorrelationIdFilter correlationIdFilter;
    private final JsonMapper jsonMapper;
    private final FinancingProperties properties;

    public SecurityConfig(
            ActorRoleAuthenticationFilter actorRoleAuthenticationFilter,
            CorrelationIdFilter correlationIdFilter,
            JsonMapper jsonMapper,
            FinancingProperties properties) {
        this.actorRoleAuthenticationFilter = actorRoleAuthenticationFilter;
        this.correlationIdFilter = correlationIdFilter;
        this.jsonMapper = jsonMapper;
        this.properties = properties;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handlers -> handlers
                        .authenticationEntryPoint((request, response, exception) -> write(
                                response, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication is required"))
                        .accessDeniedHandler((request, response, exception) -> write(
                                response, HttpStatus.FORBIDDEN, "FORBIDDEN", "You do not have permission to perform this action")))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/graphql", "/graphiql/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/audit-events", "/api/v1/audit-events/**")
                            .hasAnyRole("MANAGER", "MEMBER")
                        .requestMatchers(HttpMethod.GET, "/api/v1/budget-thresholds", "/api/v1/budget-thresholds/**", "/api/v1/budget-reports")
                            .hasAnyRole("MANAGER", "MEMBER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/transactions/*/approvals", "/api/v1/transactions/batch-approvals")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/transactions", "/api/v1/transactions/**")
                            .hasAnyRole("MANAGER", "MEMBER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/transactions/**")
                            .hasAnyRole("MANAGER", "MEMBER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/governance-items/*/signatures")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/invoices/batch-authorizations", "/api/v1/invoices/*/authorizations")
                            .hasAnyRole("MANAGER", "CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/invoices/*/disputes")
                            .hasAnyRole("MANAGER", "CLIENT_ADMIN", "CLIENT_STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/v1/invoices")
                            .hasAnyRole("MANAGER", "MEMBER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/members/**")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/members/**")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/fiscal-period/**")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/fiscal-period")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/budget-thresholds")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/budget-thresholds/**")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/budget-thresholds/**")
                            .hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/vault-files")
                            .hasAnyRole("MANAGER", "MEMBER", "CLIENT_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/milestones/**")
                            .hasAnyRole("MANAGER", "MEMBER", "CLIENT_PLANNER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/ledger-tags")
                            .hasAnyRole("MANAGER", "MEMBER")
                        .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
                        .anyRequest().authenticated())
                .addFilterBefore(correlationIdFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(actorRoleAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    FilterRegistrationBean<ActorRoleAuthenticationFilter> actorRoleFilterRegistration(ActorRoleAuthenticationFilter filter) {
        FilterRegistrationBean<ActorRoleAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    FilterRegistrationBean<CorrelationIdFilter> correlationFilterRegistration(CorrelationIdFilter filter) {
        FilterRegistrationBean<CorrelationIdFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "X-Actor-Role", "X-Client-Enclave", "X-Request-Id"));
        configuration.setExposedHeaders(List.of("X-Request-Id"));
        configuration.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private void write(HttpServletResponse response, HttpStatus status, String code, String detail) throws java.io.IOException {
        ProblemResponses.write(jsonMapper, response, status, code, detail, properties.problemTypeBaseUri());
    }
}
