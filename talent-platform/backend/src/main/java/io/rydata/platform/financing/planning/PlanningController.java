package io.rydata.platform.financing.planning;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PlanningController {

    private final MilestoneService milestoneService;
    private final ScenarioCatalog scenarioCatalog;

    public PlanningController(MilestoneService milestoneService, ScenarioCatalog scenarioCatalog) {
        this.milestoneService = milestoneService;
        this.scenarioCatalog = scenarioCatalog;
    }

    @GetMapping("/api/v1/milestones")
    public List<MilestoneResponse> milestones() {
        return milestoneService.list();
    }

    @PatchMapping("/api/v1/milestones/{id}")
    public MilestoneResponse updateMilestone(@PathVariable String id, @Valid @RequestBody UpdateMilestoneRequest request) {
        return milestoneService.update(id, request);
    }

    @GetMapping("/api/v1/scenarios")
    public List<ScenarioResponse> scenarios() {
        return scenarioCatalog.all();
    }
}
