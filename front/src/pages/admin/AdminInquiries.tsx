import { useCallback, useEffect, useState } from "react";
import { Search, Send, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { AdminInquiryListItem, Inquiry, InquiryStatus, InquiryCategory, PageResponse } from "../../types";

interface TemplateItem { id: number; key: string; value: string; }

const statusLabels: Record<InquiryStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  PENDING: { label: "답변대기", variant: "secondary" },
  REPLIED: { label: "답변완료", variant: "default" },
  CLOSED: { label: "종료", variant: "outline" },
};

const categoryLabels: Record<InquiryCategory, string> = {
  ORDER: "주문",
  SHIPPING: "배송",
  PAYMENT: "결제",
  ETC: "기타",
};

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

export default function AdminInquiries() {
  const [items, setItems] = useState<AdminInquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Inquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  const loadList = useCallback((p: number, s: number) => {
    setLoading(true);
    api
      .get<PageResponse<AdminInquiryListItem>>(`/v1/admin/inquiries?page=${p}&size=${s}`)
      .then((res) => {
        const data = unwrap(res);
        setItems(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => { toast.error("문의 목록을 불러오지 못했습니다"); setItems([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadList(page, size); }, [page, size, loadList]);

  useEffect(() => {
    api.get<Array<{ id: number; key: string; value: string }>>("/v1/admin/settings/templates")
      .then((res) => setTemplates(unwrap(res)))
      .catch(() => {});
  }, []);

  const openDetail = async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    setReplyContent("");
    setEditingReplyId(null);
    setDialogOpen(true);
    try {
      const res = await api.get<Inquiry>(`/v1/admin/inquiries/${id}`);
      setDetail(unwrap(res));
    } catch {
      toast.error("문의 상세를 불러오지 못했습니다");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const sendReply = async () => {
    if (selectedId == null || !replyContent.trim()) {
      toast.error("답변 내용을 입력해주세요"); return;
    }
    setReplySubmitting(true);
    try {
      const res = await api.post<Inquiry>(`/v1/admin/inquiries/${selectedId}/replies`, { content: replyContent.trim() });
      setDetail(unwrap(res));
      setReplyContent("");
      toast.success("답변이 등록되었습니다");
      loadList(page, size);
    } catch { toast.error("답변 등록에 실패했습니다"); }
    finally { setReplySubmitting(false); }
  };

  const updateReply = async (replyId: number) => {
    if (selectedId == null || !editContent.trim()) return;
    try {
      const res = await api.put<Inquiry>(`/v1/admin/inquiries/${selectedId}/replies/${replyId}`, { content: editContent.trim() });
      setDetail(unwrap(res));
      setEditingReplyId(null);
      toast.success("답변이 수정되었습니다");
    } catch { toast.error("수정에 실패했습니다"); }
  };

  const deleteReply = async (replyId: number) => {
    if (selectedId == null) return;
    try {
      const res = await api.delete<Inquiry>(`/v1/admin/inquiries/${selectedId}/replies/${replyId}`);
      setDetail(unwrap(res));
      toast.success("답변이 삭제되었습니다");
      loadList(page, size);
    } catch { toast.error("삭제에 실패했습니다"); }
  };

  const changeStatus = async (newStatus: InquiryStatus) => {
    if (selectedId == null) return;
    try {
      const res = await api.patch<Inquiry>(`/v1/admin/inquiries/${selectedId}/status`, { status: newStatus });
      setDetail(unwrap(res));
      toast.success("상태가 변경되었습니다");
      loadList(page, size);
    } catch { toast.error("상태 변경에 실패했습니다"); }
  };

  const filtered = search.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || String(i.id).includes(search))
    : items;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">문의 관리</h1>
        <p className="text-gray-600 mt-1">고객 문의에 답변합니다</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="제목, 문의번호 검색" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">불러오는 중...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>카테고리</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">등록된 문의가 없습니다</TableCell></TableRow>
                  ) : filtered.map((inq) => (
                    <TableRow key={inq.id}>
                      <TableCell><Badge variant="outline">{categoryLabels[inq.category]}</Badge></TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{inq.title}</TableCell>
                      <TableCell className="text-sm text-gray-500">{inq.nickname ?? `회원 #${inq.userId}`}{inq.email && <span className="block text-xs text-gray-400">{inq.email}</span>}</TableCell>
                      <TableCell><Badge variant={statusLabels[inq.status].variant}>{statusLabels[inq.status].label}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(inq.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openDetail(inq.id)}>
                          {inq.status === "PENDING" ? "답변하기" : "보기"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between p-4 border-t flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>페이지당</span>
                  <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}>
                    <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}건</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>이전</Button>
                  <span className="text-sm text-gray-500">{page + 1} / {Math.max(1, totalPages)}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>다음</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setSelectedId(null); setDetail(null); setEditingReplyId(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
            <DialogDescription>
              {detail && new Date(detail.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </DialogDescription>
          </DialogHeader>
          {detailLoading && <div className="py-8 text-center text-gray-500">불러오는 중...</div>}
          {!detailLoading && detail && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="outline">{categoryLabels[detail.category]}</Badge>
                  <Badge variant={statusLabels[detail.status].variant}>{statusLabels[detail.status].label}</Badge>
                  <span className="text-sm text-gray-500">{detail.nickname ?? `회원 #${detail.userId}`}{detail.email && ` (${detail.email})`}</span>
                  <div className="ml-auto">
                    <Select value={detail.status} onValueChange={(v) => changeStatus(v as InquiryStatus)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">답변대기</SelectItem>
                        <SelectItem value="REPLIED">답변완료</SelectItem>
                        <SelectItem value="CLOSED">종료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{detail.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{detail.content}</p>
              </div>

              {detail.replies && detail.replies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">답변 내역</h4>
                  {detail.replies.map((reply) => (
                    <div key={reply.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">R</span>
                          </div>
                          <span className="font-medium text-sm">관리자</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingReplyId(reply.id); setEditContent(reply.content); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteReply(reply.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <Separator className="my-2 bg-blue-200" />
                      {editingReplyId === reply.id ? (
                        <div className="space-y-2">
                          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateReply(reply.id)}>저장</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingReplyId(null)}>취소</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {detail.status !== "CLOSED" && (
                <div className="space-y-3">
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>답변 작성</Label>
                      {templates.length > 0 && (
                        <Select onValueChange={(v) => { const tpl = templates.find(t => String(t.id) === v); if (tpl) setReplyContent(tpl.value); }}>
                          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="템플릿 선택" /></SelectTrigger>
                          <SelectContent>
                            {templates.map((tpl) => <SelectItem key={tpl.id} value={String(tpl.id)}>{tpl.key}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Textarea placeholder="답변 내용을 입력하세요" rows={6} value={replyContent} onChange={(e) => setReplyContent(e.target.value)} disabled={replySubmitting} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={sendReply} disabled={replySubmitting}>
                      <Send className="w-4 h-4 mr-2" />답변 등록
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
