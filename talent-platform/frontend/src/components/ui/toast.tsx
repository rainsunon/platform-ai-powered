import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-2',
            toast.type === 'success' && 'bg-surface-container-lowest text-on-surface border-secondary/30',
            toast.type === 'info' && 'bg-surface-container-lowest text-on-surface border-primary/30',
            toast.type === 'warning' && 'bg-surface-container-lowest text-on-surface border-amber-500/30',
            toast.type === 'error' && 'bg-surface-container-lowest text-on-surface border-error/30'
          )}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
            )}
            {toast.type === 'info' && (
              <span className="material-symbols-outlined text-primary text-lg">info</span>
            )}
            {toast.type === 'warning' && (
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
            )}
            {toast.type === 'error' && (
              <span className="material-symbols-outlined text-error text-lg">error</span>
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-semibold font-headline">{toast.title}</h4>
            {toast.description && (
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {toast.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-md"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
