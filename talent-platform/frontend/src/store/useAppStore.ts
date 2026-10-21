import { create } from 'zustand';
import type { 
  UserRole, 
  RoleConfig, 
  LedgerTransaction, 
  Invoice, 
  GovernanceQueueItem, 
  ScenarioPreset,
  Milestone,
  TeamMember,
  VaultFile,
  AuditEvent,
  CategoryBudgetThreshold
} from '../types';
import { calculateCategorySpend, evaluateAllCategoryBudgets } from '../utils/budgetMonitor';
import { formatCurrency } from '../utils/cn';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_INVOICES, 
  INITIAL_GOVERNANCE_QUEUE, 
  INITIAL_VAULT_FILES, 
  INITIAL_TEAM_MEMBERS,
  INITIAL_AUDIT_LOGS,
  LedgerService,
  InvoiceService,
  SecurityService,
  BudgetService,
  PlanningService,
  ComplianceService,
  WorkspaceService,
  setApiActorRole,
  problemMessage,
  isFirmRole,
} from '../services/api';

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  manager: {
    key: 'manager',
    name: 'Manager',
    shortTitle: 'Manager',
    title: 'Active Simulation View: Manager (Internal Finance Lead)',
    desc: 'Showing full executive oversight, dual-sign approval triggers, ledger mutation capabilities, and immutable audit logging.',
    badgeCash: 'Manager Only: Real-time Bank Sync Active',
    badgeClass: 'bg-primary-fixed text-on-primary-fixed-variant',
    scope: 'Tier 1 Superuser Ledger',
    showBatchApprove: true,
    showApprovals: true,
    canReconcile: true,
    canManualEntry: true,
    canLockPeriod: true,
    canViewMargins: true,
    canViewBanking: true,
    canAuthorizeWires: true,
    bankText: 'J.P. Morgan Chase (Full ABA: 021000021)',
    primaryInvoiceAction: 'New Master Invoice',
    matrix: {
      role: 'MANAGER',
      view: { granted: true, text: 'GRANTED' },
      create: { granted: true, text: 'GRANTED' },
      approve: { granted: true, text: 'AUTHORITY' },
      period: { granted: true, text: 'AUTHORIZED' },
      audit: { granted: true, text: 'FULL ACCESS' },
    },
    footnote: 'Managers maintain unrestricted oversight across multi-entity consolidations under ISO 27001 policies.',
  },
  member: {
    key: 'member',
    name: 'Member',
    shortTitle: 'Member',
    title: 'Active Simulation View: Member (Staff Accountant)',
    desc: 'Standard operational permissions: Create transactions, execute reconciliations, view unposted drafts.',
    badgeCash: 'Standard Sync: Updates Hourly',
    badgeClass: 'bg-surface-container-high text-on-surface-variant',
    scope: 'Operational Ledger Drafter',
    showBatchApprove: false,
    showApprovals: false,
    canReconcile: true,
    canManualEntry: true,
    canLockPeriod: false,
    canViewMargins: true,
    canViewBanking: true,
    canAuthorizeWires: false,
    bankText: 'J.P. Morgan Chase (•••• 8912)',
    primaryInvoiceAction: 'Add Billable Line Item',
    matrix: {
      role: 'MEMBER',
      view: { granted: true, text: 'GRANTED' },
      create: { granted: true, text: 'GRANTED' },
      approve: { granted: false, text: 'RESTRICTED' },
      period: { granted: false, text: 'LOCKED' },
      audit: { granted: true, text: 'VIEW ONLY' },
    },
    footnote: 'Members can post drafts and match reconciliation pairs, but cannot approve transactions over $10k.',
  },
  client_admin: {
    key: 'client_admin',
    name: 'Client Admin',
    shortTitle: 'Client Admin',
    title: 'Active Simulation View: Client Admin (Corporate Controller)',
    desc: 'Scoped external view: Read-only ledger reports, invoice payment approvals, and client entity budgets.',
    badgeCash: 'Entity Scoped: Acme Global Only',
    badgeClass: 'bg-secondary-container text-on-secondary-container',
    scope: 'External Authorizer',
    showBatchApprove: false,
    showApprovals: false,
    canReconcile: false,
    canManualEntry: false,
    canLockPeriod: false,
    canViewMargins: false,
    canViewBanking: true,
    canAuthorizeWires: true,
    bankText: 'J.P. Morgan Chase (•••• 8912)',
    primaryInvoiceAction: 'Authorize Batch',
    matrix: {
      role: 'CLIENT ADMIN',
      view: { granted: true, text: 'SCOPED ENTITY' },
      create: { granted: false, text: 'RESTRICTED' },
      approve: { granted: true, text: 'INVOICE ONLY' },
      period: { granted: false, text: 'NO ACCESS' },
      audit: { granted: false, text: 'REDACTED' },
    },
    footnote: 'Client Admins possess outward-facing fiscal sign-offs exclusively for verified client billing vouchers.',
  },
  client_staff: {
    key: 'client_staff',
    name: 'Client Staff',
    shortTitle: 'Client Staff',
    title: 'Active Simulation View: Client Staff (AP / AR Specialist)',
    desc: 'Restricted external view: Submit expense receipts and view settled statements only.',
    badgeCash: 'Summary View Only',
    badgeClass: 'bg-tertiary-fixed text-on-tertiary-container',
    scope: 'Itemized Verification',
    showBatchApprove: false,
    showApprovals: false,
    canReconcile: false,
    canManualEntry: false,
    canLockPeriod: false,
    canViewMargins: false,
    canViewBanking: false,
    canAuthorizeWires: false,
    bankText: '[Masked - Requires Client Admin]',
    primaryInvoiceAction: 'Export All Receipts',
    matrix: {
      role: 'CLIENT STAFF',
      view: { granted: true, text: 'STATEMENTS' },
      create: { granted: false, text: 'NO ACCESS' },
      approve: { granted: false, text: 'NO ACCESS' },
      period: { granted: false, text: 'NO ACCESS' },
      audit: { granted: false, text: 'NO ACCESS' },
    },
    footnote: 'Client Staff are isolated to view-only access on reconciled statements without journal mutation rights.',
  },
  client_planner: {
    key: 'client_planner',
    name: 'Client Planner',
    shortTitle: 'Client Planner',
    title: 'Active Simulation View: Client Planner (Financial Analyst)',
    desc: 'Read-only financial model view: Cash flow forecasts, budget vs actual variance, scenario planning.',
    badgeCash: 'Forecast Baseline Fed',
    badgeClass: 'bg-surface-container-highest text-primary',
    scope: 'Forecast Analytics',
    showBatchApprove: false,
    showApprovals: false,
    canReconcile: false,
    canManualEntry: false,
    canLockPeriod: false,
    canViewMargins: false,
    canViewBanking: false,
    canAuthorizeWires: false,
    bankText: '[Masked - Restricted for Analytics Role]',
    primaryInvoiceAction: 'Model Milestone Forecast',
    matrix: {
      role: 'CLIENT PLANNER',
      view: { granted: true, text: 'ANALYTICS' },
      create: { granted: false, text: 'NO ACCESS' },
      approve: { granted: false, text: 'NO ACCESS' },
      period: { granted: false, text: 'NO ACCESS' },
      audit: { granted: false, text: 'NO ACCESS' },
    },
    footnote: 'Planners access anonymized aggregated metric feeds for long-term runway projection modeling.',
  },
};

export const SCENARIO_PRESETS: Record<string, ScenarioPreset> = {
  conservative: {
    id: 'conservative',
    label: 'Conservative',
    arr: '$12.40M',
    burn: '$340.0k',
    capex: '$1.20M',
    runway: '16.8 Mos',
    fte: 6,
    gtm: 45,
    chartPath: 'M 0 135 C 140 130, 220 110, 350 96 C 480 84, 560 68, 700 52',
    chartArea: 'M 0 135 C 140 130, 220 110, 350 96 C 480 84, 560 68, 700 52 L 700 140 L 0 140 Z',
  },
  baseline: {
    id: 'baseline',
    label: 'Baseline (Current)',
    arr: '$14.28M',
    burn: '$412.5k',
    capex: '$1.85M',
    runway: '14.6 Mos',
    fte: 12,
    gtm: 85,
    chartPath: 'M 0 130 C 140 120, 220 90, 350 78 C 480 66, 560 45, 700 28',
    chartArea: 'M 0 130 C 140 120, 220 90, 350 78 C 480 66, 560 45, 700 28 L 700 140 L 0 140 Z',
  },
  growth: {
    id: 'growth',
    label: 'Aggressive Growth',
    arr: '$17.10M',
    burn: '$585.0k',
    capex: '$2.60M',
    runway: '11.2 Mos',
    fte: 24,
    gtm: 160,
    chartPath: 'M 0 125 C 140 105, 220 70, 350 50 C 480 30, 560 18, 700 10',
    chartArea: 'M 0 125 C 140 105, 220 70, 350 50 C 480 30, 560 18, 700 10 L 700 140 L 0 140 Z',
  },
};

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'm-1',
    title: 'SOC2 Audited Infrastructure Transition',
    status: 'On Schedule',
    statusColor: 'secondary',
    budget: 240000,
    spent: 184800,
    phaseTarget: 'Phase Target: Q2 End',
    validationNote: 'Audit Enclave Validation: 8/10 Controls Cleared',
  },
  {
    id: 'm-2',
    title: 'EMEA Enterprise Sales Expansion',
    status: 'In Motion',
    statusColor: 'primary',
    budget: 680000,
    spent: 326400,
    phaseTarget: 'Target: Q3 2025',
    validationNote: 'London & Berlin Legal Entity Incorporation',
  },
  {
    id: 'm-3',
    title: 'Machine Learning Core IP Patent Filings',
    status: 'Review',
    statusColor: 'tertiary',
    budget: 135000,
    spent: 40500,
    phaseTarget: 'Target: Q4 2025',
    validationNote: 'USPTA Docket #8892 Application Lodged',
  },
];

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface AppState {
  // Active Role Simulation
  simulatedRole: UserRole;
  setSimulatedRole: (role: UserRole) => void;
  hydrate: () => Promise<void>;
  
  // Entity & Tenant
  activeEntity: string;
  setActiveEntity: (entity: string) => void;
  isFiscalPeriodLocked: boolean;
  toggleFiscalPeriodLock: () => Promise<void>;
  
  // Search modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Manual entry modal
  isManualEntryOpen: boolean;
  setIsManualEntryOpen: (open: boolean) => void;

  // Audit Export modal
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;

  // Read-only Audit Log modal / drawer
  isAuditLogModalOpen: boolean;
  setIsAuditLogModalOpen: (open: boolean) => void;

  // Budget Monitoring & Threshold Alerts
  budgetThresholds: CategoryBudgetThreshold[];
  isBudgetMonitorModalOpen: boolean;
  setIsBudgetMonitorModalOpen: (open: boolean) => void;
  updateBudgetThreshold: (id: string, updates: Partial<CategoryBudgetThreshold>) => Promise<void>;
  addBudgetThreshold: (threshold: Omit<CategoryBudgetThreshold, 'id'>) => Promise<void>;
  removeBudgetThreshold: (id: string) => Promise<void>;
  checkBudgetBreaches: (customTransactions?: LedgerTransaction[]) => void;

  // Mobile navigation drawer
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;

  // Ledger Data
  transactions: LedgerTransaction[];
  filterEntity: string;
  setFilterEntity: (entity: string) => void;
  filterClient: string;
  setFilterClient: (client: string) => void;
  filterAccountCode: string;
  setFilterAccountCode: (code: string) => void;
  filterTag: string;
  setFilterTag: (tag: string) => void;
  availableTags: string[];
  addCustomTag: (tag: string) => void;
  approveTransaction: (id: string) => Promise<void>;
  batchApproveTransactions: () => Promise<void>;
  createTransaction: (data: Partial<LedgerTransaction>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<LedgerTransaction>, reason?: string) => Promise<void>;

  // Governance Queue
  governanceQueue: GovernanceQueueItem[];
  signGovernanceItem: (id: string) => Promise<void>;

  // Invoices & Billing
  invoices: Invoice[];
  selectedInvoiceId: string;
  setSelectedInvoiceId: (id: string) => void;
  authorizeInvoice: (id: string) => Promise<void>;
  disputeInvoice: (id: string, reason?: string) => Promise<void>;
  batchAuthorizeInvoices: () => Promise<void>;
  createInvoice: (data: Partial<Invoice>) => Promise<void>;

  // Strategic Modeling & Scenarios
  activeScenarioId: 'conservative' | 'baseline' | 'growth';
  setActiveScenarioId: (id: 'conservative' | 'baseline' | 'growth') => void;
  customFte: number;
  setCustomFte: (fte: number) => void;
  customGtm: number;
  setCustomGtm: (gtm: number) => void;
  milestones: Milestone[];
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>;

  // Vault Files
  vaultFiles: VaultFile[];
  vaultFilter: 'all' | 'public' | 'admin' | 'firm';
  setVaultFilter: (filter: 'all' | 'public' | 'admin' | 'firm') => void;
  addVaultFile: (file: Partial<VaultFile>) => Promise<void>;

  // Team & Role Edit Drawer (Image 7)
  teamMembers: TeamMember[];
  selectedMemberForEdit: TeamMember | null;
  isEditRoleDrawerOpen: boolean;
  openEditRoleDrawer: (member: TeamMember) => void;
  closeEditRoleDrawer: () => void;
  saveRoleAssignment: (memberId: string, updates: Partial<TeamMember>) => Promise<void>;
  revokeAccess: (memberId: string) => Promise<void>;

  // Audit Logs
  auditLogs: AuditEvent[];

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  simulatedRole: 'manager',
  setSimulatedRole: (role) => {
    setApiActorRole(role);
    set({ simulatedRole: role });
    get().addToast({
      type: 'info',
      title: `Switched Simulation Lens: ${ROLE_CONFIGS[role].name}`,
      description: ROLE_CONFIGS[role].desc,
    });
    void get().hydrate();
  },

  hydrate: async () => {
    const role = get().simulatedRole;
    setApiActorRole(role);
    try {
      const snapshot = await WorkspaceService.load(role);
      const selectedStillPresent = snapshot.invoices.some((invoice) => invoice.id === get().selectedInvoiceId);
      set({
        transactions: snapshot.transactions,
        invoices: snapshot.invoices,
        governanceQueue: snapshot.governanceQueue,
        vaultFiles: snapshot.vaultFiles,
        teamMembers: snapshot.teamMembers,
        milestones: snapshot.milestones,
        availableTags: snapshot.tags,
        isFiscalPeriodLocked: snapshot.fiscal.locked,
        activeEntity: snapshot.fiscal.entity || get().activeEntity,
        selectedInvoiceId: selectedStillPresent
          ? get().selectedInvoiceId
          : snapshot.invoices[0]?.id ?? get().selectedInvoiceId,
        ...(isFirmRole(role)
          ? { budgetThresholds: snapshot.budgetThresholds, auditLogs: snapshot.auditLogs }
          : { auditLogs: [], budgetThresholds: [] }),
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Could not load the financing workspace',
        description: problemMessage(error),
      });
    }
  },

  activeEntity: 'Acme Global Holdings LLC',
  setActiveEntity: (entity) => {
    set({ activeEntity: entity });
    get().addToast({
      type: 'info',
      title: 'Active Entity Switched',
      description: `Current consolidation scope set to ${entity}`,
    });
  },

  isFiscalPeriodLocked: true,
  toggleFiscalPeriodLock: async () => {
    try {
      const period = await ComplianceService.toggleFiscalPeriod();
      const auditLogs = isFirmRole(get().simulatedRole)
        ? await SecurityService.getAuditLogs()
        : get().auditLogs;
      set({
        isFiscalPeriodLocked: period.locked,
        activeEntity: period.entity || get().activeEntity,
        auditLogs,
      });
      get().addToast({
        type: period.locked ? 'warning' : 'info',
        title: period.locked ? 'Fiscal Period Locked' : 'Fiscal Period Unlocked',
        description: period.locked
          ? 'Journal mutations restricted across all entities under SOX 404.'
          : 'Authorized ledger postings and journal mutations unlocked for Manager.',
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Fiscal period was not changed',
        description: problemMessage(error),
      });
    }
  },

  isSearchOpen: false,
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  isManualEntryOpen: false,
  setIsManualEntryOpen: (open) => set({ isManualEntryOpen: open }),

  isExportModalOpen: false,
  setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),

  isAuditLogModalOpen: false,
  setIsAuditLogModalOpen: (open) => set({ isAuditLogModalOpen: open }),

  budgetThresholds: [
    {
      id: 'bt-1',
      category: 'Cloud Infrastructure COGS',
      accountCode: '5100-COGS',
      monthlyBudget: 50000,
      warningPercentage: 80,
      alertEnabled: true,
      autoFlagTransactions: true,
      notes: 'Monthly AWS, GCP, and Snowflake cluster capacity threshold under FinOps governance.',
    },
    {
      id: 'bt-2',
      category: 'Statutory Legal Retainer',
      accountCode: '6200-LEG',
      monthlyBudget: 15000,
      warningPercentage: 75,
      alertEnabled: true,
      autoFlagTransactions: true,
      notes: 'Outside counsel and statutory corporate legal retainers.',
    },
    {
      id: 'bt-3',
      category: 'Enterprise SaaS Subscriptions',
      accountCode: '5200-SAAS',
      monthlyBudget: 10000,
      warningPercentage: 80,
      alertEnabled: true,
      autoFlagTransactions: false,
      notes: 'Internal productivity tools and workflow automation software caps.',
    },
    {
      id: 'bt-4',
      category: 'Corporate Travel & Client Entertainment',
      accountCode: '6500-OPEX',
      monthlyBudget: 8000,
      warningPercentage: 85,
      alertEnabled: true,
      autoFlagTransactions: false,
      notes: 'Executive client travel and advisory summit allocations.',
    },
  ],
  isBudgetMonitorModalOpen: false,
  setIsBudgetMonitorModalOpen: (open) => set({ isBudgetMonitorModalOpen: open }),

  updateBudgetThreshold: async (id, updates) => {
    const previous = get().budgetThresholds;
    set({
      budgetThresholds: previous.map((budget) => (budget.id === id ? { ...budget, ...updates } : budget)),
    });
    try {
      const saved = await BudgetService.update(id, updates);
      set({
        budgetThresholds: get().budgetThresholds.map((budget) => (budget.id === id ? saved : budget)),
      });
      get().addToast({
        type: 'info',
        title: 'Budget Threshold Updated',
        description: 'Threshold limits and alert parameters adjusted.',
      });
      get().checkBudgetBreaches();
    } catch (error) {
      set({ budgetThresholds: previous });
      get().addToast({
        type: 'error',
        title: 'Budget threshold was not saved',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  addBudgetThreshold: async (thresholdData) => {
    try {
      const created = await BudgetService.create(thresholdData);
      set((state) => ({
        budgetThresholds: [...state.budgetThresholds, created],
      }));
      get().addToast({
        type: 'success',
        title: 'New Budget Threshold Created',
        description: `Monitoring active for ${created.category} (Cap: ${formatCurrency(created.monthlyBudget)}).`,
      });
      get().checkBudgetBreaches();
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Budget threshold was not created',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  removeBudgetThreshold: async (id) => {
    const previous = get().budgetThresholds;
    set({ budgetThresholds: previous.filter((budget) => budget.id !== id) });
    try {
      await BudgetService.remove(id);
      get().addToast({
        type: 'info',
        title: 'Threshold Removed',
        description: 'Category budget monitoring disabled.',
      });
    } catch (error) {
      set({ budgetThresholds: previous });
      get().addToast({
        type: 'error',
        title: 'Budget threshold was not removed',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  checkBudgetBreaches: (customTransactions) => {
    const txs = customTransactions || get().transactions;
    const reports = evaluateAllCategoryBudgets(txs, get().budgetThresholds);
    
    let breachFound = false;
    reports.forEach((report) => {
      if (!report.threshold.alertEnabled) return;

      if (report.isBreached) {
        breachFound = true;
        get().addToast({
          type: 'error',
          title: `🚨 Monthly Budget Exceeded: ${report.threshold.category}`,
          description: `Current monthly spend of ${formatCurrency(report.currentSpend)} exceeds the ${formatCurrency(report.threshold.monthlyBudget)} budget cap (${report.utilizationPercent.toFixed(1)}%). Review required under SOX 404.`,
        });
      } else if (report.isWarning) {
        get().addToast({
          type: 'warning',
          title: `⚠️ Budget Warning: ${report.threshold.category}`,
          description: `Category spend reached ${formatCurrency(report.currentSpend)} (${report.utilizationPercent.toFixed(1)}% of ${formatCurrency(report.threshold.monthlyBudget)} cap).`,
        });
      }
    });

    if (!breachFound && customTransactions) {
      get().addToast({
        type: 'success',
        title: 'Budget Compliance Verified',
        description: 'All monitored categories are within approved monthly budget limits.',
      });
    }
  },

  isMobileNavOpen: false,
  setIsMobileNavOpen: (open) => set({ isMobileNavOpen: open }),

  transactions: INITIAL_TRANSACTIONS,
  filterEntity: 'all',
  setFilterEntity: (entity) => set({ filterEntity: entity }),
  filterClient: 'all',
  setFilterClient: (client) => set({ filterClient: client }),
  filterAccountCode: 'all',
  setFilterAccountCode: (code) => set({ filterAccountCode: code }),
  filterTag: 'all',
  setFilterTag: (tag) => set({ filterTag: tag }),
  availableTags: [
    'SaaS',
    'Retainer',
    'Tier-1',
    'Infrastructure',
    'Cloud',
    'OpEx',
    'CleanTech',
    'IP',
    'Licensing',
    'Legal',
    'Advisory',
    'Escrow',
    'AI/ML',
    'Platform',
    'Enterprise',
    'Merchant',
    'Automated',
    'Cash',
    'Payroll',
    'CapEx',
    'Compliance'
  ],
  addCustomTag: (newTag) => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.availableTags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) {
        return state;
      }
      return { availableTags: [...state.availableTags, trimmed] };
    });
    if (!isFirmRole(get().simulatedRole)) return;
    void LedgerService.addTag(trimmed).catch((error) => {
      get().addToast({
        type: 'error',
        title: 'Ledger tag was not saved',
        description: problemMessage(error),
      });
    });
  },

  approveTransaction: async (id) => {
    try {
      const approved = await LedgerService.approveTransaction(id);
      const auditLogs = isFirmRole(get().simulatedRole)
        ? await SecurityService.getAuditLogs()
        : get().auditLogs;
      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? approved : transaction
        ),
        auditLogs,
      }));
      get().addToast({
        type: 'success',
        title: 'Transaction Verified & Posted',
        description: `${approved.ref} marked as reconciled in primary double-entry books.`,
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Transaction was not approved',
        description: problemMessage(error),
      });
    }
  },

  batchApproveTransactions: async () => {
    try {
      const [transactions, governanceQueue, auditLogs] = await Promise.all([
        LedgerService.batchApprove(),
        LedgerService.getGovernanceQueue(),
        SecurityService.getAuditLogs(),
      ]);
      set({ transactions, governanceQueue, auditLogs });
      get().addToast({
        type: 'success',
        title: 'Batch Approval Completed',
        description: 'Pending ledger statements and threshold items were approved.',
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Batch approval was not completed',
        description: problemMessage(error),
      });
    }
  },

  createTransaction: async (data) => {
    let newTx: LedgerTransaction;
    try {
      newTx = await LedgerService.createTransaction(data);
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Journal entry was not posted',
        description: problemMessage(error),
      });
      throw error;
    }
    const amountVal = Math.abs(newTx.amount);

    // Check budget thresholds if this is an outflow transaction
    let isBreached = false;
    let matchedThreshold: CategoryBudgetThreshold | undefined;
    let newCategorySpend = 0;

    if (newTx.type === 'outflow') {
      const allTransactionsWithNew = [newTx, ...get().transactions];
      matchedThreshold = get().budgetThresholds.find(
        (t) =>
          t.alertEnabled &&
          (newTx.accountCode.toLowerCase().startsWith(t.accountCode.toLowerCase().split('-')[0]) ||
            newTx.category.toLowerCase().includes(t.category.toLowerCase()) ||
            t.category.toLowerCase().includes(newTx.category.toLowerCase()))
      );

      if (matchedThreshold) {
        newCategorySpend = calculateCategorySpend(
          allTransactionsWithNew,
          matchedThreshold.accountCode,
          matchedThreshold.category
        );

        if (newCategorySpend > matchedThreshold.monthlyBudget) {
          isBreached = true;
          const utilization = (newCategorySpend / matchedThreshold.monthlyBudget) * 100;
          get().addToast({
            type: 'error',
            title: `🚨 Monthly Budget Exceeded: ${matchedThreshold.category}`,
            description: `Outflow of ${formatCurrency(amountVal)} pushed total spend to ${formatCurrency(newCategorySpend)}, exceeding the ${formatCurrency(matchedThreshold.monthlyBudget)} monthly threshold (${utilization.toFixed(1)}%). Flagged for SOX 404 review.`,
          });
        } else if (
          newCategorySpend >=
          matchedThreshold.monthlyBudget * (matchedThreshold.warningPercentage / 100)
        ) {
          const utilization = (newCategorySpend / matchedThreshold.monthlyBudget) * 100;
          get().addToast({
            type: 'warning',
            title: `⚠️ Budget Warning: ${matchedThreshold.category}`,
            description: `Category spend reached ${formatCurrency(newCategorySpend)} (${utilization.toFixed(1)}% of ${formatCurrency(matchedThreshold.monthlyBudget)} budget). Approaching threshold.`,
          });
        }
      }
    }

    const auditLogs = isFirmRole(get().simulatedRole)
      ? await SecurityService.getAuditLogs().catch(() => get().auditLogs)
      : get().auditLogs;
    const tags = await LedgerService.getTags().catch(() => get().availableTags);

    set((state) => ({
      transactions: [newTx, ...state.transactions.filter((transaction) => transaction.id !== newTx.id)],
      auditLogs,
      availableTags: tags,
      isManualEntryOpen: false,
    }));

    if (!isBreached) {
      get().addToast({
        type: 'success',
        title: 'Manual Journal Entry Posted',
        description: `Reference ${newTx.ref} created under ${newTx.accountCode}. Audit event recorded.`,
      });
    }
  },

  updateTransaction: async (id, updates, reason) => {
    const prevTx = get().transactions.find((transaction) => transaction.id === id);
    if (!prevTx) return;
    try {
      const saved = await LedgerService.updateTransaction(id, updates, reason);
      const auditLogs = isFirmRole(get().simulatedRole)
        ? await SecurityService.getAuditLogs()
        : get().auditLogs;
      set((state) => ({
        transactions: state.transactions.map((transaction) => (transaction.id === id ? saved : transaction)),
        auditLogs,
      }));
      get().addToast({
        type: 'info',
        title: 'Voucher Modification Logged',
        description: `Updates to ${saved.ref} appended to the compliance audit trail.`,
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Voucher was not updated',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  governanceQueue: INITIAL_GOVERNANCE_QUEUE,
  signGovernanceItem: async (id) => {
    const item = get().governanceQueue.find((entry) => entry.id === id);
    try {
      await LedgerService.signGovernanceItem(id);
      const [governanceQueue, transactions, auditLogs] = await Promise.all([
        LedgerService.getGovernanceQueue(),
        LedgerService.getTransactions(),
        isFirmRole(get().simulatedRole) ? SecurityService.getAuditLogs() : Promise.resolve(get().auditLogs),
      ]);
      set({ governanceQueue, transactions, auditLogs });
      get().addToast({
        type: 'success',
        title: 'Dual-Signature Executed',
        description: `Executive sign-off recorded for ${item?.vendor || 'item'}.`,
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Signature was not recorded',
        description: problemMessage(error),
      });
    }
  },

  invoices: INITIAL_INVOICES,
  selectedInvoiceId: 'INV-2024-8841',
  setSelectedInvoiceId: (id) => set({ selectedInvoiceId: id }),

  authorizeInvoice: async (id) => {
    try {
      const saved = await InvoiceService.authorizePayment(id);
      set((state) => ({
        invoices: state.invoices.map((invoice) => (invoice.id === id ? saved : invoice)),
      }));
      get().addToast({
        type: 'success',
        title: 'Payment Authorized & Settled',
        description: `Invoice ${id} processed via Same-Day ACH protocol.`,
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Invoice was not authorized',
        description: problemMessage(error),
      });
    }
  },

  disputeInvoice: async (id, reason) => {
    try {
      const saved = await InvoiceService.disputeInvoice(id, reason || 'Client audit inquiry');
      set((state) => ({
        invoices: state.invoices.map((invoice) => (invoice.id === id ? saved : invoice)),
      }));
      get().addToast({
        type: 'warning',
        title: 'Dispute Ticket Assigned',
        description: `Audit discrepancy ticket registered for ${id}. Notified Controller.`,
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Invoice was not disputed',
        description: problemMessage(error),
      });
    }
  },

  batchAuthorizeInvoices: async () => {
    try {
      const invoices = await InvoiceService.batchAuthorize();
      set({ invoices });
      get().addToast({
        type: 'success',
        title: 'Batch Payment Authorized',
        description: 'Pending client invoices were scheduled for settlement.',
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Batch authorization was not completed',
        description: problemMessage(error),
      });
    }
  },

  createInvoice: async (data) => {
    try {
      const created = await InvoiceService.createInvoice(data);
      set((state) => ({
        invoices: [created, ...state.invoices],
        selectedInvoiceId: created.id,
      }));
      get().addToast({
        type: 'success',
        title: 'Invoice Created',
        description: `${created.id} issued for ${created.clientEntity}.`,
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Invoice was not created',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  activeScenarioId: 'baseline',
  setActiveScenarioId: (id) => {
    const preset = SCENARIO_PRESETS[id];
    set({
      activeScenarioId: id,
      customFte: preset.fte,
      customGtm: preset.gtm,
    });
    get().addToast({
      type: 'info',
      title: `Preset Applied: ${preset.label}`,
      description: `Projected ARR: ${preset.arr} | Runway: ${preset.runway}`,
    });
  },
  customFte: 12,
  setCustomFte: (fte) => set({ customFte: fte }),
  customGtm: 85,
  setCustomGtm: (gtm) => set({ customGtm: gtm }),

  milestones: INITIAL_MILESTONES,
  updateMilestone: async (id, updates) => {
    try {
      const saved = await PlanningService.updateMilestone(id, updates);
      set((state) => ({
        milestones: state.milestones.map((milestone) => (milestone.id === id ? saved : milestone)),
      }));
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Milestone was not updated',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  vaultFiles: INITIAL_VAULT_FILES,
  vaultFilter: 'all',
  setVaultFilter: (filter) => set({ vaultFilter: filter }),
  addVaultFile: async (file) => {
    try {
      const created = await SecurityService.addVaultFile(file);
      set((state) => ({
        vaultFiles: [created, ...state.vaultFiles],
      }));
      get().addToast({
        type: 'success',
        title: 'File Uploaded to Secure Vault',
        description: `${created.title} stored in the vault.`,
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Vault file was not uploaded',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  teamMembers: INITIAL_TEAM_MEMBERS,
  selectedMemberForEdit: null,
  isEditRoleDrawerOpen: false,
  openEditRoleDrawer: (member) =>
    set({ selectedMemberForEdit: member, isEditRoleDrawerOpen: true }),
  closeEditRoleDrawer: () =>
    set({ isEditRoleDrawerOpen: false, selectedMemberForEdit: null }),

  saveRoleAssignment: async (memberId, updates) => {
    try {
      const saved = await SecurityService.updateMemberRole(memberId, updates);
      const auditLogs = isFirmRole(get().simulatedRole)
        ? await SecurityService.getAuditLogs()
        : get().auditLogs;
      set((state) => ({
        teamMembers: state.teamMembers.map((member) => (member.id === memberId ? saved : member)),
        isEditRoleDrawerOpen: false,
        selectedMemberForEdit: null,
        auditLogs,
      }));
      get().addToast({
        type: 'success',
        title: 'Role Assignment Enforced',
        description: 'Security credentials and policy guardrails saved to the audit trail.',
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Role assignment was not saved',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  revokeAccess: async (memberId) => {
    try {
      const saved = await SecurityService.revokeMember(memberId);
      const auditLogs = isFirmRole(get().simulatedRole)
        ? await SecurityService.getAuditLogs()
        : get().auditLogs;
      set({
        teamMembers: get().teamMembers.map((member) => (member.id === memberId ? saved : member)),
        isEditRoleDrawerOpen: false,
        selectedMemberForEdit: null,
        auditLogs,
      });
      get().addToast({
        type: 'warning',
        title: 'Tenant Access Revoked',
        description: 'User credentials were invalidated.',
      });
    } catch (error) {
      get().addToast({
        type: 'error',
        title: 'Access was not revoked',
        description: problemMessage(error),
      });
      throw error;
    }
  },

  auditLogs: INITIAL_AUDIT_LOGS,

  toasts: [],
  addToast: (toast) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
