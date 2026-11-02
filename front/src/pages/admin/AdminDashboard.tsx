import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronRight, ExternalLink, Trash2, Pin } from "lucide-react";
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
import { cn } from "../../components/ui/utils";
import { Section, SectionLink, StatStrip, LoadingState, Field } from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { purchaseStatusBadgeClass } from "../../utils/purchaseStatusStyle";
import { formatRateToKrwForInput, type CurrentExchangeRates } from "../../utils/exchange";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { canAccess, readAdmin } from "../../components/layouts/adminNav";
import type {
  AdminInquiryListItem, Inquiry, User, Notice, PageResponse, PurchaseRequest,
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

type QueueItem = {
  key: string;
  label: string;
  value: number | null;
  /** Where the number leads (the page name). */
  hint: string;
  to?: string;
  onClick?: () => void;
};

const QUEUE_COLS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

/** Fetches a page but never throws: the dashboard still opens when one counter is unavailable (e.g. for a counselor). */
async function quietPage<T>(path: string): Promise<PageResponse<T> | null> {
  try {
    return unwrap(await api.get<PageResponse<T>>(path));
  } catch {
    return null;
  }
}

/**
 * The operator's desk. Opens with one sentence about today's work, then the queue
 * (what needs a hand), the latest inquiries and requests, today's rates and shortcuts.
 */
export default function AdminDashboard() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
  const navigate = useNavigate();
  const { getCurrentExchangeRates } = useExchangeRate();
  const role = readAdmin()?.role ?? "COUNSELOR";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<AdminInquiryListItem[]>([]);
  const [recentRequests, setRecentRequests] = useState<PurchaseRequest[]>([]);
  const [newRequests, setNewRequests] = useState<number | null>(null);
  const [pendingDeposits, setPendingDeposits] = useState<number | null>(null);
  const [rates, setRates] = useState<CurrentExchangeRates | null>(null);
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

  const canSeeRequests = canAccess(role, "/admin/purchase-requests");
  const canSeeUsers = canAccess(role, "/admin/users");

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

    // Secondary counters load on their own so one missing permission does not blank the desk.
    const [requests, requested, deposits] = await Promise.all([
      canSeeRequests ? quietPage<PurchaseRequest>("/v1/admin/purchases?page=0&size=5") : Promise.resolve(null),
      canSeeRequests ? quietPage<PurchaseRequest>("/v1/admin/purchases?page=0&size=1&status=REQUESTED") : Promise.resolve(null),
      quietPage<unknown>("/v1/admin/bank-transfers?page=0&size=1&status=PENDING"),
    ]);
    setRecentRequests(requests?.content ?? []);
    setNewRequests(requested ? requested.totalElements : null);
    setPendingDeposits(deposits ? deposits.totalElements : null);
    getCurrentExchangeRates().then(setRates).catch(() => setRates(null));
  }, [canSeeRequests, getCurrentExchangeRates]);

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
    return <LoadingState label={t("admin.common.loading")} />;
  }

  const today = new Date().toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric" });
  const todo = stats.pendingInquiries + (newRequests ?? 0) + (pendingDeposits ?? 0);
  const fmt = (n: number) => n.toLocaleString(dateLocale);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(dateLocale, { month: "short", day: "numeric" });

  const queue: QueueItem[] = [
    { key: "inquiries", label: t("admin.dashboard.queue.inquiries"), value: stats.pendingInquiries, hint: t("nav.admin.inquiries"), onClick: openInquiries },
    ...(canSeeRequests
      ? [{ key: "requests", label: t("admin.dashboard.queue.requests"), value: newRequests, hint: t("nav.admin.purchaseRequests"), to: "/admin/purchase-requests?status=REQUESTED" }]
      : []),
    { key: "deposits", label: t("admin.dashboard.queue.deposits"), value: pendingDeposits, hint: t("nav.admin.bankTransfers"), to: "/admin/bank-transfers" },
    ...(canSeeUsers
      ? [{ key: "signups", label: t("admin.dashboard.queue.signups"), value: stats.newUsersToday, hint: t("nav.admin.users"), onClick: openUsers }]
      : []),
  ];

  const shortcuts = [
    { key: "product", label: t("admin.dashboard.shortcut.newProduct"), to: "/admin/products" },
    { key: "notice", label: t("admin.dashboard.shortcut.newNotice"), to: "/admin/notices" },
    { key: "rates", label: t("nav.admin.exchangeRate"), to: "/admin/exchange-rate" },
    { key: "site", label: t("nav.admin.site"), to: "/admin/site" },
    { key: "admins", label: t("nav.admin.admins"), to: "/admin/admins" },
  ].filter((s) => canAccess(role, s.to));

  const totals = [
    { key: "users", label: t("admin.dashboard.totalUsers"), value: fmt(stats.totalUsers), onClick: canSeeUsers ? openUsers : undefined },
    { key: "inquiries", label: t("admin.dashboard.inquiries"), value: fmt(stats.totalInquiries), onClick: openInquiries },
    { key: "notices", label: t("admin.dashboard.notices"), value: fmt(stats.totalNotices), onClick: canAccess(role, "/admin/notices") ? openNotices : undefined },
  ];

  const queueCell = (item: QueueItem) => {
    const empty = item.value === 0 || item.value === null;
    const body = (
      <>
        <span className="block text-[13px] text-muted-foreground">{item.label}</span>
        <span className={cn("mt-3 block text-4xl font-light leading-none figure md:text-5xl", empty && "text-muted-foreground/40")}>
          {item.value === null ? "—" : fmt(item.value)}
        </span>
        <span className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          {item.hint}
          <ChevronRight className="size-3" strokeWidth={1.5} aria-hidden />
        </span>
      </>
    );
    const cls = "block h-full w-full p-4 text-left transition-colors hover:bg-muted/60 md:p-5";
    return item.to ? (
      <Link to={item.to} className={cls}>{body}</Link>
    ) : (
      <button type="button" onClick={item.onClick} className={cls}>{body}</button>
    );
  };

  return (
    <div className="space-y-12 md:space-y-14">
      {/* The desk opens with a sentence, not a title */}
      <header>
        <p className="text-[13px] text-muted-foreground figure">{today}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-light leading-tight tracking-[-0.01em] md:text-4xl">
          {todo > 0 ? t("admin.dashboard.queueSentence", { n: todo }) : t("admin.dashboard.queueEmpty")}
        </h1>
        <ul className={cn("mt-8 grid grid-cols-2 border-l border-t border-border", QUEUE_COLS[queue.length] ?? "md:grid-cols-4")}>
          {queue.map((item) => (
            <li key={item.key} className="border-b border-r border-border">
              {queueCell(item)}
            </li>
          ))}
        </ul>
      </header>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="min-w-0 space-y-12">
          <Section
            title={t("admin.dashboard.recentInquiries")}
            action={<SectionLink to="/admin/inquiries">{t("admin.common.viewAll")}</SectionLink>}
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
                      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3.5 text-left transition-colors hover:bg-muted/60 md:gap-5"
                    >
                      <Badge variant={inqStatusVariant[inquiry.status]}>{t(inquiryStatusKey(inquiry.status))}</Badge>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{inquiry.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {t(inquiryCategoryKey(inquiry.category))}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground figure">{fmtDate(inquiry.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {canSeeRequests ? (
            <Section
              title={t("admin.dashboard.recentRequests")}
              action={<SectionLink to="/admin/purchase-requests">{t("admin.common.viewAll")}</SectionLink>}
              flush
            >
              {recentRequests.length === 0 ? (
                <p className="border-b border-border py-8 text-sm text-muted-foreground">
                  {t("admin.dashboard.noRecentRequests")}
                </p>
              ) : (
                <ul>
                  {recentRequests.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/admin/purchase-requests/${r.id}`}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3.5 transition-colors hover:bg-muted/60 md:gap-5"
                      >
                        <Badge className={cn("px-2 py-0.5 text-[10px] font-medium", purchaseStatusBadgeClass(r.status))}>
                          {t(`purchase.status.${r.status}`)}
                        </Badge>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{r.requestName}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground figure">
                            {r.requestNumber} · {fmtDate(r.createdAt)}
                          </span>
                        </span>
                        <span className="text-sm figure">
                          {r.totalAmountKrw != null ? `₩${fmt(r.totalAmountKrw)}` : "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          ) : null}
        </div>

        <div className="min-w-0 space-y-12">
          <Section
            title={t("admin.dashboard.rates")}
            action={canAccess(role, "/admin/exchange-rate") ? <SectionLink to="/admin/exchange-rate">{t("nav.admin.exchangeRate")}</SectionLink> : undefined}
            flush
          >
            {rates && rates.quotes.length > 0 ? (
              <>
                <ul>
                  {rates.quotes.map((q) => (
                    <li key={q.currency} className="flex items-baseline justify-between gap-4 border-b border-border py-3">
                      <span className="text-sm">1 {q.currency}</span>
                      <span className="text-right">
                        <span className="text-xl font-light figure">{formatRateToKrwForInput(q.rateToKrw)}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">KRW</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {rates.fetchedAt ? (
                  <p className="mt-3 text-xs text-muted-foreground figure">
                    {t("admin.dashboard.ratesUpdated", {
                      time: new Date(rates.fetchedAt).toLocaleString(dateLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
                    })}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="border-b border-border py-6 text-sm text-muted-foreground">{t("admin.dashboard.ratesEmpty")}</p>
            )}
          </Section>

          <Section title={t("admin.dashboard.shortcuts")} flush>
            <ul>
              {shortcuts.map((s) => (
                <li key={s.key}>
                  <Link
                    to={s.to}
                    className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm transition-colors hover:bg-muted/60"
                  >
                    {s.label}
                    <ChevronRight className="size-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm transition-colors hover:bg-muted/60"
                >
                  {t("nav.admin.storefront")}
                  <ExternalLink className="size-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                </a>
              </li>
            </ul>
          </Section>

          <Section title={t("admin.dashboard.totals")} flush>
            <ul>
              {totals.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={row.onClick}
                    disabled={!row.onClick}
                    className="flex w-full items-baseline justify-between gap-3 border-b border-border py-3 text-left text-sm transition-colors enabled:hover:bg-muted/60 disabled:cursor-default"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="figure">{row.value}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        </div>
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
