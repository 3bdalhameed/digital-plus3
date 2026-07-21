"use client";

import { MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Client wrapper for the support page copy. Server component
 * upstream handles auth; this component picks Arabic or English
 * based on the visitor's locale-store setting.
 */
export function SupportContent() {
  const { isEn } = useT();
  const L = {
    title:  isEn ? "Technical support"                : "الدعم الفني",
    tbdH:   isEn ? "Ticket system in development"     : "نظام التذاكر قيد التطوير",
    tbdB:   isEn ? "For now, you can reach us via WhatsApp or email." : "في الوقت الحالي، يمكنك التواصل معنا عبر الواتساب أو البريد الإلكتروني",
    wa:     isEn ? "WhatsApp"                         : "واتساب",
    email:  isEn ? "Email"                            : "بريد إلكتروني",
  };
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">{L.title}</h1>
      <div className="brand-card py-16 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-brand-300" />
        <h2 className="mt-4 text-lg font-bold text-brand-800">{L.tbdH}</h2>
        <p className="mt-2 text-sm text-gray-500">{L.tbdB}</p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="https://wa.me/" target="_blank" className="brand-btn">{L.wa}</a>
          <a href="mailto:support@example.com" className="brand-btn-outline">{L.email}</a>
        </div>
      </div>
    </div>
  );
}
