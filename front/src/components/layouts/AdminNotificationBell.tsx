import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, Check, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslation } from "../../hooks/useTranslation";
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
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={t("admin.notification.title")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="w-5 h-5" />
        {summary.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {badgeText}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("admin.notification.title")}
            </h3>
            {summary.unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-700"
                onClick={handleMarkAllRead}
              >
                <Check className="w-3 h-3 mr-1" />
                {t("admin.notification.markAllRead")}
              </Button>
            )}
          </div>

          {/* 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {summary.items.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {t("admin.notification.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {summary.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleClickItem(item)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        item.isRead ? "" : "bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!item.isRead && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {item.body}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatRelativeTime(item.createdAt, t)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 전체 보기 */}
          <div className="border-t border-gray-200">
            <Link
              to="/admin/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 w-full py-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-gray-50 transition-colors"
            >
              {t("admin.notification.viewAll")}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
