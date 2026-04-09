import { useState, useCallback } from "react";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notifyListeners() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(t: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { ...t, id }];
  notifyListeners();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== id);
    notifyListeners();
  }, 5000);
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  useState(() => {
    const unsub = subscribe(setState);
    return unsub;
  });

  return {
    toasts: state,
    toast,
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    },
  };
}
