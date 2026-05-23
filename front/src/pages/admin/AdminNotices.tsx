import { useCallback, useEffect, useState } from "react";
import { Plus, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { Notice, NoticeStatus, PageResponse } from "../../types";

const statusLabels: Record<NoticeStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "초안", variant: "outline" },
  SCHEDULED: { label: "예약", variant: "secondary" },
  PUBLISHED: { label: "공개", variant: "default" },
  HIDDEN: { label: "숨김", variant: "destructive" },
};

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Notice | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [formStatus, setFormStatus] = useState<string>("PUBLISHED");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback((p: number, s: number) => {
    setLoading(true);
    api.get<PageResponse<Notice>>(`/v1/admin/notices?page=${p}&size=${s}`)
      .then((res) => {
        const data = unwrap(res);
        setNotices(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => { toast.error("공지사항을 불러오지 못했습니다"); setNotices([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadList(page, size); }, [page, size, loadList]);

  const openCreate = () => {
    setEditTarget(null);
    setFormTitle("");
    setFormContent("");
    setFormPinned(false);
    setFormStatus("PUBLISHED");
    setFormScheduledAt("");
    setFormOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditTarget(n);
    setFormTitle(n.title);
    setFormContent(n.content);
    setFormPinned(n.isPinned);
    setFormStatus(n.status);
    setFormScheduledAt(n.publishedAt ? n.publishedAt.slice(0, 16) : "");
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) { toast.error("제목과 내용을 입력해주세요"); return; }
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put<Notice>(`/v1/admin/notices/${editTarget.id}`, { title: formTitle.trim(), content: formContent.trim(), isPinned: formPinned });
        toast.success("공지사항이 수정되었습니다");
      } else {
        const body: Record<string, unknown> = { title: formTitle.trim(), content: formContent.trim(), isPinned: formPinned, status: formStatus };
        if (formStatus === "SCHEDULED" && formScheduledAt) body.publishedAt = formScheduledAt + ":00";
        await api.post<Notice>("/v1/admin/notices", body);
        toast.success("공지사항이 등록되었습니다");
      }
      setFormOpen(false);
      loadList(page, size);
    } catch { toast.error("저장에 실패했습니다"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete<void>(`/v1/admin/notices/${id}`);
      toast.success("삭제되었습니다");
      loadList(page, size);
    } catch { toast.error("삭제에 실패했습니다"); }
  };

  const togglePin = async (id: number) => {
    try {
      await api.patch<Notice>(`/v1/admin/notices/${id}/pin`, {});
      loadList(page, size);
    } catch { toast.error("고정 변경에 실패했습니다"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-gray-600 mt-1">공지사항을 작성하고 관리합니다</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />공지 작성</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">불러오는 중...</div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>조회수</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">공지사항이 없습니다</TableCell></TableRow>
                ) : notices.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>{n.isPinned && <Pin className="w-4 h-4 text-blue-500" />}</TableCell>
                    <TableCell className="font-medium max-w-md truncate">{n.title}</TableCell>
                    <TableCell><Badge variant={statusLabels[n.status].variant}>{statusLabels[n.status].label}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-500">{n.viewCount}</TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin(n.id)} title={n.isPinned ? "고정 해제" : "고정"}>
                          {n.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(n.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? "공지사항 수정" : "공지사항 작성"}</DialogTitle>
            <DialogDescription>{editTarget ? "공지사항을 수정합니다" : "새 공지사항을 작성합니다"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="공지사항 제목" disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="공지사항 내용" rows={10} disabled={submitting} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formPinned} onChange={(e) => setFormPinned(e.target.checked)} />
                중요 공지 (상단 고정)
              </label>
            </div>
            {!editTarget && (
              <div className="space-y-2">
                <Label>발행 방법</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">즉시 발행</SelectItem>
                    <SelectItem value="SCHEDULED">예약 발행</SelectItem>
                    <SelectItem value="DRAFT">초안 저장</SelectItem>
                  </SelectContent>
                </Select>
                {formStatus === "SCHEDULED" && (
                  <Input type="datetime-local" value={formScheduledAt} onChange={(e) => setFormScheduledAt(e.target.value)} disabled={submitting} />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>취소</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "저장 중..." : "저장"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
