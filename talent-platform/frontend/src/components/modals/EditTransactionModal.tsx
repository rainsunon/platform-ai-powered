import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { LedgerTransaction } from '../../types';

interface EditTransactionModalProps {
  transaction: LedgerTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
}: EditTransactionModalProps) {
  const { updateTransaction, availableTags, addCustomTag } = useAppStore();

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [client, setClient] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [auditReason, setAuditReason] = useState('');

  useEffect(() => {
    if (transaction) {
      setCategory(transaction.category);
      setAmount(Math.abs(transaction.amount).toString());
      setClient(transaction.client);
      setSelectedTags(transaction.tags || ['General']);
      setAuditReason('');
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTag = customTagInput.trim();
    if (!cleanTag) return;

    if (!selectedTags.includes(cleanTag)) {
      setSelectedTags([...selectedTags, cleanTag]);
    }
    addCustomTag(cleanTag);
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    try {
      await updateTransaction(
        transaction.id,
        {
          category,
          client,
          amount: transaction.type === 'outflow' ? -Math.abs(numAmount) : Math.abs(numAmount),
          tags: selectedTags.length > 0 ? selectedTags : ['General'],
        },
        auditReason.trim() || `Controller modification of voucher ${transaction.ref} under SOX 404 review.`
      );
    } catch {
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-lg">edit_note</span>
          </div>
          <div>
            <DialogTitle>Modify Ledger Voucher</DialogTitle>
            <DialogDescription>
              Update transaction categorization and tags. Changes are appended to the immutable audit log.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-[11px]">
          <div>
            <span className="text-on-surface-variant">Voucher Reference:</span>{' '}
            <span className="font-mono font-bold text-on-surface">{transaction.ref}</span>
          </div>
          <div>
            <span className="text-on-surface-variant">Account:</span>{' '}
            <span className="font-mono font-bold text-on-surface">{transaction.accountCode}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Counterparty / Client
            </label>
            <Input
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Transaction Category
            </label>
            <Input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-on-surface-variant block mb-1">
            Amount ($ USD)
          </label>
          <Input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Tag Selector & Categorization Section */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">label</span>
              <label className="font-bold text-on-surface text-xs font-headline">
                Voucher Tags &amp; Custom Labels
              </label>
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium">
              {selectedTags.length} selected
            </span>
          </div>

          {/* Active Tags */}
          <div className="min-h-[32px] p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high/50 flex flex-wrap items-center gap-1.5">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed-variant border border-primary/20 shadow-2xs"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-primary-fixed-dim/60 rounded-full p-0.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px] block">close</span>
                </button>
              </span>
            ))}
          </div>

          {/* Add custom tag */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-sm">
                tag
              </span>
              <Input
                type="text"
                placeholder="New tag label..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="pl-8 h-8 text-xs bg-surface-container-lowest"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleAddCustomTag()}
              disabled={!customTagInput.trim()}
              className="h-8 text-xs px-3"
            >
              + Add
            </Button>
          </div>

          {/* Common tags */}
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {availableTags.slice(0, 12).map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary font-semibold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}#{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audit Note / Reason */}
        <div>
          <label className="font-semibold text-on-surface-variant block mb-1">
            Reason for Modification (Compliance Note)
          </label>
          <Input
            placeholder="e.g. Recategorized to Retainer Revenue per client engagement addendum."
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            className="text-xs"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="subtle"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="default">
            Save &amp; Log Modification
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
