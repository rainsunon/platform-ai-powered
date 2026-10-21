package io.rydata.platform.financing.identity;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
public class IdentityController {

    private final IdentityService identityService;

    public IdentityController(IdentityService identityService) {
        this.identityService = identityService;
    }

    @GetMapping
    public List<TeamMemberResponse> list() {
        return identityService.list();
    }

    @GetMapping("/{id}")
    public TeamMemberResponse get(@PathVariable String id) {
        return identityService.get(id);
    }

    @PatchMapping("/{id}")
    public TeamMemberResponse update(@PathVariable String id, @Valid @RequestBody UpdateMemberRequest request) {
        return identityService.update(id, request);
    }

    @PostMapping("/{id}/revocations")
    public TeamMemberResponse revoke(@PathVariable String id) {
        return identityService.revoke(id);
    }
}
