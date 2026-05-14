"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, Heart, Search, Menu, X, User, ChevronDown, LogOut } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useSession, signOut } from "next-auth/react";
import type { SiteSettings, NavbarConfig, NavLink } from "@my-store/types";

const DEFAULT_NAV: NavLink[] = [
  { labelAr: "الرئيسية", href: "/" },
  { labelAr: "المنتجات", href: "/products" },
  { labelAr: "من نحن", href: "/about" },
  { labelAr: "الدعم", href: "/support" },
];

const DEFAULT_NAME_AR = "ديجيتال بلس";
const DEFAULT_NAME_EN = "DIGITAL PLUS";

interface HeaderProps {
  settings?: SiteSettings | null;
  navbarConfig?: NavbarConfig | null;
}

export function Header({ settings, navbarConfig }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const totalItems = useCartStore((s) => s.totalItems());

  const { data: session } = useSession();
  const storeName = settings?.siteName || DEFAULT_NAME_AR;
  const logoUrl = settings?.logo?.url;
  const navLinks = navbarConfig?.links?.length ? navbarConfig.links : DEFAULT_NAV;

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
                    {link.labelAr}
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
                            {child.labelAr}
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
                  {link.labelAr}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-100 p-6 flex flex-col gap-3">
          <Link
            href="/cart"
            onClick={() => setDrawerOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#7C3AED] py-3 text-sm font-bold text-[#7C3AED]"
          >
            <ShoppingCart className="h-4 w-4" />
            السلة
          </Link>
          {session?.user ? (
            <>
              <Link href="/account" onClick={() => setDrawerOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white">
                <User className="h-4 w-4" />
                {session.user.name?.split(" ")[0] ?? "حسابي"}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-600">
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setDrawerOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white">
              <User className="h-4 w-4" />
              تسجيل الدخول
            </Link>
          )}
        </div>
      </div>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 flex flex-col">

        {/* ── Announcement bar — soft lavender ── */}
        <div className="flex items-center justify-center gap-2 bg-[#EDE9FE] py-2 px-4 text-xs font-semibold text-[#5B21B6]">
          <span>✨</span>
          <span>مفاجأة حلوة إلك! استعمل كود الخصم:</span>
          <span className="font-black tracking-wider">PLUS</span>
        </div>

        {/* ── Main header — purple gradient with bow-curved bottom ── */}
        <div className="bg-gradient-to-l from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]" style={{ borderRadius: "0 0 50% 50% / 0 0 14px 14px" }}>
          <div className="relative mx-auto flex max-w-7xl items-center px-4 py-3 pb-5 sm:px-6 sm:py-4 sm:pb-6 lg:px-8">

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
                aria-label="بحث"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <input
                type="text"
                name="q"
                placeholder="أبحث عن..."
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
                aria-label="فتح القائمة"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Auth — desktop only */}
              {session?.user ? (
                <div className="hidden items-center gap-1.5 sm:flex">
                  <Link href="/account" className="flex items-center gap-1.5 rounded-xl border-2 border-white/80 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/10">
                    <User className="h-4 w-4" />
                    {session.user.name?.split(" ")[0] ?? "حسابي"}
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10" aria-label="تسجيل الخروج">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="hidden items-center gap-1.5 rounded-xl border-2 border-white/80 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10 sm:flex">
                  تسجيل الدخول
                </Link>
              )}

              {/* Wishlist */}
              <button
                className="hidden h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10 sm:flex"
                aria-label="المفضلة"
              >
                <Heart className="h-5 w-5" strokeWidth={2} />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative hidden h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10 sm:flex"
                aria-label="السلة"
              >
                <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                {totalItems > 0 && (
                  <span className="absolute -left-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-black text-white shadow">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>

        {/* ── Desktop nav row (optional — only when CMS has links) ── */}
        {navbarConfig?.links?.length ? (
          <nav className="hidden border-b border-gray-100 bg-white lg:block">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-1 px-4 sm:px-6 lg:px-8">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  {link.children?.length ? (
                    <>
                      <button className="flex items-center gap-1 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:text-[#7C3AED]">
                        {link.labelAr}
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                      </button>
                      <div className="invisible absolute right-0 top-full z-20 min-w-[180px] rounded-2xl border border-gray-100 bg-white py-2 shadow-xl opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-[#f5f3ff] hover:text-[#7C3AED]"
                          >
                            {child.labelAr}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className="block px-4 py-3 text-sm font-semibold text-gray-700 transition hover:text-[#7C3AED]"
                    >
                      {link.labelAr}
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
function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-12 w-12 text-white sm:h-14 sm:w-14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
