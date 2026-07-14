import { getPolicies } from "@/lib/payload";
import { PolicyPage } from "../PolicyPage";

export const metadata = { title: "سياسة الاسترداد | Refund Policy" };
export const revalidate = 3600;

export default async function RefundPolicyPage() {
  const policies = await getPolicies().catch(() => null);
  return <PolicyPage kind="refund" htmlContent={policies?.refundPolicy} />;
}
