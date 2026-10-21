import type { LedgerTransaction, CategoryBudgetThreshold } from '../types';

/**
 * Calculates current monthly outflow (spend) for a given account code or category name.
 */
export function calculateCategorySpend(
  transactions: LedgerTransaction[],
  accountCode: string,
  categoryName?: string
): number {
  return transactions
    .filter((tx) => {
      if (tx.type !== 'outflow') return false;

      // Match either the account code prefix (e.g. 5100) or exact match
      const codeMatches = tx.accountCode.toLowerCase().startsWith(accountCode.toLowerCase().split('-')[0]);
      
      // Match category name if provided
      const categoryMatches = categoryName 
        ? tx.category.toLowerCase().includes(categoryName.toLowerCase()) || 
          categoryName.toLowerCase().includes(tx.category.toLowerCase())
        : false;

      return codeMatches || categoryMatches;
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

export interface BudgetStatusReport {
  threshold: CategoryBudgetThreshold;
  currentSpend: number;
  remainingBudget: number;
  utilizationPercent: number;
  status: 'normal' | 'warning' | 'exceeded';
  isBreached: boolean;
  isWarning: boolean;
}

/**
 * Evaluates all category thresholds against the active transaction set.
 */
export function evaluateAllCategoryBudgets(
  transactions: LedgerTransaction[],
  thresholds: CategoryBudgetThreshold[]
): BudgetStatusReport[] {
  return thresholds.map((threshold) => {
    const currentSpend = calculateCategorySpend(
      transactions,
      threshold.accountCode,
      threshold.category
    );

    const utilizationPercent = threshold.monthlyBudget > 0
      ? (currentSpend / threshold.monthlyBudget) * 100
      : 0;

    const isBreached = currentSpend > threshold.monthlyBudget;
    const isWarning =
      !isBreached &&
      utilizationPercent >= threshold.warningPercentage;

    const status: 'normal' | 'warning' | 'exceeded' = isBreached
      ? 'exceeded'
      : isWarning
      ? 'warning'
      : 'normal';

    const remainingBudget = Math.max(0, threshold.monthlyBudget - currentSpend);

    return {
      threshold,
      currentSpend,
      remainingBudget,
      utilizationPercent,
      status,
      isBreached,
      isWarning,
    };
  });
}
