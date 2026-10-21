import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/button';
import { cn } from '../utils/cn';

export function AccessMatrixPage() {
  const { teamMembers, openEditRoleDrawer, addToast } = useAppStore();
  const [activeModule, setActiveModule] = useState<'all' | 'gl' | 'invoicing' | 'forecast' | 'security'>('all');
  const [matrixSearch, setMatrixSearch] = useState('');

  const modules = [
    {
      id: 'gl',
      title: 'Module A: General Ledger & Bank Feeds',
      badge: '5 Controls Enforced',
      permissions: [
        {
          name: 'View Ledger Transactions',
          desc: 'Inspect double-entry journal balance books, journal postings, and tax allocations.',
          manager: 'FULL',
          member: 'FULL',
          clientAdmin: 'SCOPED',
          clientStaff: 'STATEMENTS',
          clientPlanner: 'ANALYTICS',
        },
        {
          name: 'Reconcile Bank Transactions',
          desc: 'Match Plaid/Stripe feeds with pending ledger batches and adjust clearing accounts.',
          manager: 'FULL',
          member: 'FULL',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Manual Journal Entry',
          desc: 'Draft, debit, and credit adjustment entries directly to historical books.',
          manager: 'FULL',
          member: 'DRAFT',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Lock Accounting Period',
          desc: 'Freeze ledger state, seal cash timestamps, and disallow backdated entries.',
          manager: 'AUTHORIZED',
          member: 'NONE',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Export Immutable Audit Trail',
          desc: 'Generate forensic SHA-256 verifiable logs for GAAP / IRS statutory audits.',
          manager: 'FULL',
          member: 'VIEW',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
      ],
    },
    {
      id: 'invoicing',
      title: 'Module B: Invoicing & Payables',
      badge: '4 Dynamic Rails',
      permissions: [
        {
          name: 'Create & Issue Client Invoices',
          desc: 'Draft billable line items, compute jurisdictional sales tax, and dispatch pay links.',
          manager: 'FULL',
          member: 'DRAFT',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Delete / Void Invoices',
          desc: 'Permanently cancel issued documents and record reversing credit memo entries.',
          manager: 'AUTHORIZED',
          member: 'NONE',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Approve Bad-Debt Write-Offs',
          desc: 'Extinguish debt claims against accounts receivable valuation allowances.',
          manager: 'AUTHORIZED',
          member: 'NONE',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Process Payouts & Wires',
          desc: 'Release treasury reserves for vendor settlements and payroll disbursements.',
          manager: 'AUTHORIZED',
          member: 'NONE',
          clientAdmin: 'AUTHORIZED',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
      ],
    },
    {
      id: 'forecast',
      title: 'Module C: Forecasting & Client Strategy',
      badge: 'Advisory Enclave',
      permissions: [
        {
          name: 'Create Forward Scenarios',
          desc: 'Build runway models, head-count expansions, and debt-interest stress tests.',
          manager: 'FULL',
          member: 'FULL',
          clientAdmin: 'VIEW',
          clientStaff: 'NONE',
          clientPlanner: 'FULL EDIT',
        },
        {
          name: 'View Gross & Net Profit Margins',
          desc: 'Access EBITDA breakdowns, product line contribution rates, and executive payroll split.',
          manager: 'UNMASKED',
          member: 'UNMASKED',
          clientAdmin: 'MASKED',
          clientStaff: 'MASKED',
          clientPlanner: 'MASKED',
        },
        {
          name: 'Edit Master Financial Model Assumptions',
          desc: 'Update cost of capital, hurdle metrics, and inflation multipliers.',
          manager: 'FULL',
          member: 'FULL',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'FULL',
        },
      ],
    },
    {
      id: 'security',
      title: 'Module D: User & Security Management',
      badge: 'Tier-0 Root Scope',
      permissions: [
        {
          name: 'Invite & Provision Users',
          desc: 'Send authentication workspace invites and assign initial workspace tenancies.',
          manager: 'FULL',
          member: 'NONE',
          clientAdmin: 'CLIENT SCOPE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Assign RBAC Matrix Roles',
          desc: 'Elevate or downgrade accounts across the 5 security tiers.',
          manager: 'AUTHORIZED',
          member: 'NONE',
          clientAdmin: 'NONE',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
        {
          name: 'Revoke API Tokens & Passkeys',
          desc: 'Immediate cryptographic session invalidation across federated identity relays.',
          manager: 'AUTHORIZED',
          member: 'NONE',
          clientAdmin: 'SELF ONLY',
          clientStaff: 'NONE',
          clientPlanner: 'NONE',
        },
      ],
    },
  ];

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      if (activeModule !== 'all' && m.id !== activeModule) return false;
      return true;
    });
  }, [modules, activeModule]);

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
            Security Enclave
          </span>
          <span className="text-on-surface-variant text-[10px]">/</span>
          <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
            Nova Enterprise Access Control
          </span>
          <span className="text-on-surface-variant text-[10px]">/</span>
          <span className="text-[10px] text-primary font-bold">RBAC</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-on-surface tracking-tight font-headline">
              Access &amp; Permissions Matrix
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5 max-w-3xl leading-relaxed">
              Configure deterministic granular permissions, cryptographic guardrails, and compliance bounds across firm and client stakeholders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              ISO 27001 &amp; SOC2 Compliant
            </span>
          </div>
        </div>
      </div>

      {/* 5 Authority Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-on-primary-fixed-variant px-2 py-0.5 rounded-full bg-primary-fixed">
                Manager
              </span>
              <span className="text-[10px] font-mono text-outline">Tier-0 Root</span>
            </div>
            <p className="text-xs font-semibold text-on-surface">Firm Partner / Controller</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              Unrestricted operational ownership, crypto key management.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-[10px] font-semibold text-primary">
            <span>• Hardware Key</span>
            <span>24/7 Enclave</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container-high">
                Member
              </span>
              <span className="text-[10px] font-mono text-outline">Tier-1 Staff</span>
            </div>
            <p className="text-xs font-semibold text-on-surface">Senior Staff Accountant</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              Internal accounting execution, reconciliations, draft journal posting.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-[10px] font-semibold text-on-surface-variant">
            <span>• WebAuthn 2FA</span>
            <span>Office Hours</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-on-secondary-container px-2 py-0.5 rounded-full bg-secondary-container">
                Client Admin
              </span>
              <span className="text-[10px] font-mono text-outline">Tier-2 Exec</span>
            </div>
            <p className="text-xs font-semibold text-on-surface">Corporate CFO / Controller</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              Inbound wire release, corporate tokenization, balance sign-off.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-[10px] font-semibold text-secondary">
            <span>• Payout Auth</span>
            <span>Entity Scoped</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-on-tertiary-container px-2 py-0.5 rounded-full bg-tertiary-fixed">
                Client Staff
              </span>
              <span className="text-[10px] font-mono text-outline">Tier-3 Ops</span>
            </div>
            <p className="text-xs font-semibold text-on-surface">AP / AR Specialist</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              Itemized voucher entry, receipt scanning, inquiry tickets.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-[10px] font-semibold text-tertiary">
            <span>• Receipts Only</span>
            <span>Masked Bank</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[#6d28d9] px-2 py-0.5 rounded-full bg-[#f5f3ff]">
                Client Planner
              </span>
              <span className="text-[10px] font-mono text-outline">Advisory</span>
            </div>
            <p className="text-xs font-semibold text-on-surface">Financial Analyst</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              Strategic consultant / forward sandbox modeling, blinded margins.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-[10px] font-semibold text-primary">
            <span>• Scenarios</span>
            <span>Blinded P&amp;L</span>
          </div>
        </div>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-surface-container-high/60 overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Modules (24)' },
              { id: 'gl', label: 'GL & Banking' },
              { id: 'invoicing', label: 'Invoicing & AP' },
              { id: 'forecast', label: 'Forecasting & Strategy' },
              { id: 'security', label: 'Security & Users' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveModule(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                activeModule === tab.id
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-on-surface-variant">
          Matrix data verified against <span className="font-mono text-on-surface">ISO-27001 Annex A.9</span> controls
        </div>
      </div>

      {/* Detailed Granular Permission Tables by Module */}
      <div className="space-y-6">
        {filteredModules.map((mod) => (
          <div
            key={mod.id}
            className="rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs overflow-hidden"
          >
            <div className="p-4 bg-surface-container-low/70 border-b border-surface-container-high/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">tune</span>
                <h3 className="text-sm font-semibold text-on-surface font-headline">{mod.title}</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold">
                {mod.badge}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/40 text-on-surface-variant text-[10px] uppercase tracking-wider border-b border-surface-container-high/40">
                    <th className="py-2.5 px-4 font-bold">Permission / Action</th>
                    <th className="py-2.5 px-3 font-bold text-center">Manager</th>
                    <th className="py-2.5 px-3 font-bold text-center">Member</th>
                    <th className="py-2.5 px-3 font-bold text-center">Client Admin</th>
                    <th className="py-2.5 px-3 font-bold text-center">Client Staff</th>
                    <th className="py-2.5 px-3 font-bold text-center">Client Planner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/30 text-xs">
                  {mod.permissions.map((p, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4 max-w-md">
                        <span className="font-semibold text-on-surface block">{p.name}</span>
                        <span className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed block">
                          {p.desc}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold">
                          {p.manager}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-[10px] font-bold">
                          {p.member}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold',
                            p.clientAdmin === 'NONE'
                              ? 'bg-surface-container-low text-outline'
                              : 'bg-secondary-container text-on-secondary-container'
                          )}
                        >
                          {p.clientAdmin}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold',
                            p.clientStaff === 'NONE'
                              ? 'bg-surface-container-low text-outline'
                              : 'bg-tertiary-fixed text-on-tertiary-container'
                          )}
                        >
                          {p.clientStaff}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold',
                            p.clientPlanner === 'NONE'
                              ? 'bg-surface-container-low text-outline'
                              : 'bg-[#f5f3ff] text-[#6d28d9]'
                          )}
                        >
                          {p.clientPlanner}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Team Member Role Assignments & Edit Drawer Trigger Table */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-on-surface font-headline">
              Active User Role Assignments &amp; Guardrails
            </h3>
            <p className="text-xs text-on-surface-variant">
              Click &quot;Edit Role &amp; Scope&quot; on any user to configure security elevation, IP CIDR, and field masking.
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold">
            {teamMembers.length} Accounts Synchronized
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant text-[10px] uppercase tracking-wider border-b border-surface-container-high/40">
                <th className="py-3 px-4 font-bold">User Identity</th>
                <th className="py-3 px-4 font-bold">Assigned Tier</th>
                <th className="py-3 px-4 font-bold">Authorized Tenants</th>
                <th className="py-3 px-4 font-bold">Security Guardrails</th>
                <th className="py-3 px-4 font-bold">Access Expiry</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30 text-xs">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs',
                          member.avatarBg
                        )}
                      >
                        {member.avatarInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-on-surface">{member.name}</span>
                          {!member.isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-error-container text-on-error-container font-bold">
                              Revoked
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', member.badgeBg, member.badgeText)}>
                      {member.roleLabel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-on-surface font-medium truncate block max-w-xs">
                      {member.authorizedEntities.join(', ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {member.hardware2FA && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold" title="Hardware FIDO2 Enforced">
                          🔑 2FA
                        </span>
                      )}
                      {member.ipGeofenced && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold" title="IP CIDR Geofenced">
                          🌐 CIDR
                        </span>
                      )}
                      {member.maskMargins && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary-container/60 text-on-secondary-container font-semibold" title="Margin Shielding Active">
                          🛡️ Margins Masked
                        </span>
                      )}
                      {member.canAuthorizeWires && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-semibold" title="Payouts Permitted">
                          ⚡ Payouts
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                    {member.roleExpiry}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => openEditRoleDrawer(member)}
                      className="text-xs font-semibold gap-1.5 bg-primary-container text-on-primary shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">tune</span>
                      <span>Edit Role &amp; Scope</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Data Masking & Field Obfuscation */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">enhanced_encryption</span>
          <h3 className="text-base font-semibold text-on-surface font-headline">
            Data Masking &amp; Field Obfuscation
          </h3>
        </div>
        <p className="text-xs text-on-surface-variant max-w-3xl leading-relaxed">
          Deterministic cryptographic redaction applied before payment payloads reach external client browser contexts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-on-surface">Tax ID / EIN Shielding</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                  Enforced
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Middle digits masked as US-EIN-**-****02 to prevent sensitive corporate identity harvesting.
              </p>
            </div>
            <span className="font-mono text-xs text-primary font-bold mt-3">US-EIN-94••••02</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-on-surface">Profit Margins &amp; Costs</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-bold">
                  Restricted
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Gross labor rates, internal delivery costs, and contractor pass-through fees blinded for Client roles.
              </p>
            </div>
            <span className="font-mono text-xs text-error font-bold mt-3">[Field Redacted]</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-on-surface">Bank Transit &amp; Routing</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                  Enforced
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Full ABA numbers hidden. Only last 4 account digits visible on client verification vouchers.
              </p>
            </div>
            <span className="font-mono text-xs text-primary font-bold mt-3">JPMorgan Chase (•••• 8912)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
