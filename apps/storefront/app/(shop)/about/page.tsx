import { Shield, Zap, MessageCircle, CreditCard } from "lucide-react";

export const metadata = { title: "من نحن" };
// Fully static content — revalidate once per hour is generous.
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-brand-800">من نحن</h1>
        <p className="mt-4 text-lg text-gray-500">
          نحن متجر متخصص في بيع المنتجات الرقمية بأسعار تنافسية وجودة عالية
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Zap, title: "تسليم فوري", desc: "منتجاتك الرقمية تصلك فور إتمام عملية الدفع بشكل تلقائي" },
          { icon: Shield, title: "ضمان الجودة", desc: "جميع منتجاتنا أصلية ومضمونة. نوثق كل عملية لحمايتك" },
          { icon: CreditCard, title: "دفع آمن", desc: "نستخدم بوابة Airwallex العالمية لضمان أمان معاملاتك" },
          { icon: MessageCircle, title: "دعم متواصل", desc: "فريق الدعم متاح لمساعدتك عبر المنصة والواتساب" },
        ].map((f) => (
          <div key={f.title} className="brand-card flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <f.icon className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-800">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
