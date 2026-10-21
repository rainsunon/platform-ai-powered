import { useState, useMemo } from 'react';
import { useAppStore, ROLE_CONFIGS } from '../store/useAppStore';
import type { UserRole } from '../types';
import { formatCurrency, cn } from '../utils/cn';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function InvoicesAndBillingPage() {
  const {
    simulatedRole,
    setSimulatedRole,
    invoices,
    selectedInvoiceId,
    setSelectedInvoiceId,
    authorizeInvoice,
    disputeInvoice,
    batchAuthorizeInvoices,
    addToast
  } = useAppStore();

  const [isRbacExpanded, setIsRbacExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

  const roleConfig = ROLE_CONFIGS[simulatedRole];

  // Selected invoice
  const currentInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === selectedInvoiceId) || invoices[0];
  }, [invoices, selectedInvoiceId]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientSubUnit.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter === 'pending') return inv.status === 'pending_client_approval';
      if (statusFilter === 'overdue') return inv.status === 'overdue';
      if (statusFilter === 'paid') return inv.status === 'paid_settled';
      return true;
    });
  }, [invoices, searchTerm, statusFilter]);

  const roleTabItems: { key: UserRole; label: string }[] = [
    { key: 'client_admin', label: 'Client Admin' },
    { key: 'client_staff', label: 'Client Staff' },
    { key: 'client_planner', label: 'Client Planner' },
    { key: 'manager', label: 'Internal Manager' },
    { key: 'member', label: 'Internal Member' },
  ];

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Ambient background glow orbs */}
      <div className="relative">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-10 w-80 h-80 bg-secondary-fixed-dim/20 rounded-full blur-3xl pointer-events-none -z-10" />
      </div>

      {/* Header & Persona / Lens Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              Ledger Operations
            </span>
            <span className="text-on-surface-variant text-[10px]">/</span>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Fine-Grained RBAC Governance
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-on-surface tracking-tight font-headline">
              Invoices &amp; Billing Workspace
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-semibold flex items-center gap-1.5 shadow-xs border border-surface-container-high/60">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Enclave Active: Dual-Signature Mode
            </span>
          </div>
        </div>

        {/* Persona / Lens Switcher Bar */}
        <div className="p-1.5 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs flex items-center gap-1 flex-wrap">
          <div className="px-3 py-1 flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
            <span className="material-symbols-outlined text-base text-primary">visibility</span>
            <span>Simulate Lens:</span>
          </div>
          {roleTabItems.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSimulatedRole(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                simulatedRole === tab.key
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Lens Notice Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-300">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shadow-xs shrink-0">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-on-surface font-headline">
                Active Lens: {roleConfig.name} View
              </span>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider', roleConfig.badgeClass)}>
                {roleConfig.scope}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 max-w-3xl leading-relaxed">
              {roleConfig.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <span className="text-[11px] text-on-surface-variant font-medium">Auto-Refreshed 2m ago</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              addToast({
                type: 'info',
                title: 'Enclave Access Rules',
                description: `SOC2 Type II isolation verified for ${roleConfig.name}. Client segregation active.`,
              });
            }}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>Access Rules</span>
          </Button>
        </div>
      </div>

      {/* 3 KPI Row with colored sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Receivables */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high/50 shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant font-medium">Total Receivables</span>
              <span className="text-2xl sm:text-3xl font-bold text-on-surface mt-1 tracking-tight font-headline tabular-nums">
                $892,100<span className="text-sm text-on-surface-variant font-normal">.00</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-xl">account_balance</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-[11px] font-semibold border border-secondary/20">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>
              <span>+12.4% vs last cycle</span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">28 Invoices pending</span>
          </div>
          {/* Subtle SVG Sparkline */}
          <div className="mt-3 w-full h-7 overflow-hidden opacity-75">
            <svg className="w-full h-full text-secondary" fill="none" viewBox="0 0 240 28">
              <path
                d="M0 24 C 30 20, 50 14, 80 18 C 110 22, 140 8, 170 12 C 200 15, 220 4, 240 2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Overdue Invoices */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high/50 shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant font-medium">Overdue Invoices</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-error tracking-tight font-headline tabular-nums">
                  $34,200
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-bold">
                  4 Clients
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center text-error shadow-xs">
              <span className="material-symbols-outlined text-xl">schedule</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container/40 text-on-error-container text-[11px] font-semibold border border-error/20">
              <span className="material-symbols-outlined text-xs">priority_high</span>
              <span>Avg aging: 18 days</span>
            </div>
            <button
              type="button"
              onClick={() => {
                addToast({
                  type: 'warning',
                  title: 'Overdue Batch Escalated',
                  description: 'Payment reminders and aging statements dispatched to 4 client treasurers.',
                });
              }}
              className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
            >
              Escalate Batch
            </button>
          </div>
          {/* Overdue Sparkline */}
          <div className="mt-3 w-full h-7 overflow-hidden opacity-75">
            <svg className="w-full h-full text-error" fill="none" viewBox="0 0 240 28">
              <path
                d="M0 8 C 40 10, 70 20, 110 14 C 150 7, 190 22, 240 26"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Retainers & Recurring */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high/50 shadow-xs flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant font-medium">Retainers &amp; Recurring</span>
              <span className="text-2xl sm:text-3xl font-bold text-on-surface mt-1 tracking-tight font-headline tabular-nums">
                $128,500<span className="text-sm text-on-surface-variant font-normal">/mo</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-xl">autorenew</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container text-[11px] font-semibold border border-secondary/20">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span>98.2% automated ACH</span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">Next run: Oct 01</span>
          </div>
          {/* Retainers Sparkline */}
          <div className="mt-3 w-full h-7 overflow-hidden opacity-75">
            <svg className="w-full h-full text-primary" fill="none" viewBox="0 0 240 28">
              <path
                d="M0 16 C 50 14, 90 12, 130 13 C 170 14, 210 6, 240 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Collapsible RBAC Governance Matrix & Operational Guardrails */}
      <div className="rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs overflow-hidden">
        <div
          onClick={() => setIsRbacExpanded(!isRbacExpanded)}
          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
              <span className="material-symbols-outlined text-lg">shield</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface font-headline">
                RBAC Governance Matrix &amp; Operational Guardrails
              </h2>
              <p className="text-xs text-on-surface-variant">
                Active tenant permission definitions across Manager, Member, Client Admin, Client Staff, and Planner personas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-primary font-bold hidden sm:inline-block">
              5 Enforced Roles
            </span>
            <span
              className={cn(
                'material-symbols-outlined text-on-surface-variant transition-transform duration-200',
                isRbacExpanded ? 'rotate-0' : '-rotate-90'
              )}
            >
              expand_more
            </span>
          </div>
        </div>

        {isRbacExpanded && (
          <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 border-t border-surface-container-high/40 mt-1">
            {/* 1. Manager */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-on-primary-fixed-variant px-2 py-0.5 rounded-full bg-primary-fixed">
                    Manager
                  </span>
                  <span className="material-symbols-outlined text-sm text-primary">verified</span>
                </div>
                <p className="text-xs font-semibold text-on-surface mb-1">Full Tier 1 Control</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Create, delete, discount overrides, direct bad-debt write-offs, Stripe/Plaid bank reconciliation sync.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-container-high/30 flex items-center gap-1 text-[11px] text-secondary font-semibold">
                <span className="material-symbols-outlined text-xs">lock_open</span>
                <span>Write &amp; Void Granted</span>
              </div>
            </div>

            {/* 2. Member */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container-high">
                    Member
                  </span>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">edit_note</span>
                </div>
                <p className="text-xs font-semibold text-on-surface mb-1">Operational Drafting</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Draft invoices, attach receipts, add line items and tasks. Approval or uncollectible write-offs prohibited.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-container-high/30 flex items-center gap-1 text-[11px] text-on-surface-variant font-semibold">
                <span className="material-symbols-outlined text-xs">edit</span>
                <span>Draft Line Items Only</span>
              </div>
            </div>

            {/* 3. Client Admin */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-on-secondary-container px-2 py-0.5 rounded-full bg-secondary-container">
                    Client Admin
                  </span>
                  <span className="material-symbols-outlined text-sm text-secondary">payments</span>
                </div>
                <p className="text-xs font-semibold text-on-surface mb-1">Inbound Authority</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Approve inbound bills, execute ACH/wire payouts, update corporate billing methods, assign disputes.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-container-high/30 flex items-center gap-1 text-[11px] text-secondary font-semibold">
                <span className="material-symbols-outlined text-xs">credit_card</span>
                <span>Payout Authorization</span>
              </div>
            </div>

            {/* 4. Client Staff */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-on-tertiary-container px-2 py-0.5 rounded-full bg-tertiary-fixed">
                    Client Staff
                  </span>
                  <span className="material-symbols-outlined text-sm text-tertiary">receipt</span>
                </div>
                <p className="text-xs font-semibold text-on-surface mb-1">Itemized Verification</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  View itemized lines, download stamped PDF tax receipts, submit inquiry or billing tickets.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-container-high/30 flex items-center gap-1 text-[11px] text-on-surface-variant font-semibold">
                <span className="material-symbols-outlined text-xs">visibility</span>
                <span>Read &amp; Request Detail</span>
              </div>
            </div>

            {/* 5. Client Planner */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#6d28d9] px-2 py-0.5 rounded-full bg-[#f5f3ff]">
                    Client Planner
                  </span>
                  <span className="material-symbols-outlined text-sm text-[#6d28d9]">timeline</span>
                </div>
                <p className="text-xs font-semibold text-on-surface mb-1">Forecast Analytics</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Inspect upcoming milestone billing forecasts &amp; fee schedules. Masked raw banking and masked tax IDs.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-surface-container-high/30 flex items-center gap-1 text-[11px] text-primary font-semibold">
                <span className="material-symbols-outlined text-xs">query_stats</span>
                <span>Milestone Schedules</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Split Layout: Invoices Table (8 cols) & Side Inspection Drawer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Table Area (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-2 text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by invoice ID, client or tag..."
                  className="w-full bg-surface-container-low pl-9 pr-3 py-1.5 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:outline-none border border-surface-container-high/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 px-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border-none cursor-pointer outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid & Settled</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Invoices CSV Exported',
                    description: `Generated export for ${filteredInvoices.length} billing items.`,
                  });
                }}
                className="h-8 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export CSV</span>
              </button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  if (simulatedRole === 'client_admin') {
                    batchAuthorizeInvoices();
                  } else {
                    addToast({
                      type: 'info',
                      title: roleConfig.primaryInvoiceAction,
                      description: `Triggered master billing action for ${roleConfig.name} persona.`,
                    });
                  }
                }}
                className="flex items-center gap-1 bg-primary-container text-on-primary text-xs"
              >
                <span className="material-symbols-outlined text-sm">
                  {simulatedRole === 'client_admin' ? 'check_circle' : 'add'}
                </span>
                <span>{roleConfig.primaryInvoiceAction}</span>
              </Button>
            </div>
          </div>

          {/* Ledger Table Card */}
          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high/50 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low/70 border-b border-surface-container-high/40">
                  <tr>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Invoice #
                    </th>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Client Entity
                    </th>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Scope Role
                    </th>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Issue Date
                    </th>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Due Date
                    </th>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold text-right">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Status
                    </th>
                    <th className="py-3 px-4 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold text-right">
                      Actions (Role Dynamic)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/30 text-xs">
                  {filteredInvoices.map((inv) => {
                    const isSelected = inv.id === selectedInvoiceId;
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className={cn(
                          'hover:bg-surface-container-low/50 transition-colors cursor-pointer group',
                          isSelected && 'bg-primary-fixed/20'
                        )}
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                          {inv.id}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface">
                              {inv.avatarInitials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface leading-tight">
                                {inv.clientEntity}
                              </span>
                              <span className="text-[10px] text-on-surface-variant">
                                {inv.clientSubUnit}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              inv.scopeRole === 'Client Admin' && 'bg-secondary-container text-on-secondary-container',
                              inv.scopeRole === 'Client Staff' && 'bg-tertiary-fixed text-on-tertiary-container',
                              inv.scopeRole === 'Client Planner' && 'bg-[#f5f3ff] text-[#6d28d9]',
                              inv.scopeRole === 'Manager' && 'bg-primary-fixed text-on-primary-fixed-variant',
                              inv.scopeRole === 'Member' && 'bg-surface-container-high text-on-surface'
                            )}
                          >
                            {inv.scopeRole}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-on-surface-variant tabular-nums">
                          {inv.issueDate}
                        </td>

                        <td
                          className={cn(
                            'py-3.5 px-4 font-medium tabular-nums',
                            inv.status === 'overdue' ? 'text-error font-semibold' : 'text-on-surface'
                          )}
                        >
                          {inv.dueDate}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-on-surface tabular-nums">
                          {formatCurrency(inv.amount)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {inv.status === 'pending_client_approval' && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-semibold flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              Pending Client Approval
                            </span>
                          )}
                          {inv.status === 'overdue' && (
                            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-semibold flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-error" />
                              Overdue (14d)
                            </span>
                          )}
                          {inv.status === 'draft_review' && (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                              Draft Review
                            </span>
                          )}
                          {inv.status === 'paid_settled' && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                              Paid (Settled)
                            </span>
                          )}
                        </td>

                        {/* Dynamic Actions based on Role */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {simulatedRole === 'client_admin' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => authorizeInvoice(inv.id)}
                                  className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary text-[10px] font-semibold hover:opacity-95 shadow-xs transition-opacity cursor-pointer"
                                >
                                  Pay Now
                                </button>
                                <button
                                  type="button"
                                  onClick={() => disputeInvoice(inv.id)}
                                  className="px-2 py-1 rounded-lg bg-surface-container text-on-surface-variant text-[10px] font-semibold hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                                >
                                  Dispute
                                </button>
                              </>
                            )}

                            {simulatedRole === 'client_staff' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    addToast({
                                      type: 'info',
                                      title: 'Downloading Tax Stamped Receipt',
                                      description: `${inv.id}_Tax_Stamped.pdf generated with IRS verification seal.`,
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[10px] font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">download</span> PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => disputeInvoice(inv.id, 'Staff Inquiry')}
                                  className="px-2 py-1 rounded-lg bg-surface-container text-on-surface-variant text-[10px] font-semibold hover:bg-surface-container-high transition-colors"
                                >
                                  Inquire
                                </button>
                              </>
                            )}

                            {simulatedRole === 'client_planner' && (
                              <button
                                type="button"
                                onClick={() => {
                                  addToast({
                                    type: 'info',
                                    title: 'Synced with Forecast Model',
                                    description: `${inv.id} mapped to Q4 milestone revenue burn.`,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-surface-container text-primary text-[10px] font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">insights</span> Forecast
                              </button>
                            )}

                            {simulatedRole === 'manager' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    addToast({
                                      type: 'info',
                                      title: 'Manager Override Open',
                                      description: `Direct margin adjustor unlocked for ${inv.id}.`,
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary text-[10px] font-semibold hover:opacity-95 shadow-xs transition-opacity"
                                >
                                  Override
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    addToast({
                                      type: 'warning',
                                      title: 'Bad-Debt Write-Off',
                                      description: `${inv.id} marked uncollectible and transferred to allowance account.`,
                                    });
                                  }}
                                  className="px-2 py-1 rounded-lg bg-error-container text-on-error-container text-[10px] font-semibold hover:opacity-90 transition-opacity"
                                >
                                  Write-Off
                                </button>
                              </>
                            )}

                            {simulatedRole === 'member' && (
                              <button
                                type="button"
                                onClick={() => {
                                  addToast({
                                    type: 'info',
                                    title: 'Editing Voucher Line Items',
                                    description: `Draft mode enabled for ${inv.id}.`,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[10px] font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span> Edit Lines
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination / Totals Footer */}
            <div className="px-4 py-3 bg-surface-container-low/40 border-t border-surface-container-high/40 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant text-[11px]">
                Showing {filteredInvoices.length} of 48 active ledger statements
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-[10px] px-2 py-1 text-on-surface font-semibold">
                  Page 1 of 10
                </span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dual-Party RBAC Enclave Guarantee Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/50 shadow-xs flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-48 h-28 rounded-xl overflow-hidden relative shrink-0 bg-primary/10 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">corporate_fare</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-surface/90 text-on-surface text-[10px] font-semibold text-center shadow-xs">
                Multi-Entity Isolation
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-base text-primary">security</span>
                <h3 className="text-sm font-semibold text-on-surface font-headline">
                  Dual-Party RBAC Enclave Guarantee
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Every client-side invoice view dynamically redacts internal margin structures, gross labor markups, and master vendor banking feeds. Client staff interactions are logged with non-repudiation timestamps.
              </p>
            </div>

            <div className="shrink-0 flex flex-col gap-1 w-full md:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  addToast({
                    type: 'info',
                    title: 'SOC2 Type II Audit Certificate',
                    description: 'Enclave cryptographic isolation verified for FY2024-2025.',
                  });
                }}
                className="w-full text-xs font-semibold"
              >
                View Audit Trails
              </Button>
              <span className="text-center text-[10px] text-on-surface-variant">
                SOC-2 Type II Certified
              </span>
            </div>
          </div>
        </div>

        {/* Side Inspection Drawer: 4 cols */}
        <div className="lg:col-span-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs p-5 flex flex-col gap-4 sticky top-20">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined text-base">receipt_long</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-on-surface font-headline block">
                  {currentInvoice.id}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {currentInvoice.clientEntity}
                </span>
              </div>
            </div>

            <span
              className={cn(
                'text-[10px] px-2.5 py-0.5 rounded-full font-bold',
                currentInvoice.status === 'paid_settled'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : currentInvoice.status === 'overdue'
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-primary-fixed text-on-primary-fixed-variant'
              )}
            >
              {currentInvoice.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          {/* Role Access Indicator Tag */}
          <div className="p-2.5 px-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">policy</span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                Field Shielding Matrix:
              </span>
            </div>
            <span className="text-[11px] uppercase font-bold text-primary font-mono">
              {roleConfig.name}
            </span>
          </div>

          {/* Field Preview 1: General Header */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
              General Header
            </span>
            <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/40 flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Issue / Billing Period:</span>
                <span className="font-semibold text-on-surface">{currentInvoice.period}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Total Billable Amount:</span>
                <span className="font-bold text-on-surface text-sm tabular-nums">
                  {formatCurrency(currentInvoice.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Tax Identifier:</span>
                <span className="font-mono text-on-surface">{currentInvoice.taxId}</span>
              </div>
            </div>
          </div>

          {/* Field Preview 2: Deliverable Breakdown */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Deliverable Breakdown
              </span>
              <span className="text-[10px] text-secondary font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">visibility</span>
                Visible to Staff
              </span>
            </div>
            <div className="space-y-1.5">
              {currentInvoice.lineItems.map((li) => (
                <div
                  key={li.id}
                  className="p-2.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/40 flex justify-between items-center text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-on-surface leading-tight">{li.title}</span>
                    <span className="text-[10px] text-on-surface-variant">{li.description}</span>
                  </div>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatCurrency(li.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Field Preview 3: RESTRICTED FIELD: Cost & Profit Yield */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Cost &amp; Profit Yield
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold flex items-center gap-0.5',
                  roleConfig.canViewMargins ? 'text-secondary' : 'text-error'
                )}
              >
                <span className="material-symbols-outlined text-xs">
                  {roleConfig.canViewMargins ? 'lock_open' : 'lock'}
                </span>
                {roleConfig.canViewMargins ? 'Unmasked (Internal)' : 'Restricted (Internal)'}
              </span>
            </div>

            {/* MASKED VIEW vs UNMASKED VIEW */}
            {!roleConfig.canViewMargins ? (
              <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 flex flex-col items-center justify-center text-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">lock_clock</span>
                </div>
                <span className="font-semibold text-xs text-on-surface">Field Redacted</span>
                <p className="text-[11px] text-on-surface-variant max-w-xs leading-relaxed">
                  Internal Direct Cost &amp; Profit Margins are strictly shielded from Client roles (Admin, Staff, Planner).
                </p>
                <span className="text-[9px] text-error font-bold tracking-wide mt-1">
                  PERMISSION DENIED
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-container-high/70 border border-surface-container-high flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Internal Cost of Delivery:</span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatCurrency(currentInvoice.directCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Gross Profit Contribution:</span>
                  <span className="font-bold text-secondary tabular-nums">
                    {formatCurrency(currentInvoice.grossProfit)} ({currentInvoice.profitMarginPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Direct Write-Off Max:</span>
                  <span className="font-medium text-on-surface tabular-nums">
                    ${currentInvoice.writeOffMax.toLocaleString()} (Manager Auth)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Field Preview 4: Settlement Routing */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Settlement Routing
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                Client Admin &amp; Manager
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Recipient Enclave:</span>
                <span className="font-semibold text-on-surface">
                  {roleConfig.bankText}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Payment Protocol:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                  {currentInvoice.paymentProtocol}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Dynamic CTA Buttons according to role */}
          <div className="pt-2 flex flex-col gap-2 border-t border-surface-container-high/40">
            {simulatedRole === 'client_admin' && (
              <>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => authorizeInvoice(currentInvoice.id)}
                  className="w-full h-10 bg-primary-container text-on-primary font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Authorize &amp; Pay Now ({formatCurrency(currentInvoice.amount)})</span>
                </Button>
                <Button
                  type="button"
                  variant="destructiveGhost"
                  onClick={() => disputeInvoice(currentInvoice.id)}
                  className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">flag</span>
                  <span>Assign Dispute Ticket</span>
                </Button>
              </>
            )}

            {simulatedRole === 'client_staff' && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    addToast({
                      type: 'success',
                      title: 'Stamped Receipt Downloaded',
                      description: `Official IRS tax stamp verified for ${currentInvoice.id}.`,
                    });
                  }}
                  className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Download Stamped Tax Receipt (PDF)</span>
                </Button>
                <Button
                  type="button"
                  variant="subtle"
                  onClick={() => disputeInvoice(currentInvoice.id, 'Staff breakdown inquiry')}
                  className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">contact_support</span>
                  <span>Request Detail Breakdown</span>
                </Button>
              </>
            )}

            {simulatedRole === 'client_planner' && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    addToast({
                      type: 'info',
                      title: 'Milestone Synchronized',
                      description: `${currentInvoice.id} incorporated into 2025 cash runway projection.`,
                    });
                  }}
                  className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">stacked_line_chart</span>
                  <span>Sync with Cash Forecast</span>
                </Button>
                <div className="p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant text-xs text-center border border-surface-container-high/40">
                  Payment settlement is locked to Client Admin.
                </div>
              </>
            )}

            {simulatedRole === 'manager' && (
              <>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    addToast({
                      type: 'info',
                      title: 'Direct Discount Dialog',
                      description: `Manager override interface activated for ${currentInvoice.id}.`,
                    });
                  }}
                  className="w-full h-10 bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  <span>Direct Discount &amp; Override</span>
                </Button>
                <Button
                  type="button"
                  variant="destructiveGhost"
                  onClick={() => {
                    addToast({
                      type: 'warning',
                      title: 'Voucher Written Off',
                      description: `${currentInvoice.id} classified as bad-debt under SOX 404 guidelines.`,
                    });
                  }}
                  className="w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  <span>Mark Uncollectible (Write-Off)</span>
                </Button>
              </>
            )}

            {simulatedRole === 'member' && (
              <>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    addToast({
                      type: 'info',
                      title: 'Draft Mode Opened',
                      description: 'Member editing privileges granted for invoice deliverables.',
                    });
                  }}
                  className="w-full h-10 bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">edit_note</span>
                  <span>Edit Line Items &amp; Attach Receipt</span>
                </Button>
                <div className="p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant text-xs text-center border border-surface-container-high/40">
                  Write-offs &amp; payment token updates require Manager authorization.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
