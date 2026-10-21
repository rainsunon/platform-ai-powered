package io.rydata.platform.financing.budget;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BudgetMonitorTest {

    @Test
    @DisplayName("Outflow on the same account prefix counts toward the monthly cap")
    void categorySpendMatchesAccountPrefix() {
        var facts = List.of(
                fact("5100-COGS", "Compute Clusters", "outflow", "18450.00"),
                fact("5100-COGS", "Warehouse Compute Capacity", "outflow", "23400.00"),
                fact("4000-REV", "Licensing", "inflow", "29800.00"));

        BigDecimal spend = BudgetMonitor.categorySpend(facts, "5100-COGS", "Cloud Infrastructure COGS");

        assertThat(spend).isEqualByComparingTo("41850.00");
    }

    @Test
    @DisplayName("Spend above the warning percentage and below the cap is a warning")
    void warningWhenUtilizationCrossesThreshold() {
        var threshold = new BudgetMonitor.ThresholdView(
                "bt-1", "Cloud Infrastructure COGS", "5100-COGS",
                new BigDecimal("50000.00"), 80, true, true);
        var evaluation = BudgetMonitor.evaluate(
                List.of(fact("5100-COGS", "Compute Clusters", "outflow", "41850.00")),
                List.of(threshold)).getFirst();

        assertThat(evaluation.breached()).isFalse();
        assertThat(evaluation.warning()).isTrue();
        assertThat(evaluation.status()).isEqualTo("warning");
        assertThat(evaluation.utilizationPercent()).isEqualByComparingTo("83.7");
    }

    @Test
    @DisplayName("Disabled alerts are not selected as the matching threshold")
    void skipsDisabledThresholds() {
        var disabled = new BudgetMonitor.ThresholdView(
                "bt-x", "Compute Clusters", "5100-COGS",
                new BigDecimal("1.00"), 80, false, true);
        var enabled = new BudgetMonitor.ThresholdView(
                "bt-1", "Other", "9999-OTHER",
                new BigDecimal("10.00"), 80, true, false);

        var match = BudgetMonitor.match(List.of(disabled, enabled), "5100-COGS", "Compute Clusters");

        assertThat(match).isEmpty();
    }

    private static BudgetMonitor.SpendFact fact(String account, String category, String direction, String amount) {
        return new BudgetMonitor.SpendFact(account, category, direction, new BigDecimal(amount));
    }
}
