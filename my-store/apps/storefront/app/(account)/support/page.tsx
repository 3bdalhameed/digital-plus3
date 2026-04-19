import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";

export const metadata = { title: "الدعم الفني" };

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">الدعم الفني</h1>
      <div className="brand-card py-16 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-brand-300" />
        <h2 className="mt-4 text-lg font-bold text-brand-800">نظام التذاكر قيد التطوير</h2>
        <p className="mt-2 text-sm text-gray-500">
          في الوقت الحالي، يمكنك التواصل معنا عبر الواتساب أو البريد الإلكتروني
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="https://wa.me/" target="_blank" className="brand-btn">واتساب</a>
          <a href="mailto:support@example.com" className="brand-btn-outline">بريد إلكتروني</a>
        </div>
      </div>
    </div>
  );
}
