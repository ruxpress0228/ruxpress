import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Banknote, MessageCircle, MessageSquare, ShoppingCart, Check, AlertTriangle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "../../hooks/useTranslation";
import { resolveAdminNotificationText } from "../../utils/adminNotificationI18n";
import { api } from "../../utils/api";
import type { AdminNotification, AdminNotificationSummary, AdminNotificationType, ApiResponse } from "../../types";

const PAGE_SIZE = 20;

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
      return <ShoppingCart className="w-4 h-4 text-blue-600" />;
    case "NEW_DEPOSIT_REPORT":
      return <Banknote className="w-4 h-4 text-green-600" />;
    case "NEW_INQUIRY":
      return <MessageCircle className="w-4 h-4 text-purple-600" />;
    case "NEW_CHAT_MESSAGE":
      return <MessageSquare className="w-4 h-4 text-orange-500" />;
    case "NEGATIVE_WALLET_AFTER_REFUND":
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

function typeBgClass(type: AdminNotificationType): string {
  switch (type) {
    case "NEW_PURCHASE_REQUEST": return "bg-blue-50";
    case "NEW_DEPOSIT_REPORT": return "bg-green-50";
    case "NEW_INQUIRY": return "bg-purple-50";
    case "NEW_CHAT_MESSAGE": return "bg-orange-50";
    case "NEGATIVE_WALLET_AFTER_REFUND": return "bg-red-50";
    default: return "bg-gray-50";
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

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  const load = useCallback((p: number) => {
    setLoading(true);
    (api.get(`/v1/admin/notifications?limit=${PAGE_SIZE}&page=${p}`) as Promise<ApiResponse<AdminNotificationSummary>>)
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
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.notification.page.title")}
          </h1>
          <p className="text-gray-600 mt-1">{t("admin.notification.page.subtitle")}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-1.5" />
            {t("admin.notification.markAllRead")}
            <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-500 text-sm">{t("admin.common.loading")}</div>
          ) : items.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <Bell className="w-10 h-10" />
              <p className="text-sm">{t("admin.notification.empty")}</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {items.map((item) => {
                  const text = resolveAdminNotificationText(item, t);
                  return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleClickItem(item)}
                      className={`w-full text-left px-5 py-4 hover:bg-gray-50/80 transition-colors ${
                        item.isRead ? "" : "bg-blue-50/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${typeBgClass(item.type)}`}>
                          {typeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${item.isRead ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                              {text.title}
                            </p>
                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{text.body}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 flex-shrink-0 pt-0.5">
                          {formatRelativeTime(item.createdAt, t)}
                        </p>
                      </div>
                    </button>
                  </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-xs text-gray-400">{t("admin.notification.totalCount", { n: totalElements })}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t("admin.common.prev")}
                  </Button>
                  <span className="text-sm text-gray-500 tabular-nums">
                    {t("admin.common.pageOf", { page: page + 1, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("admin.common.next")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
