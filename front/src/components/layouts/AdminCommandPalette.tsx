import { useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";
import { ExternalLink, Globe, LogOut } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { useTranslation } from "../../hooks/useTranslation";
import { LOCALES } from "../../utils/constants";
import type { AdminNavGroup } from "./adminNav";

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: AdminNavGroup[];
  onLogout: () => void;
}

/** ⌘K palette: every page the operator may open, the storefront, the languages, and sign-out. */
export function AdminCommandPalette({ open, onOpenChange, groups, onLogout }: AdminCommandPaletteProps) {
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const Row = ({ icon: Icon, label, hint }: { icon: LucideIcon; label: string; hint?: string }) => (
    <>
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint ? <span className="shrink-0 text-[11px] text-muted-foreground">{hint}</span> : null}
    </>
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t("nav.admin.search")} description={t("admin.palette.hint")}>
      <CommandInput placeholder={t("nav.admin.search")} />
      <CommandList className="max-h-[min(60vh,420px)] py-1">
        <CommandEmpty>{t("admin.palette.empty")}</CommandEmpty>
        <CommandGroup heading={t("admin.palette.pages")}>
          {groups.flatMap((group) =>
            group.items.map((item) => (
              <CommandItem
                key={item.path}
                value={`${t(item.nameKey)} ${t(`nav.admin.group.${group.key}`)} ${item.path}`}
                onSelect={() => go(item.path)}
                className="gap-3 text-[13px]"
              >
                <Row icon={item.icon} label={t(item.nameKey)} hint={t(`nav.admin.group.${group.key}`)} />
              </CommandItem>
            )),
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("admin.palette.actions")}>
          <CommandItem
            value={`${t("nav.admin.storefront")} storefront store`}
            onSelect={() => {
              onOpenChange(false);
              window.open("/", "_blank", "noopener");
            }}
            className="gap-3 text-[13px]"
          >
            <Row icon={ExternalLink} label={t("nav.admin.storefront")} />
          </CommandItem>
          {LOCALES.filter((loc) => loc !== locale).map((loc) => (
            <CommandItem
              key={loc}
              value={`${t("admin.palette.switchTo", { lang: t(`locale.${loc}`) })} language locale ${loc}`}
              onSelect={() => {
                onOpenChange(false);
                setLocale(loc);
              }}
              className="gap-3 text-[13px]"
            >
              <Row icon={Globe} label={t("admin.palette.switchTo", { lang: t(`locale.${loc}`) })} />
            </CommandItem>
          ))}
          <CommandItem
            value={`${t("nav.admin.logout")} logout sign out`}
            onSelect={() => {
              onOpenChange(false);
              onLogout();
            }}
            className="gap-3 text-[13px]"
          >
            <Row icon={LogOut} label={t("nav.admin.logout")} />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
