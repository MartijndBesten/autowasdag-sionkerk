import { createClient } from "@/lib/supabase/server";
import ReserveringenClient from "./ReserveringenClient";

export default async function ReserveringenPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("car_reservations")
    .select("*")
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  return <ReserveringenClient initialData={data ?? []} />;
}
