package io.rydata.platform.financing.budget;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping("/budget-thresholds")
    public List<BudgetThresholdResponse> list() {
        return budgetService.list();
    }

    @GetMapping("/budget-reports")
    public List<BudgetReportResponse> reports() {
        return budgetService.reports();
    }

    @PostMapping("/budget-thresholds")
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetThresholdResponse create(@Valid @RequestBody CreateBudgetThresholdRequest request) {
        return budgetService.create(request);
    }

    @PatchMapping("/budget-thresholds/{id}")
    public BudgetThresholdResponse update(@PathVariable String id, @Valid @RequestBody UpdateBudgetThresholdRequest request) {
        return budgetService.update(id, request);
    }

    @DeleteMapping("/budget-thresholds/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        budgetService.delete(id);
    }
}
