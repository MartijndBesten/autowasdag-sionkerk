"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useModal } from "@/context/ModalContext";

interface ModalProps {
  title: string;
  children: ReactNode;
}

export default function Modal({ title, children }: ModalProps) {
  const { closeModal } = useModal();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal
  useEffect(() => {
    const el = overlayRef.current;
    el?.focus();
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-bold text-green-950 text-lg">{title}</h2>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
