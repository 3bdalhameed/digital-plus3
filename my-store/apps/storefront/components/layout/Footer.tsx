import Link from "next/link";

const footerLinks = [
  {
    title: "المتجر",
    links: [
      { label: "جميع المنتجات", href: "/products" },
      { label: "العروض", href: "/products?type=offers" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "تواصل معنا", href: "/support" },
      { label: "من نحن", href: "/about" },
    ],
  },
  {
    title: "السياسات",
    links: [
      { label: "الشروط والأحكام", href: "/policies/terms" },
      { label: "سياسة الاسترداد", href: "/policies/refund" },
      { label: "سياسة الخصوصية", href: "/policies/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
                <span className="text-xl font-black text-white">م</span>
              </div>
              <span className="text-xl font-bold text-brand-600">متجري</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              متجرك الموثوق للمنتجات الرقمية. نوفر لك أفضل الاشتراكات والمفاتيح
              الرقمية بأسعار تنافسية وضمان كامل.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-bold text-brand-800">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-brand-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-brand-50 pt-6 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} متجري. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
