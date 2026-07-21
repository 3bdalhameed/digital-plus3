import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SupportContent } from "./SupportContent";

export const metadata = { title: "الدعم الفني | Support" };

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <SupportContent />;
}
