import { getHomePage } from "@/lib/payload";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

export const revalidate = 60;

export default async function HomePage() {
  let homeData;
  try {
    homeData = await getHomePage();
  } catch {
    homeData = null;
  }

  // Fallback if CMS is not connected yet
  if (!homeData?.sections?.length) {
    return <FallbackHome />;
  }

  return (
    <div className="space-y-12">
      {homeData.sections.map((section: any, index: number) => (
        <SectionRenderer key={index} section={section} />
      ))}
    </div>
  );
}

function FallbackHome() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-8 py-16 text-center text-white md:py-24">
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-tight md:text-5xl">
          مرحباً بك في متجري
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          متجرك الموثوق للمنتجات الرقمية — اشتراكات، مفاتيح، بطاقات ألعاب
          والمزيد
        </p>
        <a
          href="/products"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-bold text-brand-600 transition-all hover:scale-105 hover:shadow-lg"
        >
          تصفح المنتجات
        </a>
      </section>

      {/* Features */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            emoji: "⚡",
            title: "تسليم فوري",
            desc: "استلم منتجك الرقمي فور إتمام الدفع",
          },
          {
            emoji: "🔒",
            title: "دفع آمن",
            desc: "نستخدم أحدث تقنيات التشفير لحماية بياناتك",
          },
          {
            emoji: "💬",
            title: "دعم متواصل",
            desc: "فريق دعم متاح للمساعدة في أي وقت",
          },
        ].map((f) => (
          <div key={f.title} className="brand-card flex items-start gap-4">
            <span className="text-3xl">{f.emoji}</span>
            <div>
              <h3 className="text-sm font-bold text-brand-800">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CMS notice */}
      <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-8 text-center">
        <p className="text-sm text-brand-400">
          قم بتشغيل Payload CMS وأضف محتوى الصفحة الرئيسية من لوحة التحكم
        </p>
      </div>
    </div>
  );
}
