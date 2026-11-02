/**
 * Notifications éphémères (toasts).
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Ajouter une animation de sortie.
 *  [ ] Tester l'accessibilité (aria-live).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuX,
} from "react-icons/lu";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-success/20 bg-success-soft text-success",
  error: "border-danger/20 bg-danger-soft text-danger",
  info: "border-info/20 bg-info-soft text-info",
};

const VARIANT_ICONS: Record<ToastVariant, typeof LuCircleCheck> = {
  success: LuCircleCheck,
  error: LuCircleAlert,
  info: LuInfo,
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, title, message, variant }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, message) => push("success", title, message),
      error: (title, message) => push("error", title, message),
      info: (title, message) => push("info", title, message),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-3"
      >
        {toasts.map((toast) => {
          const Icon = VARIANT_ICONS[toast.variant];
          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border bg-surface p-4 shadow-lifted animate-slide-up",
                VARIANT_STYLES[toast.variant],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{toast.title}</p>
                {toast.message ? (
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {toast.message}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-ink-soft transition hover:bg-surface-muted"
                aria-label="Fermer la notification"
              >
                <LuX className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé dans un ToastProvider.");
  }
  return context;
}
