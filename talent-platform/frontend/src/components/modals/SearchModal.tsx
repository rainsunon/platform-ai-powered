import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { formatCurrency } from '../../utils/cn';

export function SearchModal() {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    transactions, 
    invoices, 
    vaultFiles, 
    teamMembers,
    setSelectedInvoiceId 
  } = useAppStore();

  const [query, setQuery] = useState('');

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { transactions: [], invoices: [], files: [], members: [] };

    const q = query.toLowerCase();

    return {
      transactions: transactions.filter(
        (t) =>
          t.ref.toLowerCase().includes(q) ||
          t.client.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.accountCode.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      ),
      invoices: invoices.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.clientEntity.toLowerCase().includes(q) ||
          i.clientSubUnit.toLowerCase().includes(q)
      ),
      files: vaultFiles.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.subtitle.toLowerCase().includes(q)
      ),
      members: teamMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.roleLabel.toLowerCase().includes(q)
      ),
    };
  }, [query, transactions, invoices, vaultFiles, teamMembers]);

  const hasResults =
    filteredResults.transactions.length > 0 ||
    filteredResults.invoices.length > 0 ||
    filteredResults.files.length > 0 ||
    filteredResults.members.length > 0;

  return (
    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <DialogHeader>
        <DialogTitle>Unified Ledger & Enclave Search</DialogTitle>
        <DialogDescription>
          Find transactions, invoices, encrypted vault documents, and team permissions.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
            search
          </span>
          <Input
            autoFocus
            placeholder="Type a transaction code, client name, account, or document..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {query.trim() && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredResults.transactions.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Transactions ({filteredResults.transactions.length})
                </span>
                <div className="space-y-1">
                  {filteredResults.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-on-surface">{tx.client}</div>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {tx.ref} • {tx.accountCode} • {tx.category}
                        </span>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tx.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-surface-container-high text-on-surface-variant"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold font-mono ${
                            tx.type === 'inflow' ? 'text-secondary' : 'text-on-surface'
                          }`}
                        >
                          {formatCurrency(tx.amount)}
                        </div>
                        <span className="text-[10px] text-on-surface-variant">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredResults.invoices.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Invoices ({filteredResults.invoices.length})
                </span>
                <div className="space-y-1">
                  {filteredResults.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setIsSearchOpen(false);
                      }}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-on-surface">{inv.clientEntity}</div>
                        <span className="text-[10px] text-primary font-mono font-semibold">
                          {inv.id} • {inv.clientSubUnit}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold font-mono text-on-surface">
                          {formatCurrency(inv.amount)}
                        </div>
                        <span className="text-[10px] text-on-surface-variant capitalize">
                          {inv.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredResults.files.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Vault Documents ({filteredResults.files.length})
                </span>
                <div className="space-y-1">
                  {filteredResults.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-primary">description</span>
                        <div>
                          <div className="font-semibold text-on-surface">{file.title}</div>
                          <span className="text-[10px] text-on-surface-variant">{file.subtitle}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface">
                        {file.fileSize}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredResults.members.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Authorized Team ({filteredResults.members.length})
                </span>
                <div className="space-y-1">
                  {filteredResults.members.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-on-surface">{mem.name}</div>
                        <span className="text-[10px] text-on-surface-variant">{mem.email}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary-fixed text-on-primary-fixed-variant">
                        {mem.roleLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasResults && (
              <div className="text-center py-6 text-on-surface-variant text-xs">
                No ledger records matching &quot;{query}&quot; in active consolidation.
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant space-y-2">
            <span className="font-semibold text-on-surface block">Quick Shortcuts:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setQuery('TXN')}
                className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px]"
              >
                TXN-90241
              </button>
              <button
                type="button"
                onClick={() => setQuery('Strata')}
                className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px]"
              >
                Strata Cloud
              </button>
              <button
                type="button"
                onClick={() => setQuery('INV')}
                className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px]"
              >
                INV-2024-8841
              </button>
              <button
                type="button"
                onClick={() => setQuery('Audited')}
                className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px]"
              >
                Audited Statements
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
