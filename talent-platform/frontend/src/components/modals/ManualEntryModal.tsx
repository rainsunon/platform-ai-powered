import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function ManualEntryModal() {
  const { 
    isManualEntryOpen, 
    setIsManualEntryOpen, 
    createTransaction, 
    activeEntity,
    availableTags,
    addCustomTag 
  } = useAppStore();

  const [formData, setFormData] = useState({
    entity: activeEntity,
    client: '',
    accountCode: '1200-AR',
    category: '',
    amount: '',
    type: 'inflow' as 'inflow' | 'outflow',
    method: 'Inflow Wire',
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(['SaaS', 'Retainer']);
  const [customTagInput, setCustomTagInput] = useState('');

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
    if (!formData.client || !formData.amount) return;

    const numAmount = parseFloat(formData.amount);
    try {
      await createTransaction({
        entity: formData.entity,
        client: formData.client,
        accountCode: formData.accountCode,
        category: formData.category || 'General Ledger Entry',
        amount: formData.type === 'outflow' ? -Math.abs(numAmount) : Math.abs(numAmount),
        method: formData.method,
        tags: selectedTags.length > 0 ? selectedTags : ['General'],
      });
    } catch {
      return;
    }

    setFormData({
      entity: activeEntity,
      client: '',
      accountCode: '1200-AR',
      category: '',
      amount: '',
      type: 'inflow',
      method: 'Inflow Wire',
    });
    setSelectedTags(['SaaS', 'Retainer']);
    setCustomTagInput('');
  };

  return (
    <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">add_circle</span>
          </div>
          <div>
            <DialogTitle>Manual Journal Entry</DialogTitle>
            <DialogDescription>
              Record a double-entry general ledger voucher with custom categorization tags.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-on-surface-variant block mb-1">
            Consolidated Entity
          </label>
          <select
            value={formData.entity}
            onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
            className="w-full h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="Acme Global Holdings LLC">Acme Global Holdings LLC</option>
            <option value="Acme EMEA Operations B.V.">Acme EMEA Operations B.V.</option>
            <option value="Acme Pacific Logistics Inc">Acme Pacific Logistics Inc</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Counterparty / Client
            </label>
            <Input
              required
              placeholder="e.g. Strata Cloud Corp"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Account Ledger Code
            </label>
            <select
              value={formData.accountCode}
              onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
              className="w-full h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="1010-CASH">1010 - Cash & Equivalents</option>
              <option value="1200-AR">1200 - Accounts Receivable</option>
              <option value="2000-AP">2000 - Accounts Payable</option>
              <option value="4000-REV">4000 - Retainer Revenue</option>
              <option value="5100-COGS">5100 - Cloud Infrastructure COGS</option>
              <option value="6200-LEG">6200 - Statutory Legal Retainer</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Transaction Category
            </label>
            <Input
              placeholder="e.g. Licensing & IP"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Payment Rail / Method
            </label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Inflow Wire">Inflow Wire</option>
              <option value="ACH Outflow">ACH Outflow</option>
              <option value="Direct Deposit">Direct Deposit</option>
              <option value="Swift Wire">Swift Wire</option>
              <option value="Corporate Escrow">Corporate Escrow</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Amount ($ USD)
            </label>
            <Input
              required
              type="number"
              step="0.01"
              placeholder="25000.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface-variant block mb-1">
              Flow Direction
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'inflow' })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  formData.type === 'inflow'
                    ? 'bg-secondary-container text-on-secondary-container border-secondary/40 shadow-xs'
                    : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                }`}
              >
                + Inflow (Credit)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'outflow' })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  formData.type === 'outflow'
                    ? 'bg-error-container text-on-error-container border-error/40 shadow-xs'
                    : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                }`}
              >
                - Outflow (Debit)
              </button>
            </div>
          </div>
        </div>

        {/* Tag Selector & Categorization Section */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">label</span>
              <label className="font-bold text-on-surface text-xs font-headline">
                Transaction Tags &amp; Labels
              </label>
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium">
              {selectedTags.length} selected
            </span>
          </div>

          {/* Active / Selected Tags Badges */}
          <div className="min-h-[32px] p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high/50 flex flex-wrap items-center gap-1.5">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed-variant border border-primary/20 shadow-2xs animate-in fade-in"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-primary-fixed-dim/60 rounded-full p-0.5 transition-colors cursor-pointer"
                    title={`Remove ${tag} tag`}
                  >
                    <span className="material-symbols-outlined text-[12px] block">close</span>
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-on-surface-variant/70 italic px-1">
                No tags selected yet. Pick from recommendations below or create custom labels.
              </span>
            )}
          </div>

          {/* Custom Tag Input */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-sm">
                tag
              </span>
              <Input
                type="text"
                placeholder="Type a custom tag (e.g. Q4-Audit, Tier-1, Escrow)..."
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
              className="h-8 text-xs font-semibold px-3"
            >
              + Add Tag
            </Button>
          </div>

          {/* Quick Tag Recommendations */}
          <div>
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1.5">
              Available &amp; Common Tags
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-primary-container text-on-primary border-primary-container font-semibold shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-container-high/40'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">info</span>
          <span>
            Amounts &gt; $10,000 automatically route to the Dual-Sign Governance Queue for SOX 404 segregation of duties.
          </span>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="subtle"
            onClick={() => setIsManualEntryOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="default">
            Post Journal Voucher
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
