import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Users, MessageSquare, FileText, TrendingUp, Trash2, Pin } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { PageHeader, Section, StatStrip, LoadingState, Field, type StatItem } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type {
  AdminInquiryListItem, Inquiry, User, Notice, PageResponse,
  UserStatus, InquiryStatus, InquiryCategory, NoticeStatus,
} from "../../types";
import { useTranslation } from "../../hooks/useTranslation";

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalInquiries: number;
  pendingInquiries: number;
  totalNotices: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  withdrawnUsers: number;
  newUsersToday: number;
}

const userStatusVariant: Record<UserStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default", SUSPENDED: "outline", WITHDRAWN: "secondary",
};
const userStatusClass: Partial<Record<UserStatus, string>> = {
  SUSPENDED: "border-destructive/30 bg-destructive/10 text-destructive",
};
const inqStatusVariant: Record<InquiryStatus, "default" | "secondary" | "outline"> = {
  PENDING: "outline", REPLIED: "default", CLOSED: "secondary",
};

function inquiryStatusKey(status: InquiryStatus) {
  return `inquiry.status.${status.toLowerCase()}` as "inquiry.status.pending" | "inquiry.status.replied" | "inquiry.status.closed";
}

function inquiryCategoryKey(category: InquiryCategory) {
  return `inquiry.category.${category.toLowerCase()}` as "inquiry.category.order" | "inquiry.category.shipping" | "inquiry.category.payment" | "inquiry.category.etc";
}

function userStatusKey(status: UserStatus) {
  return `admin.user.status.${status}` as "admin.user.status.ACTIVE" | "admin.user.status.SUSPENDED" | "admin.user.status.WITHDRAWN";
}

function noticeStatusKey(status: NoticeStatus) {
  return `admin.notice.status.${status}` as "admin.notice.status.DRAFT" | "admin.notice.status.SCHEDULED" | "admin.notice.status.PUBLISHED" | "admin.notice.status.HIDDEN";
}

type PopupKind = "users" | "inquiries" | "notices" | null;

export default function AdminDashboard() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<AdminInquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [popup, setPopup] = useState<PopupKind>(null);

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [inquiries, setInquiries] = useState<AdminInquiryListItem[]>([]);
  const [inqLoading, setInqLoading] = useState(false);
  const [inqDetail, setInqDetail] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, inqRes] = await Promise.all([
        api.get<DashboardStats>("/v1/admin/stats/dashboard"),
        api.get<PageResponse<AdminInquiryListItem>>("/v1/admin/inquiries?page=0&size=5"),
      ]);
      setStats(unwrap(statsRes));
      setRecentInquiries(unwrap(inqRes).content);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openUsers = async () => {
    setPopup("users");
    setUsersLoading(true);
    try {
      const [s, u] = await Promise.all([
        api.get<UserStats>("/v1/admin/users/stats"),
        api.get<PageResponse<User>>("/v1/admin/users?page=0&size=10"),
      ]);
      setUserStats(unwrap(s));
      setUsers(unwrap(u).content);
    } catch { toast.error(t("admin.dashboard.usersLoadError")); }
    finally { setUsersLoading(false); }
  };

  const changeUserStatus = async (id: number, status: UserStatus) => {
    try {
      await api.patch<User>(`/v1/admin/users/${id}/status`, { status });
      toast.success(t("admin.common.statusChanged"));
      openUsers();
      load();
    } catch { toast.error(t("admin.common.changeFailed")); }
  };

  const openInquiries = async () => {
    setPopup("inquiries");
    setInqDetail(null);
    setInqLoading(true);
    try {
      const res = await api.get<PageResponse<AdminInquiryListItem>>("/v1/admin/inquiries?page=0&size=20");
      setInquiries(unwrap(res).content);
    } catch { toast.error(t("admin.dashboard.inquiriesLoadError")); }
    finally { setInqLoading(false); }
  };

  const openInqDetail = async (id: number) => {
    try {
      const res = await api.get<Inquiry>(`/v1/admin/inquiries/${id}`);
      setInqDetail(unwrap(res));
      setReplyText("");
    } catch { toast.error(t("admin.dashboard.inquiryDetailError")); }
  };

  const sendReply = async () => {
    if (!inqDetail || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await api.post<Inquiry>(`/v1/admin/inquiries/${inqDetail.id}/replies`, { content: replyText.trim() });
      setInqDetail(unwrap(res));
      setReplyText("");
      toast.success(t("admin.inquiries.replyCreated"));
      openInquiries();
      load();
    } catch { toast.error(t("admin.dashboard.replyError")); }
    finally { setReplying(false); }
  };

  const openNotices = async () => {
    setPopup("notices");
    setNoticesLoading(true);
    try {
      const res = await api.get<PageResponse<Notice>>("/v1/admin/notices?page=0&size=20");
      setNotices(unwrap(res).content);
    } catch { toast.error(t("admin.notices.loadError")); }
    finally { setNoticesLoading(false); }
  };

  const deleteNotice = async (id: number) => {
    try {
      await api.delete<void>(`/v1/admin/notices/${id}`);
      toast.success(t("admin.common.deleteDone"));
      openNotices();
      load();
    } catch { toast.error(t("admin.common.deleteError")); }
  };

  const togglePin = async (id: number) => {
    try {
      await api.patch<Notice>(`/v1/admin/notices/${id}/pin`, {});
      openNotices();
    } catch { toast.error(t("admin.common.pinChangeError")); }
  };

  const closePopup = () => { setPopup(null); setInqDetail(null); };

  const userStatItems = userStats ? [
    { key: "all" as const, v: userStats.totalUsers },
    { key: "active" as const, v: userStats.activeUsers },
    { key: "suspended" as const, v: userStats.suspendedUsers },
    { key: "withdrawn" as const, v: userStats.withdrawnUsers },
    { key: "todayShort" as const, v: userStats.newUsersToday },
  ] : [];

  if (loading || !stats) {
    return (
      <div>
        <PageHeader title={t("admin.dashboard.title")} description={t("admin.dashboard.subtitle")} />
        <LoadingState label={t("admin.common.loading")} />
      </div>
    );
  }

  const statItems: StatItem[] = [
    {
      key: "users",
      label: t("admin.dashboard.totalUsers"),
      value: t("admin.common.countUnit", { n: stats.totalUsers }),
      hint: t("admin.common.todayPlus", { n: stats.newUsersToday }),
      icon: Users,
      onClick: openUsers,
    },
    {
      key: "inquiries",
      label: t("admin.dashboard.inquiries"),
      value: t("admin.common.countCase", { n: stats.totalInquiries }),
      hint: t("admin.common.pendingCount", { n: stats.pendingInquiries }),
      icon: MessageSquare,
      onClick: openInquiries,
      emphasis: stats.pendingInquiries > 0,
    },
    {
      key: "notices",
      label: t("admin.dashboard.notices"),
      value: t("admin.common.countCase", { n: stats.totalNotices }),
      icon: FileText,
      onClick: openNotices,
    },
    {
      key: "exchange",
      label: t("admin.dashboard.exchangeRate"),
      value: "—",
      hint: t("admin.dashboard.exchangeHint"),
      icon: TrendingUp,
      to: "/admin/exchange-rate",
    },
  ];

  return (
    <div>
      <PageHeader title={t("admin.dashboard.title")} description={t("admin.dashboard.subtitle")} />

      <div className="space-y-10 md:space-y-12">
        <StatStrip size="md" columns={4} items={statItems} />

        <Section
          title={t("admin.dashboard.recentInquiries")}
          description={t("admin.dashboard.recentInquiriesDesc")}
          action={
            stats.pendingInquiries > 0 ? (
              <Badge variant="outline">{t("admin.common.pendingBadge", { n: stats.pendingInquiries })}</Badge>
            ) : undefined
          }
          flush
        >
          {recentInquiries.length === 0 ? (
            <p className="border-b border-border py-8 text-sm text-muted-foreground">
              {t("admin.dashboard.noRecentInquiries")}
            </p>
          ) : (
            <ul>
              {recentInquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <button
                    type="button"
                    onClick={() => { openInquiries().then(() => openInqDetail(inquiry.id)); }}
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-4 text-left transition-colors hover:bg-muted/60 md:gap-5"
                  >
                    <Badge variant={inqStatusVariant[inquiry.status]}>{t(inquiryStatusKey(inquiry.status))}</Badge>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{inquiry.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {t(inquiryCategoryKey(inquiry.category))}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground figure">
                      {new Date(inquiry.createdAt).toLocaleDateString(dateLocale)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Dialog open={popup === "users"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.dashboard.usersPopupTitle")}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.usersPopupDesc")}</DialogDescription>
          </DialogHeader>
          {usersLoading ? <LoadingState compact label={t("admin.common.loading")} /> : (
            <>
              {userStats && (
                <StatStrip
                  size="sm"
                  columns={5}
                  items={userStatItems.map((s) => ({
                    key: s.key,
                    label: s.key === "all" ? t("admin.common.all") : t(`admin.user.stats.${s.key}` as "admin.user.stats.active"),
                    value: s.v,
                  }))}
                />
              )}
              <ul className="border-t border-border">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.nickname}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {u.email} · <span className="figure">{new Date(u.createdAt).toLocaleDateString(dateLocale)}</span>
                      </p>
                    </div>
                    <Badge variant={userStatusVariant[u.status]} className={userStatusClass[u.status]}>
                      {t(userStatusKey(u.status))}
                    </Badge>
                    <div className="flex justify-end">
                      {u.status !== "ACTIVE" && (
                        <Button size="sm" variant="outline" onClick={() => changeUserStatus(u.id, "ACTIVE")}>
                          {t("admin.user.status.ACTIVE")}
                        </Button>
                      )}
                      {u.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => changeUserStatus(u.id, "SUSPENDED")}
                        >
                          {t("admin.user.status.SUSPENDED")}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="outline" onClick={() => { closePopup(); navigate("/admin/users"); }}>
                  {t("admin.common.viewAll")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={popup === "inquiries"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{inqDetail ? t("admin.dashboard.inquiryHash", { id: inqDetail.id }) : t("admin.dashboard.inquiriesPopupTitle")}</DialogTitle>
            <DialogDescription>{inqDetail ? inqDetail.title : t("admin.dashboard.inquiriesPopupDesc")}</DialogDescription>
          </DialogHeader>

          {inqLoading ? <LoadingState compact label={t("admin.common.loading")} /> : inqDetail ? (
            <div className="space-y-5">
              <div>
                <Button variant="ghost" size="sm" onClick={() => setInqDetail(null)}>{t("admin.common.backToList")}</Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{t(inquiryCategoryKey(inqDetail.category))}</Badge>
                <Badge variant={inqStatusVariant[inqDetail.status]}>{t(inquiryStatusKey(inqDetail.status))}</Badge>
                <span className="min-w-0 truncate">
                  {inqDetail.nickname ?? t("admin.common.memberHash", { id: inqDetail.userId })}
                  {inqDetail.email && ` (${inqDetail.email})`}
                </span>
              </div>

              <p className="border border-border p-4 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {inqDetail.content}
              </p>

              {inqDetail.replies && inqDetail.replies.length > 0 && (
                <ul className="border-t border-border">
                  {inqDetail.replies.map((r) => (
                    <li key={r.id} className="border-b border-border py-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{t("admin.common.adminLabel")}</span>
                        <span className="figure">
                          {new Date(r.createdAt).toLocaleDateString(dateLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words">{r.content}</p>
                    </li>
                  ))}
                </ul>
              )}

              {inqDetail.status !== "CLOSED" && (
                <div className="border-t border-border pt-5">
                  <Field htmlFor="dashboard-reply" label={t("admin.common.reply")}>
                    <Textarea
                      id="dashboard-reply"
                      placeholder={t("admin.dashboard.replyPlaceholder")}
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={replying}
                    />
                  </Field>
                  <DialogFooter className="mt-4">
                    <Button onClick={sendReply} disabled={replying || !replyText.trim()}>
                      {replying ? t("admin.common.registering") : t("admin.common.registerReply")}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          ) : (
            <>
              {inquiries.length === 0 ? (
                <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">
                  {t("admin.dashboard.noInquiries")}
                </p>
              ) : (
                <ul className="border-t border-border">
                  {inquiries.map((inq) => (
                    <li key={inq.id}>
                      <button
                        type="button"
                        onClick={() => openInqDetail(inq.id)}
                        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3 text-left transition-colors hover:bg-muted/60"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <Badge variant="outline">{t(inquiryCategoryKey(inq.category))}</Badge>
                            <span className="min-w-0 truncate text-sm font-medium">{inq.title}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {inq.nickname ?? `#${inq.userId}`} · <span className="figure">{new Date(inq.createdAt).toLocaleDateString(dateLocale)}</span>
                          </span>
                        </span>
                        <Badge variant={inqStatusVariant[inq.status]}>{t(inquiryStatusKey(inq.status))}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { closePopup(); navigate("/admin/inquiries"); }}>
                  {t("admin.common.viewAll")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={popup === "notices"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.dashboard.noticesPopupTitle")}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.noticesPopupDesc")}</DialogDescription>
          </DialogHeader>
          {noticesLoading ? <LoadingState compact label={t("admin.common.loading")} /> : (
            <>
              {notices.length === 0 ? (
                <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">
                  {t("admin.notices.empty")}
                </p>
              ) : (
                <ul className="border-t border-border">
                  {notices.map((n) => (
                    <li
                      key={n.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          {n.isPinned && (
                            <Pin className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                          )}
                          <span className="min-w-0 truncate">{n.title}</span>
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant={n.status === "PUBLISHED" ? "default" : n.status === "DRAFT" ? "outline" : "secondary"}>
                            {t(noticeStatusKey(n.status))}
                          </Badge>
                          <span className="figure">{t("admin.dashboard.col.views")} {n.viewCount}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(n.id)}
                          title={n.isPinned ? t("admin.common.unpin") : t("admin.common.pin")}
                        >
                          {n.isPinned ? t("admin.common.unpinShort") : t("admin.common.pin")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => deleteNotice(n.id)}
                          title={t("admin.common.delete")}
                          aria-label={t("admin.common.delete")}
                        >
                          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { closePopup(); navigate("/admin/notices"); }}>
                  {t("admin.common.viewAll")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
