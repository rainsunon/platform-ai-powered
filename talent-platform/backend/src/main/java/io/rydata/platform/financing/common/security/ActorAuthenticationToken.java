package io.rydata.platform.financing.common.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public final class ActorAuthenticationToken extends AbstractAuthenticationToken {

    private final PlatformRole role;

    public ActorAuthenticationToken(PlatformRole role) {
        super(List.of(new SimpleGrantedAuthority("ROLE_" + role.authority())));
        this.role = role;
        setAuthenticated(true);
    }

    public PlatformRole role() {
        return role;
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public Object getPrincipal() {
        return role.actorName();
    }
}
