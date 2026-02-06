"use client";

import type { ReactNode } from "react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  title = "Finalize subscription",
  children,
}: CheckoutModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
    >
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Zamknij
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
