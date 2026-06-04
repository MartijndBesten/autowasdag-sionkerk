import { Suspense } from "react";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "Inloggen — Admin Autowasdag" };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
