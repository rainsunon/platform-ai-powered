INSERT INTO fiscal_period (id, locked, entity_name, version, updated_at)
VALUES ('current', TRUE, 'Acme Global Holdings LLC', 0, timestamptz '2026-10-19 00:00:00+00');

INSERT INTO ledger_transaction (
    id, ref, posted_label, entity_name, client_name, account_code, category, amount, direction, status, method,
    requires_dual_sign, approved, version, created_at, updated_at
) VALUES
('tx-1', 'TXN-90241', 'Today, 09:42 AM', 'Acme Global Holdings', 'Strata Cloud Corp', '1200-AR', 'Q3 Cloud Retainer', 64200.00, 'INFLOW', 'VERIFIED', 'Inflow Wire', FALSE, TRUE, 0, timestamptz '2026-10-19 09:42:00+00', timestamptz '2026-10-19 09:42:00+00'),
('tx-2', 'TXN-90238', 'Yesterday, 16:15', 'Acme EMEA B.V.', 'Amazon Web Services', '5100-COGS', 'Compute Clusters', -18450.00, 'OUTFLOW', 'AWAITING_MGR', 'ACH Outflow', TRUE, FALSE, 0, timestamptz '2026-10-18 16:15:00+00', timestamptz '2026-10-18 16:15:00+00'),
('tx-3', 'TXN-90192', 'Oct 24, 2024', 'Acme Pacific Logistics', 'Helios Energy Corp', '4000-REV', 'Licensing & IP', 29800.00, 'INFLOW', 'RECONCILED', 'Direct Deposit', FALSE, TRUE, 0, timestamptz '2024-10-24 12:00:00+00', timestamptz '2024-10-24 12:00:00+00'),
('tx-4', 'TXN-90184', 'Oct 23, 2024', 'Acme Global Holdings', 'Latham & Watkins LLP', '6200-LEG', 'Statutory Filing Retainer', -14500.00, 'OUTFLOW', 'THRESHOLD_FLAG', 'Corporate Escrow', TRUE, FALSE, 0, timestamptz '2024-10-23 12:00:00+00', timestamptz '2024-10-23 12:00:00+00'),
('tx-5', 'TXN-90161', 'Oct 21, 2024', 'Acme Pacific Logistics', 'Nexus Robotics AI', '4000-REV', 'Enterprise AI Tier 4', 82000.00, 'INFLOW', 'VERIFIED', 'Swift Wire', FALSE, TRUE, 0, timestamptz '2024-10-21 12:00:00+00', timestamptz '2024-10-21 12:00:00+00'),
('tx-6', 'TXN-90145', 'Oct 19, 2024', 'Acme Global Holdings', 'Stripe Settlement', '1010-CASH', 'Merchant Card Settlement', 43250.00, 'INFLOW', 'RECONCILED', 'Automated Clearing House', FALSE, TRUE, 0, timestamptz '2024-10-19 12:00:00+00', timestamptz '2024-10-19 12:00:00+00'),
('tx-7', 'TXN-90122', 'Oct 18, 2024', 'Acme EMEA B.V.', 'Snowflake Data Cloud', '5100-COGS', 'Warehouse Compute Capacity', -23400.00, 'OUTFLOW', 'THRESHOLD_FLAG', 'ACH Direct', TRUE, FALSE, 0, timestamptz '2024-10-18 12:00:00+00', timestamptz '2024-10-18 12:00:00+00');

INSERT INTO ledger_transaction_tag (transaction_id, tag_order, tag) VALUES
('tx-1', 0, 'SaaS'), ('tx-1', 1, 'Retainer'), ('tx-1', 2, 'Tier-1'),
('tx-2', 0, 'Infrastructure'), ('tx-2', 1, 'Cloud'), ('tx-2', 2, 'OpEx'),
('tx-3', 0, 'CleanTech'), ('tx-3', 1, 'IP'), ('tx-3', 2, 'Licensing'),
('tx-4', 0, 'Legal'), ('tx-4', 1, 'Advisory'), ('tx-4', 2, 'Escrow'),
('tx-5', 0, 'AI/ML'), ('tx-5', 1, 'Platform'), ('tx-5', 2, 'Enterprise'),
('tx-6', 0, 'Merchant'), ('tx-6', 1, 'Automated'), ('tx-6', 2, 'Cash'),
('tx-7', 0, 'Infrastructure'), ('tx-7', 1, 'Data Cloud');

INSERT INTO ledger_tag (name) VALUES
('SaaS'), ('Retainer'), ('Tier-1'), ('Infrastructure'), ('Cloud'), ('OpEx'), ('CleanTech'), ('IP'),
('Licensing'), ('Legal'), ('Advisory'), ('Escrow'), ('AI/ML'), ('Platform'), ('Enterprise'),
('Merchant'), ('Automated'), ('Cash'), ('Payroll'), ('CapEx'), ('Compliance'), ('Data Cloud');

INSERT INTO invoice (
    id, client_entity, client_sub_unit, avatar_initials, scope_role, issue_date, due_date, amount, status,
    period_label, tax_id, direct_cost, gross_profit, profit_margin_percent, write_off_max, recipient_bank,
    payment_protocol, line_items, disputed, dispute_reason, version, created_at, updated_at
) VALUES
('INV-2024-8841', 'Vortex Dynamics Inc.', 'Global Enterprise', 'VO', 'Client Admin', 'Sep 12, 2024', 'Oct 02, 2024', 142800.00, 'PENDING_CLIENT_APPROVAL', 'Sep 01 - Sep 30, 2024', 'US-EIN-94819002', 64260.00, 78540.00, 55.00, 15000.00, 'J.P. Morgan Chase (•••• 8912)', 'ACH Same-Day Verified', '[{"id":"li-1","title":"Data Engine Cluster Architecture","description":"140 hours @ $450/hr billing rate","amount":63000.00},{"id":"li-2","title":"Enterprise SOC2 Enclave Migration","description":"Fixed Milestone 2 Completion","amount":79800.00}]'::jsonb, FALSE, NULL, 0, timestamptz '2026-10-19 12:00:00+00', timestamptz '2026-10-19 12:00:00+00'),
('INV-2024-8839', 'Hyperion Logistics', 'Fleet Operations', 'HL', 'Client Staff', 'Aug 28, 2024', 'Sep 18, 2024', 34200.00, 'OVERDUE', 'Aug 01 - Aug 31, 2024', 'US-EIN-48201994', 15390.00, 18810.00, 55.00, 5000.00, 'J.P. Morgan Chase (•••• 8912)', 'ACH Same-Day Verified', '[{"id":"li-3","title":"Global Fleet Telemetry Routing API","description":"Monthly active compute throughput","amount":34200.00}]'::jsonb, FALSE, NULL, 0, timestamptz '2026-10-18 12:00:00+00', timestamptz '2026-10-18 12:00:00+00'),
('INV-2024-8836', 'Aether Tech Labs', 'Research Unit', 'AT', 'Client Planner', 'Sep 15, 2024', 'Oct 15, 2024', 88500.00, 'DRAFT_REVIEW', 'Sep 01 - Sep 30, 2024', 'US-EIN-73910284', 39825.00, 48675.00, 55.00, 10000.00, 'J.P. Morgan Chase (•••• 8912)', 'ACH Same-Day Verified', '[{"id":"li-4","title":"Quantum Simulator Pipeline Engineering","description":"Sprint 8 deliverable sign-off","amount":88500.00}]'::jsonb, FALSE, NULL, 0, timestamptz '2026-10-17 12:00:00+00', timestamptz '2026-10-17 12:00:00+00'),
('INV-2024-8820', 'Northbridge Capital', 'Fund II Management', 'NB', 'Manager', 'Sep 01, 2024', 'Sep 20, 2024', 325000.00, 'PAID_SETTLED', 'Aug 01 - Aug 31, 2024', 'US-EIN-29381044', 130000.00, 195000.00, 60.00, 50000.00, 'J.P. Morgan Chase (Full ABA: 021000021)', 'Wire Transfer Settled', '[{"id":"li-5","title":"Private Equity General Ledger Audit & Tax Prep","description":"Retainer settlement and closing workpapers","amount":325000.00}]'::jsonb, FALSE, NULL, 0, timestamptz '2026-10-16 12:00:00+00', timestamptz '2026-10-16 12:00:00+00'),
('INV-2024-8815', 'Solaria Renewable LLC', 'Solar Grid Phase 3', 'SO', 'Client Admin', 'Sep 05, 2024', 'Oct 05, 2024', 101600.00, 'PENDING_CLIENT_APPROVAL', 'Aug 15 - Sep 15, 2024', 'US-EIN-88192031', 45720.00, 55880.00, 55.00, 15000.00, 'J.P. Morgan Chase (•••• 8912)', 'ACH Same-Day Verified', '[{"id":"li-6","title":"Clean Energy Tax Equity Structure Advisory","description":"Section 48 investment tax credit allocation","amount":101600.00}]'::jsonb, FALSE, NULL, 0, timestamptz '2026-10-15 12:00:00+00', timestamptz '2026-10-15 12:00:00+00');

INSERT INTO governance_item (
    id, vendor, txn_ref, category, entity_name, amount, due_in, requires_second_signer, signed, signer_name, version, created_at, updated_at
) VALUES
('gov-1', 'Amazon Web Services', 'TXN-90238 • Infrastructure COGS', 'Compute Clusters', 'Acme EMEA B.V.', 18450.00, 'Requires 2nd Signer', TRUE, FALSE, NULL, 0, timestamptz '2026-10-19 08:00:00+00', timestamptz '2026-10-19 08:00:00+00'),
('gov-2', 'Latham & Watkins LLP', 'TXN-90184 • Statutory Retainer', 'Corporate Escrow', 'Acme Global Holdings', 14500.00, 'Due in 18 hrs', TRUE, FALSE, NULL, 0, timestamptz '2026-10-18 08:00:00+00', timestamptz '2026-10-18 08:00:00+00'),
('gov-3', 'Snowflake Data Cloud', 'TXN-90122 • Warehouse Compute', 'Database Infrastructure', 'Acme EMEA B.V.', 23400.00, 'Due in 24 hrs', TRUE, FALSE, NULL, 0, timestamptz '2026-10-17 08:00:00+00', timestamptz '2026-10-17 08:00:00+00');

INSERT INTO team_member (
    id, name, email, avatar_initials, avatar_bg, role, role_label, badge_bg, badge_text, active,
    cap_invoicing, cap_banking, cap_planning, cap_audit, hardware_2fa, ip_geofenced, mask_margins,
    permit_scenario_modeling, can_authorize_wires, role_expiry, elevation_protocol, audit_log_note,
    version, created_at, updated_at
) VALUES
('user-elena-gomez', 'Elena Gomez', 'elena.gomez@strattechcorp.com', 'EG', 'bg-[#6d28d9] text-white', 'client_planner', 'Client Planner', 'bg-[#f5f3ff]', 'text-[#6d28d9]', TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, 'Continuous Access (Until Revoked)', 'Peer-Reviewed • Tier-2 Compliant', 'Assigned strategic advisory privileges for FY2025 planning round with verified CIDR geofence.', 0, timestamptz '2026-10-19 10:00:00+00', timestamptz '2026-10-19 10:00:00+00'),
('user-marcus-vance', 'Marcus Vance', 'marcus.vance@strattechcorp.com', 'MV', 'bg-[#0f766e] text-white', 'client_admin', 'Client Admin', 'bg-[#f0fdfa]', 'text-[#0f766e]', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'Continuous Access (Until Revoked)', 'Board Authorized', 'Designated external authorized corporate treasury officer.', 0, timestamptz '2026-10-18 10:00:00+00', timestamptz '2026-10-18 10:00:00+00'),
('user-dave-robinson', 'Dave Robinson', 'dave.robinson@strattechcorp.com', 'DR', 'bg-[#0369a1] text-white', 'client_staff', 'Client Staff', 'bg-[#f0f9ff]', 'text-[#0369a1]', FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, 'Temporary 90 Days', 'Manager Approved', 'Restricted AP receipt scanning and invoice inquiry ticketing.', 0, timestamptz '2026-10-17 10:00:00+00', timestamptz '2026-10-17 10:00:00+00'),
('user-elena-rostova', 'Elena Rostova', 'elena.rostova@acmeglobal.com', 'ER', 'bg-primary text-white', 'manager', 'Internal Manager', 'bg-primary-fixed', 'text-on-primary-fixed-variant', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, 'Permanent Root', 'Executive VP & Controller (SOX 404)', 'Full root general ledger mutation, fiscal locking, and dual-sign authority.', 0, timestamptz '2026-10-16 10:00:00+00', timestamptz '2026-10-16 10:00:00+00'),
('user-alex-chen', 'Alex Chen', 'alex.chen@acmeglobal.com', 'AC', 'bg-surface-container-high text-on-surface', 'member', 'Internal Member', 'bg-surface-container-high', 'text-on-surface-variant', TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, 'Continuous Access', 'Senior Staff Accountant', 'Double-entry drafting, draft posting, bank reconciliations.', 0, timestamptz '2026-10-15 10:00:00+00', timestamptz '2026-10-15 10:00:00+00');

INSERT INTO team_member_entity (member_id, entity_order, entity_name) VALUES
('user-elena-gomez', 0, 'StratTech Corp (Primary)'),
('user-elena-gomez', 1, 'StratTech EMEA Ltd (2 Entities)'),
('user-marcus-vance', 0, 'StratTech Corp (Primary)'),
('user-marcus-vance', 1, 'StratTech EMEA Ltd (2 Entities)'),
('user-dave-robinson', 0, 'StratTech Corp (Primary)'),
('user-elena-rostova', 0, 'Acme Global Holdings LLC'),
('user-elena-rostova', 1, 'Acme EMEA Operations B.V.'),
('user-elena-rostova', 2, 'Acme Pacific Logistics Inc'),
('user-alex-chen', 0, 'Acme Global Holdings LLC'),
('user-alex-chen', 1, 'Acme EMEA Operations B.V.');

INSERT INTO vault_file (
    id, title, subtitle, category, category_label, fiscal_period, file_size, planner_access, icon, icon_bg, created_at
) VALUES
('vf-1', 'FY2024 Audited Balance Sheet & P&L', 'Certified by Deloitte LLP', 'PUBLIC', 'Public to Client', 'FY 2024 Final', '4.2 MB', 'FULL_VIEW', 'description', 'bg-primary-fixed text-on-primary-fixed', timestamptz '2026-10-19 09:00:00+00'),
('vf-2', 'Q1 2025 Revenue Realization Models', 'StratTech SaaS Recurring Ledger', 'PUBLIC', 'Public to Client', 'Q1 2025 WIP', '1.8 MB', 'FULL_EDIT', 'table_view', 'bg-secondary-fixed text-on-secondary-fixed', timestamptz '2026-10-18 09:00:00+00'),
('vf-3', 'Silicon Valley Bank Wire Mandate & Signers', 'Treasury signatory protocol', 'ADMIN', 'Client Admin Only', 'Active Indefinite', '890 KB', 'RESTRICTED', 'key', 'bg-surface-container-highest text-on-surface-variant', timestamptz '2026-10-17 09:00:00+00'),
('vf-4', 'Executive Bonus & Equity Cap Table Schedule', 'Series B Option Allocation', 'ADMIN', 'Client Admin Only', '2024-2025', '3.1 MB', 'RESTRICTED', 'payments', 'bg-surface-container-highest text-on-surface-variant', timestamptz '2026-10-16 09:00:00+00'),
('vf-5', 'Nova CPA Advisory Engagement Workpapers', 'Staff accountant audit reconciliations', 'FIRM', 'Internal Firm Only', 'Internal Audit', '12.4 MB', 'HIDDEN', 'lock_clock', 'bg-surface-container-highest text-on-surface-variant', timestamptz '2026-10-15 09:00:00+00'),
('vf-6', 'R&D Tax Credit Federal Eligibility Assessment', 'IRS Form 6765 Prep Documentation', 'PUBLIC', 'Public to Client', 'Tax Year 2024', '2.1 MB', 'FULL_VIEW', 'verified', 'bg-primary-fixed text-on-primary-fixed', timestamptz '2026-10-14 09:00:00+00');

INSERT INTO budget_threshold (
    id, category, account_code, monthly_budget, warning_percentage, alert_enabled, auto_flag_transactions, notes, version, created_at, updated_at
) VALUES
('bt-1', 'Cloud Infrastructure COGS', '5100-COGS', 50000.00, 80, TRUE, TRUE, 'Monthly AWS, GCP, and Snowflake cluster capacity threshold under FinOps governance.', 0, timestamptz '2026-10-19 07:00:00+00', timestamptz '2026-10-19 07:00:00+00'),
('bt-2', 'Statutory Legal Retainer', '6200-LEG', 15000.00, 75, TRUE, TRUE, 'Outside counsel and statutory corporate legal retainers.', 0, timestamptz '2026-10-19 07:01:00+00', timestamptz '2026-10-19 07:01:00+00'),
('bt-3', 'Enterprise SaaS Subscriptions', '5200-SAAS', 10000.00, 80, TRUE, FALSE, 'Internal productivity tools and workflow automation software caps.', 0, timestamptz '2026-10-19 07:02:00+00', timestamptz '2026-10-19 07:02:00+00'),
('bt-4', 'Corporate Travel & Client Entertainment', '6500-OPEX', 8000.00, 85, TRUE, FALSE, 'Executive client travel and advisory summit allocations.', 0, timestamptz '2026-10-19 07:03:00+00', timestamptz '2026-10-19 07:03:00+00');

INSERT INTO milestone (id, title, status, status_color, budget, spent, phase_target, validation_note, version, updated_at) VALUES
('m-1', 'SOC2 Audited Infrastructure Transition', 'On Schedule', 'secondary', 240000.00, 184800.00, 'Phase Target: Q2 End', 'Audit Enclave Validation: 8/10 Controls Cleared', 0, timestamptz '2026-10-19 06:00:00+00'),
('m-2', 'EMEA Enterprise Sales Expansion', 'In Motion', 'primary', 680000.00, 326400.00, 'Target: Q3 2025', 'London & Berlin Legal Entity Incorporation', 0, timestamptz '2026-10-19 06:01:00+00'),
('m-3', 'Machine Learning Core IP Patent Filings', 'Review', 'tertiary', 135000.00, 40500.00, 'Target: Q4 2025', 'USPTA Docket #8892 Application Lodged', 0, timestamptz '2026-10-19 06:02:00+00');

INSERT INTO audit_event (
    id, occurred_at, actor, role_label, action_name, category, entity_name, target_ref, content_hash, severity, details, ip_address, verified, delta, created_at
) VALUES
('aud-105', '2026-10-18 20:46:12 UTC', 'Elena Rostova (Executive VP)', 'Manager', 'MANUAL_ENTRY_POSTED', 'MANUAL_ENTRY', 'Acme Global Holdings LLC', 'TXN-90241 (Strata Cloud Corp • $64,200.00)', '0x7e11...99bc2', 'MEDIUM', 'Initial double-entry ledger posting with tags [#SaaS, #Retainer, #Tier-1]. Verified via Swift wire rails.', '192.168.1.14 (Corporate Root CIDR)', TRUE, '[{"fieldName":"AccountCode","previousValue":"Unallocated","currentValue":"1200-AR"},{"fieldName":"Amount","previousValue":"$0.00","currentValue":"$64,200.00"},{"fieldName":"Tags","previousValue":"None","currentValue":"SaaS; Retainer; Tier-1"}]'::jsonb, timestamptz '2026-10-18 20:46:12+00'),
('aud-101', '2026-10-18 20:14:02 UTC', 'Elena Rostova (Executive VP)', 'Manager', 'DUAL_SIGN_APPROVED', 'APPROVAL', 'Acme EMEA B.V.', 'TXN-90238 (AWS $18,450.00)', '0x8f2d...4a1e9', 'HIGH', 'Executive dual-signature authorization released under SOX 404 segregation of duties threshold.', '192.168.1.14 (Corporate Root CIDR)', TRUE, '[{"fieldName":"SignerStatus","previousValue":"Awaiting 2nd Signer","currentValue":"Executive Signed"},{"fieldName":"LedgerStatus","previousValue":"Awaiting Mgr","currentValue":"Verified & Posted"}]'::jsonb, timestamptz '2026-10-18 20:14:02+00'),
('aud-102', '2026-10-18 19:42:15 UTC', 'System Enclave Plaid Relay', 'Automated Bot', 'RECONCILIATION_MATCH', 'MODIFICATION', 'Acme Global Holdings LLC', 'Chase Plaid Batch #49281 (TXN-90145)', '0x3c71...99e12', 'LOW', 'Continuous double-entry match cleared against JPMorgan Chase direct bank webhook.', '10.0.12.88 (Plaid VPC Peering)', TRUE, '[{"fieldName":"Status","previousValue":"Pending Webhook","currentValue":"Reconciled"}]'::jsonb, timestamptz '2026-10-18 19:42:15+00'),
('aud-103', '2026-10-18 18:05:44 UTC', 'Elena Gomez (StratTech Corp)', 'Client Planner', 'SCENARIO_PARAM_MODIFIED', 'MODIFICATION', 'StratTech Corp', 'Roadmap FY2025 Parameters (+12 FTEs)', '0xaa45...71cb8', 'MEDIUM', 'Forward runway sandbox tuned. R&D hiring adjusted from +6 to +12 FTEs; GTM spend tuned to $85k/mo.', '172.56.21.90 (Client VPN IPsec)', TRUE, '[{"fieldName":"HiringFTE","previousValue":"+6 FTEs","currentValue":"+12 FTEs"},{"fieldName":"GTMSpend","previousValue":"$45k/mo","currentValue":"$85k/mo"},{"fieldName":"TargetBurn","previousValue":"$340.0k/mo","currentValue":"$412.5k/mo"}]'::jsonb, timestamptz '2026-10-18 18:05:44+00'),
('aud-104', '2026-10-18 16:30:10 UTC', 'Elena Rostova (Executive VP)', 'Manager', 'ROLE_RBAC_ELEVATION', 'SECURITY', 'StratTech Corp', 'Elena Gomez -> Client Planner [CIDR Geofenced]', '0x4092...ST881', 'CRITICAL', 'Security tier assignment modified with FIDO2 WebAuthn enforcement and profit margin redaction enabled.', '192.168.1.14 (Corporate Root CIDR)', TRUE, '[{"fieldName":"AuthorityTier","previousValue":"Client Staff (Tier-3)","currentValue":"Client Planner (Tier-4)"},{"fieldName":"MarginMasking","previousValue":"Unenforced","currentValue":"Deterministic Redaction Active"}]'::jsonb, timestamptz '2026-10-18 16:30:10+00'),
('aud-106', '2026-10-18 14:12:00 UTC', 'Elena Rostova (Executive VP)', 'Manager', 'FISCAL_PERIOD_SEALED', 'PERIOD_LOCK', 'Acme Global Holdings LLC', 'Q3 2024 Accounting Period', '0xfe99...110a4', 'HIGH', 'Fiscal period locked. Journal voucher mutations and backdated postings sealed under ISO 27001.', '192.168.1.14 (Corporate Root CIDR)', TRUE, '[{"fieldName":"PeriodLock","previousValue":"Open (Drafting)","currentValue":"Locked (SOX 404 Enforced)"}]'::jsonb, timestamptz '2026-10-18 14:12:00+00');
