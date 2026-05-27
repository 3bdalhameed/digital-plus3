import React, { useState } from "react";
import {
  Home,
  LayoutDashboard,
  CheckSquare,
  Users,
  Shield,
  User,
  CreditCard,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCircle,
  Mail,
  Building2,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Menu data                                                          */
/* ------------------------------------------------------------------ */
const MENU = [
  { id: "home", label: "Home", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: CheckSquare, badge: "8" },
  {
    id: "users",
    label: "Users",
    icon: Users,
    children: [
      { id: "profile", label: "Profile", icon: UserCircle },
      { id: "email", label: "Email Address", icon: Mail },
      { id: "organization", label: "Organization", icon: Building2 },
    ],
  },
  { id: "security", label: "Security", icon: Shield },
  { id: "account", label: "Account", icon: User },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "setting", label: "Setting", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "3" },
];

/* ------------------------------------------------------------------ */
/*  Theme tokens                                                       */
/* ------------------------------------------------------------------ */
const THEMES = {
  light: {
    page: "bg-slate-100",
    sidebar: "bg-white border-r border-slate-200/80 shadow-sm",
    logoBox: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
    brand: "text-slate-900",
    search:
      "bg-slate-100/80 border border-slate-200/60 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-200/60",
    searchIcon: "text-slate-400",
    sectionLabel: "text-slate-400",
    item: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    itemActive:
      "bg-violet-600 text-white shadow-md shadow-violet-600/25 hover:bg-violet-600 hover:text-white",
    itemIconActive: "text-white",
    submenuItem: "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
    submenuItemActive: "text-violet-700 bg-violet-50",
    badge: "bg-slate-200 text-slate-700",
    badgeActive: "bg-white/20 text-white",
    divider: "border-slate-200/80",
    profileName: "text-slate-900",
    profileRole: "text-slate-500",
    toggleBtn:
      "bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 shadow-sm",
    tooltip: "bg-slate-900 text-white",
  },
  dark: {
    page: "bg-[#0a0a0b]",
    sidebar: "bg-[#111114] border-r border-white/5",
    logoBox: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
    brand: "text-white",
    search:
      "bg-white/5 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:bg-white/10 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20",
    searchIcon: "text-slate-500",
    sectionLabel: "text-slate-500",
    item: "text-slate-400 hover:bg-white/5 hover:text-white",
    itemActive:
      "bg-violet-600 text-white shadow-lg shadow-violet-900/40 hover:bg-violet-600 hover:text-white",
    itemIconActive: "text-white",
    submenuItem: "text-slate-500 hover:text-white hover:bg-white/5",
    submenuItemActive: "text-violet-300 bg-violet-500/10",
    badge: "bg-white/10 text-slate-300",
    badgeActive: "bg-white/20 text-white",
    divider: "border-white/5",
    profileName: "text-white",
    profileRole: "text-slate-500",
    toggleBtn:
      "bg-[#1a1a1f] border border-white/10 text-slate-400 hover:text-white hover:border-white/20",
    tooltip: "bg-white text-slate-900",
  },
  purple: {
    page: "bg-gradient-to-br from-violet-50 to-indigo-50",
    sidebar:
      "bg-gradient-to-b from-violet-700 via-violet-700 to-indigo-800 border-r border-violet-900/20",
    logoBox: "bg-white/15 backdrop-blur text-white ring-1 ring-white/20",
    brand: "text-white",
    search:
      "bg-white/10 border border-white/15 text-white placeholder:text-violet-200/70 focus:bg-white/15 focus:border-white/30 focus:ring-2 focus:ring-white/10",
    searchIcon: "text-violet-200/80",
    sectionLabel: "text-violet-200/60",
    item: "text-violet-100/80 hover:bg-white/10 hover:text-white",
    itemActive:
      "bg-white text-violet-700 shadow-lg shadow-violet-900/30 hover:bg-white hover:text-violet-700",
    itemIconActive: "text-violet-600",
    submenuItem: "text-violet-200/70 hover:text-white hover:bg-white/10",
    submenuItemActive: "text-white bg-white/15",
    badge: "bg-white/15 text-violet-100",
    badgeActive: "bg-violet-100 text-violet-700",
    divider: "border-white/10",
    profileName: "text-white",
    profileRole: "text-violet-200/70",
    toggleBtn:
      "bg-white text-violet-700 border border-violet-200 hover:bg-violet-50 shadow-md shadow-violet-900/10",
    tooltip: "bg-white text-violet-700 shadow-lg",
  },
};

/* ------------------------------------------------------------------ */
/*  Tooltip (for collapsed mode)                                       */
/* ------------------------------------------------------------------ */
const Tooltip = ({ label, theme, badge }) => (
  <div
    className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${theme.tooltip}`}
  >
    {label}
    {badge && (
      <span className="ml-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[10px]">
        {badge}
      </span>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Nav item                                                           */
/* ------------------------------------------------------------------ */
const NavItem = ({
  item,
  active,
  collapsed,
  theme,
  isOpen,
  onClick,
  activeChild,
  onChildClick,
}) => {
  const Icon = item.icon;
  const hasChildren = !!item.children;

  return (
    <li className="group relative">
      <button
        onClick={onClick}
        className={`relative flex w-full items-center rounded-xl transition-all duration-200 ${
          collapsed ? "h-11 justify-center px-0" : "h-10 px-3"
        } ${active ? theme.itemActive : theme.item}`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 ${
            active ? theme.itemIconActive : ""
          }`}
          strokeWidth={active ? 2.25 : 2}
        />

        {/* Expanded label + chevron + badge */}
        <span
          className={`flex flex-1 items-center justify-between overflow-hidden transition-all duration-300 ${
            collapsed ? "ml-0 w-0 opacity-0" : "ml-3 opacity-100"
          }`}
        >
          <span className="truncate text-[13.5px] font-medium tracking-tight">
            {item.label}
          </span>
          <span className="flex items-center gap-1.5">
            {item.badge && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? theme.badgeActive : theme.badge
                }`}
              >
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isOpen ? "rotate-0" : "-rotate-90"
                }`}
                strokeWidth={2.25}
              />
            )}
          </span>
        </span>

        {/* Collapsed tooltip */}
        {collapsed && (
          <Tooltip label={item.label} theme={theme} badge={item.badge} />
        )}
      </button>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out ${
            isOpen
              ? "mt-1 grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <ul className="ml-4 min-h-0 space-y-0.5 border-l border-current/10 pl-3">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const isActive = activeChild === child.id;
              return (
                <li key={child.id}>
                  <button
                    onClick={() => onChildClick(child.id)}
                    className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] font-medium tracking-tight transition-colors duration-150 ${
                      isActive ? theme.submenuItemActive : theme.submenuItem
                    }`}
                  >
                    <ChildIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span className="truncate">{child.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
const Sidebar = ({ themeKey = "light", collapsed, onToggle }) => {
  const theme = THEMES[themeKey];
  const [active, setActive] = useState("dashboard");
  const [activeChild, setActiveChild] = useState(null);
  const [openMenu, setOpenMenu] = useState("users");

  const handleClick = (item) => {
    if (item.children) {
      setOpenMenu(openMenu === item.id ? null : item.id);
    } else {
      setActive(item.id);
      setActiveChild(null);
    }
  };

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col transition-[width] duration-300 ease-in-out ${
        theme.sidebar
      } ${collapsed ? "w-[76px]" : "w-[264px]"}`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`absolute -right-3 top-7 z-30 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${theme.toggleBtn}`}
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
      </button>

      {/* Logo */}
      <div
        className={`flex h-[72px] items-center ${
          collapsed ? "justify-center px-0" : "px-5"
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.logoBox}`}
        >
          <Sparkles className="h-4.5 w-4.5" strokeWidth={2.5} />
        </div>
        <span
          className={`overflow-hidden whitespace-nowrap font-semibold tracking-tight transition-all duration-300 ${
            theme.brand
          } ${
            collapsed
              ? "ml-0 w-0 text-[0px] opacity-0"
              : "ml-2.5 w-auto text-[17px] opacity-100"
          }`}
        >
          Ottertag
        </span>
      </div>

      {/* Search */}
      <div
        className={`overflow-hidden px-5 transition-all duration-300 ${
          collapsed ? "h-0 opacity-0" : "h-[52px] opacity-100"
        }`}
      >
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.searchIcon}`}
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search..."
            className={`h-9 w-full rounded-lg pl-9 pr-3 text-[13px] outline-none transition-all duration-200 ${theme.search}`}
          />
          <kbd
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] ${theme.badge} border-current/10`}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Collapsed search icon */}
      {collapsed && (
        <div className="group relative mx-auto flex h-11 w-11 items-center justify-center">
          <button
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 ${theme.item}`}
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <Tooltip label="Search" theme={theme} />
        </div>
      )}

      {/* Section label */}
      <div
        className={`px-5 pb-2 pt-4 transition-opacity duration-200 ${
          collapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        <span
          className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] ${theme.sectionLabel}`}
        >
          Menu
        </span>
      </div>

      {/* Nav */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden pb-4 ${
          collapsed ? "px-3" : "px-3"
        }`}
      >
        <ul className="space-y-0.5">
          {MENU.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={active === item.id}
              collapsed={collapsed}
              theme={theme}
              isOpen={openMenu === item.id}
              activeChild={activeChild}
              onClick={() => handleClick(item)}
              onChildClick={(childId) => {
                setActive(item.id);
                setActiveChild(childId);
              }}
            />
          ))}
        </ul>
      </nav>

      {/* Profile */}
      <div className={`border-t ${theme.divider} p-3`}>
        <div
          className={`flex items-center rounded-xl p-2 transition-colors duration-200 ${theme.item} cursor-pointer`}
        >
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-violet-500 text-[12px] font-bold text-white ring-2 ring-current/5">
              AH
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-current/10" />
          </div>
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? "ml-0 w-0 opacity-0" : "ml-3 flex-1 opacity-100"
            }`}
          >
            <p className={`truncate text-[13px] font-semibold ${theme.profileName}`}>
              Abdalhameed
            </p>
            <p className={`truncate text-[11.5px] ${theme.profileRole}`}>
              Administrator
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

/* ------------------------------------------------------------------ */
/*  Demo wrapper                                                       */
/* ------------------------------------------------------------------ */
export default function App() {
  const [themeKey, setThemeKey] = useState("light");
  const [collapsed, setCollapsed] = useState(false);
  const theme = THEMES[themeKey];

  const themeOptions = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "purple", label: "Purple", icon: Sparkles },
  ];

  return (
    <div className={`flex min-h-screen w-full font-sans ${theme.page}`}>
      <Sidebar
        themeKey={themeKey}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {/* Demo content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1
                className={`text-2xl font-bold tracking-tight ${
                  themeKey === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Dashboard
              </h1>
              <p
                className={`mt-1 text-sm ${
                  themeKey === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Welcome back — here is what is happening today.
              </p>
            </div>

            {/* Theme switcher */}
            <div
              className={`flex items-center gap-1 rounded-xl p-1 ${
                themeKey === "dark"
                  ? "bg-white/5"
                  : themeKey === "purple"
                  ? "bg-white shadow-sm"
                  : "bg-white shadow-sm"
              }`}
            >
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = themeKey === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setThemeKey(opt.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-violet-600 text-white shadow-sm"
                        : themeKey === "dark"
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Total Revenue", value: "$48,290", delta: "+12.4%" },
              { label: "Active Users", value: "2,841", delta: "+8.2%" },
              { label: "Open Tasks", value: "127", delta: "-3.1%" },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl p-5 ${
                  themeKey === "dark"
                    ? "bg-[#111114] border border-white/5"
                    : "bg-white shadow-sm border border-slate-200/60"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    themeKey === "dark" ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold tracking-tight ${
                    themeKey === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {card.value}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    card.delta.startsWith("+")
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }`}
                >
                  {card.delta} vs last week
                </p>
              </div>
            ))}
          </div>

          <div
            className={`mt-6 rounded-2xl p-6 ${
              themeKey === "dark"
                ? "bg-[#111114] border border-white/5"
                : "bg-white shadow-sm border border-slate-200/60"
            }`}
          >
            <p
              className={`text-sm ${
                themeKey === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              <strong
                className={
                  themeKey === "dark" ? "text-white" : "text-slate-900"
                }
              >
                Try it out:
              </strong>{" "}
              Click the chevron on the sidebar edge to collapse it. Hover icons
              in collapsed mode to see tooltips. Click <em>Users</em> to expand
              the submenu. Switch themes above.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
