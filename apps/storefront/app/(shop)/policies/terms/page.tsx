import { getPolicies } from "@/lib/payload";
import { PolicyPage } from "../PolicyPage";

export const metadata = { title: "الشروط والأحكام | Terms & Conditions" };
export const revalidate = 3600;

export default async function TermsPage() {
  const policies = await getPolicies().catch(() => null);
  return <PolicyPage kind="terms" htmlContent={policies?.termsAndConditions} />;
}
