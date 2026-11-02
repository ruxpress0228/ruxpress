import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import { LogOut, Globe, Check, Search, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "../ui/sidebar";
import { useTranslation } from "../../hooks/useTranslation";
import { LOCALES, STORAGE_KEYS } from "../../utils/constants";
import { notifyUserAuthChange, readAuthValue } from "../../utils/api";
import AdminNotificationBell from "./AdminNotificationBell";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { ADMIN_STORAGE_KEY, initialsOf, matchNav, navGroupsFor, readAdmin } from "./adminNav";
import { Mark, Wordmark } from "../brand/BrandMark";

const RAIL_ITEM =
  "h-8 px-2 text-[13px] text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground " +
  "data-[active=true]:bg-sidebar-primary data-[active=true]:font-medium data-[active=true]:text-sidebar-primary-foreground " +
  "group-data-[collapsible=icon]:justify-center";

/**
 * The console shell: an ink rail on the left with the pages grouped by what operators do,
 * a slim bar with the breadcrumb and the ⌘K palette, and the page on paper.
 */
export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langOpen]);

  // ⌘K / Ctrl+K opens the palette from anywhere in the console.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const token = readAuthValue(STORAGE_KEYS.TOKEN);
  const admin = readAdmin();

  if (!token || !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    notifyUserAuthChange();
    navigate("/admin/login");
  };

  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  const roleLabel = isSuperAdmin ? t("nav.admin.roleSuper") : t("nav.admin.roleCounselor");
  const groups = navGroupsFor(admin.role);
  const current = matchNav(location.pathname);
  const isActive = (path: string) => current?.item.path === path;

  return (
    <SidebarProvider style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3 py-0 group-data-[collapsible=icon]:px-0">
          <Link
            to="/admin"
            className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center"
          >
            <Mark size="sm" className="bg-sidebar-primary text-sidebar-primary-foreground" />
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <Wordmark size="sm" className="text-sidebar-foreground" />
              <span className="mt-1 block text-[11px] leading-none text-sidebar-foreground/55">{t("nav.admin.label")}</span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="gap-0 py-2">
          {groups.map((group) => (
            <SidebarGroup key={group.key} className="px-2 py-1.5">
              <SidebarGroupLabel className="h-7 px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/45">
                {t(`nav.admin.group.${group.key}`)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-px">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={active} tooltip={t(item.nameKey)} className={RAIL_ITEM}>
                          <Link to={item.path} aria-current={active ? "page" : undefined}>
                            <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                            <span>{t(item.nameKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu className="gap-px">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("nav.admin.storefront")} className={RAIL_ITEM}>
                <a href="/" target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden />
                  <span>{t("nav.admin.storefront")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t("nav.admin.logout")} onClick={handleLogout} className={RAIL_ITEM}>
                <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
                <span>{t("nav.admin.logout")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md md:px-5">
          <SidebarTrigger className="size-8 text-muted-foreground hover:text-foreground" title={t("nav.menu")} aria-label={t("nav.menu")} />

          {current ? (
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
              <span className="text-muted-foreground">{t(`nav.admin.group.${current.group.key}`)}</span>
              <ChevronRight className="size-3 text-muted-foreground/60" strokeWidth={1.5} aria-hidden />
              <span className="truncate font-medium">{t(current.item.nameKey)}</span>
            </nav>
          ) : null}

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:ml-6 md:h-8 md:w-64 md:justify-start md:gap-2 md:border md:border-border md:px-2.5 md:text-xs md:hover:border-foreground/40"
            aria-label={t("nav.admin.search")}
            aria-keyshortcuts="Meta+K Control+K"
          >
            <Search className="size-4" strokeWidth={1.5} aria-hidden />
            <span className="hidden flex-1 text-left md:inline">{t("nav.admin.search")}</span>
            <kbd className="hidden border border-border px-1 py-px font-sans text-[10px] text-muted-foreground figure md:inline">⌘K</kbd>
          </button>

          <div className="flex items-center gap-0.5 md:ml-1">
            <div className="relative" ref={langRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                title={t("common.language")}
                onClick={() => setLangOpen((v) => !v)}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <Globe className="size-[18px]" strokeWidth={1.5} />
              </Button>
              {langOpen && (
                <div
                  className="absolute right-0 top-full z-[100] mt-2 min-w-[10rem] border border-border bg-popover py-1"
                  role="listbox"
                  aria-label={t("common.language")}
                >
                  {LOCALES.map((loc) => {
                    const selected = locale === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                          selected ? "text-foreground" : "text-muted-foreground",
                        )}
                        onClick={() => {
                          setLocale(loc);
                          setLangOpen(false);
                        }}
                      >
                        {t(`locale.${loc}`)}
                        {selected ? <Check className="size-3.5" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <AdminNotificationBell />
          </div>

          <div className="ml-1 flex items-center gap-2.5 border-l border-border pl-3" title={`${admin.name} · ${admin.email}`}>
            <span
              className="inline-flex size-7 shrink-0 select-none items-center justify-center bg-foreground text-[10px] font-medium tracking-[0.06em] text-background"
              aria-hidden
            >
              {initialsOf(admin.name)}
            </span>
            <span className="hidden min-w-0 lg:block">
              <span className="block max-w-[11rem] truncate text-[13px] leading-tight">{admin.name}</span>
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">{roleLabel}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} groups={groups} onLogout={handleLogout} />
    </SidebarProvider>
  );
}
