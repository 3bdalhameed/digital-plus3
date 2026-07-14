"use client";

import { useT } from "@/lib/i18n";

export function CartHeader() {
  const { t, dir } = useT();
  return (
    <h1 className="mb-8 text-2xl font-black text-brand-800" dir={dir}>
      {t("cartTitle")}
    </h1>
  );
}
