import toast from 'react-hot-toast';

export function useToast() {
  const success = (message: string) => {
    toast.success(message, {
      style: {
        background: '#10b981',
        color: '#fff',
        borderRadius: '8px',
      },
    });
  };

  const error = (message: string) => {
    toast.error(message, {
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '8px',
      },
      duration: 5000,
    });
  };

  const loading = (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
      },
    });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        borderRadius: '8px',
      },
    });
  };

  return {
    success,
    error,
    loading,
    dismiss,
    promise,
  };
}