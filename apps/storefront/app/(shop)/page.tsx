import { getHomePage } from "@/lib/payload";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import Link from "@/components/ui/link";
import { ArrowLeft, Zap, Shield, Headphones, Star } from "lucide-react";
import { draftMode } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

export const revalidate = 60;

/**
 * Fetch the CMS homepage with a few retries. The CMS often hasn't fully
 * warmed by the time the storefront's cold-start fires its first request
 * right after a deploy — one transient failure used to bake the empty
 * fallback into the ISR cache for a full minute. We retry briefly so a
 * single hiccup doesn't promote the placeholder to "the homepage."
 */
async function fetchHomeWithRetry(maxAttempts = 3): Promise<any | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await getHomePage();
      if (data?.sections?.length) return data;
      // Treat empty sections as a transient miss too — the global may still
      // be hydrating from the CMS DB on cold-start.
      console.warn(`[home] attempt ${attempt}: empty sections`);
    } catch (err) {
      console.warn(`[home] attempt ${attempt} failed:`, (err as Error)?.message);
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  return null;
}

export default async function HomePage() {
  // Reading draftMode opts this page out of ISR when preview is active
  draftMode();

  const homeData = await fetchHomeWithRetry();

  if (!homeData?.sections?.length) {
    // CRITICAL: prevent ISR from caching the placeholder. Without noStore()
    // here, a single failed fetch would lock the fallback in for 60 seconds
    // — even after the CMS recovered. With it, the very next request tries
    // the CMS again fresh.
    noStore();
    return <FallbackHome />;
  }

  return (
    <div className="space-y-3">
      {homeData.sections.map((section: any, index: number) => (
        <SectionRenderer key={index} section={section} />
      ))}
    </div>
  );
}

function FallbackHome() {
  const categories = [
    {
      emoji: "🎓",
      name: "إشتراكات الدورات والتعليم",
      desc: "قسم يشمل بيع الإشتراكات الخاصة بتقديم البرامج والدورات التعليمية",
      href: "/products?type=software_subscription",
    },
    {
      emoji: "🛍️",
      name: "خدمات المتاجر الإلكترونية",
      desc: "قسم يشمل بيع توفير الخدمات التي تفيد من يدير متجرًا إلكترونيًا أو بيع منتجات",
      href: "/products",
    },
    {
      emoji: "🎮",
      name: "GAMING",
      desc: "قسم يشمل بيع مفاتيح وإشتراكات الألعاب التي تفي في الألعاب",
      href: "/products?type=gaming_card",
    },
    {
      emoji: "💼",
      name: "إشتراكات الأعمال والمحاسبة",
      desc: "قسم يشمل بيع مفاتيح وإشتراكات البرامج الإنتاجية والكاتب والشهادات الإلينية",
      href: "/products?type=license_key",
    },
  ];

  const features = [
    { icon: Zap,        title: "تسليم فوري",     desc: "استلم منتجك الرقمي فور إتمام الدفع" },
    { icon: Shield,     title: "دفع آمن 100%",    desc: "تشفير متقدم لحماية جميع المعاملات" },
    { icon: Headphones, title: "دعم متواصل",      desc: "فريق دعم متخصص متاح على مدار الساعة" },
  ];

  const testimonials = [
    { name: "أحمد م.", text: "تسليم سريع جداً وخدمة ممتازة!", stars: 5 },
    { name: "سارة ع.", text: "أفضل متجر رقمي جربته بدون منازع", stars: 5 },
    { name: "خالد ر.", text: "أسعار تنافسية ومنتجات أصلية", stars: 5 },
  ];

  return (
    <div className="space-y-14">

      {/* ── Hero Banner ── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#9333EA] px-10 py-16 md:px-16 md:py-24">
        <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:justify-between">

          {/* Text side */}
          <div className="text-right md:max-w-xl">
            <p className="mb-3 text-base font-semibold text-[#c4b5fd]">مرحبًا في عالم</p>
            <h1 className="text-5xl font-black leading-tight text-white md:text-6xl lg:text-7xl">
              متجري<br />
              <span className="text-[#e9d5ff]">للمنتجات الرقمية</span>
            </h1>
            <ul className="mt-6 space-y-2 text-base text-[#ddd6fe] md:text-lg">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c4b5fd]" />
                إكتشف أقوى الاشتراكات الرقمية بأفضل الأسعار
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c4b5fd]" />
                تفعيل فوري وخدمة دعم على مدار الساعة
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-black text-[#7C3AED] shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all hover:bg-[#f5f3ff] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
                تصفح المنتجات
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Link href="/about" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-white/10">
                تعرف علينا
              </Link>
            </div>
          </div>

          {/* Illustration side */}
          <div className="flex items-center justify-center">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-white/10 md:h-80 md:w-80">
              <span className="text-9xl md:text-[10rem]">🛒</span>
              {/* Floating badges */}
              <div className="absolute -right-4 -top-4 animate-float rounded-full bg-white px-4 py-2 text-sm font-bold text-[#7C3AED] shadow-lg">
                ⚡ تسليم فوري
              </div>
              <div className="absolute -bottom-2 -left-4 animate-float rounded-full bg-white px-4 py-2 text-sm font-bold text-[#7C3AED] shadow-lg" style={{ animationDelay: "1.2s" }}>
                🔒 دفع آمن
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Categories ── */}
      <section>
        <div className="section-title">اقسام المتجر</div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map(({ emoji, name, desc, href }) => (
            <Link key={name} href={href} className="cat-card group">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-[0_4px_12px_rgba(124,58,237,0.15)] transition-transform duration-300 group-hover:scale-110">
                <span className="text-5xl">{emoji}</span>
              </div>
              <div>
                <p className="text-base font-bold leading-snug text-[#1e1b4b]">{name}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="brand-card flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE]">
              <Icon className="h-7 w-7 text-[#7C3AED]" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1e1b4b]">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Testimonials ── */}
      <section>
        <div className="section-title">ماذا يقول عملاؤنا</div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map(({ name, text, stars }) => (
            <div key={name} className="brand-card">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-3 text-base leading-relaxed text-[#6b7280]">"{text}"</p>
              <p className="mt-3 text-base font-bold text-[#1e1b4b]">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#5B21B6] via-[#7C3AED] to-[#9333EA] px-10 py-16 text-center">
        <h2 className="text-3xl font-black text-white md:text-4xl">هل أنت مستعد للبدء؟</h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-[#ddd6fe]">
          انضم إلى آلاف العملاء الراضين واحصل على منتجاتك الرقمية فورياً
        </p>
        <Link href="/products" className="mt-8 inline-flex rounded-xl bg-white px-12 py-4 text-base font-black text-[#7C3AED] shadow-lg transition-all hover:bg-[#f5f3ff]">
          تسوق الآن
        </Link>
      </section>

    </div>
  );
}
