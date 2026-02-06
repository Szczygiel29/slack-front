"use client";

import type { ReactNode } from "react";

interface CheckoutModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

const CheckoutModal = ({ isOpen, title, onClose, children }: CheckoutModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-black shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default CheckoutModal;
