export type UserRole = 
  | 'manager'
  | 'member'
  | 'client_admin'
  | 'client_staff'
  | 'client_planner';

export interface RoleConfig {
  key: UserRole;
  name: string;
  shortTitle: string;
  title: string;
  desc: string;
  badgeCash: string;
  badgeClass: string;
  scope: string;
  showBatchApprove: boolean;
  showApprovals: boolean;
  canReconcile: boolean;
  canManualEntry: boolean;
  canLockPeriod: boolean;
  canViewMargins: boolean;
  canViewBanking: boolean;
  canAuthorizeWires: boolean;
  bankText: string;
  primaryInvoiceAction: string;
  matrix: {
    role: string;
    view: { granted: boolean; text: string };
    create: { granted: boolean; text: string };
    approve: { granted: boolean; text: string };
    period: { granted: boolean; text: string };
    audit: { granted: boolean; text: string };
  };
  footnote: string;
}

export interface LedgerTransaction {
  id: string;
  ref: string;
  date: string;
  entity: string;
  client: string;
  accountCode: string;
  category: string;
  amount: number;
  type: 'inflow' | 'outflow';
  status: 'verified' | 'awaiting_mgr' | 'reconciled' | 'threshold_flag' | 'posted';
  method: string;
  requiresDualSign?: boolean;
  approved?: boolean;
  tags?: string[];
}

export interface InvoiceLineItem {
  id: string;
  title: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  clientEntity: string;
  clientSubUnit: string;
  avatarInitials: string;
  scopeRole: 'Client Admin' | 'Client Staff' | 'Client Planner' | 'Manager' | 'Member';
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'pending_client_approval' | 'overdue' | 'draft_review' | 'paid_settled';
  period: string;
  taxId: string;
  lineItems: InvoiceLineItem[];
  directCost: number;
  grossProfit: number;
  profitMarginPercent: number;
  writeOffMax: number;
  recipientBank: string;
  paymentProtocol: string;
  disputed?: boolean;
}

export interface GovernanceQueueItem {
  id: string;
  vendor: string;
  txnRef: string;
  category: string;
  entity: string;
  amount: number;
  dueIn: string;
  requiresSecondSigner: boolean;
  signed: boolean;
  signerName?: string;
}

export interface ScenarioPreset {
  id: 'conservative' | 'baseline' | 'growth';
  label: string;
  arr: string;
  burn: string;
  capex: string;
  runway: string;
  fte: number;
  gtm: number;
  chartPath: string;
  chartArea: string;
}

export interface Milestone {
  id: string;
  title: string;
  status: 'On Schedule' | 'In Motion' | 'Review';
  statusColor: 'secondary' | 'primary' | 'tertiary';
  budget: number;
  spent: number;
  phaseTarget: string;
  validationNote: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarBg: string;
  role: UserRole;
  roleLabel: string;
  badgeBg: string;
  badgeText: string;
  isActive: boolean;
  capabilities: {
    invoicing: boolean;
    banking: boolean;
    planning: boolean;
    audit: boolean;
  };
  authorizedEntities: string[];
  hardware2FA: boolean;
  ipGeofenced: boolean;
  maskMargins: boolean;
  permitScenarioModeling: boolean;
  canAuthorizeWires: boolean;
  roleExpiry: string;
  elevationProtocol: string;
  auditLogNote: string;
}

export interface VaultFile {
  id: string;
  title: string;
  subtitle: string;
  category: 'public' | 'admin' | 'firm';
  categoryLabel: string;
  fiscalPeriod: string;
  fileSize: string;
  plannerAccess: 'full_view' | 'full_edit' | 'restricted' | 'hidden';
  icon: string;
  iconBg: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  category: 'manual_entry' | 'modification' | 'approval' | 'security' | 'period_lock';
  entity: string;
  targetRef: string;
  hash: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  ipAddress?: string;
  delta?: { field: string; previous: string; current: string }[];
  verified?: boolean;
}

export interface CategoryBudgetThreshold {
  id: string;
  category: string;
  accountCode: string;
  monthlyBudget: number;
  warningPercentage: number;
  alertEnabled: boolean;
  autoFlagTransactions: boolean;
  notes?: string;
}

