import axios from 'axios';
import { appConfig } from '../config/env';
import type { 
  LedgerTransaction, 
  Invoice, 
  GovernanceQueueItem, 
  VaultFile, 
  TeamMember,
  AuditEvent,
  Milestone,
  CategoryBudgetThreshold,
} from '../types';

// Axios instance. baseURL comes from the active env file (.env.development, .env.dev, .env.production).
// Local calls /api, which Vite proxies to VITE_API_PROXY_TARGET. Dev and prod call the financing API directly.
export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Enclave': 'SOC2-TypeII-Certified',
  },
});

let actorRole = 'manager';

export function setApiActorRole(role: string) {
  actorRole = role;
}

apiClient.interceptors.request.use((config) => {
  config.headers.set('X-Actor-Role', actorRole);
  return config;
});

export function problemMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; title?: string } | undefined;
    if (data?.detail) return data.detail;
    if (data?.title) return data.title;
    if (error.response?.status) return `Request failed (${error.response.status})`;
  }
  return 'The financing API could not complete this request.';
}

function money(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function asTransaction(raw: LedgerTransaction): LedgerTransaction {
  return {
    ...raw,
    amount: money(raw.amount),
    tags: raw.tags ?? [],
    requiresDualSign: Boolean(raw.requiresDualSign),
    approved: Boolean(raw.approved),
  };
}

function asInvoice(raw: Invoice): Invoice {
  return {
    ...raw,
    amount: money(raw.amount),
    lineItems: (raw.lineItems ?? []).map((line) => ({ ...line, amount: money(line.amount) })),
    directCost: raw.directCost == null ? raw.directCost : money(raw.directCost),
    grossProfit: raw.grossProfit == null ? raw.grossProfit : money(raw.grossProfit),
    profitMarginPercent: raw.profitMarginPercent == null ? raw.profitMarginPercent : money(raw.profitMarginPercent),
    writeOffMax: money(raw.writeOffMax),
    disputed: Boolean(raw.disputed),
  };
}

function asMember(raw: TeamMember & { active?: boolean }): TeamMember {
  return {
    ...raw,
    isActive: raw.isActive ?? Boolean(raw.active),
  };
}

function asBudget(raw: CategoryBudgetThreshold): CategoryBudgetThreshold {
  return {
    ...raw,
    monthlyBudget: money(raw.monthlyBudget),
    warningPercentage: Number(raw.warningPercentage),
  };
}

function asMilestone(raw: Milestone): Milestone {
  return { ...raw, budget: money(raw.budget), spent: money(raw.spent) };
}

function asGovernance(raw: GovernanceQueueItem): GovernanceQueueItem {
  return { ...raw, amount: money(raw.amount), requiresSecondSigner: Boolean(raw.requiresSecondSigner), signed: Boolean(raw.signed) };
}

export function isFirmRole(role: string): boolean {
  return role === 'manager' || role === 'member';
}

// Mock Initial Data Seed
export const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: 'tx-1',
    ref: 'TXN-90241',
    date: 'Today, 09:42 AM',
    entity: 'Acme Global Holdings',
    client: 'Strata Cloud Corp',
    accountCode: '1200-AR',
    category: 'Q3 Cloud Retainer',
    amount: 64200.0,
    type: 'inflow',
    status: 'verified',
    method: 'Inflow Wire',
    requiresDualSign: false,
    approved: true,
    tags: ['SaaS', 'Retainer', 'Tier-1'],
  },
  {
    id: 'tx-2',
    ref: 'TXN-90238',
    date: 'Yesterday, 16:15',
    entity: 'Acme EMEA B.V.',
    client: 'Amazon Web Services',
    accountCode: '5100-COGS',
    category: 'Compute Clusters',
    amount: -18450.0,
    type: 'outflow',
    status: 'awaiting_mgr',
    method: 'ACH Outflow',
    requiresDualSign: true,
    approved: false,
    tags: ['Infrastructure', 'Cloud', 'OpEx'],
  },
  {
    id: 'tx-3',
    ref: 'TXN-90192',
    date: 'Oct 24, 2024',
    entity: 'Acme Pacific Logistics',
    client: 'Helios Energy Corp',
    accountCode: '4000-REV',
    category: 'Licensing & IP',
    amount: 29800.0,
    type: 'inflow',
    status: 'reconciled',
    method: 'Direct Deposit',
    requiresDualSign: false,
    approved: true,
    tags: ['CleanTech', 'IP', 'Licensing'],
  },
  {
    id: 'tx-4',
    ref: 'TXN-90184',
    date: 'Oct 23, 2024',
    entity: 'Acme Global Holdings',
    client: 'Latham & Watkins LLP',
    accountCode: '6200-LEG',
    category: 'Statutory Filing Retainer',
    amount: -14500.0,
    type: 'outflow',
    status: 'threshold_flag',
    method: 'Corporate Escrow',
    requiresDualSign: true,
    approved: false,
    tags: ['Legal', 'Advisory', 'Escrow'],
  },
  {
    id: 'tx-5',
    ref: 'TXN-90161',
    date: 'Oct 21, 2024',
    entity: 'Acme Pacific Logistics',
    client: 'Nexus Robotics AI',
    accountCode: '4000-REV',
    category: 'Enterprise AI Tier 4',
    amount: 82000.0,
    type: 'inflow',
    status: 'verified',
    method: 'Swift Wire',
    requiresDualSign: false,
    approved: true,
    tags: ['AI/ML', 'Platform', 'Enterprise'],
  },
  {
    id: 'tx-6',
    ref: 'TXN-90145',
    date: 'Oct 19, 2024',
    entity: 'Acme Global Holdings',
    client: 'Stripe Settlement',
    accountCode: '1010-CASH',
    category: 'Merchant Card Settlement',
    amount: 43250.0,
    type: 'inflow',
    status: 'reconciled',
    method: 'Automated Clearing House',
    requiresDualSign: false,
    approved: true,
    tags: ['Merchant', 'Automated', 'Cash'],
  },
  {
    id: 'tx-7',
    ref: 'TXN-90122',
    date: 'Oct 18, 2024',
    entity: 'Acme EMEA B.V.',
    client: 'Snowflake Data Cloud',
    accountCode: '5100-COGS',
    category: 'Warehouse Compute Capacity',
    amount: -23400.0,
    type: 'outflow',
    status: 'threshold_flag',
    method: 'ACH Direct',
    requiresDualSign: true,
    approved: false,
    tags: ['Infrastructure', 'Data Cloud'],
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2024-8841',
    clientEntity: 'Vortex Dynamics Inc.',
    clientSubUnit: 'Global Enterprise',
    avatarInitials: 'VO',
    scopeRole: 'Client Admin',
    issueDate: 'Sep 12, 2024',
    dueDate: 'Oct 02, 2024',
    amount: 142800.0,
    status: 'pending_client_approval',
    period: 'Sep 01 - Sep 30, 2024',
    taxId: 'US-EIN-94819002',
    lineItems: [
      {
        id: 'li-1',
        title: 'Data Engine Cluster Architecture',
        description: '140 hours @ $450/hr billing rate',
        amount: 63000.0,
      },
      {
        id: 'li-2',
        title: 'Enterprise SOC2 Enclave Migration',
        description: 'Fixed Milestone 2 Completion',
        amount: 79800.0,
      },
    ],
    directCost: 64260.0,
    grossProfit: 78540.0,
    profitMarginPercent: 55.0,
    writeOffMax: 15000,
    recipientBank: 'J.P. Morgan Chase (•••• 8912)',
    paymentProtocol: 'ACH Same-Day Verified',
  },
  {
    id: 'INV-2024-8839',
    clientEntity: 'Hyperion Logistics',
    clientSubUnit: 'Fleet Operations',
    avatarInitials: 'HL',
    scopeRole: 'Client Staff',
    issueDate: 'Aug 28, 2024',
    dueDate: 'Sep 18, 2024',
    amount: 34200.0,
    status: 'overdue',
    period: 'Aug 01 - Aug 31, 2024',
    taxId: 'US-EIN-48201994',
    lineItems: [
      {
        id: 'li-3',
        title: 'Global Fleet Telemetry Routing API',
        description: 'Monthly active compute throughput',
        amount: 34200.0,
      },
    ],
    directCost: 15390.0,
    grossProfit: 18810.0,
    profitMarginPercent: 55.0,
    writeOffMax: 5000,
    recipientBank: 'J.P. Morgan Chase (•••• 8912)',
    paymentProtocol: 'ACH Same-Day Verified',
  },
  {
    id: 'INV-2024-8836',
    clientEntity: 'Aether Tech Labs',
    clientSubUnit: 'Research Unit',
    avatarInitials: 'AT',
    scopeRole: 'Client Planner',
    issueDate: 'Sep 15, 2024',
    dueDate: 'Oct 15, 2024',
    amount: 88500.0,
    status: 'draft_review',
    period: 'Sep 01 - Sep 30, 2024',
    taxId: 'US-EIN-73910284',
    lineItems: [
      {
        id: 'li-4',
        title: 'Quantum Simulator Pipeline Engineering',
        description: 'Sprint 8 deliverable sign-off',
        amount: 88500.0,
      },
    ],
    directCost: 39825.0,
    grossProfit: 48675.0,
    profitMarginPercent: 55.0,
    writeOffMax: 10000,
    recipientBank: 'J.P. Morgan Chase (•••• 8912)',
    paymentProtocol: 'ACH Same-Day Verified',
  },
  {
    id: 'INV-2024-8820',
    clientEntity: 'Northbridge Capital',
    clientSubUnit: 'Fund II Management',
    avatarInitials: 'NB',
    scopeRole: 'Manager',
    issueDate: 'Sep 01, 2024',
    dueDate: 'Sep 20, 2024',
    amount: 325000.0,
    status: 'paid_settled',
    period: 'Aug 01 - Aug 31, 2024',
    taxId: 'US-EIN-29381044',
    lineItems: [
      {
        id: 'li-5',
        title: 'Private Equity General Ledger Audit & Tax Prep',
        description: 'Retainer settlement and closing workpapers',
        amount: 325000.0,
      },
    ],
    directCost: 130000.0,
    grossProfit: 195000.0,
    profitMarginPercent: 60.0,
    writeOffMax: 50000,
    recipientBank: 'J.P. Morgan Chase (Full ABA: 021000021)',
    paymentProtocol: 'Wire Transfer Settled',
  },
  {
    id: 'INV-2024-8815',
    clientEntity: 'Solaria Renewable LLC',
    clientSubUnit: 'Solar Grid Phase 3',
    avatarInitials: 'SO',
    scopeRole: 'Client Admin',
    issueDate: 'Sep 05, 2024',
    dueDate: 'Oct 05, 2024',
    amount: 101600.0,
    status: 'pending_client_approval',
    period: 'Aug 15 - Sep 15, 2024',
    taxId: 'US-EIN-88192031',
    lineItems: [
      {
        id: 'li-6',
        title: 'Clean Energy Tax Equity Structure Advisory',
        description: 'Section 48 investment tax credit allocation',
        amount: 101600.0,
      },
    ],
    directCost: 45720.0,
    grossProfit: 55880.0,
    profitMarginPercent: 55.0,
    writeOffMax: 15000,
    recipientBank: 'J.P. Morgan Chase (•••• 8912)',
    paymentProtocol: 'ACH Same-Day Verified',
  },
];

export const INITIAL_GOVERNANCE_QUEUE: GovernanceQueueItem[] = [
  {
    id: 'gov-1',
    vendor: 'Amazon Web Services',
    txnRef: 'TXN-90238 • Infrastructure COGS',
    category: 'Compute Clusters',
    entity: 'Acme EMEA B.V.',
    amount: 18450.0,
    dueIn: 'Requires 2nd Signer',
    requiresSecondSigner: true,
    signed: false,
  },
  {
    id: 'gov-2',
    vendor: 'Latham & Watkins LLP',
    txnRef: 'TXN-90184 • Statutory Retainer',
    category: 'Corporate Escrow',
    entity: 'Acme Global Holdings',
    amount: 14500.0,
    dueIn: 'Due in 18 hrs',
    requiresSecondSigner: true,
    signed: false,
  },
  {
    id: 'gov-3',
    vendor: 'Snowflake Data Cloud',
    txnRef: 'TXN-90122 • Warehouse Compute',
    category: 'Database Infrastructure',
    entity: 'Acme EMEA B.V.',
    amount: 23400.0,
    dueIn: 'Due in 24 hrs',
    requiresSecondSigner: true,
    signed: false,
  }
];

export const INITIAL_VAULT_FILES: VaultFile[] = [
  {
    id: 'vf-1',
    title: 'FY2024 Audited Balance Sheet & P&L',
    subtitle: 'Certified by Deloitte LLP',
    category: 'public',
    categoryLabel: 'Public to Client',
    fiscalPeriod: 'FY 2024 Final',
    fileSize: '4.2 MB',
    plannerAccess: 'full_view',
    icon: 'description',
    iconBg: 'bg-primary-fixed text-on-primary-fixed',
  },
  {
    id: 'vf-2',
    title: 'Q1 2025 Revenue Realization Models',
    subtitle: 'StratTech SaaS Recurring Ledger',
    category: 'public',
    categoryLabel: 'Public to Client',
    fiscalPeriod: 'Q1 2025 WIP',
    fileSize: '1.8 MB',
    plannerAccess: 'full_edit',
    icon: 'table_view',
    iconBg: 'bg-secondary-fixed text-on-secondary-fixed',
  },
  {
    id: 'vf-3',
    title: 'Silicon Valley Bank Wire Mandate & Signers',
    subtitle: 'Treasury signatory protocol',
    category: 'admin',
    categoryLabel: 'Client Admin Only',
    fiscalPeriod: 'Active Indefinite',
    fileSize: '890 KB',
    plannerAccess: 'restricted',
    icon: 'key',
    iconBg: 'bg-surface-container-highest text-on-surface-variant',
  },
  {
    id: 'vf-4',
    title: 'Executive Bonus & Equity Cap Table Schedule',
    subtitle: 'Series B Option Allocation',
    category: 'admin',
    categoryLabel: 'Client Admin Only',
    fiscalPeriod: '2024-2025',
    fileSize: '3.1 MB',
    plannerAccess: 'restricted',
    icon: 'payments',
    iconBg: 'bg-surface-container-highest text-on-surface-variant',
  },
  {
    id: 'vf-5',
    title: 'Nova CPA Advisory Engagement Workpapers',
    subtitle: 'Staff accountant audit reconciliations',
    category: 'firm',
    categoryLabel: 'Internal Firm Only',
    fiscalPeriod: 'Internal Audit',
    fileSize: '12.4 MB',
    plannerAccess: 'hidden',
    icon: 'lock_clock',
    iconBg: 'bg-surface-container-highest text-on-surface-variant',
  },
  {
    id: 'vf-6',
    title: 'R&D Tax Credit Federal Eligibility Assessment',
    subtitle: 'IRS Form 6765 Prep Documentation',
    category: 'public',
    categoryLabel: 'Public to Client',
    fiscalPeriod: 'Tax Year 2024',
    fileSize: '2.1 MB',
    plannerAccess: 'full_view',
    icon: 'verified',
    iconBg: 'bg-primary-fixed text-on-primary-fixed',
  },
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-elena-gomez',
    name: 'Elena Gomez',
    email: 'elena.gomez@strattechcorp.com',
    avatarInitials: 'EG',
    avatarBg: 'bg-[#6d28d9] text-white',
    role: 'client_planner',
    roleLabel: 'Client Planner',
    badgeBg: 'bg-[#f5f3ff]',
    badgeText: 'text-[#6d28d9]',
    isActive: true,
    capabilities: {
      invoicing: true,
      banking: false,
      planning: true,
      audit: false,
    },
    authorizedEntities: ['StratTech Corp (Primary)', 'StratTech EMEA Ltd (2 Entities)'],
    hardware2FA: true,
    ipGeofenced: true,
    maskMargins: true,
    permitScenarioModeling: true,
    canAuthorizeWires: false,
    roleExpiry: 'Continuous Access (Until Revoked)',
    elevationProtocol: 'Peer-Reviewed • Tier-2 Compliant',
    auditLogNote: 'Assigned strategic advisory privileges for FY2025 planning round with verified CIDR geofence.',
  },
  {
    id: 'user-marcus-vance',
    name: 'Marcus Vance',
    email: 'marcus.vance@strattechcorp.com',
    avatarInitials: 'MV',
    avatarBg: 'bg-[#0f766e] text-white',
    role: 'client_admin',
    roleLabel: 'Client Admin',
    badgeBg: 'bg-[#f0fdfa]',
    badgeText: 'text-[#0f766e]',
    isActive: true,
    capabilities: {
      invoicing: true,
      banking: true,
      planning: true,
      audit: true,
    },
    authorizedEntities: ['StratTech Corp (Primary)', 'StratTech EMEA Ltd (2 Entities)'],
    hardware2FA: true,
    ipGeofenced: true,
    maskMargins: true,
    permitScenarioModeling: true,
    canAuthorizeWires: true,
    roleExpiry: 'Continuous Access (Until Revoked)',
    elevationProtocol: 'Board Authorized',
    auditLogNote: 'Designated external authorized corporate treasury officer.',
  },
  {
    id: 'user-dave-robinson',
    name: 'Dave Robinson',
    email: 'dave.robinson@strattechcorp.com',
    avatarInitials: 'DR',
    avatarBg: 'bg-[#0369a1] text-white',
    role: 'client_staff',
    roleLabel: 'Client Staff',
    badgeBg: 'bg-[#f0f9ff]',
    badgeText: 'text-[#0369a1]',
    isActive: false,
    capabilities: {
      invoicing: true,
      banking: false,
      planning: false,
      audit: false,
    },
    authorizedEntities: ['StratTech Corp (Primary)'],
    hardware2FA: false,
    ipGeofenced: true,
    maskMargins: true,
    permitScenarioModeling: false,
    canAuthorizeWires: false,
    roleExpiry: 'Temporary 90 Days',
    elevationProtocol: 'Manager Approved',
    auditLogNote: 'Restricted AP receipt scanning and invoice inquiry ticketing.',
  },
  {
    id: 'user-elena-rostova',
    name: 'Elena Rostova',
    email: 'elena.rostova@acmeglobal.com',
    avatarInitials: 'ER',
    avatarBg: 'bg-primary text-white',
    role: 'manager',
    roleLabel: 'Internal Manager',
    badgeBg: 'bg-primary-fixed',
    badgeText: 'text-on-primary-fixed-variant',
    isActive: true,
    capabilities: {
      invoicing: true,
      banking: true,
      planning: true,
      audit: true,
    },
    authorizedEntities: ['Acme Global Holdings LLC', 'Acme EMEA Operations B.V.', 'Acme Pacific Logistics Inc'],
    hardware2FA: true,
    ipGeofenced: false,
    maskMargins: false,
    permitScenarioModeling: true,
    canAuthorizeWires: true,
    roleExpiry: 'Permanent Root',
    elevationProtocol: 'Executive VP & Controller (SOX 404)',
    auditLogNote: 'Full root general ledger mutation, fiscal locking, and dual-sign authority.',
  },
  {
    id: 'user-alex-chen',
    name: 'Alex Chen',
    email: 'alex.chen@acmeglobal.com',
    avatarInitials: 'AC',
    avatarBg: 'bg-surface-container-high text-on-surface',
    role: 'member',
    roleLabel: 'Internal Member',
    badgeBg: 'bg-surface-container-high',
    badgeText: 'text-on-surface-variant',
    isActive: true,
    capabilities: {
      invoicing: true,
      banking: false,
      planning: true,
      audit: true,
    },
    authorizedEntities: ['Acme Global Holdings LLC', 'Acme EMEA Operations B.V.'],
    hardware2FA: true,
    ipGeofenced: true,
    maskMargins: false,
    permitScenarioModeling: true,
    canAuthorizeWires: false,
    roleExpiry: 'Continuous Access',
    elevationProtocol: 'Senior Staff Accountant',
    auditLogNote: 'Double-entry drafting, draft posting, bank reconciliations.',
  }
];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'aud-105',
    timestamp: '2026-10-18 20:46:12 UTC',
    actor: 'Elena Rostova (Executive VP)',
    role: 'Manager',
    action: 'MANUAL_ENTRY_POSTED',
    category: 'manual_entry',
    entity: 'Acme Global Holdings LLC',
    targetRef: 'TXN-90241 (Strata Cloud Corp • $64,200.00)',
    hash: '0x7e11...99bc2',
    severity: 'medium',
    details: 'Initial double-entry ledger posting with tags [#SaaS, #Retainer, #Tier-1]. Verified via Swift wire rails.',
    ipAddress: '192.168.1.14 (Corporate Root CIDR)',
    delta: [
      { field: 'AccountCode', previous: 'Unallocated', current: '1200-AR' },
      { field: 'Amount', previous: '$0.00', current: '$64,200.00' },
      { field: 'Tags', previous: 'None', current: 'SaaS; Retainer; Tier-1' },
    ],
    verified: true,
  },
  {
    id: 'aud-101',
    timestamp: '2026-10-18 20:14:02 UTC',
    actor: 'Elena Rostova (Executive VP)',
    role: 'Manager',
    action: 'DUAL_SIGN_APPROVED',
    category: 'approval',
    entity: 'Acme EMEA B.V.',
    targetRef: 'TXN-90238 (AWS $18,450.00)',
    hash: '0x8f2d...4a1e9',
    severity: 'high',
    details: 'Executive dual-signature authorization released under SOX 404 segregation of duties threshold.',
    ipAddress: '192.168.1.14 (Corporate Root CIDR)',
    delta: [
      { field: 'SignerStatus', previous: 'Awaiting 2nd Signer', current: 'Executive Signed' },
      { field: 'LedgerStatus', previous: 'Awaiting Mgr', current: 'Verified & Posted' },
    ],
    verified: true,
  },
  {
    id: 'aud-102',
    timestamp: '2026-10-18 19:42:15 UTC',
    actor: 'System Enclave Plaid Relay',
    role: 'Automated Bot',
    action: 'RECONCILIATION_MATCH',
    category: 'modification',
    entity: 'Acme Global Holdings LLC',
    targetRef: 'Chase Plaid Batch #49281 (TXN-90145)',
    hash: '0x3c71...99e12',
    severity: 'low',
    details: 'Continuous double-entry match cleared against JPMorgan Chase direct bank webhook.',
    ipAddress: '10.0.12.88 (Plaid VPC Peering)',
    delta: [
      { field: 'Status', previous: 'Pending Webhook', current: 'Reconciled' },
    ],
    verified: true,
  },
  {
    id: 'aud-103',
    timestamp: '2026-10-18 18:05:44 UTC',
    actor: 'Elena Gomez (StratTech Corp)',
    role: 'Client Planner',
    action: 'SCENARIO_PARAM_MODIFIED',
    category: 'modification',
    entity: 'StratTech Corp',
    targetRef: 'Roadmap FY2025 Parameters (+12 FTEs)',
    hash: '0xaa45...71cb8',
    severity: 'medium',
    details: 'Forward runway sandbox tuned. R&D hiring adjusted from +6 to +12 FTEs; GTM spend tuned to $85k/mo.',
    ipAddress: '172.56.21.90 (Client VPN IPsec)',
    delta: [
      { field: 'HiringFTE', previous: '+6 FTEs', current: '+12 FTEs' },
      { field: 'GTMSpend', previous: '$45k/mo', current: '$85k/mo' },
      { field: 'TargetBurn', previous: '$340.0k/mo', current: '$412.5k/mo' },
    ],
    verified: true,
  },
  {
    id: 'aud-104',
    timestamp: '2026-10-18 16:30:10 UTC',
    actor: 'Elena Rostova (Executive VP)',
    role: 'Manager',
    action: 'ROLE_RBAC_ELEVATION',
    category: 'security',
    entity: 'StratTech Corp',
    targetRef: 'Elena Gomez -> Client Planner [CIDR Geofenced]',
    hash: '0x4092...ST881',
    severity: 'critical',
    details: 'Security tier assignment modified with FIDO2 WebAuthn enforcement and profit margin redaction enabled.',
    ipAddress: '192.168.1.14 (Corporate Root CIDR)',
    delta: [
      { field: 'AuthorityTier', previous: 'Client Staff (Tier-3)', current: 'Client Planner (Tier-4)' },
      { field: 'MarginMasking', previous: 'Unenforced', current: 'Deterministic Redaction Active' },
    ],
    verified: true,
  },
  {
    id: 'aud-106',
    timestamp: '2026-10-18 14:12:00 UTC',
    actor: 'Elena Rostova (Executive VP)',
    role: 'Manager',
    action: 'FISCAL_PERIOD_SEALED',
    category: 'period_lock',
    entity: 'Acme Global Holdings LLC',
    targetRef: 'Q3 2024 Accounting Period',
    hash: '0xfe99...110a4',
    severity: 'high',
    details: 'Fiscal period locked. Journal voucher mutations and backdated postings sealed under ISO 27001.',
    ipAddress: '192.168.1.14 (Corporate Root CIDR)',
    delta: [
      { field: 'PeriodLock', previous: 'Open (Drafting)', current: 'Locked (SOX 404 Enforced)' },
    ],
    verified: true,
  },
];

// Typed API helper services. Paths are /v1 because apiClient.baseURL is /api.
export const LedgerService = {
  async getTransactions(): Promise<LedgerTransaction[]> {
    const { data } = await apiClient.get<LedgerTransaction[]>('/v1/transactions');
    return data.map(asTransaction);
  },

  async createTransaction(tx: Partial<LedgerTransaction>): Promise<LedgerTransaction> {
    const { data } = await apiClient.post<LedgerTransaction>('/v1/transactions', {
      entity: tx.entity,
      client: tx.client,
      accountCode: tx.accountCode,
      category: tx.category,
      amount: tx.amount,
      method: tx.method,
      tags: tx.tags,
    });
    return asTransaction(data);
  },

  async updateTransaction(id: string, updates: Partial<LedgerTransaction>, reason?: string): Promise<LedgerTransaction> {
    const { data } = await apiClient.patch<LedgerTransaction>(`/v1/transactions/${id}`, {
      entity: updates.entity,
      client: updates.client,
      accountCode: updates.accountCode,
      category: updates.category,
      amount: updates.amount,
      method: updates.method,
      tags: updates.tags,
      reason,
    });
    return asTransaction(data);
  },

  async approveTransaction(id: string): Promise<LedgerTransaction> {
    const { data } = await apiClient.post<LedgerTransaction>(`/v1/transactions/${id}/approvals`);
    return asTransaction(data);
  },

  async batchApprove(): Promise<LedgerTransaction[]> {
    const { data } = await apiClient.post<LedgerTransaction[]>('/v1/transactions/batch-approvals');
    return data.map(asTransaction);
  },

  async getGovernanceQueue(): Promise<GovernanceQueueItem[]> {
    const { data } = await apiClient.get<GovernanceQueueItem[]>('/v1/governance-items');
    return data.map(asGovernance);
  },

  async signGovernanceItem(id: string): Promise<GovernanceQueueItem> {
    const { data } = await apiClient.post<GovernanceQueueItem>(`/v1/governance-items/${id}/signatures`);
    return asGovernance(data);
  },

  async getTags(): Promise<string[]> {
    const { data } = await apiClient.get<string[]>('/v1/ledger-tags');
    return data;
  },

  async addTag(name: string): Promise<string> {
    const { data } = await apiClient.post<string>('/v1/ledger-tags', { name });
    return data;
  },
};

export const InvoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const { data } = await apiClient.get<Invoice[]>('/v1/invoices');
    return data.map(asInvoice);
  },

  async authorizePayment(id: string): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(`/v1/invoices/${id}/authorizations`);
    return asInvoice(data);
  },

  async disputeInvoice(id: string, reason: string): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(`/v1/invoices/${id}/disputes`, { reason });
    return asInvoice(data);
  },

  async batchAuthorize(): Promise<Invoice[]> {
    const { data } = await apiClient.post<Invoice[]>('/v1/invoices/batch-authorizations');
    return data.map(asInvoice);
  },

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>('/v1/invoices', {
      clientEntity: invoice.clientEntity,
      clientSubUnit: invoice.clientSubUnit,
      scopeRole: invoice.scopeRole,
      amount: invoice.amount,
      lineItems: invoice.lineItems?.map((line) => ({
        title: line.title,
        description: line.description,
        amount: line.amount,
      })),
    });
    return asInvoice(data);
  },
};

export const SecurityService = {
  async getMembers(): Promise<TeamMember[]> {
    const { data } = await apiClient.get<TeamMember[]>('/v1/members');
    return data.map(asMember);
  },

  async updateMemberRole(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const { data } = await apiClient.patch<TeamMember>(`/v1/members/${id}`, {
      role: updates.role,
      hardware2FA: updates.hardware2FA,
      ipGeofenced: updates.ipGeofenced,
      maskMargins: updates.maskMargins,
      permitScenarioModeling: updates.permitScenarioModeling,
      canAuthorizeWires: updates.canAuthorizeWires,
      roleExpiry: updates.roleExpiry,
      auditLogNote: updates.auditLogNote,
      authorizedEntities: updates.authorizedEntities,
    });
    return asMember(data);
  },

  async revokeMember(id: string): Promise<TeamMember> {
    const { data } = await apiClient.post<TeamMember>(`/v1/members/${id}/revocations`);
    return asMember(data);
  },

  async getAuditLogs(): Promise<AuditEvent[]> {
    const { data } = await apiClient.get<AuditEvent[]>('/v1/audit-events');
    return data;
  },

  async getVaultFiles(): Promise<VaultFile[]> {
    const { data } = await apiClient.get<VaultFile[]>('/v1/vault-files');
    return data;
  },

  async addVaultFile(file: Partial<VaultFile>): Promise<VaultFile> {
    const { data } = await apiClient.post<VaultFile>('/v1/vault-files', {
      title: file.title,
      subtitle: file.subtitle,
      category: file.category,
      fiscalPeriod: file.fiscalPeriod,
      fileSize: file.fileSize,
    });
    return data;
  },
};

export const BudgetService = {
  async list(): Promise<CategoryBudgetThreshold[]> {
    const { data } = await apiClient.get<CategoryBudgetThreshold[]>('/v1/budget-thresholds');
    return data.map(asBudget);
  },

  async create(threshold: Omit<CategoryBudgetThreshold, 'id'>): Promise<CategoryBudgetThreshold> {
    const { data } = await apiClient.post<CategoryBudgetThreshold>('/v1/budget-thresholds', threshold);
    return asBudget(data);
  },

  async update(id: string, updates: Partial<CategoryBudgetThreshold>): Promise<CategoryBudgetThreshold> {
    const { data } = await apiClient.patch<CategoryBudgetThreshold>(`/v1/budget-thresholds/${id}`, updates);
    return asBudget(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/v1/budget-thresholds/${id}`);
  },
};

export const PlanningService = {
  async getMilestones(): Promise<Milestone[]> {
    const { data } = await apiClient.get<Milestone[]>('/v1/milestones');
    return data.map(asMilestone);
  },

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    const { data } = await apiClient.patch<Milestone>(`/v1/milestones/${id}`, updates);
    return asMilestone(data);
  },
};

export const ComplianceService = {
  async getFiscalPeriod(): Promise<{ locked: boolean; entity: string }> {
    const { data } = await apiClient.get<{ locked: boolean; entity: string }>('/v1/fiscal-period');
    return data;
  },

  async toggleFiscalPeriod(): Promise<{ locked: boolean; entity: string }> {
    const { data } = await apiClient.post<{ locked: boolean; entity: string }>('/v1/fiscal-period/toggle');
    return data;
  },
};

export interface WorkspaceSnapshot {
  transactions: LedgerTransaction[];
  invoices: Invoice[];
  governanceQueue: GovernanceQueueItem[];
  vaultFiles: VaultFile[];
  teamMembers: TeamMember[];
  milestones: Milestone[];
  budgetThresholds: CategoryBudgetThreshold[];
  auditLogs: AuditEvent[];
  tags: string[];
  fiscal: { locked: boolean; entity: string };
}

export const WorkspaceService = {
  async load(role: string): Promise<WorkspaceSnapshot> {
    const [transactions, invoices, governanceQueue, vaultFiles, teamMembers, milestones, tags, fiscal] = await Promise.all([
      LedgerService.getTransactions(),
      InvoiceService.getInvoices(),
      LedgerService.getGovernanceQueue(),
      SecurityService.getVaultFiles(),
      SecurityService.getMembers(),
      PlanningService.getMilestones(),
      LedgerService.getTags(),
      ComplianceService.getFiscalPeriod(),
    ]);
    let budgetThresholds: CategoryBudgetThreshold[] = [];
    let auditLogs: AuditEvent[] = [];
    if (isFirmRole(role)) {
      [budgetThresholds, auditLogs] = await Promise.all([
        BudgetService.list(),
        SecurityService.getAuditLogs(),
      ]);
    }
    return {
      transactions,
      invoices,
      governanceQueue,
      vaultFiles,
      teamMembers,
      milestones,
      budgetThresholds,
      auditLogs,
      tags,
      fiscal,
    };
  },
};
