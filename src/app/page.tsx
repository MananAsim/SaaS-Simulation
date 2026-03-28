import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTickets } from "./actions";
import { DashboardClient } from "@/components/DashboardClient";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const initialTickets = await getTickets();

  return <DashboardClient initialTickets={initialTickets} />;
}
