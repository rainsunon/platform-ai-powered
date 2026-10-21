import { useState, useRef, useEffect } from 'react';
import { useAppStore, ROLE_CONFIGS } from '../../store/useAppStore';
import type { UserRole } from '../../types';
import { cn } from '../../utils/cn';

export function Header() {
  const { 
    simulatedRole, 
    setSimulatedRole, 
    activeEntity, 
    isFiscalPeriodLocked, 
    setIsSearchOpen,
    setIsMobileNavOpen,
    auditLogs
  } = useAppStore();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: { key: UserRole; label: string; desc: string }[] = [
    { key: 'manager', label: 'Manager', desc: 'Internal Root / Full system control' },
    { key: 'member', label: 'Member', desc: 'Internal Senior Staff / Operational reconciliations' },
    { key: 'client_admin', label: 'Client Admin', desc: 'Corporate CFO / Inbound wire release' },
    { key: 'client_staff', label: 'Client Staff', desc: 'AP/AR Specialist / Itemized voucher entry' },
    { key: 'client_planner', label: 'Client Planner', desc: 'Financial Analyst / Scenario modeling' },
  ];

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/85 backdrop-blur-xl border-b border-surface-container-high/40 shadow-[0_1px_8px_rgba(19,27,46,0.03)] z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Mobile menu toggle + Tenant Workspace + Role Pill */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="lg:hidden w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        {/* Tenant Workspace dropdown button */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 shadow-xs cursor-pointer hover:bg-surface-container-low transition-colors">
          <div className="w-6 h-6 rounded-md bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
            <span className="material-symbols-outlined text-sm">corporate_fare</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-on-surface-variant font-medium leading-none">Tenant Workspace</span>
            <span className="text-xs font-semibold text-on-surface tracking-tight truncate max-w-[170px]">
              {activeEntity}
            </span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-base ml-0.5">expand_more</span>
        </div>

        <div className="hidden sm:block h-5 w-px bg-surface-container-high" />

        {/* Role Pill with interactive popover menu */}
        <div className="relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-colors cursor-pointer border border-primary/20 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] uppercase font-bold tracking-wider">
              Role: {ROLE_CONFIGS[simulatedRole]?.shortTitle || 'Manager'}
            </span>
            <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Select Active Simulation Lens
              </div>
              <div className="mt-1 space-y-1">
                {rolesList.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      setSimulatedRole(r.key);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-start gap-2 transition-colors',
                      simulatedRole === r.key
                        ? 'bg-primary-container text-on-primary font-semibold'
                        : 'hover:bg-surface-container text-on-surface'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full mt-1 shrink-0',
                        simulatedRole === r.key ? 'bg-white' : 'bg-primary/50'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">{r.label}</span>
                      <span
                        className={cn(
                          'text-[10px] leading-tight',
                          simulatedRole === r.key ? 'text-white/80' : 'text-on-surface-variant'
                        )}
                      >
                        {r.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lock indicator */}
        <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low border border-surface-container-high/50 text-on-surface-variant text-xs">
          <span
            className={cn(
              'material-symbols-outlined text-xs',
              isFiscalPeriodLocked ? 'text-amber-600' : 'text-secondary'
            )}
          >
            {isFiscalPeriodLocked ? 'lock' : 'lock_open'}
          </span>
          <span className="text-[11px] font-medium">
            {isFiscalPeriodLocked ? 'Fiscal Lock Active' : 'Full Ledger Edit'}
          </span>
        </div>
      </div>

      {/* Right side: Search + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          title="Search transactions, invoices, or records (Ctrl+K)"
        >
          <span className="material-symbols-outlined text-lg">search</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high/50 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer relative"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
                <span className="font-headline text-sm font-semibold text-on-surface">Compliance & Event Stream</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                  Live Audit
                </span>
              </div>
              <div className="mt-2 divide-y divide-surface-container-high/30 max-h-72 overflow-y-auto">
                {auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface">{log.action}</span>
                        <span className="text-[10px] text-on-surface-variant">{log.timestamp.split(' ')[1]}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{log.targetRef}</p>
                      <span className="text-[10px] font-mono text-outline block mt-0.5">By {log.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-center border-t border-surface-container-high/40">
                <a
                  href="#/tax-and-compliance"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View Complete Immutable Audit Trail →
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-surface-container-high" />

        {/* User Profile */}
        <div className="relative" ref={profileMenuRef}>
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-surface-container-lowest border border-surface-container-high/50 shadow-xs cursor-pointer hover:bg-surface-container-low transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs ring-2 ring-primary-fixed">
              ER
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-on-surface leading-tight">Elena Rostova</span>
              <span className="text-[10px] text-on-surface-variant leading-none">Executive VP & Controller</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-base">expand_more</span>
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5 pb-2 border-b border-surface-container-high/50">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                  ER
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Elena Rostova</span>
                  <span className="text-[11px] text-on-surface-variant">elena.rostova@acmeglobal.com</span>
                  <span className="text-[10px] text-secondary font-semibold mt-0.5">SOX 404 Executive Signer</span>
                </div>
              </div>
              <div className="py-2 text-xs space-y-1 text-on-surface-variant">
                <div className="flex justify-between py-1">
                  <span>Enclave Authentication:</span>
                  <span className="font-semibold text-on-surface">FIDO2 YubiKey 5C</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Authorized Tenants:</span>
                  <span className="font-semibold text-on-surface">3 Consolidations</span>
                </div>
              </div>
              <div className="pt-2 border-t border-surface-container-high/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    useAppStore.getState().addToast({
                      type: 'info',
                      title: 'Session Re-authenticated',
                      description: 'FIDO2 cryptographic certificate verified against SOC2 enclave.',
                    });
                  }}
                  className="w-full text-center py-1.5 text-xs text-primary font-semibold hover:bg-surface-container rounded-lg"
                >
                  Verify Cryptographic Enclave Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
