import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input, Switch } from '../ui/input';
import { formatCurrency, cn } from '../../utils/cn';
import { evaluateAllCategoryBudgets } from '../../utils/budgetMonitor';
import type { CategoryBudgetThreshold } from '../../types';

export function BudgetMonitoringModal() {
  const {
    isBudgetMonitorModalOpen,
    setIsBudgetMonitorModalOpen,
    budgetThresholds,
    updateBudgetThreshold,
    addBudgetThreshold,
    removeBudgetThreshold,
    transactions,
    createTransaction,
    activeEntity,
    checkBudgetBreaches,
    addToast,
  } = useAppStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);

  // New threshold form state
  const [newCategory, setNewCategory] = useState('');
  const [newAccountCode, setNewAccountCode] = useState('5100-COGS');
  const [newBudget, setNewBudget] = useState('25000');
  const [newWarningPercent, setNewWarningPercent] = useState('80');
  const [newNotes, setNewNotes] = useState('');

  // Evaluated status reports
  const reports = useMemo(() => {
    return evaluateAllCategoryBudgets(transactions, budgetThresholds);
  }, [transactions, budgetThresholds]);

  const summary = useMemo(() => {
    const totalBudget = budgetThresholds.reduce((sum, b) => sum + b.monthlyBudget, 0);
    const totalSpend = reports.reduce((sum, r) => sum + r.currentSpend, 0);
    const breachedCount = reports.filter((r) => r.isBreached).length;
    const warningCount = reports.filter((r) => r.isWarning).length;
    return { totalBudget, totalSpend, breachedCount, warningCount };
  }, [budgetThresholds, reports]);

  const handleAddNewThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(newBudget);
    const warningNum = parseFloat(newWarningPercent);
    if (!newCategory || isNaN(budgetNum)) return;

    try {
      await addBudgetThreshold({
        category: newCategory,
        accountCode: newAccountCode,
        monthlyBudget: budgetNum,
        warningPercentage: isNaN(warningNum) ? 80 : warningNum,
        alertEnabled: true,
        autoFlagTransactions: true,
        notes: newNotes.trim() || undefined,
      });
    } catch {
      return;
    }

    setNewCategory('');
    setNewBudget('25000');
    setNewWarningPercent('80');
    setNewNotes('');
    setIsAddingNew(false);
  };

  // Simulate an outflow transaction that instantly triggers a breach alert
  const handleSimulateBreach = (threshold: CategoryBudgetThreshold, currentSpend: number) => {
    const overAmount = Math.max(2500, threshold.monthlyBudget - currentSpend + 4500);
    void createTransaction({
      entity: activeEntity,
      client: 'AWS Cloud Services / Fast Simulation',
      accountCode: threshold.accountCode,
      category: threshold.category,
      amount: -overAmount,
      type: 'outflow',
      method: 'ACH Outflow',
      tags: ['BudgetAlert', 'Simulated', 'OpEx'],
    });
  };

  return (
    <Dialog open={isBudgetMonitorModalOpen} onOpenChange={setIsBudgetMonitorModalOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">speed</span>
          </div>
          <div>
            <DialogTitle>Category Budget Monitoring &amp; Alert Engine</DialogTitle>
            <DialogDescription>
              Real-time monitoring system triggering automated toast notifications when ledger accounts exceed pre-defined monthly budget caps.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 text-xs">
        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/50 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">
              Monitored Categories
            </span>
            <span className="text-base font-bold text-on-surface font-headline mt-0.5 tabular-nums">
              {budgetThresholds.length} Active Caps
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/50 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">
              Total Monthly Budget
            </span>
            <span className="text-base font-bold text-on-surface font-headline mt-0.5 tabular-nums">
              {formatCurrency(summary.totalBudget)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/50 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">
              Current Month Outflow
            </span>
            <span className="text-base font-bold text-primary font-headline mt-0.5 tabular-nums">
              {formatCurrency(summary.totalSpend)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/50 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">
              Threshold Breaches
            </span>
            <span
              className={cn(
                'text-base font-bold font-headline mt-0.5 tabular-nums flex items-center gap-1',
                summary.breachedCount > 0 ? 'text-error' : 'text-secondary'
              )}
            >
              {summary.breachedCount > 0 && <span className="w-2 h-2 rounded-full bg-error animate-ping" />}
              {summary.breachedCount} Breached {summary.warningCount > 0 && `(${summary.warningCount} warning)`}
            </span>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-base">notifications_active</span>
            <span>Real-time monitoring engine runs continuously on every journal voucher entry.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => checkBudgetBreaches()}
              className="h-8 text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-sm">notifications</span>
              <span>Test All Alerts</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="h-8 text-xs font-semibold bg-primary-container text-on-primary"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>{isAddingNew ? 'Cancel New Cap' : 'Add Category Cap'}</span>
            </Button>
          </div>
        </div>

        {/* Inline Add New Category Budget Form */}
        {isAddingNew && (
          <form
            onSubmit={handleAddNewThreshold}
            className="p-4 rounded-xl bg-surface-container-lowest border-2 border-primary/30 shadow-md space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/40">
              <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">add_circle</span>
                New Category Monthly Budget Threshold
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">SOX 404 Guardrail</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-on-surface-variant block mb-1">
                  Category Name
                </label>
                <Input
                  required
                  placeholder="e.g. Sales &amp; Marketing GTM"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant block mb-1">
                  Ledger Account Code
                </label>
                <select
                  value={newAccountCode}
                  onChange={(e) => setNewAccountCode(e.target.value)}
                  className="w-full h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-xs text-on-surface focus:outline-none"
                >
                  <option value="5100-COGS">5100 - Cloud Infrastructure COGS</option>
                  <option value="5200-SAAS">5200 - Enterprise SaaS Subscriptions</option>
                  <option value="6000-MKT">6000 - Sales &amp; Marketing Operations</option>
                  <option value="6200-LEG">6200 - Statutory Legal Retainer</option>
                  <option value="6500-OPEX">6500 - Corporate Travel &amp; OpEx</option>
                  <option value="6700-RND">6700 - Research &amp; Engineering</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-on-surface-variant block mb-1">
                  Monthly Budget Cap ($ USD)
                </label>
                <Input
                  required
                  type="number"
                  step="500"
                  placeholder="25000"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant block mb-1">
                  Warning Threshold (% of Budget)
                </label>
                <Input
                  required
                  type="number"
                  min="50"
                  max="99"
                  placeholder="80"
                  value={newWarningPercent}
                  onChange={(e) => setNewWarningPercent(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Policy Notes / Rationale
              </label>
              <Input
                placeholder="e.g. Approved board cap for GTM ad spend."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Save &amp; Activate Monitor
              </Button>
            </div>
          </form>
        )}

        {/* Monitored Categories List */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {reports.map((report) => {
            const { threshold, currentSpend, utilizationPercent, status, isBreached, isWarning } = report;
            const isEditing = editingThresholdId === threshold.id;

            return (
              <div
                key={threshold.id}
                className={cn(
                  'p-4 rounded-xl border transition-all space-y-3',
                  isBreached
                    ? 'bg-error-container/15 border-error/40 shadow-xs'
                    : isWarning
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-surface-container-low/70 border-surface-container-high/50'
                )}
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] font-bold text-on-surface">
                      {threshold.accountCode}
                    </span>
                    <h4 className="font-bold text-sm text-on-surface font-headline">
                      {threshold.category}
                    </h4>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isBreached && (
                      <span className="px-2.5 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center gap-1 shadow-xs animate-pulse">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        BUDGET EXCEEDED ({utilizationPercent.toFixed(1)}%)
                      </span>
                    )}

                    {isWarning && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        APPROACHING CAP ({utilizationPercent.toFixed(1)}%)
                      </span>
                    )}

                    {status === 'normal' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        WITHIN BUDGET ({utilizationPercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Numerical Metrics */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-baseline gap-1">
                      <span className="text-on-surface-variant">Current Outflow:</span>
                      <span className="font-bold text-on-surface tabular-nums">
                        {formatCurrency(currentSpend)}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-on-surface-variant">Monthly Cap:</span>
                      <span className="font-bold text-on-surface tabular-nums">
                        {formatCurrency(threshold.monthlyBudget)}
                      </span>
                    </div>

                    <div className="font-mono text-[11px]">
                      {isBreached ? (
                        <span className="text-error font-bold">
                          +{formatCurrency(currentSpend - threshold.monthlyBudget)} OVER BUDGET
                        </span>
                      ) : (
                        <span className="text-secondary font-semibold">
                          {formatCurrency(threshold.monthlyBudget - currentSpend)} Remaining
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress meter */}
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300 rounded-full',
                        isBreached ? 'bg-error' : isWarning ? 'bg-amber-500' : 'bg-secondary'
                      )}
                      style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Policy Notes */}
                {threshold.notes && (
                  <p className="text-[11px] text-on-surface-variant italic">
                    Note: {threshold.notes}
                  </p>
                )}

                {/* Toggle Controls & Quick Simulation Trigger */}
                <div className="pt-2 border-t border-surface-container-high/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Switch
                        checked={threshold.alertEnabled}
                        onCheckedChange={(checked) =>
                          updateBudgetThreshold(threshold.id, { alertEnabled: checked })
                        }
                      />
                      <span className="text-[11px] text-on-surface font-medium">
                        Toast Alerts Active
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Switch
                        checked={threshold.autoFlagTransactions}
                        onCheckedChange={(checked) =>
                          updateBudgetThreshold(threshold.id, { autoFlagTransactions: checked })
                        }
                      />
                      <span className="text-[11px] text-on-surface font-medium">
                        Auto-Flag Ledger Voucher
                      </span>
                    </label>
                  </div>

                  {/* Quick Test Breach Action */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSimulateBreach(threshold, currentSpend)}
                      className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Post a test outflow transaction that breaches this category's budget"
                    >
                      <span className="material-symbols-outlined text-xs text-error">bolt</span>
                      <span>Trigger Breach Test</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingThresholdId(isEditing ? null : threshold.id)}
                      className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[10px] font-semibold"
                    >
                      {isEditing ? 'Close Edit' : 'Edit Cap'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeBudgetThreshold(threshold.id)}
                      className="p-1 rounded hover:bg-error-container text-on-surface-variant hover:text-on-error-container transition-colors cursor-pointer"
                      title="Remove threshold monitor"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {/* Inline Edit Form */}
                {isEditing && (
                  <div className="mt-2 p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high space-y-2 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                          Adjust Monthly Budget ($)
                        </label>
                        <Input
                          type="number"
                          defaultValue={threshold.monthlyBudget}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              updateBudgetThreshold(threshold.id, { monthlyBudget: val });
                            }
                          }}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                          Warning Alert Threshold (%)
                        </label>
                        <Input
                          type="number"
                          defaultValue={threshold.warningPercentage}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              updateBudgetThreshold(threshold.id, { warningPercentage: val });
                            }
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Informational SOX 404 Footer */}
        <div className="p-2.5 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">policy</span>
          <span>
            Threshold alerts enforce SOX 404 segregation of duties by immediately routing breached expenditures to the Executive Dual-Signature Governance Queue.
          </span>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="default"
          onClick={() => setIsBudgetMonitorModalOpen(false)}
        >
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
