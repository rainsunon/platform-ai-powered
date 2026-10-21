CREATE TABLE ledger_transaction (
    id                  text    NOT NULL,
    ref                 text    NOT NULL,
    posted_label        text    NOT NULL,
    entity_name         text   NOT NULL,
    client_name         text   NOT NULL,
    account_code        text    NOT NULL,
    category            text   NOT NULL,
    amount              numeric(19, 2) NOT NULL,
    direction           text    NOT NULL,
    status              text    NOT NULL,
    method              text   NOT NULL,
    requires_dual_sign  BOOLEAN        NOT NULL,
    approved            BOOLEAN        NOT NULL,
    version             BIGINT         NOT NULL,
    created_at          timestamptz      NOT NULL,
    updated_at          timestamptz      NOT NULL,
    CONSTRAINT pk_ledger_transaction PRIMARY KEY (id),
    CONSTRAINT uq_ledger_transaction_ref UNIQUE (ref),
    CONSTRAINT ck_ledger_direction CHECK (direction IN ('INFLOW', 'OUTFLOW')),
    CONSTRAINT ck_ledger_status CHECK (status IN ('VERIFIED', 'AWAITING_MGR', 'RECONCILED', 'THRESHOLD_FLAG', 'POSTED'))
);

CREATE INDEX idx_ledger_transaction_entity ON ledger_transaction (entity_name);
CREATE INDEX idx_ledger_transaction_status_created ON ledger_transaction (status, created_at);
CREATE INDEX idx_ledger_transaction_account ON ledger_transaction (account_code);

CREATE TABLE ledger_transaction_tag (
    transaction_id text NOT NULL,
    tag_order      INT         NOT NULL,
    tag            text NOT NULL,
    CONSTRAINT pk_ledger_transaction_tag PRIMARY KEY (transaction_id, tag_order),
    CONSTRAINT fk_ledger_tag_tx FOREIGN KEY (transaction_id) REFERENCES ledger_transaction (id)
);

CREATE INDEX idx_ledger_transaction_tag_tag ON ledger_transaction_tag (tag);

CREATE TABLE ledger_tag (
    name text NOT NULL,
    CONSTRAINT pk_ledger_tag PRIMARY KEY (name)
);

CREATE TABLE invoice (
    id                     text    NOT NULL,
    client_entity          text   NOT NULL,
    client_sub_unit        text   NOT NULL,
    avatar_initials        text     NOT NULL,
    scope_role             text    NOT NULL,
    issue_date             text    NOT NULL,
    due_date               text    NOT NULL,
    amount                 numeric(19, 2) NOT NULL,
    status                 text    NOT NULL,
    period_label           text   NOT NULL,
    tax_id                 text    NOT NULL,
    direct_cost            numeric(19, 2) NOT NULL,
    gross_profit           numeric(19, 2) NOT NULL,
    profit_margin_percent  numeric(6, 2)  NOT NULL,
    write_off_max          numeric(19, 2) NOT NULL,
    recipient_bank         text   NOT NULL,
    payment_protocol       text   NOT NULL,
    line_items             jsonb          NOT NULL,
    disputed               BOOLEAN        NOT NULL,
    dispute_reason         text,
    version                BIGINT         NOT NULL,
    created_at             timestamptz      NOT NULL,
    updated_at             timestamptz      NOT NULL,
    CONSTRAINT pk_invoice PRIMARY KEY (id),
    CONSTRAINT ck_invoice_amount CHECK (amount > 0),
    CONSTRAINT ck_invoice_status CHECK (status IN ('PENDING_CLIENT_APPROVAL', 'OVERDUE', 'DRAFT_REVIEW', 'PAID_SETTLED')),
    CONSTRAINT ck_invoice_line_items CHECK (jsonb_typeof(line_items) = 'array')
);

CREATE INDEX idx_invoice_status ON invoice (status);

CREATE TABLE governance_item (
    id                      text    NOT NULL,
    vendor                  text   NOT NULL,
    txn_ref                 text   NOT NULL,
    category                text   NOT NULL,
    entity_name             text   NOT NULL,
    amount                  numeric(19, 2) NOT NULL,
    due_in                  text   NOT NULL,
    requires_second_signer  BOOLEAN        NOT NULL,
    signed                  BOOLEAN        NOT NULL,
    signer_name             text,
    version                 BIGINT         NOT NULL,
    created_at              timestamptz      NOT NULL,
    updated_at              timestamptz      NOT NULL,
    CONSTRAINT pk_governance_item PRIMARY KEY (id)
);

CREATE INDEX idx_governance_item_signed ON governance_item (signed);

CREATE TABLE team_member (
    id                        text   NOT NULL,
    name                      text  NOT NULL,
    email                     text  NOT NULL,
    avatar_initials           text    NOT NULL,
    avatar_bg                 text  NOT NULL,
    role                      text   NOT NULL,
    role_label                text   NOT NULL,
    badge_bg                  text  NOT NULL,
    badge_text                text  NOT NULL,
    active                    BOOLEAN       NOT NULL,
    cap_invoicing             BOOLEAN       NOT NULL,
    cap_banking               BOOLEAN       NOT NULL,
    cap_planning              BOOLEAN       NOT NULL,
    cap_audit                 BOOLEAN       NOT NULL,
    hardware_2fa              BOOLEAN       NOT NULL,
    ip_geofenced              BOOLEAN       NOT NULL,
    mask_margins              BOOLEAN       NOT NULL,
    permit_scenario_modeling  BOOLEAN       NOT NULL,
    can_authorize_wires       BOOLEAN       NOT NULL,
    role_expiry               text  NOT NULL,
    elevation_protocol        text  NOT NULL,
    audit_log_note            text NOT NULL,
    version                   BIGINT        NOT NULL,
    created_at                timestamptz     NOT NULL,
    updated_at                timestamptz     NOT NULL,
    CONSTRAINT pk_team_member PRIMARY KEY (id),
    CONSTRAINT uq_team_member_email UNIQUE (email)
);

CREATE INDEX idx_team_member_role ON team_member (role);

CREATE TABLE team_member_entity (
    member_id    text  NOT NULL,
    entity_order INT          NOT NULL,
    entity_name  text NOT NULL,
    CONSTRAINT pk_team_member_entity PRIMARY KEY (member_id, entity_order),
    CONSTRAINT fk_member_entity_member FOREIGN KEY (member_id) REFERENCES team_member (id)
);

CREATE TABLE audit_event (
    id           text   NOT NULL,
    occurred_at  text   NOT NULL,
    actor        text  NOT NULL,
    role_label   text   NOT NULL,
    action_name  text   NOT NULL,
    category     text   NOT NULL,
    entity_name  text  NOT NULL,
    target_ref   text  NOT NULL,
    content_hash text   NOT NULL,
    severity     text   NOT NULL,
    details      text,
    ip_address   text,
    verified     BOOLEAN       NOT NULL,
    delta        jsonb         NOT NULL,
    created_at   timestamptz     NOT NULL,
    CONSTRAINT pk_audit_event PRIMARY KEY (id),
    CONSTRAINT ck_audit_category CHECK (category IN ('MANUAL_ENTRY', 'MODIFICATION', 'APPROVAL', 'SECURITY', 'PERIOD_LOCK')),
    CONSTRAINT ck_audit_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ck_audit_delta CHECK (jsonb_typeof(delta) = 'array')
);

CREATE INDEX idx_audit_event_created ON audit_event (created_at);
CREATE INDEX idx_audit_event_severity ON audit_event (severity);

CREATE TABLE vault_file (
    id             text  NOT NULL,
    title          text NOT NULL,
    subtitle       text NOT NULL,
    category       text  NOT NULL,
    category_label text  NOT NULL,
    fiscal_period  text  NOT NULL,
    file_size      text  NOT NULL,
    planner_access text  NOT NULL,
    icon           text  NOT NULL,
    icon_bg        text NOT NULL,
    created_at     timestamptz    NOT NULL,
    CONSTRAINT pk_vault_file PRIMARY KEY (id),
    CONSTRAINT ck_vault_category CHECK (category IN ('PUBLIC', 'ADMIN', 'FIRM')),
    CONSTRAINT ck_vault_access CHECK (planner_access IN ('FULL_VIEW', 'FULL_EDIT', 'RESTRICTED', 'HIDDEN'))
);

CREATE INDEX idx_vault_file_category ON vault_file (category);

CREATE TABLE budget_threshold (
    id                     text    NOT NULL,
    category               text   NOT NULL,
    account_code           text    NOT NULL,
    monthly_budget         numeric(19, 2) NOT NULL,
    warning_percentage     INT            NOT NULL,
    alert_enabled          BOOLEAN        NOT NULL,
    auto_flag_transactions BOOLEAN        NOT NULL,
    notes                  text,
    version                BIGINT         NOT NULL,
    created_at             timestamptz      NOT NULL,
    updated_at             timestamptz      NOT NULL,
    CONSTRAINT pk_budget_threshold PRIMARY KEY (id),
    CONSTRAINT ck_budget_amount CHECK (monthly_budget > 0),
    CONSTRAINT ck_budget_warning CHECK (warning_percentage BETWEEN 1 AND 100)
);

CREATE INDEX idx_budget_threshold_account ON budget_threshold (account_code);

CREATE TABLE milestone (
    id              text    NOT NULL,
    title           text   NOT NULL,
    status          text    NOT NULL,
    status_color    text    NOT NULL,
    budget          numeric(19, 2) NOT NULL,
    spent           numeric(19, 2) NOT NULL,
    phase_target    text   NOT NULL,
    validation_note text   NOT NULL,
    version         BIGINT         NOT NULL,
    updated_at      timestamptz      NOT NULL,
    CONSTRAINT pk_milestone PRIMARY KEY (id),
    CONSTRAINT ck_milestone_budget CHECK (budget >= 0 AND spent >= 0)
);

CREATE TABLE fiscal_period (
    id          text  NOT NULL,
    locked      BOOLEAN      NOT NULL,
    entity_name text NOT NULL,
    version     BIGINT       NOT NULL,
    updated_at  timestamptz    NOT NULL,
    CONSTRAINT pk_fiscal_period PRIMARY KEY (id)
);
