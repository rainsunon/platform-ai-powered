import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { exportLedgerToCSV, exportLedgerToPDF } from '../../utils/exportLedger';
import type { LedgerTransaction } from '../../types';
import { cn } from '../../utils/cn';

interface AuditExportModalProps {
  filteredTransactions: LedgerTransaction[];
}

export function AuditExportModal({ filteredTransactions }: AuditExportModalProps) {
  const { 
    isExportModalOpen, 
    setIsExportModalOpen, 
    transactions, 
    activeEntity, 
    addToast 
  } = useAppStore();

  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [includeHashes, setIncludeHashes] = useState(true);
  const [includeSOXLogs, setIncludeSOXLogs] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const targetTransactions = exportScope === 'filtered' ? filteredTransactions : transactions;

  const handleExecuteExport = (formatToUse?: 'pdf' | 'csv') => {
    const format = formatToUse || exportFormat;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const options = {
          entityName: activeEntity,
          generatedBy: 'Elena Rostova (Executive VP & Controller)',
          includeHashes,
          includeCertification: includeSOXLogs,
        };

        if (format === 'pdf') {
          exportLedgerToPDF(targetTransactions, options);
          addToast({
            type: 'success',
            title: 'Audit PDF Generated & Downloaded',
            description: `Certified statutory report generated for ${targetTransactions.length} vouchers with cryptographic verification stamps.`,
          });
        } else {
          exportLedgerToCSV(targetTransactions, options);
          addToast({
            type: 'success',
            title: 'Audit CSV Exported',
            description: `Exported ${targetTransactions.length} transactions with RFC 4180 audit headers.`,
          });
        }
        setIsExportModalOpen(false);
      } catch (err) {
        console.error(err);
        addToast({
          type: 'error',
          title: 'Export Generation Failed',
          description: 'An error occurred while compiling the report bundle.',
        });
      } finally {
        setIsProcessing(false);
      }
    }, 250);
  };

  return (
    <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl">file_download</span>
          </div>
          <div>
            <DialogTitle>Export Statutory Ledger &amp; Audit Reports</DialogTitle>
            <DialogDescription>
              Generate certified forensic PDF reports for Big-4 auditors or RFC 4180 CSV exports for ERP integration.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 text-xs">
        {/* Scope Selection */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Export Transaction Scope
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() => setExportScope('filtered')}
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                exportScope === 'filtered'
                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-low/70 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-base">filter_list</span>
                <div>
                  <span className="font-semibold text-on-surface block">Current Filtered Scope</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {filteredTransactions.length} transactions selected
                  </span>
                </div>
              </div>
              {exportScope === 'filtered' && (
                <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              )}
            </div>

            <div
              onClick={() => setExportScope('all')}
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all',
                exportScope === 'all'
                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-low/70 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-base">select_all</span>
                <div>
                  <span className="font-semibold text-on-surface block">All Consolidated Vouchers</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {transactions.length} total active entries
                  </span>
                </div>
              </div>
              {exportScope === 'all' && (
                <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              )}
            </div>
          </div>
        </div>

        {/* Format Cards */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Report Output Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PDF Option */}
            <div
              onClick={() => setExportFormat('pdf')}
              className={cn(
                'p-3.5 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-all',
                exportFormat === 'pdf'
                  ? 'bg-primary-fixed/25 border-primary ring-1 ring-primary/40 shadow-xs'
                  : 'bg-surface-container-low/70 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">picture_as_pdf</span>
                    <span className="font-bold text-xs text-on-surface">Certified Audit PDF</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                    Auditor Ready
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Official letterhead with SOX 404 segregation declaration, debits/credits balance verification, voucher hash signatures, and Deloitte LLP intake format.
                </p>
              </div>
              <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>Includes Cryptographic Stamps</span>
              </div>
            </div>

            {/* CSV Option */}
            <div
              onClick={() => setExportFormat('csv')}
              className={cn(
                'p-3.5 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-all',
                exportFormat === 'csv'
                  ? 'bg-primary-fixed/25 border-primary ring-1 ring-primary/40 shadow-xs'
                  : 'bg-surface-container-low/70 border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">table_chart</span>
                    <span className="font-bold text-xs text-on-surface">RFC 4180 CSV Data</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface font-bold">
                    ERP Feed
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Raw high-precision tabular feed with metadata comment headers, account code mappings, tags, and reconciliation status for NetSuite, SAP, or Excel.
                </p>
              </div>
              <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">sync_alt</span>
                <span>Structured for Automated Ingestion</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Compliance Checkboxes */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Auditor Attestation Controls
          </span>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHashes}
              onChange={(e) => setIncludeHashes(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-[#4338ca] cursor-pointer"
            />
            <span className="text-xs text-on-surface">
              Include Non-Repudiation Forensic Checksum Hashes
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSOXLogs}
              onChange={(e) => setIncludeSOXLogs(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-[#4338ca] cursor-pointer"
            />
            <span className="text-xs text-on-surface">
              Append Controller SOX 404 Dual-Sign Electronic Signatures
            </span>
          </label>
        </div>

        {/* Informational footer note */}
        <div className="p-2.5 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">verified_user</span>
          <span>
            Report generated under ISO 27001 data integrity protocol. Signed by Elena Rostova (Executive VP &amp; Controller).
          </span>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          type="button"
          variant="subtle"
          onClick={() => setIsExportModalOpen(false)}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={isProcessing}
          onClick={() => handleExecuteExport('csv')}
          className="flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span>Export CSV</span>
        </Button>

        <Button
          type="button"
          variant="default"
          disabled={isProcessing}
          onClick={() => handleExecuteExport('pdf')}
          className="flex items-center gap-1.5 bg-primary-container text-on-primary"
        >
          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
          <span>{isProcessing ? 'Compiling Report...' : 'Download Certified PDF'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
