import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { resolveAdminNotificationText } from "../../utils/adminNotificationI18n";
import { api } from "../../utils/api";
import type {
  AdminNotification,
  AdminNotificationSummary,
  ApiResponse,
} from "../../types";

const POLL_INTERVAL_MS = 15_000;
const ITEMS_LIMIT = 20;

function formatRelativeTime(iso: string, t: (key: string) => string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return t("admin.notification.time.justNow");
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}${t("admin.notification.time.minutesAgo")}`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}${t("admin.notification.time.hoursAgo")}`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}${t("admin.notification.time.daysAgo")}`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminNotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AdminNotificationSummary>({
    unreadCount: 0,
    totalElements: 0,
    items: [],
  });
  const [open, setOpen] = useState(false);
  const cancelledRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 폴링
  const fetchSummary = useCallback(async () => {
    try {
      const res: ApiResponse<AdminNotificationSummary> = await api.get(
        `/v1/admin/notifications?limit=${ITEMS_LIMIT}`,
      );
      if (cancelledRef.current) return;
      if (res?.code === 200 && res.data) {
        setSummary(res.data);
      }
    } catch {
      // 조용히 실패 — 다음 주기에 재시도
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    fetchSummary();
    const interval = window.setInterval(fetchSummary, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      window.clearInterval(interval);
    };
  }, [fetchSummary]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleClickItem = async (item: AdminNotification) => {
    setOpen(false);
    if (!item.isRead) {
      setSummary((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        items: prev.items.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      }));
      try {
        await api.patch(`/v1/admin/notifications/${item.id}/read`);
      } catch {
        // 다음 폴링에서 보정
      }
    }
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (summary.unreadCount === 0) return;
    setSummary((prev) => ({
      ...prev,
      unreadCount: 0,
      items: prev.items.map((n) => ({ ...n, isRead: true })),
    }));
    try {
      await api.patch("/v1/admin/notifications/read-all");
    } catch {
      // 무시
    }
  };

  const badgeText = summary.unreadCount > 99 ? "99+" : String(summary.unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        title={t("admin.notification.title")}
        aria-label={t("admin.notification.title")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-[18px]" strokeWidth={1.5} aria-hidden />
        {summary.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] leading-none text-background figure">
            {badgeText}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label={t("admin.notification.title")}
          className="absolute right-0 top-full z-[100] mt-2 w-80 max-w-[calc(100vw-2rem)] border border-border bg-popover"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">{t("admin.notification.title")}</h3>
            {summary.unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {t("admin.notification.markAllRead")}
              </button>
            )}
          </div>

          {/* 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {summary.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("admin.notification.empty")}
              </p>
            ) : (
              <ul>
                {summary.items.map((item) => {
                  const text = resolveAdminNotificationText(item, t);
                  return (
                    <li key={item.id} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => handleClickItem(item)}
                        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                      >
                        <span
                          className={cn(
                            "mt-[7px] size-1.5 rounded-full",
                            item.isRead ? "bg-transparent" : "bg-foreground",
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className={cn("block truncate text-sm", !item.isRead && "font-medium")}>
                            {text.title}
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{text.body}</span>
                        </span>
                        <span className="pt-0.5 text-[11px] text-muted-foreground figure">
                          {formatRelativeTime(item.createdAt, t)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 전체 보기 */}
          <div className="border-t border-border p-1">
            <Button asChild variant="ghost" className="w-full">
              <Link to="/admin/notifications" onClick={() => setOpen(false)}>
                {t("admin.notification.viewAll")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
