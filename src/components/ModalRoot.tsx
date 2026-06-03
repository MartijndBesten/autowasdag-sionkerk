"use client";

import { useModal } from "@/context/ModalContext";
import Modal from "@/components/Modal";
import ReservationForm from "@/components/forms/ReservationForm";
import VolunteerForm from "@/components/forms/VolunteerForm";
import BakingForm from "@/components/forms/BakingForm";
import MaterialsForm from "@/components/forms/MaterialsForm";

export default function ModalRoot() {
  const { modalType } = useModal();

  if (modalType === "reservation") return <Modal title="Reserveer een wasbeurt"><ReservationForm /></Modal>;
  if (modalType === "volunteer")   return <Modal title="Aanmelden als vrijwilliger"><VolunteerForm /></Modal>;
  if (modalType === "baking")      return <Modal title="Iets meebakken"><BakingForm /></Modal>;
  if (modalType === "materials")   return <Modal title="Spullen meenemen"><MaterialsForm /></Modal>;

  return null;
}
