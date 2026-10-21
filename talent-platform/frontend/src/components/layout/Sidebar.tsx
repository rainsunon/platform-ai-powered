import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badgeText: string;
  badgeStyle: string;
  hasDot?: boolean;
}

interface NavGroup {
  group: string;
  badge: string;
  items: NavItem[];
}

export function Sidebar({ isMobile = false, onCloseMobile }: SidebarProps) {
  const { activeEntity, setActiveEntity } = useAppStore();

  const navItems: NavGroup[] = [
    {
      group: 'General Ledger',
      badge: 'CORE',
      items: [
        {
          path: '/',
          label: 'Overview & Ledger',
          icon: 'account_balance_wallet',
          badgeText: 'All',
          badgeStyle: 'bg-surface-container text-on-surface-variant font-semibold',
        },
      ],
    },
    {
      group: 'Operations',
      badge: 'FIN',
      items: [
        {
          path: '/invoices-and-billing',
          label: 'Invoices & Billing',
          icon: 'receipt_long',
          badgeText: 'Ops',
          badgeStyle: 'bg-surface-container-high text-on-surface font-semibold',
        },
        {
          path: '/client-portal-and-plans',
          label: 'Cash Flow & Forecast',
          icon: 'trending_up',
          badgeText: 'AI',
          badgeStyle: 'bg-secondary-fixed/50 text-on-secondary-container font-semibold',
        },
      ],
    },
    {
      group: 'Statutory & Client',
      badge: 'SEC',
      items: [
        {
          path: '/tax-and-compliance',
          label: 'Tax & Compliance',
          icon: 'verified_user',
          badgeText: 'Audit',
          badgeStyle: 'bg-primary-fixed text-on-primary-fixed-variant font-semibold',
        },
        {
          path: '/client-portal-and-plans',
          label: 'Client Portal & Plans',
          icon: 'group_work',
          badgeText: 'Shared',
          badgeStyle: 'bg-surface-container-high text-on-surface font-semibold',
        },
      ],
    },
    {
      group: 'Governance',
      badge: 'TIER 1',
      items: [
        {
          path: '/access-and-permissions-matrix',
          label: 'Access Matrix',
          icon: 'lock_person',
          badgeText: 'RBAC',
          badgeStyle: 'bg-primary-fixed text-on-primary-fixed-variant font-bold',
          hasDot: true,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'w-72 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_1px_16px_rgba(19,27,46,0.04)] border-r border-surface-container-high/40 flex flex-col justify-between overflow-y-auto z-40 transition-all',
        isMobile ? 'h-full' : 'fixed left-0 top-0 h-screen'
      )}
    >
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between bg-surface-container-lowest/40 backdrop-blur-md border-b border-surface-container-high/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center p-1.5 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.8)] border border-primary/10">
              <span className="material-symbols-outlined text-primary text-xl font-bold">account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-base text-on-surface tracking-tight font-semibold">Nova Ledger</span>
              <span className="text-[10px] text-on-surface-variant tracking-wider uppercase font-semibold">Enterprise OS</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container border border-secondary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Active Entity Selector Dropdown */}
        <div className="p-3">
          <div className="p-2.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/50 flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors group">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-base">domain</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Active Entity</span>
                <select
                  aria-label="Active Entity"
                  value={activeEntity}
                  onChange={(e) => setActiveEntity(e.target.value)}
                  className="bg-transparent text-xs text-on-surface font-medium truncate outline-none cursor-pointer pr-1"
                >
                  <option value="Acme Global Holdings LLC">Acme Global Holdings</option>
                  <option value="Acme EMEA Operations B.V.">Acme EMEA Operations</option>
                  <option value="Acme Pacific Logistics Inc">Acme Pacific Logistics</option>
                </select>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-base">unfold_more</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-1 space-y-4">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-2.5 pb-1 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/80 font-bold">
                  {group.group}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 font-semibold">{group.badge}</span>
              </div>
              {group.items.map((item, iIdx) => (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  onClick={() => onCloseMobile?.()}
                  className={({ isActive }) =>
                    cn(
                      'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary-container text-on-primary font-semibold shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2)]'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-base">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.hasDot && (
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isActive ? 'bg-on-primary' : 'bg-primary'
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full',
                            isActive ? 'bg-white/20 text-white' : item.badgeStyle
                          )}
                        >
                          {item.badgeText}
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Enclave Compliance Card */}
      <div className="p-3 bg-surface-container-lowest/90 border-t border-surface-container-high/40">
        <div className="p-2.5 rounded-xl bg-surface-container-low/80 flex items-center justify-between border border-surface-container-high/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-base">shield_with_heart</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface font-semibold">SOC2 Type II</span>
              <span className="text-[10px] text-secondary font-medium">Encrypted Enclave</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
        </div>
      </div>
    </aside>
  );
}
