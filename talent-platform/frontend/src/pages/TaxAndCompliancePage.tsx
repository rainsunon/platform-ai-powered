import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/button';
import { formatCurrency } from '../utils/cn';
import { exportLedgerToPDF, exportLedgerToCSV } from '../utils/exportLedger';
import { ReadOnlyAuditLog } from '../components/audit/ReadOnlyAuditLog';

export function TaxAndCompliancePage() {
  const { auditLogs, transactions, activeEntity, addToast, isFiscalPeriodLocked, toggleFiscalPeriodLock } = useAppStore();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'critical'>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterSeverity === 'all') return true;
    return log.severity === filterSeverity;
  });

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              Statutory &amp; Regulatory
            </span>
            <span className="text-on-surface-variant text-[10px]">/</span>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Tax &amp; Compliance Audit Enclave
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-on-surface tracking-tight font-headline mt-1">
            Tax &amp; Compliance Vault
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
            Continuous verification of double-entry books, SOX 404 dual-sign audit trails, and IRS 6765 R&amp;D tax credits.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => {
              exportLedgerToCSV(transactions, {
                entityName: activeEntity,
                generatedBy: 'Elena Rostova (Executive VP & Controller)',
                includeHashes: true,
                includeCertification: true,
              });
              addToast({
                type: 'success',
                title: 'Forensic Audit CSV Exported',
                description: 'Full RFC 4180 audit spreadsheet generated with cryptographic hash checksums.',
              });
            }}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Audit CSV</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              exportLedgerToPDF(transactions, {
                entityName: activeEntity,
                generatedBy: 'Elena Rostova (Executive VP & Controller)',
                includeHashes: true,
                includeCertification: true,
              });
              addToast({
                type: 'success',
                title: 'Forensic Audit PDF Generated',
                description: 'Certified statutory report bundle compiled for Deloitte LLP auditor intake.',
              });
            }}
            className="flex items-center gap-1.5 bg-primary-container text-on-primary text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            <span>Download Audit PDF</span>
          </Button>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant font-medium">SOX 404 Status</span>
              <span className="material-symbols-outlined text-secondary text-xl">shield</span>
            </div>
            <div className="text-2xl font-bold text-on-surface tracking-tight font-headline">
              100% In-Compliance
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Dual-sign authorization enforced for all disbursements &gt; $10,000.
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-xs">
            <span className="text-secondary font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" /> Segregation Active
            </span>
            <span className="text-[10px] text-on-surface-variant font-mono">0 Violations</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant font-medium">Q3 Tax Liability Reserve</span>
              <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
            </div>
            <div className="text-2xl font-bold text-on-surface tracking-tight font-headline tabular-nums">
              $312,450.00
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Federal &amp; multi-state statutory withholding balance in escrow.
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-xs">
            <span className="text-primary font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" /> 100% Funded
            </span>
            <span className="text-[10px] text-on-surface-variant">Due Oct 31</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant font-medium">Accounting Period Lock</span>
              <span className="material-symbols-outlined text-amber-600 text-xl">
                {isFiscalPeriodLocked ? 'lock' : 'lock_open'}
              </span>
            </div>
            <div className="text-2xl font-bold text-on-surface tracking-tight font-headline">
              {isFiscalPeriodLocked ? 'Q3 Locked' : 'Q3 Unlocked'}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {isFiscalPeriodLocked
                ? 'Backdated ledger journal postings permanently sealed.'
                : 'Ledger mutations enabled for internal controllers.'}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={toggleFiscalPeriodLock}
              className="text-primary font-semibold text-xs hover:underline cursor-pointer"
            >
              {isFiscalPeriodLocked ? 'Request Unlock Exception' : 'Enforce Immediate Lock'}
            </button>
            <span className="text-[10px] text-on-surface-variant font-mono">ISO-27001</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Read-Only Audit Log Component */}
      <ReadOnlyAuditLog />
    </div>
  );
}
