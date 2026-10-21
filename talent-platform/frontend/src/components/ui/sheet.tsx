import * as React from 'react';
import { cn } from '../../utils/cn';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'right' | 'left';
  className?: string;
}

export function Sheet({ open, onOpenChange, children, side = 'right', className }: SheetProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      <div className={cn(
        'fixed inset-y-0 z-50 flex max-w-full',
        side === 'right' ? 'right-0' : 'left-0'
      )}>
        <div
          className={cn(
            'relative w-screen max-w-md sm:max-w-xl bg-surface-container-lowest shadow-2xl border-l border-surface-container-high flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out',
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('p-5 border-b border-surface-container-high/60 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur sticky top-0 z-20', className)}>
      {children}
    </div>
  );
}

export function SheetTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('text-base sm:text-lg font-semibold text-on-surface font-headline', className)}>
      {children}
    </h3>
  );
}

export function SheetDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('text-xs text-on-surface-variant mt-0.5', className)}>{children}</p>;
}

export function SheetFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('p-4 border-t border-surface-container-high/60 bg-surface-container-lowest/90 backdrop-blur sticky bottom-0 z-20 flex items-center justify-between gap-2', className)}>
      {children}
    </div>
  );
}
