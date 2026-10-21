import { useState, useMemo } from 'react';
import { useAppStore, ROLE_CONFIGS } from '../store/useAppStore';
import type { UserRole, LedgerTransaction } from '../types';
import { formatCurrency, cn } from '../utils/cn';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/input';
import { AuditExportModal } from '../components/modals/AuditExportModal';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';
import { ReadOnlyAuditLog } from '../components/audit/ReadOnlyAuditLog';
import { exportLedgerToPDF, exportLedgerToCSV } from '../utils/exportLedger';
import { evaluateAllCategoryBudgets } from '../utils/budgetMonitor';

export function OverviewAndLedgerPage() {
  const {
    simulatedRole,
    setSimulatedRole,
    isFiscalPeriodLocked,
    toggleFiscalPeriodLock,
    transactions,
    approveTransaction,
    batchApproveTransactions,
    governanceQueue,
    signGovernanceItem,
    setIsManualEntryOpen,
    setIsExportModalOpen,
    isAuditLogModalOpen,
    setIsAuditLogModalOpen,
    activeEntity,
    filterEntity,
    setFilterEntity,
    filterClient,
    setFilterClient,
    filterAccountCode,
    setFilterAccountCode,
    filterTag,
    setFilterTag,
    availableTags,
    budgetThresholds,
    setIsBudgetMonitorModalOpen,
    checkBudgetBreaches,
    addToast
  } = useAppStore();

  const [editingTx, setEditingTx] = useState<LedgerTransaction | null>(null);
  const [showAuditSection, setShowAuditSection] = useState(true);

  const budgetReports = useMemo(() => {
    return evaluateAllCategoryBudgets(transactions, budgetThresholds);
  }, [transactions, budgetThresholds]);

  const breachedThresholds = budgetReports.filter((r) => r.isBreached);

  const roleConfig = ROLE_CONFIGS[simulatedRole];

  const roleOptions: { key: UserRole; label: string }[] = [
    { key: 'manager', label: 'Manager' },
    { key: 'member', label: 'Member' },
    { key: 'client_admin', label: 'Client Admin' },
    { key: 'client_staff', label: 'Client Staff' },
    { key: 'client_planner', label: 'Client Planner' },
  ];

  // Filtering transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterEntity !== 'all' && !t.entity.toLowerCase().includes(filterEntity.toLowerCase())) return false;
      if (filterClient !== 'all' && !t.client.toLowerCase().includes(filterClient.toLowerCase())) return false;
      if (filterAccountCode !== 'all' && !t.accountCode.startsWith(filterAccountCode)) return false;
      if (filterTag !== 'all' && (!t.tags || !t.tags.includes(filterTag))) return false;
      return true;
    });
  }, [transactions, filterEntity, filterClient, filterAccountCode, filterTag]);

  // Export helpers for accountants & auditors
  const handleExportCSV = () => {
    exportLedgerToCSV(filteredTransactions, {
      entityName: activeEntity,
      generatedBy: 'Elena Rostova (Executive VP & Controller)',
      includeHashes: true,
      includeCertification: true,
    });
    addToast({
      type: 'success',
      title: 'Audit CSV Export Generated',
      description: `Exported ${filteredTransactions.length} ledger transactions with cryptographic checksums.`,
    });
  };

  const handleExportPDF = () => {
    exportLedgerToPDF(filteredTransactions, {
      entityName: activeEntity,
      generatedBy: 'Elena Rostova (Executive VP & Controller)',
      includeHashes: true,
      includeCertification: true,
    });
    addToast({
      type: 'success',
      title: 'Statutory Audit PDF Report Compiled',
      description: `Downloaded certified balance sheet and journal voucher audit bundle.`,
    });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Role Context Simulation Switcher Banner */}
      <section className="relative mx-4 sm:mx-8 mt-4 mb-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs p-4 sm:p-5 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  RBAC Environment Simulator
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold flex items-center gap-1 border border-secondary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                  Live Governance
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-on-surface tracking-tight mt-0.5 font-headline">
                {roleConfig.title}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 max-w-2xl">
                {roleConfig.desc}
              </p>
            </div>
          </div>

          {/* Role Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-highest rounded-xl overflow-x-auto self-start lg:self-auto shrink-0 border border-surface-container-high/50">
            {roleOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSimulatedRole(opt.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap',
                  simulatedRole === opt.key
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    simulatedRole === opt.key ? 'bg-primary' : 'bg-outline/50'
                  )}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Top 4 KPI Grid */}
      <section className="mx-4 sm:mx-8 mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Operating Cash */}
        <div className="relative bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 shadow-xs border border-surface-container-high/50 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/20 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant font-medium">Total Operating Cash</span>
              <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-headline tabular-nums">
              $4,829,320.40
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center gap-1 border border-secondary/20">
                <span className="material-symbols-outlined text-xs">arrow_upward</span>+12.4% MoM
              </span>
              <span className="text-xs text-on-surface-variant/80">vs prior period</span>
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between">
            <span className="px-2 py-1 rounded-md bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-semibold flex items-center gap-1">
              <span className={cn('w-1.5 h-1.5 rounded-full', simulatedRole === 'manager' ? 'bg-primary animate-pulse' : 'bg-outline')} />
              {roleConfig.badgeCash}
            </span>
          </div>

          {/* Sparkline SVG */}
          <div className="w-full h-8 mt-2 text-secondary opacity-70">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path
                d="M0,20 Q15,18 30,12 T60,15 T85,5 T100,2"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Pending Invoices */}
        <div className="relative bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 shadow-xs border border-surface-container-high/50 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant font-medium">Pending Invoices</span>
              <span className="material-symbols-outlined text-tertiary text-xl">hourglass_top</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-headline tabular-nums">
              $148,900
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-semibold">
                18 awaiting review
              </span>
              <span className="text-xs text-error font-medium">$42,300 &gt;14 days</span>
            </div>
          </div>

          <div className="mt-4 pt-2">
            {roleConfig.showBatchApprove ? (
              <Button
                type="button"
                onClick={batchApproveTransactions}
                className="w-full h-9 bg-primary-container text-on-primary text-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">checklist_rtl</span>
                <span>Batch Approve (Manager Only)</span>
              </Button>
            ) : (
              <div className="text-center">
                <Button
                  disabled
                  type="button"
                  className="w-full h-9 bg-surface-container text-outline text-xs cursor-not-allowed opacity-60"
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  <span>Batch Approve (Manager Only)</span>
                </Button>
                <p className="text-[10px] text-on-surface-variant/70 mt-1">
                  Read-only in {roleConfig.name} view mode
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Tax Liability Reserves */}
        <div className="relative bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 shadow-xs border border-surface-container-high/50 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant font-medium">Tax Liability Reserves</span>
              <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-headline tabular-nums">
              $312,450
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold text-[11px]">
                Q3 Provision
              </span>
              <span className="text-xs text-secondary font-medium">100% Fully Funded</span>
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between p-2 rounded-xl bg-surface-container-low border border-surface-container-high/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-on-surface-variant">
                {isFiscalPeriodLocked ? 'lock' : 'lock_open'}
              </span>
              <span className="text-xs text-on-surface font-medium">Lock Fiscal Period</span>
            </div>
            <Switch
              disabled={!roleConfig.canLockPeriod}
              checked={isFiscalPeriodLocked}
              onCheckedChange={toggleFiscalPeriodLock}
            />
          </div>
        </div>

        {/* Card 4: Client Inflow Accuracy */}
        <div className="relative bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 shadow-xs border border-surface-container-high/50 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant font-medium">Client Inflow vs Forecast</span>
              <span className="material-symbols-outlined text-secondary text-xl">query_stats</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-headline tabular-nums">
                94.2%
              </span>
              <span className="text-xs text-on-surface-variant">model confidence</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-secondary h-2 rounded-full transition-all duration-700" style={{ width: '94.2%' }} />
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between text-on-surface-variant">
            <div className="flex items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-sm text-secondary">verified</span>
              <span>Variance &lt; ±2.1%</span>
            </div>
            <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full font-semibold">
              AI Audited
            </span>
          </div>
        </div>
      </section>

      {/* Category Budget Monitoring & Real-time Alert Widget */}
      <section className="mx-4 sm:mx-8 mb-6 p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-surface-container-high/40">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">speed</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Category Budget Threshold Monitoring
                </span>
                {breachedThresholds.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center gap-1 shadow-xs animate-pulse">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    {breachedThresholds.length} CATEGORY EXCEEDED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold flex items-center gap-1 border border-secondary/20">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    All Categories Under Budget
                  </span>
                )}
                <span className="text-[10px] text-on-surface-variant font-mono">Real-time Toast Alert Active</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-on-surface font-headline mt-0.5">
                Pre-defined Monthly Budget Thresholds &amp; Outflow Caps
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => checkBudgetBreaches()}
              className="text-xs font-semibold"
              title="Audit test all account categories and trigger breach toasts"
            >
              <span className="material-symbols-outlined text-sm">notifications_active</span>
              <span>Test All Breach Alerts</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setIsBudgetMonitorModalOpen(true)}
              className="text-xs font-semibold bg-primary-container text-on-primary"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Configure Thresholds ({budgetThresholds.length})</span>
            </Button>
          </div>
        </div>

        {/* Category Budget Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {budgetReports.map((report) => (
            <div
              key={report.threshold.id}
              onClick={() => setIsBudgetMonitorModalOpen(true)}
              className={cn(
                'p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex flex-col justify-between gap-2.5 group',
                report.isBreached
                  ? 'bg-error-container/20 border-error/50 ring-1 ring-error/30'
                  : report.isWarning
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-surface-container-lowest border-surface-container-high/40'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-1.5 py-0.2 rounded bg-surface-container font-mono text-[10px] font-bold text-on-surface">
                    {report.threshold.accountCode}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold',
                      report.isBreached
                        ? 'text-error'
                        : report.isWarning
                        ? 'text-amber-700'
                        : 'text-secondary'
                    )}
                  >
                    {report.utilizationPercent.toFixed(1)}% Cap
                  </span>
                </div>
                <div className="font-semibold text-xs text-on-surface truncate group-hover:text-primary transition-colors" title={report.threshold.category}>
                  {report.threshold.category}
                </div>
              </div>

              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      report.isBreached ? 'bg-error' : report.isWarning ? 'bg-amber-500' : 'bg-secondary'
                    )}
                    style={{ width: `${Math.min(100, report.utilizationPercent)}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-between text-[11px] tabular-nums">
                  <span className="text-on-surface font-semibold">
                    {formatCurrency(report.currentSpend)}
                  </span>
                  <span className="text-on-surface-variant font-mono text-[10px]">
                    / {formatCurrency(report.threshold.monthlyBudget)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Split Layout: 70% Table, 30% Governance Queue & RBAC Matrix */}
      <div className="mx-4 sm:mx-8 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column (70%): Live Ledger Transactions */}
        <section className="w-full lg:w-[70%] flex flex-col gap-4">
          {/* Controls & Filter Bar */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-surface-container-high/50 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-on-surface tracking-tight font-headline">
                    General Ledger Transactions
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold">
                    Q3 ACTIVE
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Continuous double-entry reconciliations & real-time enterprise event stream
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 text-xs font-semibold hover:text-primary hover:bg-primary-fixed/30"
                  title="Generate certified audit-ready PDF statement"
                >
                  <span className="material-symbols-outlined text-base text-primary">picture_as_pdf</span>
                  <span>Export PDF</span>
                </Button>

                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  title="Export RFC 4180 CSV spreadsheet"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Export CSV</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold"
                  title="Configure auditor export bundle options"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  <span>Audit Bundle...</span>
                </Button>

                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => setIsBudgetMonitorModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold hover:bg-surface-container"
                  title="Open category budget monitoring and threshold alert engine"
                >
                  <span className="material-symbols-outlined text-base text-amber-600">speed</span>
                  <span>Budget Monitor</span>
                  {breachedThresholds.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-error text-on-error text-[9px] font-bold">
                      {breachedThresholds.length} BREACHED
                    </span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById('compliance-audit-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold hover:bg-surface-container"
                  title="Inspect read-only audit log of manual entries & modifications"
                >
                  <span className="material-symbols-outlined text-base text-secondary">policy</span>
                  <span>Compliance Log</span>
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={!roleConfig.canManualEntry}
                  onClick={() => setIsManualEntryOpen(true)}
                  className="flex items-center gap-1.5 bg-primary-container text-on-primary text-xs"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Manual Entry</span>
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-surface-container-high/30">
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">
                  Filter by Entity
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-base">
                    domain
                  </span>
                  <select
                    value={filterEntity}
                    onChange={(e) => setFilterEntity(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium border border-surface-container-high/50 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="all">All Registered Entities (3)</option>
                    <option value="Global">Acme Global Holdings LLC</option>
                    <option value="EMEA">Acme EMEA Operations B.V.</option>
                    <option value="Pacific">Acme Pacific Logistics Inc</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-base pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">
                  Client Group / Project
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-base">
                    corporate_fare
                  </span>
                  <select
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium border border-surface-container-high/50 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="all">All Client Accounts</option>
                    <option value="Strata">Strata Cloud Corp (Tier 1)</option>
                    <option value="Amazon">Amazon Web Services</option>
                    <option value="Helios">Helios Renewable Energy</option>
                    <option value="Nexus">Nexus Robotics AI</option>
                    <option value="Latham">Latham & Watkins LLP</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-base pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">
                  Account Ledger Type
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-base">
                    account_tree
                  </span>
                  <select
                    value={filterAccountCode}
                    onChange={(e) => setFilterAccountCode(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium border border-surface-container-high/50 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="all">All Account Classes</option>
                    <option value="1010">1010 - Cash & Equivalents</option>
                    <option value="1200">1200 - Accounts Receivable</option>
                    <option value="2000">2000 - Accounts Payable</option>
                    <option value="4000">4000 - Enterprise Retainer Revenue</option>
                    <option value="5100">5100 - Cloud Infrastructure COGS</option>
                    <option value="6200">6200 - Legal Advisory</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-base pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">
                  Filter by Tag Label
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-base">
                    label
                  </span>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium border border-surface-container-high/50 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="all">All Categorization Tags</option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        #{tag}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-base pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Tag Pill Filter Bar */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mr-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">sell</span> Quick Tags:
              </span>
              <button
                type="button"
                onClick={() => setFilterTag('all')}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer',
                  filterTag === 'all'
                    ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                )}
              >
                All ({transactions.length})
              </button>
              {['SaaS', 'Infrastructure', 'Legal', 'CleanTech', 'AI/ML', 'OpEx', 'Retainer'].map((tag) => {
                const count = transactions.filter((t) => t.tags && t.tags.includes(tag)).length;
                if (count === 0) return null;
                const isSelected = filterTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFilterTag(isSelected ? 'all' : tag)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1',
                      isSelected
                        ? 'bg-primary-fixed text-on-primary-fixed-variant font-bold border border-primary/30 shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    )}
                  >
                    <span>#{tag}</span>
                    <span className="text-[9px] opacity-75">({count})</span>
                  </button>
                );
              })}

              {filterTag !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterTag('all')}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-container text-on-error-container hover:opacity-90 transition-opacity ml-1 flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[11px]">close</span>
                  <span>Clear Tag Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container-high/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/90 text-on-surface-variant text-[10px] uppercase tracking-wider font-bold border-b border-surface-container-high/50">
                    <th className="py-3 px-4">Date / Ref</th>
                    <th className="py-3 px-4">Entity / Client</th>
                    <th className="py-3 px-3">Account Code</th>
                    <th className="py-3 px-3">Category &amp; Tags</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-center">RBAC Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40 text-xs text-on-surface">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-surface-container-low/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-on-surface">{tx.date}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{tx.ref}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-on-surface truncate max-w-[160px]">
                          {tx.client}
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate max-w-[160px]">
                          {tx.entity}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono text-[11px]">
                          {tx.accountCode}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-on-surface font-medium truncate block max-w-[140px]">
                            {tx.category}
                          </span>
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tx.tags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterTag(filterTag === tag ? 'all' : tag);
                                  }}
                                  className={cn(
                                    'px-1.5 py-0.2 rounded text-[9px] font-mono transition-colors cursor-pointer',
                                    filterTag === tag
                                      ? 'bg-primary text-on-primary font-bold'
                                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-medium'
                                  )}
                                  title={`Filter by tag #${tag}`}
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div
                          className={cn(
                            'font-bold tabular-nums',
                            tx.type === 'inflow' ? 'text-secondary' : 'text-on-surface'
                          )}
                        >
                          {tx.type === 'inflow' ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">{tx.method}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {tx.status === 'verified' && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            Verified
                          </span>
                        )}
                        {tx.status === 'awaiting_mgr' && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Awaiting Mgr
                          </span>
                        )}
                        {tx.status === 'reconciled' && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            Reconciled
                          </span>
                        )}
                        {tx.status === 'threshold_flag' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Threshold Flag
                          </span>
                        )}
                        {tx.status === 'posted' && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                            Posted
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {roleConfig.showApprovals && !tx.approved && (
                            <button
                              type="button"
                              onClick={() => approveTransaction(tx.id)}
                              className="px-2.5 py-1 rounded-md bg-primary-container text-on-primary text-[10px] font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              Approve & Post
                            </button>
                          )}
                          {roleConfig.canManualEntry && (
                            <button
                              type="button"
                              onClick={() => setEditingTx(tx)}
                              className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors"
                              title="Modify voucher categorization/tags (appends to audit log)"
                            >
                              <span className="material-symbols-outlined text-xs">edit_note</span>
                              <span>Edit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              addToast({
                                type: 'info',
                                title: `Voucher Details: ${tx.ref}`,
                                description: `${tx.client} • Account: ${tx.accountCode} • Flow: ${tx.method}`,
                              });
                            }}
                            className="px-2 py-1 rounded-md bg-surface-container text-on-surface-variant hover:text-on-surface text-[10px] font-semibold"
                          >
                            Details
                          </button>

                          <div className="relative group/tooltip">
                            <button
                              type="button"
                              disabled={!roleConfig.canReconcile}
                              onClick={() => {
                                addToast({
                                  type: 'success',
                                  title: `Reconciliation Match Confirmed`,
                                  description: `${tx.ref} cleared against Automated Clearing House feed.`,
                                });
                              }}
                              className={cn(
                                'p-1 rounded-md bg-surface-container-high text-on-surface-variant transition-colors',
                                roleConfig.canReconcile
                                  ? 'hover:text-primary cursor-pointer'
                                  : 'opacity-30 cursor-not-allowed'
                              )}
                            >
                              <span className="material-symbols-outlined text-sm">sync_alt</span>
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:block z-30 px-2 py-1 rounded-md bg-inverse-surface text-inverse-on-surface text-[10px] shadow-md whitespace-nowrap">
                              Requires Member/Manager Privileges
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination & Live Sync Status Footer */}
            <div className="px-4 py-3 bg-surface-container-low/70 border-t border-surface-container-high/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Real-time ledger pipeline synchronized with Acme Tier-1 banking partners
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-on-surface-variant">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled
                    className="w-7 h-7 rounded bg-surface-container-lowest flex items-center justify-center text-on-surface-variant opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="w-7 h-7 rounded bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column (30%): Approvals & Governance Queue + RBAC Matrix */}
        <aside className="w-full lg:w-[30%] flex flex-col gap-4">
          {/* Governance Queue */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-5 border border-surface-container-high/50 shadow-xs flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">gavel</span>
                </div>
                <div>
                  <span className="font-semibold text-sm text-on-surface font-headline block">
                    Governance Queue
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Thresholds &gt; $10,000</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">
                {governanceQueue.filter(g => !g.signed).length} PENDING
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Transactions requiring senior sign-off under SOX 404 segregation of duties:
            </p>

            <div className="space-y-2.5">
              {governanceQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-on-surface text-xs">{item.vendor}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">{item.txnRef}</div>
                    </div>
                    <span className="font-bold text-xs text-on-surface tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/30">
                    <span className="text-[10px] text-error font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        {item.signed ? 'check_circle' : 'warning'}
                      </span>
                      {item.signed ? `Signed by ${item.signerName?.split(' ')[0]}` : item.dueIn}
                    </span>

                    {item.signed ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                        Dual-Signed
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!roleConfig.showApprovals}
                        onClick={() => signGovernanceItem(item.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[10px] font-semibold transition-opacity',
                          roleConfig.showApprovals
                            ? 'bg-primary text-on-primary hover:opacity-90 cursor-pointer shadow-xs'
                            : 'bg-surface-container text-outline cursor-not-allowed opacity-60'
                        )}
                      >
                        Executive Sign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RBAC Quick Reference Widget */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-5 border border-surface-container-high/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">shield_person</span>
                <span className="font-semibold text-sm text-on-surface font-headline">Active Role Matrix</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold">
                {roleConfig.matrix.role}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'material-symbols-outlined text-base',
                      roleConfig.matrix.view.granted ? 'text-secondary' : 'text-outline'
                    )}
                  >
                    {roleConfig.matrix.view.granted ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-xs text-on-surface font-medium">Read Full Ledger</span>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold',
                    roleConfig.matrix.view.granted ? 'text-secondary' : 'text-outline'
                  )}
                >
                  {roleConfig.matrix.view.text}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'material-symbols-outlined text-base',
                      roleConfig.matrix.create.granted ? 'text-secondary' : 'text-outline'
                    )}
                  >
                    {roleConfig.matrix.create.granted ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-xs text-on-surface font-medium">Create Journal Entries</span>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold',
                    roleConfig.matrix.create.granted ? 'text-secondary' : 'text-outline'
                  )}
                >
                  {roleConfig.matrix.create.text}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'material-symbols-outlined text-base',
                      roleConfig.matrix.approve.granted ? 'text-secondary' : 'text-outline'
                    )}
                  >
                    {roleConfig.matrix.approve.granted ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-xs text-on-surface font-medium">Approve &gt; $10k Thresholds</span>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold',
                    roleConfig.matrix.approve.granted ? 'text-secondary' : 'text-outline'
                  )}
                >
                  {roleConfig.matrix.approve.text}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'material-symbols-outlined text-base',
                      roleConfig.matrix.period.granted ? 'text-secondary' : 'text-outline'
                    )}
                  >
                    {roleConfig.matrix.period.granted ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-xs text-on-surface font-medium">Lock / Close Fiscal Period</span>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold',
                    roleConfig.matrix.period.granted ? 'text-secondary' : 'text-outline'
                  )}
                >
                  {roleConfig.matrix.period.text}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'material-symbols-outlined text-base',
                      roleConfig.matrix.audit.granted ? 'text-secondary' : 'text-outline'
                    )}
                  >
                    {roleConfig.matrix.audit.granted ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-xs text-on-surface font-medium">View Statutory Audit Logs</span>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold',
                    roleConfig.matrix.audit.granted ? 'text-secondary' : 'text-outline'
                  )}
                >
                  {roleConfig.matrix.audit.text}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-container-high/60 flex items-start gap-2 border border-surface-container-high">
              <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">info</span>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                {roleConfig.footnote}
              </p>
            </div>
          </div>

          {/* Financial Period Assurance Card */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-5 border border-surface-container-high/50 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                Ledger Health & Integrity
              </span>
              <span className="text-[10px] text-secondary font-bold">100% In-Balance</span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-on-surface-variant">Debits Total:</span>
              <span className="font-semibold text-on-surface tabular-nums">$5,419,820.40</span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-on-surface-variant">Credits Total:</span>
              <span className="font-semibold text-on-surface tabular-nums">$5,419,820.40</span>
            </div>
            <div className="w-full bg-secondary/15 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-secondary h-1.5 rounded-full w-full" />
            </div>
            <span className="text-[10px] text-on-surface-variant text-right">
              Zero Variance • Continuous Verification
            </span>
          </div>
        </aside>
      </div>

      {/* Enterprise Compliance Read-Only Audit Log Section */}
      <section id="compliance-audit-section" className="mx-4 sm:mx-8 mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
            <h3 className="text-base font-bold text-on-surface font-headline">
              Continuous Traceability &amp; Audit Log
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
              SOX 404 Active
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAuditSection(!showAuditSection)}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showAuditSection ? 'Collapse Audit Stream' : 'Expand Audit Stream'}</span>
            <span className="material-symbols-outlined text-sm">
              {showAuditSection ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {showAuditSection && (
          <ReadOnlyAuditLog maxHeight="max-h-[550px]" />
        )}
      </section>

      {/* Audit Export Modal */}
      <AuditExportModal filteredTransactions={filteredTransactions} />

      {/* Edit Voucher Modal */}
      <EditTransactionModal
        transaction={editingTx}
        open={!!editingTx}
        onOpenChange={(open) => !open && setEditingTx(null)}
      />
    </div>
  );
}
