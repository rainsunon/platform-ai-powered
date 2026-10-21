import { useState, useMemo } from 'react';
import { useAppStore, SCENARIO_PRESETS } from '../store/useAppStore';
import { formatCurrency, cn } from '../utils/cn';
import { Button } from '../components/ui/button';

export function ClientPortalAndPlansPage() {
  const {
    activeScenarioId,
    setActiveScenarioId,
    customFte,
    setCustomFte,
    customGtm,
    setCustomGtm,
    milestones,
    vaultFiles,
    vaultFilter,
    setVaultFilter,
    addVaultFile,
    teamMembers,
    openEditRoleDrawer,
    addToast
  } = useAppStore();

  const [isUploading, setIsUploading] = useState(false);

  // Dynamic calculations based on sliders
  const scenario = SCENARIO_PRESETS[activeScenarioId];

  // Derived ARR based on GTM spend and hiring
  const dynamicArr = useMemo(() => {
    const base = parseFloat(scenario.arr.replace(/[^0-9.]/g, ''));
    const fteFactor = (customFte - scenario.fte) * 0.08;
    const gtmFactor = (customGtm - scenario.gtm) * 0.015;
    return (base + fteFactor + gtmFactor).toFixed(2);
  }, [scenario, customFte, customGtm]);

  const dynamicBurn = useMemo(() => {
    const base = parseFloat(scenario.burn.replace(/[^0-9.]/g, ''));
    const fteCost = (customFte - scenario.fte) * 12.5;
    const gtmCost = (customGtm - scenario.gtm) * 1.0;
    return (base + fteCost + gtmCost).toFixed(1);
  }, [scenario, customFte, customGtm]);

  const dynamicRunway = useMemo(() => {
    const burn = parseFloat(dynamicBurn);
    const cashReserve = 4829.3; // $4.8M
    if (burn <= 0) return '24+ Mos';
    return (cashReserve / burn).toFixed(1) + ' Mos';
  }, [dynamicBurn]);

  // Filtered vault files
  const filteredVault = useMemo(() => {
    if (vaultFilter === 'all') return vaultFiles;
    return vaultFiles.filter((f) => f.category === vaultFilter);
  }, [vaultFiles, vaultFilter]);

  const handleSimulateUpload = () => {
    const fileName = prompt('Enter document name for encrypted vault:', 'Q4_2024_Executive_Audit_Summary.pdf');
    if (!fileName) return;

    setIsUploading(true);
    void addVaultFile({
      title: fileName,
      subtitle: 'Uploaded via Secure Client Dropbox',
      category: 'public',
      fiscalPeriod: 'Q4 2024 Final',
      fileSize: '3.4 MB',
    }).finally(() => setIsUploading(false));
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Ambient glow orbs */}
      <div className="relative">
        <div className="pointer-events-none absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-fixed/30 blur-3xl -z-10" />
        <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl -z-10" />
        <div className="pointer-events-none absolute bottom-10 left-1/4 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl -z-10" />
      </div>

      {/* Top Role Context Strip & Page Meta */}
      <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-surface-container-lowest/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-surface-container-high/60 shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container-high/50">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Portal Active View
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Logged in as:</span>
            <span className="text-sm font-semibold text-on-surface font-headline">Sarah Jenkins</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#f5f3ff] text-[#6d28d9] font-bold tracking-wide">
              Client Planner • StratTech Corp
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container border border-secondary/20">
            <span className="material-symbols-outlined text-sm font-semibold">shield</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Strategy Edit Mode</span>
          </div>
          <button
            type="button"
            onClick={() => {
              addToast({
                type: 'success',
                title: 'Strategic Roadmap Deck Exported',
                description: 'Generated 24-page executive scenario deck (StratTech_FY2025_Roadmap.pdf).',
              });
            }}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-semibold text-on-surface flex items-center gap-1.5 shadow-xs border border-surface-container-high/60 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Deck</span>
          </button>
        </div>
      </div>

      {/* SOC2 Compliance Notice Ribbon */}
      <div className="w-full bg-surface-container-low/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
            <span className="material-symbols-outlined text-base">verified_user</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Compliance Notice
              </span>
              <span className="text-[10px] bg-surface-container-highest px-1.5 py-0.2 rounded text-on-surface-variant font-medium">
                SOC2 Type II Encrypted
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              Sensitive Payroll and Internal Firm Overhead data are masked for Client Planner and Client Staff roles under corporate compliance governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <span className="text-[10px] font-mono text-outline font-medium">Audit Token #4092-ST</span>
          <button
            type="button"
            onClick={() => {
              addToast({
                type: 'info',
                title: 'SOC2 Masking Policy',
                description: 'All salary multipliers and wage line-items blinded at REST boundary.',
              });
            }}
            className="text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Main Strategic Grid: Plan (8 cols) + Sidebar (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left 8 Cols: Strategy & Projections */}
        <div className="xl:col-span-8 space-y-6">
          {/* Strategy Hero Bento */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-surface-container-high/50 shadow-xs flex flex-col space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  2025 Advisory Roadmap
                </span>
                <h2 className="text-lg sm:text-xl font-semibold text-on-surface tracking-tight font-headline">
                  Financial Projections &amp; Allocation Model
                </h2>
              </div>

              {/* Scenario Preset Selector */}
              <div className="inline-flex p-1 bg-surface-container-low rounded-xl border border-surface-container-high/60 gap-1 self-start sm:self-auto">
                {(['conservative', 'baseline', 'growth'] as const).map((presetKey) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => setActiveScenarioId(presetKey)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize',
                      activeScenarioId === presetKey
                        ? 'bg-primary-container text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:bg-surface-container-lowest'
                    )}
                  >
                    {presetKey === 'baseline' ? 'Baseline (Current)' : presetKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Projection Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="bg-surface-container-low/70 p-4 rounded-xl border border-surface-container-high/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Projected 2025 ARR</span>
                  <span className="material-symbols-outlined text-sm text-secondary">trending_up</span>
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl text-on-surface font-bold font-headline tabular-nums">
                    ${dynamicArr}M
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                    +18.4%
                  </span>
                  <span className="text-xs text-on-surface-variant">vs 2024 Actual</span>
                </div>
              </div>

              <div className="bg-surface-container-low/70 p-4 rounded-xl border border-surface-container-high/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Target Operating Burn</span>
                  <span className="material-symbols-outlined text-sm text-tertiary">speed</span>
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl text-on-surface font-bold font-headline tabular-nums">
                    ${dynamicBurn}k
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">/mo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] font-bold">
                    {dynamicRunway}
                  </span>
                  <span className="text-xs text-on-surface-variant">Runway window</span>
                </div>
              </div>

              <div className="bg-surface-container-low/70 p-4 rounded-xl border border-surface-container-high/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Planned CapEx Reserve</span>
                  <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl text-on-surface font-bold font-headline tabular-nums">
                    {scenario.capex}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold">
                    Allocated
                  </span>
                  <span className="text-xs text-on-surface-variant">Board Approved</span>
                </div>
              </div>
            </div>

            {/* Dynamic SVG Vector Forecast Chart */}
            <div className="w-full bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high/40 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">
                  Quarterly Trajectory Graph ($M)
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                    <span className="text-on-surface-variant">Strategic Plan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span className="text-on-surface-variant">Advisory Target</span>
                  </div>
                </div>
              </div>

              {/* Scalable SVG Area Graph */}
              <div className="w-full h-44 relative">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 160">
                  <defs>
                    <linearGradient id="planGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4338ca" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#4338ca" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line stroke="#dae2fd" strokeWidth="1" x1="0" x2="700" y1="140" y2="140" />
                  <line stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="95" y2="95" />
                  <line stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="50" y2="50" />

                  {/* Dynamic Plan Area & Line */}
                  <path
                    className="transition-all duration-500 ease-out"
                    d={scenario.chartArea}
                    fill="url(#planGrad)"
                  />
                  <path
                    className="transition-all duration-500 ease-out"
                    d={scenario.chartPath}
                    fill="none"
                    stroke="#4338ca"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />

                  {/* Target Path (dashed green line) */}
                  <path
                    d="M 0 135 C 160 128, 260 102, 350 88 C 470 70, 580 50, 700 42"
                    fill="none"
                    stroke="#006c4a"
                    strokeDasharray="5 4"
                    strokeWidth="2"
                  />

                  {/* Quarter Marker Pins */}
                  <circle cx="0" cy="130" fill="#4338ca" r="4" />
                  <circle cx="233" cy="98" fill="#4338ca" r="4" />
                  <circle cx="466" cy="62" fill="#4338ca" r="4" />
                  <circle cx="700" cy="28" fill="#4338ca" r="5" />
                </svg>
              </div>

              <div className="flex justify-between text-[11px] text-on-surface-variant px-1 font-medium pt-1">
                <span>Q1 2025 ($2.8M)</span>
                <span>Q2 2025 ($3.4M)</span>
                <span>Q3 2025 ($3.9M)</span>
                <span>Q4 2025 ($4.18M)</span>
              </div>
            </div>

            {/* Scenario Simulation Tuning Sliders */}
            <div className="bg-surface-container-low/60 p-4 rounded-xl border border-surface-container-high/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">tune</span>
                  <span className="font-semibold text-xs text-on-surface font-headline">
                    Real-Time Scenario Parameters
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-semibold">
                  Interactive Client Sandbox
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slider 1: FTE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">R&amp;D Hiring Acceleration</span>
                    <span className="font-semibold text-on-surface tabular-nums">
                      +{customFte} FTEs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={customFte}
                    onChange={(e) => setCustomFte(parseInt(e.target.value))}
                    className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-[#4338ca]"
                  />
                  <div className="flex justify-between text-[10px] text-outline">
                    <span>Freeze (+0)</span>
                    <span>Target (+12)</span>
                    <span>Hyper (+30)</span>
                  </div>
                </div>

                {/* Slider 2: GTM Spend */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">GTM Expansion &amp; Ad Spend</span>
                    <span className="font-semibold text-on-surface tabular-nums">
                      ${customGtm}k/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="250"
                    step="5"
                    value={customGtm}
                    onChange={(e) => setCustomGtm(parseInt(e.target.value))}
                    className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-[#4338ca]"
                  />
                  <div className="flex justify-between text-[10px] text-outline">
                    <span>$20k</span>
                    <span>$125k</span>
                    <span>$250k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones & Advisory Budgets Progress */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-surface-container-high/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-base">flag</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface font-headline">
                    Advisory Milestones &amp; Budget Caps
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Fiscal Year 2025 strategic execution phases
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const title = prompt('Enter new advisory milestone title:');
                  if (!title) return;
                  addToast({
                    type: 'success',
                    title: 'Milestone Added to 2025 Plan',
                    description: `${title} allocated with $100k initial cap.`,
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>New Milestone</span>
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m) => {
                const percent = Math.round((m.spent / m.budget) * 100);
                return (
                  <div
                    key={m.id}
                    className="bg-surface-container-low/60 p-4 rounded-xl border border-surface-container-high/40 space-y-2 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'w-2.5 h-2.5 rounded-full',
                            m.statusColor === 'secondary' && 'bg-secondary',
                            m.statusColor === 'primary' && 'bg-primary-container',
                            m.statusColor === 'tertiary' && 'bg-tertiary'
                          )}
                        />
                        <span className="text-xs font-semibold text-on-surface">{m.title}</span>
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-bold',
                            m.statusColor === 'secondary' && 'bg-secondary-fixed text-on-secondary-fixed',
                            m.statusColor === 'primary' && 'bg-primary-fixed text-on-primary-fixed-variant',
                            m.statusColor === 'tertiary' && 'bg-tertiary-fixed text-on-tertiary-fixed'
                          )}
                        >
                          {m.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-on-surface-variant">
                          Budget: {formatCurrency(m.budget)}
                        </span>
                        <span className="font-semibold text-on-surface">
                          Spent: {formatCurrency(m.spent)} ({percent}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all duration-700',
                          m.statusColor === 'secondary' && 'bg-secondary',
                          m.statusColor === 'primary' && 'bg-primary-container',
                          m.statusColor === 'tertiary' && 'bg-tertiary'
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-outline pt-0.5">
                      <span>{m.phaseTarget}</span>
                      <span>{m.validationNote}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Privileges, Team Roster & Partner */}
        <div className="xl:col-span-4 space-y-6">
          {/* Active Role Privileges Card */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-5 rounded-2xl border border-surface-container-high/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Active Role Privileges
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#6d28d9] font-bold">
                Client Planner
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/40 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                  check_circle
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Edit &amp; Submit Strategy</span>
                  <span className="text-[11px] text-on-surface-variant">
                    Full rights to tune milestones, reforecast quarters, and export scenarios.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high/40 border border-surface-container-high/40 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-error text-base shrink-0 mt-0.5">
                  lock
                </span>
                <div className="flex flex-col space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-on-surface">Direct Bank Wires &amp; ACH</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-error-container text-on-error-container font-bold">
                      Gated
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Requires Client Admin authorization (Marcus Vance) to release outbound wire transfers.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high/40 border border-surface-container-high/40 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-outline text-base shrink-0 mt-0.5">
                  visibility_off
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">
                    Individual Compensation Records
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Masked at ledger level. Aggregated headcount expense visible only in strategic totals.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: '2025 Plan Dispatched for Admin Sign-Off',
                    description: 'Audit log #4092 created. Marcus Vance notified for corporate authorization.',
                  });
                }}
                className="w-full h-10 bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>Submit 2025 Plan for Admin Review</span>
              </Button>
            </div>
          </div>

          {/* Client Team Roster with Roles & Quick Matrix */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-5 rounded-2xl border border-surface-container-high/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-on-surface font-headline">
                  Client Team Roster
                </h3>
                <span className="text-xs text-on-surface-variant">
                  StratTech Corp Authorized Members
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">manage_accounts</span>
            </div>

            <div className="space-y-3">
              {teamMembers
                .filter((m) => m.role.startsWith('client_'))
                .map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/40 space-y-2 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                            member.avatarBg
                          )}
                        >
                          {member.avatarInitials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">{member.name}</span>
                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.2 rounded-full font-bold w-fit mt-0.5',
                              member.badgeBg,
                              member.badgeText
                            )}
                          >
                            {member.roleLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            member.isActive ? 'bg-secondary' : 'bg-outline-variant'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => openEditRoleDrawer(member)}
                          className="p-1 rounded-md hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Edit User Role & Scope (Image 7)"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] text-center text-on-surface-variant">
                      <div className="p-1 rounded bg-surface-container-lowest flex flex-col items-center">
                        <span
                          className={cn(
                            'material-symbols-outlined text-xs',
                            member.capabilities.invoicing ? 'text-secondary' : 'text-outline'
                          )}
                        >
                          {member.capabilities.invoicing ? 'check' : 'close'}
                        </span>
                        <span className="scale-90">Invoicing</span>
                      </div>

                      <div className="p-1 rounded bg-surface-container-lowest flex flex-col items-center">
                        <span
                          className={cn(
                            'material-symbols-outlined text-xs',
                            member.capabilities.banking ? 'text-secondary' : 'text-outline'
                          )}
                        >
                          {member.capabilities.banking ? 'check' : 'close'}
                        </span>
                        <span className="scale-90">Banking</span>
                      </div>

                      <div className="p-1 rounded bg-surface-container-lowest flex flex-col items-center">
                        <span
                          className={cn(
                            'material-symbols-outlined text-xs',
                            member.capabilities.planning ? 'text-secondary' : 'text-outline'
                          )}
                        >
                          {member.capabilities.planning ? 'check' : 'close'}
                        </span>
                        <span className="scale-90">Planning</span>
                      </div>

                      <div className="p-1 rounded bg-surface-container-lowest flex flex-col items-center">
                        <span
                          className={cn(
                            'material-symbols-outlined text-xs',
                            member.capabilities.audit ? 'text-secondary' : 'text-outline'
                          )}
                        >
                          {member.capabilities.audit ? 'check' : 'close'}
                        </span>
                        <span className="scale-90">Audit</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Advisory Contact Card */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-surface-container-high/50 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary font-headline text-lg font-bold shrink-0 shadow-xs">
              JV
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Assigned Nova CPA Partner
              </span>
              <span className="text-sm font-semibold text-on-surface font-headline">
                Julian Vance, CFA
              </span>
              <span className="text-xs text-secondary font-medium">
                Available for Strategic Review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Shared Documents & Financial Statements Vault */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-surface-container-high/50 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              Secure Document Enclave
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-on-surface tracking-tight font-headline">
              Financial Statements &amp; Advisory Vault
            </h3>
          </div>

          {/* Filter Visibility Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { key: 'all', label: `All Documents (${vaultFiles.length})` },
                { key: 'public', label: 'Public to Client' },
                { key: 'admin', label: 'Client Admin Only' },
                { key: 'firm', label: 'Internal Firm Only' },
              ] as const
            ).map((filterOpt) => (
              <button
                key={filterOpt.key}
                type="button"
                onClick={() => setVaultFilter(filterOpt.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  vaultFilter === filterOpt.key
                    ? 'bg-primary-container text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                )}
              >
                {filterOpt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vault File List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/90 text-on-surface-variant text-[10px] uppercase tracking-wider border-b border-surface-container-high/50">
                <th className="py-3 px-4 font-bold rounded-l-lg">Document Title</th>
                <th className="py-3 px-4 font-bold">Visibility Tag</th>
                <th className="py-3 px-4 font-bold">Fiscal Period</th>
                <th className="py-3 px-4 font-bold">File Size</th>
                <th className="py-3 px-4 font-bold">Planner Access</th>
                <th className="py-3 px-4 font-bold rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-surface-container-high/30">
              {filteredVault.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', doc.iconBg)}>
                        <span className="material-symbols-outlined text-base">{doc.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{doc.title}</p>
                        <span className="text-[10px] text-outline">{doc.subtitle}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        'text-[10px] px-2.5 py-0.5 rounded-full font-bold',
                        doc.category === 'public' && 'bg-[#f0f9ff] text-[#0369a1]',
                        doc.category === 'admin' && 'bg-[#f0fdfa] text-[#0f766e]',
                        doc.category === 'firm' && 'bg-surface-container-high text-on-surface-variant'
                      )}
                    >
                      {doc.categoryLabel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-on-surface tabular-nums">{doc.fiscalPeriod}</td>

                  <td className="py-3.5 px-4 text-on-surface-variant tabular-nums">{doc.fileSize}</td>

                  <td className="py-3.5 px-4">
                    {doc.plannerAccess === 'full_view' && (
                      <span className="inline-flex items-center gap-1 text-secondary font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-xs">visibility</span> Full View
                      </span>
                    )}
                    {doc.plannerAccess === 'full_edit' && (
                      <span className="inline-flex items-center gap-1 text-secondary font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-xs">edit</span> Full Edit
                      </span>
                    )}
                    {doc.plannerAccess === 'restricted' && (
                      <span className="inline-flex items-center gap-1 text-error font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-xs">lock</span> Restricted
                      </span>
                    )}
                    {doc.plannerAccess === 'hidden' && (
                      <span className="inline-flex items-center gap-1 text-outline font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-xs">visibility_off</span> Hidden
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {doc.plannerAccess === 'full_view' || doc.plannerAccess === 'full_edit' ? (
                      <button
                        type="button"
                        onClick={() => {
                          addToast({
                            type: 'success',
                            title: `Downloaded: ${doc.title}`,
                            description: 'Verified SHA-256 encrypted file stream.',
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-primary font-semibold text-xs cursor-pointer"
                      >
                        Download
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-2.5 py-1 rounded-lg bg-surface-container text-outline cursor-not-allowed font-semibold text-xs"
                      >
                        {doc.plannerAccess === 'restricted' ? 'Locked' : 'Firm Restrict'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-on-surface-variant text-xs gap-2">
          <span>Showing {filteredVault.length} of {vaultFiles.length} files stored under Nova Enterprise Encrypted Vault</span>
          <button
            type="button"
            disabled={isUploading}
            onClick={handleSimulateUpload}
            className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">cloud_upload</span>
            <span>{isUploading ? 'Encrypting & Uploading...' : 'Upload File via Secure Client Dropbox'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
