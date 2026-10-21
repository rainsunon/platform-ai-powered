package io.rydata.platform.financing.governance;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/governance-items")
public class GovernanceController {

    private final GovernanceService governanceService;

    public GovernanceController(GovernanceService governanceService) {
        this.governanceService = governanceService;
    }

    @GetMapping
    public List<GovernanceItemResponse> list() {
        return governanceService.list();
    }

    @PostMapping("/{id}/signatures")
    public GovernanceItemResponse sign(@PathVariable String id) {
        return governanceService.sign(id);
    }
}
