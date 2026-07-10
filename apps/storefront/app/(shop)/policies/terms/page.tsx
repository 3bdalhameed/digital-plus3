import { getPolicies } from "@/lib/payload";

export const metadata = { title: "الشروط والأحكام" };
export const revalidate = 3600;

export default async function TermsPage() {
  const policies = await getPolicies().catch(() => null);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">الشروط والأحكام</h1>
      <div className="brand-card prose prose-purple max-w-none text-gray-600">
        {policies?.termsAndConditions ? (
          <div dangerouslySetInnerHTML={{ __html: policies.termsAndConditions }} />
        ) : (
          <p>سيتم إضافة الشروط والأحكام قريباً من لوحة تحكم CMS.</p>
        )}
      </div>
    </div>
  );
}
