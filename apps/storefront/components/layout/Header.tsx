"use client";

import Link from "@/components/ui/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, Heart, Search, Menu, X, User, ChevronDown, LogOut } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useLocaleStore } from "@/lib/locale-store";
import { useSession, signOut } from "next-auth/react";
import type { SiteSettings, NavbarConfig, NavLink } from "@my-store/types";

const DEFAULT_NAV: NavLink[] = [
  { labelAr: "الرئيسية", labelEn: "Home",     href: "/" },
  { labelAr: "المنتجات", labelEn: "Products", href: "/products" },
  { labelAr: "من نحن",   labelEn: "About",    href: "/about" },
  { labelAr: "الدعم",    labelEn: "Support",  href: "/support" },
];

const DEFAULT_NAME_AR = "ديجيتال بلس";
const DEFAULT_NAME_EN = "DIGITAL PLUS";

// Every UI string that isn't editor-configurable lives here so the
// header renders in the visitor's picked language without dozens of
// inline ternaries. Keys are the concept, not the Arabic text -- makes
// grepping trivial. If we ever add another locale, just add a third
// column here and switch `lang` above.
const t = {
  ar: {
    promoBar:       "مفاجأة حلوة إلك! استعمل كود الخصم:",
    searchAria:     "بحث",
    searchPlaceholder: "أبحث عن...",
    openMenu:       "فتح القائمة",
    closeMenu:      "إغلاق القائمة",
    accountFallback:"حسابي",
    signIn:         "تسجيل الدخول",
    signOut:        "تسجيل الخروج",
    wishlistAria:   "المفضلة",
    cartAria:       "السلة",
    langLabelAr:    "عربي",
    langLabelEn:    "English",
    langShortAr:    "ع",
    langShortEn:    "EN",
  },
  en: {
    promoBar:       "Sweet surprise for you! Use discount code:",
    searchAria:     "Search",
    searchPlaceholder: "Search for...",
    openMenu:       "Open menu",
    closeMenu:      "Close menu",
    accountFallback:"My account",
    signIn:         "Sign in",
    signOut:        "Sign out",
    wishlistAria:   "Wishlist",
    cartAria:       "Cart",
    langLabelAr:    "عربي",
    langLabelEn:    "English",
    langShortAr:    "ع",
    langShortEn:    "EN",
  },
} as const;

interface HeaderProps {
  settings?: SiteSettings | null;
  navbarConfig?: NavbarConfig | null;
}

export function Header({ settings, navbarConfig }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Hydration guard. Zustand's `persist` middleware reads from
  // localStorage AFTER the initial React render, so if we render the
  // cart badge / lang / currency straight from the store we get a
  // hydration mismatch: server produced HTML with defaults, client
  // wants to render persisted values → React error #418 → the whole
  // root re-renders (#423) causing a visible header flash including
  // the logo. Defer store-derived UI to the first useEffect tick so
  // the SSR HTML and the first client render always agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rawTotalItems = useCartStore((s) => s.totalItems());
  const rawWishlistCount = useWishlistStore((s) => s.items.length);
  const localeStore = useLocaleStore();

  const totalItems = mounted ? rawTotalItems : 0;
  const wishlistCount = mounted ? rawWishlistCount : 0;
  const lang = mounted ? localeStore.lang : "ar";
  const currency = mounted ? localeStore.currency : "USD";
  const { setLang, setCurrency, fetchRates, detectCurrency } = localeStore;

  // UI copy in the visitor's picked language. Falls back to Arabic
  // during the SSR + first-CSR pass so the hydration guard above
  // continues to hold (server and first render both use `t.ar`).
  const s = t[lang];

  // Nav link label helper. Editors can leave labelEn empty and the UI
  // still renders correctly -- we fall back to the Arabic label.
  const navLabel = (link: NavLink) =>
    lang === "en" && link.labelEn ? link.labelEn : link.labelAr;

  const { data: session } = useSession();
  const storeName = settings?.siteName || DEFAULT_NAME_AR;
  const logoUrl = settings?.logo?.url;
  const navLinks = navbarConfig?.links?.length ? navbarConfig.links : DEFAULT_NAV;

  // Fetch live exchange rates + auto-detect currency from IP geo on mount.
  // detectCurrency() is a no-op if the user has manually picked a currency.
  useEffect(() => {
    fetchRates();
    detectCurrency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transition-transform duration-500"
        style={{ transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2">
            {logoUrl ? (
              <Image src={logoUrl} alt={storeName} width={100} height={32} className="object-contain" />
            ) : (
              <span className="text-xl font-black text-[#7C3AED]">{storeName}</span>
            )}
          </Link>
        </div>

        <nav className="flex flex-col px-6 py-4">
          {navLinks.map((link) => (
            <div key={link.href}>
              {link.children?.length ? (
                <>
                  <button
                    className="flex w-full items-center justify-between py-3 text-right text-base font-semibold text-gray-800"
                    onClick={() => setOpenDropdown(openDropdown === link.href ? null : link.href)}
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-[#7C3AED] transition-transform ${openDropdown === link.href ? "rotate-180" : ""}`}
                    />
                    {navLabel(link)}
                  </button>
                  {openDropdown === link.href && (
                    <ul className="mb-2 flex flex-col gap-1 pr-4">
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setDrawerOpen(false)}
                            className="block py-2 text-sm font-medium text-gray-500 hover:text-[#7C3AED]"
                          >
                            {navLabel(child)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className="block py-3 text-base font-semibold text-gray-800 hover:text-[#7C3AED]"
                >
                  {navLabel(link)}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-100 p-6 flex flex-col gap-3">
          {/* Lang + Currency row in drawer */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center rounded-lg border border-gray-200">
              {(["ar", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    lang === l ? "bg-[#7C3AED] text-white" : "text-gray-500 hover:text-[#7C3AED]"
                  }`}
                >
                  {l === "ar" ? s.langLabelAr : s.langLabelEn}
                </button>
              ))}
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none"
            >
              {(["USD", "SAR", "JOD", "AED"] as const).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {session?.user ? (
            <>
              <Link href="/account" onClick={() => setDrawerOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white">
                <User className="h-4 w-4" />
                {session.user.name?.split(" ")[0] ?? s.accountFallback}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-600">
                <LogOut className="h-4 w-4" />
                {s.signOut}
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setDrawerOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white">
              <User className="h-4 w-4" />
              {s.signIn}
            </Link>
          )}
        </div>
      </div>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 flex flex-col">

        {/* ── Announcement bar — soft lavender ── */}
        <div className="flex items-center justify-center gap-2 bg-[#EDE9FE] py-2 px-4 text-xs font-semibold text-[#5B21B6]">
          <span>✨</span>
          <span>{s.promoBar}</span>
          <span className="font-black tracking-wider">PLUS</span>
        </div>

        {/* ── Main header — purple gradient with bow-curved bottom ── */}
        <div className="bg-gradient-to-l from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]" style={{ borderRadius: "0 0 50% 50% / 0 0 14px 14px" }}>
          <div className="relative mx-auto flex max-w-[90rem] items-center px-4 py-3 pb-5 sm:px-6 sm:py-4 sm:pb-6 lg:px-8">

            {/* Logo — LEFT in RTL (first in DOM). Replace LogoMark with your animated logo. */}
            <Link href="/" className="flex shrink-0 items-center" aria-label={storeName}>
              {logoUrl ? (
                <div className="relative h-14 w-32 shrink-0 overflow-hidden sm:h-16 sm:w-36">
                  <Image src={logoUrl} alt={storeName} fill className="object-contain" />
                </div>
              ) : (
                <LogoMark />
              )}
            </Link>

            {/* Search — truly centered via absolute positioning */}
            <form action="/products" method="get" className="absolute left-1/2 -translate-x-1/2 hidden w-full max-w-xs sm:block sm:max-w-sm">
              <button
                type="submit"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED] transition hover:bg-[#DDD6FE]"
                aria-label={s.searchAria}
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <input
                type="text"
                name="q"
                placeholder={s.searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full rounded-full border-0 bg-white py-2.5 pr-12 pl-4 text-sm text-gray-700 placeholder-gray-400 shadow-sm outline-none transition focus:ring-2 focus:ring-white/50"
              />
            </form>

            {/* Spacer — pushes actions to the right */}
            <div className="flex-1" />

            {/* Actions — RIGHT in RTL (last in DOM) */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
                aria-label={s.openMenu}
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Auth — desktop only */}
              {session?.user ? (
                <div className="hidden items-center gap-1.5 sm:flex">
                  <Link href="/account" className="flex items-center gap-1.5 rounded-xl border-2 border-white/80 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/10">
                    <User className="h-4 w-4" />
                    {session.user.name?.split(" ")[0] ?? s.accountFallback}
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10" aria-label={s.signOut}>
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link href="/login" aria-label={s.signIn} className="hidden items-center gap-1.5 rounded-xl border-2 border-white/80 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10 sm:flex">
                  {s.signIn}
                </Link>
              )}

              {/* Language toggle */}
              <div className="hidden items-center rounded-lg bg-white/10 sm:flex">
                {(["ar", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ${
                      lang === l ? "bg-white text-[#7C3AED]" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {l === "ar" ? "ع" : "EN"}
                  </button>
                ))}
              </div>

              {/* Currency selector */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="hidden rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-bold text-white outline-none sm:block cursor-pointer"
              >
                {(["USD", "SAR", "JOD", "AED"] as const).map((c) => (
                  <option key={c} value={c} className="text-gray-900">{c}</option>
                ))}
              </select>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label={s.wishlistAria}
              >
                <Heart className="h-5 w-5" strokeWidth={2} />
                {wishlistCount > 0 && (
                  <span className="absolute -left-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-black text-white shadow-md ring-2 ring-[#7C3AED]">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart — visible on all sizes, with count badge in the corner */}
              <Link
                href="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
                aria-label={s.cartAria}
              >
                <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                {totalItems > 0 && (
                  <span className="absolute -left-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-black text-white shadow-md ring-2 ring-[#7C3AED]">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

          </div>

          {/* ── Mobile search bar — appears as a second row below the icons,
              only on phones (desktop has the absolute-centered one above). */}
          <form
            action="/products"
            method="get"
            className="px-4 pb-3 sm:hidden"
          >
            <div className="relative">
              <button
                type="submit"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED] transition hover:bg-[#DDD6FE]"
                aria-label={s.searchAria}
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <input
                type="text"
                name="q"
                placeholder={s.searchPlaceholder}
                className="w-full rounded-full border-0 bg-white py-2.5 pr-12 pl-4 text-sm text-gray-700 placeholder-gray-400 shadow-sm outline-none transition focus:ring-2 focus:ring-white/50"
              />
            </div>
          </form>
        </div>

        {/* ── Desktop nav row (optional — only when CMS has links) ── */}
        {navbarConfig?.links?.length ? (
          <nav className="hidden border-b border-gray-100 bg-white lg:block">
            <div className="mx-auto flex max-w-[90rem] items-center justify-center gap-1 px-4 sm:px-6 lg:px-8">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  {link.children?.length ? (
                    <>
                      <button className="flex items-center gap-1 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:text-[#7C3AED]">
                        {navLabel(link)}
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                      </button>
                      <div className="invisible absolute right-0 top-full z-20 min-w-[180px] rounded-2xl border border-gray-100 bg-white py-2 shadow-xl opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-[#f5f3ff] hover:text-[#7C3AED]"
                          >
                            {navLabel(child)}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className="block px-4 py-3 text-sm font-semibold text-gray-700 transition hover:text-[#7C3AED]"
                    >
                      {navLabel(link)}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </nav>
        ) : null}

      </header>
    </>
  );
}

/* Stylized "D+" logo mark — used when no CMS logo is uploaded */
/**
 * Default brand mark shown when no logo is uploaded in the CMS Site
 * Settings. Renders the Arabic + English wordmark next to the "+" icon
 * so the header reads as a real logo instead of a placeholder shape.
 * If SiteSettings.logo.url gets set the Image branch in Header takes
 * over and this component is unused.
 */
function LogoMark() {
  return (
    <div className="flex items-center gap-2 sm:gap-3" dir="rtl">
      <div className="flex flex-col text-white leading-tight">
        <span className="text-base font-black sm:text-xl">ديجيتال بلس</span>
        <span
          className="text-[9px] font-bold tracking-[0.15em] text-white/85 sm:text-[10px]"
          dir="ltr"
        >
          DIGITAL PLUS
        </span>
      </div>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/40 backdrop-blur sm:h-11 sm:w-11"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-white sm:h-7 sm:w-7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  );
}
