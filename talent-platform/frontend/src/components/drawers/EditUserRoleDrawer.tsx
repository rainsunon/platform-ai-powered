import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Switch } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/input';
import type { UserRole } from '../../types';
import { cn } from '../../utils/cn';

export function EditUserRoleDrawer() {
  const { 
    isEditRoleDrawerOpen, 
    closeEditRoleDrawer, 
    selectedMemberForEdit, 
    saveRoleAssignment,
    revokeAccess 
  } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('client_planner');
  const [selectedEntity, setSelectedEntity] = useState('StratTech Corp (Primary) + StratTech EMEA Ltd (2 Entities)');
  const [hardware2FA, setHardware2FA] = useState(true);
  const [ipGeofenced, setIpGeofenced] = useState(true);
  const [maskMargins, setMaskMargins] = useState(true);
  const [permitScenarioModeling, setPermitScenarioModeling] = useState(true);
  const [canAuthorizeWires, setCanAuthorizeWires] = useState(false);
  const [roleExpiry, setRoleExpiry] = useState('Continuous Access (Until Revoked)');
  const [auditLogNote, setAuditLogNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedMemberForEdit) {
      setSelectedRole(selectedMemberForEdit.role);
      setHardware2FA(selectedMemberForEdit.hardware2FA);
      setIpGeofenced(selectedMemberForEdit.ipGeofenced);
      setMaskMargins(selectedMemberForEdit.maskMargins);
      setPermitScenarioModeling(selectedMemberForEdit.permitScenarioModeling);
      setCanAuthorizeWires(selectedMemberForEdit.canAuthorizeWires);
      setRoleExpiry(selectedMemberForEdit.roleExpiry || 'Continuous Access (Until Revoked)');
      setAuditLogNote(
        selectedMemberForEdit.auditLogNote ||
        `Assigned ${selectedMemberForEdit.roleLabel} privileges with verified enclave security policy.`
      );
    }
  }, [selectedMemberForEdit]);

  if (!selectedMemberForEdit) return null;

  const handleRoleSelect = (roleKey: UserRole) => {
    setSelectedRole(roleKey);
    // Auto-align default guardrails based on selected role
    if (roleKey === 'manager' || roleKey === 'client_admin') {
      setCanAuthorizeWires(true);
    } else {
      setCanAuthorizeWires(false);
    }
    if (roleKey === 'manager' || roleKey === 'member') {
      setMaskMargins(false);
    } else {
      setMaskMargins(true);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await saveRoleAssignment(selectedMemberForEdit.id, {
        role: selectedRole,
        roleLabel:
          selectedRole === 'manager'
            ? 'Internal Manager'
            : selectedRole === 'member'
            ? 'Internal Member'
            : selectedRole === 'client_admin'
            ? 'Client Admin'
            : selectedRole === 'client_staff'
            ? 'Client Staff'
            : 'Client Planner',
        hardware2FA,
        ipGeofenced,
        maskMargins,
        permitScenarioModeling,
        canAuthorizeWires,
        roleExpiry,
        auditLogNote,
        authorizedEntities: [selectedEntity],
      });
    } catch {
      // The store already reports the problem detail.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (confirm(`Are you sure you want to revoke tenant access for ${selectedMemberForEdit.name}?`)) {
      setIsSubmitting(true);
      try {
        await revokeAccess(selectedMemberForEdit.id);
      } catch {
        // The store already reports the problem detail.
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isWireAuthorizedTier = selectedRole === 'manager' || selectedRole === 'client_admin';

  return (
    <Sheet open={isEditRoleDrawerOpen} onOpenChange={(open) => !open && closeEditRoleDrawer()}>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
          </div>
          <div>
            <SheetTitle>Edit User Role & Scope</SheetTitle>
            <SheetDescription>
              Manage RBAC tier, entity permissions, security guardrails, and cryptographic masking for this user.
            </SheetDescription>
          </div>
        </div>
        <button
          type="button"
          onClick={closeEditRoleDrawer}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </SheetHeader>

      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* User Card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs', selectedMemberForEdit.avatarBg)}>
              {selectedMemberForEdit.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-on-surface">{selectedMemberForEdit.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container/80 text-on-secondary-container font-bold">
                  Active Tenant
                </span>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">{selectedMemberForEdit.email}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">
              Current Role
            </span>
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-bold inline-block mt-0.5', selectedMemberForEdit.badgeBg, selectedMemberForEdit.badgeText)}>
              • {selectedMemberForEdit.roleLabel}
            </span>
          </div>
        </div>

        {/* Section 1: RBAC Authority Tier */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Select RBAC Authority Tier
            </span>
            <span className="text-xs text-on-surface-variant font-medium">1 of 5 Selected</span>
          </div>

          <div className="space-y-2">
            {/* Manager */}
            <div
              onClick={() => handleRoleSelect('manager')}
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                selectedRole === 'manager'
                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-low/60 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedRole === 'manager' ? 'border-primary bg-primary' : 'border-outline'
                )}>
                  {selectedRole === 'manager' && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">shield_person</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-on-surface">Manager</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed-variant font-bold">
                      Tier-0 Root
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Internal Root / Full system control and key management
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-base">vpn_key</span>
            </div>

            {/* Member */}
            <div
              onClick={() => handleRoleSelect('member')}
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                selectedRole === 'member'
                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-low/60 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedRole === 'member' ? 'border-primary bg-primary' : 'border-outline'
                )}>
                  {selectedRole === 'member' && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-base">edit_note</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-on-surface">Member</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface font-bold">
                      Tier-1 Staff
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Internal Senior Staff / Operational reconciliations & draft posting
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-base">rate_review</span>
            </div>

            {/* Client Admin */}
            <div
              onClick={() => handleRoleSelect('client_admin')}
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                selectedRole === 'client_admin'
                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-low/60 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedRole === 'client_admin' ? 'border-primary bg-primary' : 'border-outline'
                )}>
                  {selectedRole === 'client_admin' && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined text-base">payments</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-on-surface">Client Admin</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container font-bold">
                      Tier-2 Exec
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Corporate CFO / Inbound wire release and balance sign-off
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-base">verified_user</span>
            </div>

            {/* Client Staff */}
            <div
              onClick={() => handleRoleSelect('client_staff')}
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                selectedRole === 'client_staff'
                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-low/60 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedRole === 'client_staff' ? 'border-primary bg-primary' : 'border-outline'
                )}>
                  {selectedRole === 'client_staff' && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container">
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-on-surface">Client Staff</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-container font-bold">
                      Tier-3 Ops
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    AP / AR Clerk / Itemized voucher entry & receipt scanning
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-base">badge</span>
            </div>

            {/* Client Planner */}
            <div
              onClick={() => handleRoleSelect('client_planner')}
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                selectedRole === 'client_planner'
                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-low/60 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedRole === 'client_planner' ? 'border-primary bg-primary' : 'border-outline'
                )}>
                  {selectedRole === 'client_planner' && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center text-[#6d28d9]">
                  <span className="material-symbols-outlined text-base">query_stats</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-on-surface">Client Planner</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#f5f3ff] text-[#6d28d9] font-bold">
                      Selected Active • Advisory
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Strategic Consultant / Scenario modeling, blinded margin calculations
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
            </div>
          </div>
        </div>

        {/* Section 2: Authorized Tenant & Entities */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Authorized Tenant & Entities
          </label>
          <div className="relative">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full h-10 rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 pr-8 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="StratTech Corp (Primary) + StratTech EMEA Ltd (2 Entities)">
                StratTech Corp (Primary) + StratTech EMEA Ltd (2 Entities)
              </option>
              <option value="StratTech Corp (Primary Entity Only)">
                StratTech Corp (Primary Entity Only)
              </option>
              <option value="All Registered Entities (Global Consolidation)">
                All Registered Entities (Global Consolidation)
              </option>
            </select>
            <span className="material-symbols-outlined text-on-surface-variant text-base absolute right-3 top-2.5 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Section 3: Security & Enclave Guardrails */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block">
            Security & Enclave Guardrails
          </span>

          <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-base">key</span>
              <div>
                <span className="font-semibold text-xs text-on-surface block">Enforce Hardware Key / WebAuthn 2FA</span>
                <span className="text-[11px] text-on-surface-variant">Requires FIDO2 biometric or YubiKey prompt</span>
              </div>
            </div>
            <Switch checked={hardware2FA} onCheckedChange={setHardware2FA} />
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              <div>
                <span className="font-semibold text-xs text-on-surface block">IP CIDR Geo-fencing Restriction</span>
                <span className="text-[11px] text-on-surface-variant">Strictly restricted to US / CA corporate blocks</span>
              </div>
            </div>
            <Switch checked={ipGeofenced} onCheckedChange={setIpGeofenced} />
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-secondary text-base">visibility_off</span>
              <div>
                <span className="font-semibold text-xs text-on-surface block">Mask Internal Profit Margins & Cost Multipliers</span>
                <span className="text-[11px] text-on-surface-variant">Deterministic percentile redaction active</span>
              </div>
            </div>
            <Switch checked={maskMargins} onCheckedChange={setMaskMargins} />
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-base">show_chart</span>
              <div>
                <span className="font-semibold text-xs text-on-surface block">Permit Financial Scenario Modeling & Projections</span>
                <span className="text-[11px] text-on-surface-variant">Forward-looking sandbox simulations enabled</span>
              </div>
            </div>
            <Switch checked={permitScenarioModeling} onCheckedChange={setPermitScenarioModeling} />
          </div>

          <div className={cn(
            'p-3 rounded-xl border flex items-center justify-between',
            isWireAuthorizedTier
              ? 'bg-surface-container-low/70 border-surface-container-high/50'
              : 'bg-surface-container/40 border-dashed border-outline-variant/60 opacity-60'
          )}>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-error text-base">payments</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-on-surface">Can Authorize Direct Payouts / Wires</span>
                  {!isWireAuthorizedTier && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-error-container text-on-error-container font-bold uppercase">
                      LOCKED
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  {isWireAuthorizedTier
                    ? 'Permitted for corporate outbound settlements'
                    : 'Client Admin or Manager role required'}
                </span>
              </div>
            </div>
            <Switch
              disabled={!isWireAuthorizedTier}
              checked={canAuthorizeWires}
              onCheckedChange={setCanAuthorizeWires}
            />
          </div>
        </div>

        {/* Section 4: Role Access Expiry & Protocol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
              Role Access Expiry
            </span>
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
              <span>{roleExpiry}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-base">calendar_today</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
              Security Elevation Protocol
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Peer-Reviewed • Tier-2 Compliant</span>
            </div>
          </div>
        </div>

        {/* Section 5: Reason for Change / Immutable Audit Log Note */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
            Reason For Change / Immutable Audit Log Note
          </label>
          <Textarea
            rows={3}
            value={auditLogNote}
            onChange={(e) => setAuditLogNote(e.target.value)}
            placeholder="Document rationale for role grant, tier change, or CIDR exception..."
            className="text-xs"
          />
        </div>
      </div>

      <SheetFooter>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleRevoke}
          className="text-xs text-error font-semibold hover:underline flex items-center gap-1 px-2 py-1.5"
        >
          <span className="material-symbols-outlined text-sm">lock_reset</span>
          <span>Revoke Access</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={closeEditRoleDrawer}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isSubmitting}
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-primary-container text-on-primary"
          >
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Save & Enforce Role Assignment</span>
          </Button>
        </div>
      </SheetFooter>
    </Sheet>
  );
}
