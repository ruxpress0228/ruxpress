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
  UserStatus, InquiryStatus, InquiryCategory,
} from "../../types";

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

const statusVariant: Record<UserStatus, "default" | "destructive" | "outline"> = {
  ACTIVE: "default", SUSPENDED: "destructive", WITHDRAWN: "outline",
};
const statusLabel: Record<UserStatus, string> = {
  ACTIVE: "정상", SUSPENDED: "정지", WITHDRAWN: "탈퇴",
};
const inqStatusLabel: Record<InquiryStatus, string> = {
  PENDING: "답변대기", REPLIED: "답변완료", CLOSED: "종료",
};
const inqStatusVariant: Record<InquiryStatus, "default" | "secondary" | "outline"> = {
  PENDING: "secondary", REPLIED: "default", CLOSED: "outline",
};
const catLabel: Record<InquiryCategory, string> = {
  ORDER: "주문", SHIPPING: "배송", PAYMENT: "결제", ETC: "기타",
};

type PopupKind = "users" | "inquiries" | "notices" | null;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<AdminInquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [popup, setPopup] = useState<PopupKind>(null);

  // --- users popup ---
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // --- inquiries popup ---
  const [inquiries, setInquiries] = useState<AdminInquiryListItem[]>([]);
  const [inqLoading, setInqLoading] = useState(false);
  const [inqDetail, setInqDetail] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // --- notices popup ---
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

  // popup loaders
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
    } catch { toast.error("회원 정보를 불러오지 못했습니다"); }
    finally { setUsersLoading(false); }
  };

  const changeUserStatus = async (id: number, status: UserStatus) => {
    try {
      await api.patch<User>(`/v1/admin/users/${id}/status`, { status });
      toast.success("상태가 변경되었습니다");
      openUsers();
      load();
    } catch { toast.error("변경 실패"); }
  };

  const openInquiries = async () => {
    setPopup("inquiries");
    setInqDetail(null);
    setInqLoading(true);
    try {
      const res = await api.get<PageResponse<AdminInquiryListItem>>("/v1/admin/inquiries?page=0&size=20");
      setInquiries(unwrap(res).content);
    } catch { toast.error("문의 목록을 불러오지 못했습니다"); }
    finally { setInqLoading(false); }
  };

  const openInqDetail = async (id: number) => {
    try {
      const res = await api.get<Inquiry>(`/v1/admin/inquiries/${id}`);
      setInqDetail(unwrap(res));
      setReplyText("");
    } catch { toast.error("상세 조회 실패"); }
  };

  const sendReply = async () => {
    if (!inqDetail || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await api.post<Inquiry>(`/v1/admin/inquiries/${inqDetail.id}/replies`, { content: replyText.trim() });
      setInqDetail(unwrap(res));
      setReplyText("");
      toast.success("답변이 등록되었습니다");
      openInquiries();
      load();
    } catch { toast.error("답변 등록 실패"); }
    finally { setReplying(false); }
  };

  const openNotices = async () => {
    setPopup("notices");
    setNoticesLoading(true);
    try {
      const res = await api.get<PageResponse<Notice>>("/v1/admin/notices?page=0&size=20");
      setNotices(unwrap(res).content);
    } catch { toast.error("공지사항을 불러오지 못했습니다"); }
    finally { setNoticesLoading(false); }
  };

  const deleteNotice = async (id: number) => {
    try {
      await api.delete<void>(`/v1/admin/notices/${id}`);
      toast.success("삭제되었습니다");
      openNotices();
      load();
    } catch { toast.error("삭제 실패"); }
  };

  const togglePin = async (id: number) => {
    try {
      await api.patch<Notice>(`/v1/admin/notices/${id}/pin`, {});
      openNotices();
    } catch { toast.error("고정 변경 실패"); }
  };

  const closePopup = () => { setPopup(null); setInqDetail(null); };

  if (loading || !stats) {
    return <div className="py-12 text-center text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">Ruxpress 관리자 현황 — 카드를 클릭하면 상세를 볼 수 있습니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openUsers}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 회원</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}명</div>
            <p className="text-xs text-green-600 mt-1">오늘 +{stats.newUsersToday}명</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openInquiries}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">1:1 문의</CardTitle>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalInquiries}건</div>
            <p className="text-xs text-orange-600 mt-1">답변 대기 {stats.pendingInquiries}건</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openNotices}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">공지사항</CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalNotices}건</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/exchange-rate")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">현재 환율</CardTitle>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <p className="text-xs text-gray-500 mt-1">클릭하여 환율 설정</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent inquiries inline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>최근 문의</CardTitle>
              <CardDescription>최근 등록된 1:1 문의 목록</CardDescription>
            </div>
            {stats.pendingInquiries > 0 && (
              <Badge variant="destructive" className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {stats.pendingInquiries}건 대기중
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInquiries.length === 0 ? (
              <p className="text-center text-gray-500 py-4">최근 문의가 없습니다</p>
            ) : recentInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => { openInquiries().then(() => openInqDetail(inquiry.id)); }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{inquiry.title}</span>
                    <Badge variant={inqStatusVariant[inquiry.status]}>{inqStatusLabel[inquiry.status]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {catLabel[inquiry.category]} · {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Users Popup ─────────────────────────────── */}
      <Dialog open={popup === "users"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원 현황</DialogTitle>
            <DialogDescription>최근 회원 목록 및 상태 관리</DialogDescription>
          </DialogHeader>
          {usersLoading ? <div className="py-8 text-center text-gray-500">불러오는 중...</div> : (
            <>
              {userStats && (
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {[
                    { l: "전체", v: userStats.totalUsers },
                    { l: "활성", v: userStats.activeUsers },
                    { l: "정지", v: userStats.suspendedUsers },
                    { l: "탈퇴", v: userStats.withdrawnUsers },
                    { l: "오늘", v: userStats.newUsersToday },
                  ].map((s) => (
                    <div key={s.l} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">{s.l}</p>
                      <p className="text-lg font-bold">{s.v}</p>
                    </div>
                  ))}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>닉네임</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>변경</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nickname}</TableCell>
                      <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                      <TableCell><Badge variant={statusVariant[u.status]}>{statusLabel[u.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.status !== "ACTIVE" && <Button size="sm" variant="outline" onClick={() => changeUserStatus(u.id, "ACTIVE")}>정상</Button>}
                          {u.status === "ACTIVE" && <Button size="sm" variant="destructive" onClick={() => changeUserStatus(u.id, "SUSPENDED")}>정지</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => { closePopup(); navigate("/admin/users"); }}>
                  <ExternalLink className="w-3 h-3 mr-1" />전체 보기
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Inquiries Popup ────────────────────────── */}
      <Dialog open={popup === "inquiries"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{inqDetail ? `문의 #${inqDetail.id}` : "문의 현황"}</DialogTitle>
            <DialogDescription>{inqDetail ? inqDetail.title : "답변 대기 문의를 확인하고 바로 답변할 수 있습니다"}</DialogDescription>
          </DialogHeader>

          {inqLoading ? <div className="py-8 text-center text-gray-500">불러오는 중...</div> : inqDetail ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setInqDetail(null)}>← 목록으로</Button>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{catLabel[inqDetail.category]}</Badge>
                  <Badge variant={inqStatusVariant[inqDetail.status]}>{inqStatusLabel[inqDetail.status]}</Badge>
                  <span className="text-xs text-gray-500">회원 #{inqDetail.userId}</span>
                </div>
                <p className="whitespace-pre-wrap text-gray-700">{inqDetail.content}</p>
              </div>

              {inqDetail.replies && inqDetail.replies.length > 0 && (
                <div className="space-y-2">
                  {inqDetail.replies.map((r) => (
                    <div key={r.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>관리자</span>
                        <span>{new Date(r.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
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
                    placeholder="답변을 입력하세요"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={replying}
                  />
                  <div className="flex justify-end">
                    <Button onClick={sendReply} disabled={replying || !replyText.trim()}>
                      <Send className="w-4 h-4 mr-1" />{replying ? "등록 중..." : "답변 등록"}
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
                    <TableHead>카테고리</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500">문의가 없습니다</TableCell></TableRow>
                  ) : inquiries.map((inq) => (
                    <TableRow key={inq.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openInqDetail(inq.id)}>
                      <TableCell><Badge variant="outline">{catLabel[inq.category]}</Badge></TableCell>
                      <TableCell className="font-medium">{inq.title}</TableCell>
                      <TableCell><Badge variant={inqStatusVariant[inq.status]}>{inqStatusLabel[inq.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(inq.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => { closePopup(); navigate("/admin/inquiries"); }}>
                  <ExternalLink className="w-3 h-3 mr-1" />전체 보기
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Notices Popup ──────────────────────────── */}
      <Dialog open={popup === "notices"} onOpenChange={(o) => { if (!o) closePopup(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>공지사항 관리</DialogTitle>
            <DialogDescription>공지 목록 확인 및 고정/삭제</DialogDescription>
          </DialogHeader>
          {noticesLoading ? <div className="py-8 text-center text-gray-500">불러오는 중...</div> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>조회</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500">공지사항이 없습니다</TableCell></TableRow>
                  ) : notices.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">
                        {n.isPinned && <span className="text-yellow-600 mr-1">📌</span>}
                        {n.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={n.status === "PUBLISHED" ? "default" : n.status === "DRAFT" ? "outline" : "secondary"}>
                          {n.status === "PUBLISHED" ? "공개" : n.status === "DRAFT" ? "초안" : n.status === "SCHEDULED" ? "예약" : "숨김"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{n.viewCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => togglePin(n.id)} title={n.isPinned ? "고정 해제" : "고정"}>
                            {n.isPinned ? "해제" : "고정"}
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
                  <ExternalLink className="w-3 h-3 mr-1" />전체 보기
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
