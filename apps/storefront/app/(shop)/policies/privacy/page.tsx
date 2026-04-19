import { getPolicies } from "@/lib/payload";

export const metadata = { title: "سياسة الخصوصية" };
export const revalidate = 300;

export default async function PrivacyPolicyPage() {
  const policies = await getPolicies().catch(() => null);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">سياسة الخصوصية</h1>
      <div className="brand-card prose prose-purple max-w-none text-gray-600">
        {policies?.privacyPolicy ? (
          <div dangerouslySetInnerHTML={{ __html: policies.privacyPolicy }} />
        ) : (
          <p>سيتم إضافة سياسة الخصوصية قريباً من لوحة تحكم CMS.</p>
        )}
      </div>
    </div>
  );
}
