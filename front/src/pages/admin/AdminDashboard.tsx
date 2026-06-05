import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Users, MessageSquare, FileText, TrendingUp, AlertCircle,
  Send, ExternalLink, Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
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

const userStatusVariant: Record<UserStatus, "default" | "destructive" | "outline"> = {
  ACTIVE: "default", SUSPENDED: "destructive", WITHDRAWN: "outline",
};
const inqStatusVariant: Record<InquiryStatus, "default" | "secondary" | "outline"> = {
  PENDING: "secondary", REPLIED: "default", CLOSED: "outline",
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
    return <div className="py-12 text-center text-gray-500">{t("admin.common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.dashboard.title")}</h1>
        <p className="text-gray-600 mt-1">{t("admin.dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openUsers}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("admin.dashboard.totalUsers")}</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{t("admin.common.countUnit", { n: stats.totalUsers })}</div>
            <p className="text-xs text-green-600 mt-1">{t("admin.common.todayPlus", { n: stats.newUsersToday })}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openInquiries}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("admin.dashboard.inquiries")}</CardTitle>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{t("admin.common.countCase", { n: stats.totalInquiries })}</div>
            <p className="text-xs text-orange-600 mt-1">{t("admin.common.pendingCount", { n: stats.pendingInquiries })}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openNotices}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("admin.dashboard.notices")}</CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{t("admin.common.countCase", { n: stats.totalNotices })}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/exchange-rate")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("admin.dashboard.exchangeRate")}</CardTitle>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <p className="text-xs text-gray-500 mt-1">{t("admin.dashboard.exchangeHint")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("admin.dashboard.recentInquiries")}</CardTitle>
              <CardDescription>{t("admin.dashboard.recentInquiriesDesc")}</CardDescription>
            </div>
            {stats.pendingInquiries > 0 && (
              <Badge variant="destructive" className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {t("admin.common.pendingBadge", { n: stats.pendingInquiries })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInquiries.length === 0 ? (
              <p className="text-center text-gray-500 py-4">{t("admin.dashboard.noRecentInquiries")}</p>
            ) : recentInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => { openInquiries().then(() => openInqDetail(inquiry.id)); }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{inquiry.title}</span>
                    <Badge variant={inqStatusVariant[inquiry.status]}>{t(inquiryStatusKey(inquiry.status))}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {t(inquiryCategoryKey(inquiry.category))} · {new Date(inquiry.createdAt).toLocaleDateString(dateLocale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={popup === "users"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.dashboard.usersPopupTitle")}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.usersPopupDesc")}</DialogDescription>
          </DialogHeader>
          {usersLoading ? <div className="py-8 text-center text-gray-500">{t("admin.common.loading")}</div> : (
            <>
              {userStats && (
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {userStatItems.map((s) => (
                    <div key={s.key} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">
                        {s.key === "all" ? t("admin.common.all") : t(`admin.user.stats.${s.key}` as "admin.user.stats.active")}
                      </p>
                      <p className="text-lg font-bold">{s.v}</p>
                    </div>
                  ))}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.common.col.nickname")}</TableHead>
                    <TableHead>{t("admin.common.col.email")}</TableHead>
                    <TableHead>{t("admin.common.col.status")}</TableHead>
                    <TableHead>{t("admin.common.col.signupDate")}</TableHead>
                    <TableHead>{t("admin.common.col.change")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nickname}</TableCell>
                      <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                      <TableCell><Badge variant={userStatusVariant[u.status]}>{t(userStatusKey(u.status))}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.status !== "ACTIVE" && <Button size="sm" variant="outline" onClick={() => changeUserStatus(u.id, "ACTIVE")}>{t("admin.user.status.ACTIVE")}</Button>}
                          {u.status === "ACTIVE" && <Button size="sm" variant="destructive" onClick={() => changeUserStatus(u.id, "SUSPENDED")}>{t("admin.user.status.SUSPENDED")}</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => { closePopup(); navigate("/admin/users"); }}>
                  <ExternalLink className="w-3 h-3 mr-1" />{t("admin.common.viewAll")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={popup === "inquiries"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{inqDetail ? t("admin.dashboard.inquiryHash", { id: inqDetail.id }) : t("admin.dashboard.inquiriesPopupTitle")}</DialogTitle>
            <DialogDescription>{inqDetail ? inqDetail.title : t("admin.dashboard.inquiriesPopupDesc")}</DialogDescription>
          </DialogHeader>

          {inqLoading ? <div className="py-8 text-center text-gray-500">{t("admin.common.loading")}</div> : inqDetail ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setInqDetail(null)}>{t("admin.common.backToList")}</Button>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{t(inquiryCategoryKey(inqDetail.category))}</Badge>
                  <Badge variant={inqStatusVariant[inqDetail.status]}>{t(inquiryStatusKey(inqDetail.status))}</Badge>
                  <span className="text-xs text-gray-500">
                    {inqDetail.nickname ?? t("admin.common.memberHash", { id: inqDetail.userId })}
                    {inqDetail.email && ` (${inqDetail.email})`}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-gray-700">{inqDetail.content}</p>
              </div>

              {inqDetail.replies && inqDetail.replies.length > 0 && (
                <div className="space-y-2">
                  {inqDetail.replies.map((r) => (
                    <div key={r.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{t("admin.common.adminLabel")}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString(dateLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {inqDetail.status !== "CLOSED" && (
                <>
                  <Separator />
                  <Textarea
                    placeholder={t("admin.dashboard.replyPlaceholder")}
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={replying}
                  />
                  <div className="flex justify-end">
                    <Button onClick={sendReply} disabled={replying || !replyText.trim()}>
                      <Send className="w-4 h-4 mr-1" />{replying ? t("admin.common.registering") : t("admin.common.registerReply")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.common.col.category")}</TableHead>
                    <TableHead>{t("admin.common.col.title")}</TableHead>
                    <TableHead>{t("admin.common.col.author")}</TableHead>
                    <TableHead>{t("admin.common.col.status")}</TableHead>
                    <TableHead>{t("admin.common.col.createdAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-gray-500">{t("admin.dashboard.noInquiries")}</TableCell></TableRow>
                  ) : inquiries.map((inq) => (
                    <TableRow key={inq.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openInqDetail(inq.id)}>
                      <TableCell><Badge variant="outline">{t(inquiryCategoryKey(inq.category))}</Badge></TableCell>
                      <TableCell className="font-medium">{inq.title}</TableCell>
                      <TableCell className="text-sm text-gray-500">{inq.nickname ?? `#${inq.userId}`}</TableCell>
                      <TableCell><Badge variant={inqStatusVariant[inq.status]}>{t(inquiryStatusKey(inq.status))}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(inq.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => { closePopup(); navigate("/admin/inquiries"); }}>
                  <ExternalLink className="w-3 h-3 mr-1" />{t("admin.common.viewAll")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={popup === "notices"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.dashboard.noticesPopupTitle")}</DialogTitle>
            <DialogDescription>{t("admin.dashboard.noticesPopupDesc")}</DialogDescription>
          </DialogHeader>
          {noticesLoading ? <div className="py-8 text-center text-gray-500">{t("admin.common.loading")}</div> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.common.col.title")}</TableHead>
                    <TableHead>{t("admin.common.col.status")}</TableHead>
                    <TableHead>{t("admin.dashboard.col.views")}</TableHead>
                    <TableHead>{t("admin.common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500">{t("admin.notices.empty")}</TableCell></TableRow>
                  ) : notices.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">
                        {n.isPinned && <span className="text-yellow-600 mr-1">📌</span>}
                        {n.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={n.status === "PUBLISHED" ? "default" : n.status === "DRAFT" ? "outline" : "secondary"}>
                          {t(noticeStatusKey(n.status))}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{n.viewCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => togglePin(n.id)} title={n.isPinned ? t("admin.common.unpin") : t("admin.common.pin")}>
                            {n.isPinned ? t("admin.common.unpinShort") : t("admin.common.pin")}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteNotice(n.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => { closePopup(); navigate("/admin/notices"); }}>
                  <ExternalLink className="w-3 h-3 mr-1" />{t("admin.common.viewAll")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
