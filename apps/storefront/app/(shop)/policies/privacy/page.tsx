import { getPolicies } from "@/lib/payload";
import { PolicyPage } from "../PolicyPage";

export const metadata = { title: "سياسة الخصوصية | Privacy Policy" };
export const revalidate = 3600;

export default async function PrivacyPolicyPage() {
  const policies = await getPolicies().catch(() => null);
  return <PolicyPage kind="privacy" htmlContent={policies?.privacyPolicy} />;
}
