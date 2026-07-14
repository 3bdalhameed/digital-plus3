"use client";

import { useEffect, useState } from "react";
import { useLocaleStore } from "@/lib/locale-store";

/**
 * Shared client render for all three policy pages (privacy, refund,
 * terms). The parent server page fetches the CMS HTML (Arabic) and
 * passes it in as `htmlContent`; we only bilingualize the page title
 * and the "content is coming soon" empty-state message.
 *
 * The CMS content itself is only stored in Arabic today; adding
 * English requires a matching `<policy>En` field in the Policies
 * global, migrations, and admin translation work -- deliberately
 * scoped out of this pass.
 */
export function PolicyPage({
  kind,
  htmlContent,
}: {
  kind: "privacy" | "refund" | "terms";
  htmlContent: string | null | undefined;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const lang = useLocaleStore((s) => s.lang);
  const useEn = mounted && lang === "en";

  const t = {
    privacy: {
      title: useEn ? "Privacy Policy"          : "سياسة الخصوصية",
      empty: useEn ? "The privacy policy will be added soon from the CMS." : "سيتم إضافة سياسة الخصوصية قريباً من لوحة تحكم CMS.",
    },
    refund: {
      title: useEn ? "Refund Policy"           : "سياسة الاسترداد",
      empty: useEn ? "The refund policy will be added soon from the CMS."  : "سيتم إضافة سياسة الاسترداد قريباً من لوحة تحكم CMS.",
    },
    terms: {
      title: useEn ? "Terms & Conditions"      : "الشروط والأحكام",
      empty: useEn ? "The terms and conditions will be added soon from the CMS." : "سيتم إضافة الشروط والأحكام قريباً من لوحة تحكم CMS.",
    },
  }[kind];

  return (
    <div className="mx-auto max-w-3xl" dir={useEn ? "ltr" : "rtl"}>
      <h1 className="mb-8 text-2xl font-black text-brand-800">{t.title}</h1>
      <div className="brand-card prose prose-purple max-w-none text-gray-600">
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <p>{t.empty}</p>
        )}
      </div>
    </div>
  );
}
