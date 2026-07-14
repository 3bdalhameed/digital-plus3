"use client";

import { useEffect, useState } from "react";
import { Shield, Zap, MessageCircle, CreditCard } from "lucide-react";
import { useLocaleStore } from "@/lib/locale-store";

const T_AR = {
  h1:      "من نحن",
  intro:   "نحن متجر متخصص في بيع المنتجات الرقمية بأسعار تنافسية وجودة عالية",
  features: [
    { title: "تسليم فوري",     desc: "منتجاتك الرقمية تصلك فور إتمام عملية الدفع بشكل تلقائي" },
    { title: "ضمان الجودة",   desc: "جميع منتجاتنا أصلية ومضمونة. نوثق كل عملية لحمايتك" },
    { title: "دفع آمن",         desc: "نستخدم بوابة Airwallex العالمية لضمان أمان معاملاتك" },
    { title: "دعم متواصل",    desc: "فريق الدعم متاح لمساعدتك عبر المنصة والواتساب" },
  ],
};
const T_EN = {
  h1:      "About Us",
  intro:   "We're a store specializing in digital products at competitive prices and high quality",
  features: [
    { title: "Instant Delivery",  desc: "Your digital products arrive automatically the moment payment is complete" },
    { title: "Quality Guarantee", desc: "All our products are genuine and guaranteed. We document every transaction to protect you" },
    { title: "Secure Payment",    desc: "We use the Airwallex global gateway to keep your transactions safe" },
    { title: "Continuous Support", desc: "The support team is available to help you through the platform and WhatsApp" },
  ],
};

const ICONS = [Zap, Shield, CreditCard, MessageCircle];

export function AboutContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const lang = useLocaleStore((s) => s.lang);
  const t = mounted && lang === "en" ? T_EN : T_AR;

  return (
    <div className="mx-auto max-w-3xl space-y-8" dir={mounted && lang === "en" ? "ltr" : "rtl"}>
      <div className="text-center">
        <h1 className="text-3xl font-black text-brand-800">{t.h1}</h1>
        <p className="mt-4 text-lg text-gray-500">{t.intro}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {t.features.map((f, i) => {
          const Icon = ICONS[i] ?? Shield;
          return (
            <div key={f.title} className="brand-card flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                <Icon className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-800">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
