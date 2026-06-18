// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth, useConfig } from "payload/components/utilities";
import {
  ChevronDown,
  Menu as MenuToggle,
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
  const { collections, globals, routes } = useConfig();
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
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    readLS<string>(LS_COLLAPSED, "0") === "1"
  );
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

  return (
    <aside
      className="ot-sidebar"
      data-theme={theme}
      data-collapsed={collapsed ? "true" : "false"}
      aria-label="القائمة الرئيسية"
      dir="ltr"
    >
      {/* Edge toggle — hamburger */}
      <button
        type="button"
        className="ot-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
        aria-expanded={!collapsed}
        title={`${collapsed ? "توسيع" : "طي"} (Ctrl+B)`}
      >
        <MenuToggle size={16} strokeWidth={2.25} />
      </button>

      {/* Brand */}
      <div className="ot-brand">
        <NavLink to={adminRoute} className="ot-brand__link">
          <div className="ot-brand__logo">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>
          <span className="ot-brand__name">digital-plus3 admin</span>
        </NavLink>
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
                  return (
                    <li key={it.id}>
                      <NavLink
                        to={it.href}
                        className={`ot-item ot-tip-host ${active ? "ot-item--active" : ""}`}
                      >
                        <Icon className="ot-item__icon" size={18} strokeWidth={active ? 2.25 : 2} />
                        <span className="ot-item__label">{it.label}</span>
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
  );
};

export default OttertagNav;
