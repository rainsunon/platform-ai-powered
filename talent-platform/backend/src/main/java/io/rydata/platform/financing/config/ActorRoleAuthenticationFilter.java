package io.rydata.platform.financing.config;

import io.rydata.platform.financing.common.security.ActorAuthenticationToken;
import io.rydata.platform.financing.common.security.PlatformRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

@Component
public class ActorRoleAuthenticationFilter extends OncePerRequestFilter {

    public static final String ROLE_HEADER = "X-Actor-Role";

    private final JsonMapper jsonMapper;
    private final FinancingProperties properties;

    public ActorRoleAuthenticationFilter(JsonMapper jsonMapper, FinancingProperties properties) {
        this.jsonMapper = jsonMapper;
        this.properties = properties;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(ROLE_HEADER);
        PlatformRole role = PlatformRole.MANAGER;
        if (header != null && !header.isBlank()) {
            var resolved = PlatformRole.fromWire(header.trim());
            if (resolved.isEmpty()) {
                ProblemResponses.write(
                        jsonMapper,
                        response,
                        HttpStatus.BAD_REQUEST,
                        "UNKNOWN_ROLE",
                        "X-Actor-Role must be manager, member, client_admin, client_staff, or client_planner",
                        properties.problemTypeBaseUri());
                return;
            }
            role = resolved.get();
        }
        SecurityContextHolder.getContext().setAuthentication(new ActorAuthenticationToken(role));
        filterChain.doFilter(request, response);
    }
}
