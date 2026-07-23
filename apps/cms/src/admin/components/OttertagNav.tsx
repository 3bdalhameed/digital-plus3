// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth, useConfig } from "payload/components/utilities";
import {
  ChevronDown,
  Menu as MenuToggle,
  X as CloseIcon,
  Search,
  Sun,
  Moon,
  Sparkles,
  LogOut,
  /* entity icons */
  Package,
  Tag,
  Folder,
  ShoppingCart,
  Users,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  User as UserIcon,
  Home,
  Settings,
  Menu as MenuIcon,
  PanelBottom,
  Shield,
  LayoutDashboard,
  Circle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Theme & collapse — stored in localStorage so they survive
   page reloads and full router transitions.
   ────────────────────────────────────────────────────────────*/
type ThemeKey = "light" | "dark" | "purple";

const LS_THEME = "ot-nav-theme";
const LS_COLLAPSED = "ot-nav-collapsed";

const readLS = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    if (v == null) return fallback;
    return (v as unknown) as T;
  } catch {
    return fallback;
  }
};

/* ─────────────────────────────────────────────────────────────
   Icon lookup by collection / global slug.
   Falls back to a neutral circle so any new entity still works.
   ────────────────────────────────────────────────────────────*/
const ICONS: Record<string, any> = {
  // collections
  products: Package,
  categories: Tag,
  subcategories: Folder,
  orders: ShoppingCart,
  customers: Users,
  "evidence-logs": FileText,
  "support-tickets": MessageSquare,
  "abandoned-carts": ShoppingCart,
  media: ImageIcon,
  users: UserIcon,
  // globals
  "home-page": Home,
  settings: Settings,
  "navbar-config": MenuIcon,
  "footer-config": PanelBottom,
  "policies-content": Shield,
};

const iconFor = (slug: string) => ICONS[slug] || Circle;

/* ─────────────────────────────────────────────────────────────
   Tooltip — shown only when sidebar is collapsed
   ────────────────────────────────────────────────────────────*/
const Tooltip: React.FC<{ label: string }> = ({ label }) => (
  <span className="ot-tooltip">{label}</span>
);

/* ─────────────────────────────────────────────────────────────
   OttertagNav — registered as admin.components.Nav
   ────────────────────────────────────────────────────────────*/
const OttertagNav: React.FC = () => {
  const { collections, globals, routes, serverURL } = useConfig();
  const { user, logOut, permissions } = useAuth();
  // useLocation can return null when the Nav is mounted by Payload's
  // upload-picker drawer outside the main Router context. Treat that as
  // "no active path" so the Nav still renders instead of throwing
  // `TypeError: can't access property "pathname"` and blanking the drawer.
  const location = useLocation();
  const pathname = location?.pathname ?? "";

  const adminRoute = routes?.admin || "/admin";

  /* Local UI state ------------------------------------------------ */
  const [theme, setTheme] = useState<ThemeKey>(() =>
    (readLS<ThemeKey>(LS_THEME, "dark") as ThemeKey) ?? "dark"
  );
  /* On mobile, `collapsed` doubles as "drawer closed" — see the
     @media (max-width: 900px) block in custom.css. If the visitor
     hasn't touched the toggle yet (no LS entry) we default to
     collapsed on narrow screens so the drawer doesn't cover the
     dashboard on first paint. Desktop first-visit is still expanded. */
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_COLLAPSED) : null;
      if (raw === "1") return true;
      if (raw === "0") return false;
      return typeof window !== "undefined" && window.innerWidth < 900;
    } catch {
      return false;
    }
  });

  /* Direction detection.
     Payload's admin doesn't always set `dir` on <html>, so
     `html[dir="rtl"] .foo` selectors silently miss and the toggle /
     drawer default to LTR positioning even in an Arabic admin --
     which put the hamburger on the opposite side of the drawer in
     the last iteration. Read the direction from document (or default
     to rtl since this deployment is an Arabic panel) once at mount
     and thread it through as `data-dir` on the elements we position,
     so our own CSS doesn't depend on Payload setting a global. */
  const [dir, setDir] = useState<"rtl" | "ltr">("rtl");
  useEffect(() => {
    try {
      const raw =
        (typeof document !== "undefined" &&
          (document.documentElement.getAttribute("dir") ||
            document.body.getAttribute("dir"))) ||
        "rtl";
      setDir(raw.toLowerCase() === "ltr" ? "ltr" : "rtl");
    } catch { /* keep default */ }
  }, []);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  /* Per-collection live counts shown as small badges next to menu items.
     Keyed by collection slug. Currently only orders is fetched, but the
     shape allows adding more (e.g. support-tickets, customers) without
     touching the render loop. */
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!user || !serverURL) return;
    let cancelled = false;
    fetch(`${serverURL}${routes?.api || "/api"}/orders?limit=0&depth=0`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (typeof j?.totalDocs === "number") {
          setCounts((c) => ({ ...c, orders: j.totalDocs }));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, serverURL, routes?.api]);

  useEffect(() => {
    try { localStorage.setItem(LS_THEME, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  /* Keyboard shortcut: Ctrl/⌘+B toggles collapse */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Build the menu from Payload's real collections + globals,
     respecting admin.group and admin.hidden.                       */
  const sections = useMemo(() => {
    const isHidden = (def: any) => {
      const h = def?.admin?.hidden;
      if (typeof h === "function") return !!h({ user });
      return !!h;
    };

    const collectionAllowed = (slug: string) => {
      const p = (permissions as any)?.collections?.[slug];
      return !p || p?.read?.permission !== false;
    };
    const globalAllowed = (slug: string) => {
      const p = (permissions as any)?.globals?.[slug];
      return !p || p?.read?.permission !== false;
    };

    const items: Array<{
      id: string;
      label: string;
      href: string;
      group?: string;
      slug: string;
    }> = [];

    (collections || []).forEach((c: any) => {
      if (isHidden(c)) return;
      if (!collectionAllowed(c.slug)) return;
      const label =
        (typeof c.labels?.plural === "string" && c.labels.plural) ||
        c.labels?.plural?.en ||
        c.labels?.plural?.ar ||
        c.slug;
      items.push({
        id: `coll-${c.slug}`,
        slug: c.slug,
        label: String(label),
        href: `${adminRoute}/collections/${c.slug}`,
        group: c.admin?.group,
      });
    });

    (globals || []).forEach((g: any) => {
      if (isHidden(g)) return;
      if (!globalAllowed(g.slug)) return;
      const label =
        (typeof g.label === "string" && g.label) ||
        g.label?.en ||
        g.label?.ar ||
        g.slug;
      items.push({
        id: `glob-${g.slug}`,
        slug: g.slug,
        label: String(label),
        href: `${adminRoute}/globals/${g.slug}`,
        group: g.admin?.group,
      });
    });

    // Custom admin view: review moderation queue. Not a Payload
    // collection (Payload can't own the reviews table's schema) so
    // we hand-add the sidebar link here and gate it by role.
    const currentRole = (user as any)?.role as string | undefined;
    if (currentRole && ["super_admin", "admin", "catalog"].includes(currentRole)) {
      items.push({
        id: "reviews-moderation",
        slug: "reviews-moderation",
        label: "مراجعة التقييمات",
        href: `${adminRoute}/reviews-moderation`,
        group: "المتجر",
      });
    }

    // Custom admin view: abandoned carts. Same rationale as the
    // reviews queue -- not a Payload collection, so we hand-add the
    // link and gate it by role.
    if (currentRole && ["super_admin", "admin", "orders", "support"].includes(currentRole)) {
      items.push({
        id: "abandoned-carts",
        slug: "abandoned-carts",
        label: "السلات المتروكة",
        href: `${adminRoute}/abandoned-carts`,
        group: "الطلبات",
      });
    }

    /* Group by admin.group (fallback to "General") */
    const grouped = new Map<string, typeof items>();
    items.forEach((it) => {
      const key = it.group || "General";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(it);
    });

    return Array.from(grouped.entries()).map(([label, items]) => ({
      label: label === "General" ? "عام" : label,
      items,
    }));
  }, [collections, globals, adminRoute, user, permissions]);

  /* Initialise all groups open */
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      sections.forEach((s) => {
        if (next[s.label] === undefined) next[s.label] = true;
      });
      return next;
    });
  }, [sections]);

  /* Search filter */
  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((it) =>
          it.label.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, query]);

  /* Helpers */
  const isItemActive = (href: string) => {
    // Match exact and child routes (e.g. /admin/collections/products/...)
    return pathname === href || pathname.startsWith(href + "/");
  };

  const themeBtns: Array<{ id: ThemeKey; Icon: any; title: string }> = [
    { id: "light", Icon: Sun, title: "فاتح" },
    { id: "dark", Icon: Moon, title: "داكن" },
    { id: "purple", Icon: Sparkles, title: "بنفسجي" },
  ];

  /* Avatar initial */
  const initial =
    (user?.email && String(user.email).charAt(0).toUpperCase()) || "U";
  const displayName = (user as any)?.name || user?.email || "مسؤول";
  const roleLabel = user?.id ? "مدير النظام" : "زائر";

  /* Auto-close the mobile drawer after navigation. On desktop this is
     a no-op — the CSS keeps the sidebar visible regardless of the
     collapsed flag above 900px, and clicking a nav link there doesn't
     "close" anything. On mobile, tapping a link would leave the drawer
     open on top of the newly loaded page, so we collapse it. */
  const closeOnMobile = () => {
    try {
      if (window.innerWidth < 900) setCollapsed(true);
    } catch {}
  };

  return (
    <>
      {/* Mobile-only backdrop. Rendered outside <aside> so the click
          target covers the whole viewport minus the drawer itself.
          Purely CSS-driven visibility — see @media (max-width: 900px)
          in custom.css. */}
      <div
        className="ot-backdrop"
        data-visible={!collapsed ? "true" : "false"}
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />
      {/* Mobile-only toggle. Rendered as a sibling of <aside> because
          the drawer uses `transform` to slide off-screen, and any
          transform on an ancestor demotes child `position: fixed` to
          a de-facto absolute -- the button would slide out with the
          drawer and become unreachable. As an outside sibling it
          stays pinned to the viewport regardless of drawer state.
          Hidden on desktop (see .ot-toggle-mobile in custom.css) --
          the desktop equivalent lives inside the sidebar's brand row
          below so it can't overlap search / nav content. */}
      <button
        type="button"
        className="ot-toggle ot-toggle-mobile"
        data-collapsed={collapsed ? "true" : "false"}
        data-dir={dir}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
        aria-expanded={!collapsed}
        title={`${collapsed ? "توسيع" : "طي"} (Ctrl+B)`}
      >
        {collapsed ? (
          <MenuToggle size={20} strokeWidth={2.5} />
        ) : (
          <CloseIcon size={20} strokeWidth={2.5} />
        )}
      </button>
    <aside
      className="ot-sidebar"
      data-theme={theme}
      data-collapsed={collapsed ? "true" : "false"}
      data-dir={dir}
      aria-label="القائمة الرئيسية"
      dir="ltr"
    >
      {/* Brand — desktop-only toggle lives here alongside the brand
          name so it's part of the sidebar's chrome instead of floating
          over its content. Hidden on mobile (mobile uses the sibling
          .ot-toggle-mobile above). */}
      <div className="ot-brand">
        <NavLink to={adminRoute} className="ot-brand__link">
          <div className="ot-brand__logo">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>
          <span className="ot-brand__name">digital-plus3 admin</span>
        </NavLink>
        <button
          type="button"
          className="ot-toggle-desktop"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          aria-expanded={!collapsed}
          title={`${collapsed ? "توسيع" : "طي"} (Ctrl+B)`}
        >
          <MenuToggle size={16} strokeWidth={2.25} />
        </button>
      </div>

      {/* Search */}
      <div className="ot-search-wrap">
        {collapsed ? (
          <button
            type="button"
            className="ot-icon-btn ot-tip-host"
            aria-label="بحث"
            onClick={() => setCollapsed(false)}
          >
            <Search size={18} />
            <Tooltip label="بحث" />
          </button>
        ) : (
          <label className="ot-search">
            <Search size={15} className="ot-search__icon" />
            <input
              type="text"
              placeholder="بحث…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        )}
      </div>

      {/* Nav scroll area */}
      <nav className="ot-nav">
        {/* Dashboard (always first) */}
        <ul className="ot-list">
          <li>
            <NavLink
              to={adminRoute}
              exact
              onClick={closeOnMobile}
              className="ot-item ot-tip-host"
              activeClassName="ot-item--active"
            >
              <LayoutDashboard className="ot-item__icon" size={18} strokeWidth={2} />
              <span className="ot-item__label">لوحة التحكم</span>
              {collapsed && <Tooltip label="لوحة التحكم" />}
            </NavLink>
          </li>
        </ul>

        {filteredSections.map((section) => {
          const open = openGroups[section.label] !== false;
          return (
            <div key={section.label} className="ot-group">
              <button
                type="button"
                className="ot-section"
                onClick={() =>
                  setOpenGroups((g) => ({ ...g, [section.label]: !open }))
                }
                aria-expanded={open}
              >
                <span>{section.label}</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2.5}
                  className={`ot-section__chev ${open ? "is-open" : ""}`}
                />
              </button>

              <ul
                className={`ot-list ot-list--collapsible ${open ? "is-open" : ""}`}
              >
                {section.items.map((it) => {
                  const Icon = iconFor(it.slug);
                  const active = isItemActive(it.href);
                  const count = counts[it.slug];
                  return (
                    <li key={it.id}>
                      <NavLink
                        to={it.href}
                        onClick={closeOnMobile}
                        className={`ot-item ot-tip-host ${active ? "ot-item--active" : ""}`}
                      >
                        <Icon className="ot-item__icon" size={18} strokeWidth={active ? 2.25 : 2} />
                        <span className="ot-item__label">{it.label}</span>
                        {typeof count === "number" && !collapsed && (
                          <span className="ot-item__badge" dir="ltr">{count.toLocaleString("en-US")}</span>
                        )}
                        {collapsed && <Tooltip label={it.label} />}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom: theme switcher + profile */}
      <div className="ot-foot">
        <div className="ot-theme">
          {themeBtns.map(({ id, Icon, title }) => (
            <button
              key={id}
              type="button"
              className={`ot-theme__btn ${theme === id ? "is-active" : ""}`}
              aria-label={`السمة ${title}`}
              aria-pressed={theme === id}
              title={title}
              onClick={() => setTheme(id)}
            >
              <Icon size={14} strokeWidth={2.25} />
            </button>
          ))}
        </div>

        <div className="ot-profile">
          <NavLink
            to={`${adminRoute}/account`}
            className="ot-profile__link ot-tip-host"
            title="عرض الملف الشخصي"
          >
            <div className="ot-profile__avatar" aria-hidden>
              {initial}
              <span className="ot-profile__dot" />
            </div>
            <div className="ot-profile__meta">
              <div className="ot-profile__name">{displayName}</div>
              <div className="ot-profile__role">{roleLabel}</div>
            </div>
            {collapsed && <Tooltip label={displayName} />}
          </NavLink>
          <button
            type="button"
            className="ot-icon-btn ot-tip-host ot-logout"
            aria-label="تسجيل الخروج"
            onClick={() => logOut?.()}
          >
            <LogOut size={16} />
            <Tooltip label="تسجيل الخروج" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default OttertagNav;
