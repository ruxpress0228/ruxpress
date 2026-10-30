import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Banknote, MessageCircle, MessageSquare, ShoppingCart, Check, AlertTriangle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../components/ui/utils";
import { PageHeader, Pager, EmptyState, LoadingState } from "../../components/page";
import { toast } from "sonner";
import { useTranslation } from "../../hooks/useTranslation";
import { resolveAdminNotificationText } from "../../utils/adminNotificationI18n";
import { api } from "../../utils/api";
import type { AdminNotification, AdminNotificationSummary, AdminNotificationType, ApiResponse } from "../../types";
import { DEFAULT_PAGE_SIZE } from "../../utils/constants";

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

function typeIcon(type: AdminNotificationType) {
  switch (type) {
    case "NEW_PURCHASE_REQUEST":
      return <ShoppingCart className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />;
    case "NEW_DEPOSIT_REPORT":
      return <Banknote className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />;
    case "NEW_INQUIRY":
      return <MessageCircle className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />;
    case "NEW_CHAT_MESSAGE":
      return <MessageSquare className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />;
    case "NEGATIVE_WALLET_AFTER_REFUND":
      return <AlertTriangle className="size-4 shrink-0 text-destructive" strokeWidth={1.5} aria-hidden />;
    default:
      return <Bell className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />;
  }
}

export default function AdminNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));

  const load = useCallback((p: number) => {
    setLoading(true);
    (api.get(`/v1/admin/notifications?limit=${DEFAULT_PAGE_SIZE}&page=${p}`) as Promise<ApiResponse<AdminNotificationSummary>>)
      .then((res) => {
        if (res?.code === 200 && res.data) {
          setItems(res.data.items);
          setUnreadCount(res.data.unreadCount);
          setTotalElements(res.data.totalElements);
        }
      })
      .catch(() => toast.error(t("admin.notification.loadError")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const handleClickItem = async (item: AdminNotification) => {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await api.patch(`/v1/admin/notifications/${item.id}/read`);
      } catch {
        // next load will correct state
      }
    }
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch("/v1/admin/notifications/read-all");
    } catch {
      toast.error(t("admin.common.processError"));
    }
  };

  return (
    <div>
      <PageHeader
        title={t("admin.notification.page.title")}
        description={t("admin.notification.page.subtitle")}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <Check className="size-4" strokeWidth={1.5} aria-hidden />
              {t("admin.notification.markAllRead")}
              <span className="rounded-full bg-foreground px-1.5 text-[10px] leading-4 text-background figure">
                {unreadCount}
              </span>
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingState label={t("admin.common.loading")} />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title={t("admin.notification.empty")} />
      ) : (
        <>
          <ul className="border-t border-border">
            {items.map((item) => {
              const text = resolveAdminNotificationText(item, t);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleClickItem(item)}
                    className="grid w-full grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-4 text-left transition-colors hover:bg-muted/60 md:gap-4"
                  >
                    <span
                      className={cn("size-1.5 rounded-full", item.isRead ? "bg-transparent" : "bg-foreground")}
                      aria-hidden
                    />
                    {typeIcon(item.type)}
                    <span className="min-w-0">
                      <span className={cn("block truncate text-sm", !item.isRead && "font-medium")}>{text.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{text.body}</span>
                    </span>
                    <span className="text-xs text-muted-foreground figure">
                      {formatRelativeTime(item.createdAt, t)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Pager
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            prevLabel={t("admin.common.prev")}
            nextLabel={t("admin.common.next")}
            leading={
              <span className="text-xs text-muted-foreground figure">
                {t("admin.notification.totalCount", { n: totalElements })}
              </span>
            }
          />
        </>
      )}
    </div>
  );
}
