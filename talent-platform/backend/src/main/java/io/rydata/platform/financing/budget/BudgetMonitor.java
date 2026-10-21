package io.rydata.platform.financing.budget;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public final class BudgetMonitor {

    private BudgetMonitor() {
    }

    public record SpendFact(String accountCode, String category, String direction, BigDecimal amount) {
    }

    public record ThresholdView(
            String id,
            String category,
            String accountCode,
            BigDecimal monthlyBudget,
            int warningPercentage,
            boolean alertEnabled,
            boolean autoFlagTransactions
    ) {
    }

    public record Evaluation(
            ThresholdView threshold,
            BigDecimal currentSpend,
            BigDecimal remainingBudget,
            BigDecimal utilizationPercent,
            String status,
            boolean breached,
            boolean warning
    ) {
    }

    public static BigDecimal categorySpend(List<SpendFact> transactions, String accountCode, String categoryName) {
        String prefix = accountCode.toLowerCase(Locale.ROOT).split("-")[0];
        return transactions.stream()
                .filter(transaction -> "outflow".equalsIgnoreCase(transaction.direction()))
                .filter(transaction -> matches(transaction, prefix, categoryName))
                .map(transaction -> transaction.amount().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static Optional<ThresholdView> match(List<ThresholdView> thresholds, String accountCode, String category) {
        return thresholds.stream()
                .filter(ThresholdView::alertEnabled)
                .filter(threshold -> accountCode.toLowerCase(Locale.ROOT).startsWith(prefixOf(threshold))
                        || categoryMatches(category, threshold.category()))
                .findFirst();
    }

    public static List<Evaluation> evaluate(List<SpendFact> transactions, List<ThresholdView> thresholds) {
        return thresholds.stream()
                .map(threshold -> evaluateOne(transactions, threshold))
                .toList();
    }

    private static Evaluation evaluateOne(List<SpendFact> transactions, ThresholdView threshold) {
        BigDecimal currentSpend = categorySpend(transactions, threshold.accountCode(), threshold.category());
        BigDecimal utilization = threshold.monthlyBudget().signum() == 0
                ? BigDecimal.ZERO
                : currentSpend.multiply(BigDecimal.valueOf(100))
                .divide(threshold.monthlyBudget(), 1, RoundingMode.HALF_UP);
        boolean breached = currentSpend.compareTo(threshold.monthlyBudget()) > 0;
        boolean warning = !breached && utilization.compareTo(BigDecimal.valueOf(threshold.warningPercentage())) >= 0;
        String status = breached ? "exceeded" : warning ? "warning" : "normal";
        BigDecimal remaining = threshold.monthlyBudget().subtract(currentSpend).max(BigDecimal.ZERO);
        return new Evaluation(threshold, currentSpend, remaining, utilization, status, breached, warning);
    }

    private static boolean matches(SpendFact transaction, String prefix, String categoryName) {
        boolean codeMatches = transaction.accountCode().toLowerCase(Locale.ROOT).startsWith(prefix);
        return codeMatches || categoryMatches(transaction.category(), categoryName);
    }

    private static boolean categoryMatches(String left, String right) {
        String a = left.toLowerCase(Locale.ROOT);
        String b = right.toLowerCase(Locale.ROOT);
        return a.contains(b) || b.contains(a);
    }

    private static String prefixOf(ThresholdView threshold) {
        return threshold.accountCode().toLowerCase(Locale.ROOT).split("-")[0];
    }
}
