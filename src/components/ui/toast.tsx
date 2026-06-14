"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import styles from "./toast.module.scss";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toast: (title: string, type?: ToastType, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (title: string, type: ToastType = "info", description?: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const value = useMemo<ToastContextType>(
    () => ({
      toast: addToast,
      success: (title, description) => addToast(title, "success", description),
      error: (title, description) => addToast(title, "error", description),
    }),
    [addToast]
  );

  const colorMap: Record<ToastType, string> = {
    success: "var(--accent-green)",
    error: "var(--accent-red)",
    info: "var(--accent-cyan)",
    warning: "var(--accent-yellow)",
  };

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={styles.toast}
            style={{ borderColor: colorMap[t.type] }}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
          >
            <div>
              <ToastPrimitive.Title className={styles.title}>
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className={styles.description}>
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className={styles.close}>
              <X size={14} />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className={styles.viewport} />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
