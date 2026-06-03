"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { PackageType } from "@/lib/types";

export type ModalType = "reservation" | "volunteer" | "baking" | "materials" | null;

export interface ModalData {
  package?: PackageType;
}

interface ModalContextValue {
  modalType: ModalType;
  modalData: ModalData;
  openModal: (type: Exclude<ModalType, null>, data?: ModalData) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<ModalData>({});

  const openModal = useCallback((type: Exclude<ModalType, null>, data: ModalData = {}) => {
    setModalType(type);
    setModalData(data);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setModalData({});
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  return (
    <ModalContext.Provider value={{ modalType, modalData, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within <ModalProvider>");
  return ctx;
}
