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
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

const statusVariants: Record<NoticeStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SCHEDULED: "secondary",
  PUBLISHED: "default",
  HIDDEN: "destructive",
};

function noticeStatusKey(status: NoticeStatus) {
  return `admin.notice.status.${status}` as "admin.notice.status.DRAFT" | "admin.notice.status.SCHEDULED" | "admin.notice.status.PUBLISHED" | "admin.notice.status.HIDDEN";
}

function formatDateTime(iso: string, dateLocale: string) {
  return new Date(iso).toLocaleString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNotices() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailNotice, setDetailNotice] = useState<Notice | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [formStatus, setFormStatus] = useState<string>("PUBLISHED");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const populateForm = (n: Notice) => {
    setFormTitle(n.title);
    setFormContent(n.content);
    setFormPinned(n.isPinned);
    setFormStatus(n.status);
    setFormScheduledAt(n.publishedAt ? n.publishedAt.slice(0, 16) : "");
  };

  const resetCreateForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormPinned(false);
    setFormStatus("PUBLISHED");
    setFormScheduledAt("");
  };

  const loadList = useCallback((p: number, s: number) => {
    setLoading(true);
    api.get<PageResponse<Notice>>(`/v1/admin/notices?page=${p}&size=${s}`)
      .then((res) => {
        const data = unwrap(res);
        setNotices(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => { toast.error(t("admin.notices.loadError")); setNotices([]); })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { loadList(page, size); }, [page, size, loadList]);

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const openDetailView = (n: Notice) => {
    setDetailNotice(n);
    populateForm(n);
    setDetailEditing(false);
    setDetailOpen(true);
  };

  const openDetailEdit = (n: Notice) => {
    setDetailNotice(n);
    populateForm(n);
    setDetailEditing(true);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailEditing(false);
    setDetailNotice(null);
  };

  const cancelDetailEdit = () => {
    if (detailNotice) {
      populateForm(detailNotice);
      setDetailEditing(false);
    } else {
      closeDetail();
    }
  };

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) { toast.error(t("admin.notices.validation")); return; }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { title: formTitle.trim(), content: formContent.trim(), isPinned: formPinned, status: formStatus };
      if (formStatus === "SCHEDULED" && formScheduledAt) body.publishedAt = formScheduledAt + ":00";
      await api.post<Notice>("/v1/admin/notices", body);
      toast.success(t("admin.notices.created"));
      setCreateOpen(false);
      loadList(page, size);
    } catch { toast.error(t("admin.common.saveError")); }
    finally { setSubmitting(false); }
  };

  const handleDetailSave = async () => {
    if (!detailNotice) return;
    if (!formTitle.trim() || !formContent.trim()) { toast.error(t("admin.notices.validation")); return; }
    setSubmitting(true);
    try {
      const res = await api.put<Notice>(`/v1/admin/notices/${detailNotice.id}`, {
        title: formTitle.trim(),
        content: formContent.trim(),
        isPinned: formPinned,
      });
      toast.success(t("admin.notices.updated"));
      const updated = res.code === 200 && res.data
        ? res.data
        : { ...detailNotice, title: formTitle.trim(), content: formContent.trim(), isPinned: formPinned };
      setDetailNotice(updated);
      setDetailEditing(false);
      loadList(page, size);
    } catch { toast.error(t("admin.common.saveError")); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number, fromDetail = false) => {
    try {
      await api.delete<void>(`/v1/admin/notices/${id}`);
      toast.success(t("admin.common.deleteDone"));
      if (fromDetail) closeDetail();
      loadList(page, size);
    } catch { toast.error(t("admin.common.deleteError")); }
  };

  const togglePin = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.patch<Notice>(`/v1/admin/notices/${id}/pin`, {});
      loadList(page, size);
      if (detailNotice?.id === id) {
        setDetailNotice((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : prev));
        setFormPinned((prev) => !prev);
      }
    } catch { toast.error(t("admin.common.pinChangeError")); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("admin.notices.title")}</h1>
          <p className="text-gray-600 mt-1">{t("admin.notices.subtitle")}</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />{t("admin.notices.create")}</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">{t("admin.common.loading")}</div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>{t("admin.common.col.title")}</TableHead>
                  <TableHead>{t("admin.common.col.status")}</TableHead>
                  <TableHead>{t("admin.common.col.views")}</TableHead>
                  <TableHead>{t("admin.common.col.createdAt")}</TableHead>
                  <TableHead>{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">{t("admin.notices.empty")}</TableCell></TableRow>
                ) : notices.map((n) => (
                  <TableRow
                    key={n.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openDetailView(n)}
                  >
                    <TableCell>{n.isPinned && <Pin className="w-4 h-4 text-blue-500" />}</TableCell>
                    <TableCell className="font-medium max-w-md truncate text-blue-700">{n.title}</TableCell>
                    <TableCell><Badge variant={statusVariants[n.status]}>{t(noticeStatusKey(n.status))}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-500">{n.viewCount}</TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin(n.id)} title={n.isPinned ? t("admin.common.unpin") : t("admin.common.pin")}>
                          {n.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetailEdit(n)} title={t("admin.common.edit")}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(n.id)} title={t("admin.common.delete")}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{t("admin.common.pageSize")}</span>
                <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}>
                  <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>{t("admin.common.pageSizeSuffix", { n: s })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>{t("admin.common.prev")}</Button>
                <span className="text-sm text-gray-500">{t("admin.common.pageOf", { page: page + 1, total: Math.max(1, totalPages) })}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>{t("admin.common.next")}</Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 공지 상세 / 편집 팝업 */}
      <Dialog open={detailOpen} onOpenChange={(o) => { if (!o) closeDetail(); else setDetailOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailEditing ? t("admin.notices.editTitle") : (detailNotice?.title ?? t("admin.common.detail"))}
            </DialogTitle>
            <DialogDescription>
              {detailEditing ? t("admin.notices.editDesc") : t("admin.notices.viewDesc")}
            </DialogDescription>
          </DialogHeader>

          {detailNotice && !detailEditing && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {detailNotice.isPinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="w-3 h-3" />
                    {t("admin.notices.pinned")}
                  </Badge>
                )}
                <Badge variant={statusVariants[detailNotice.status]}>{t(noticeStatusKey(detailNotice.status))}</Badge>
                <span className="text-sm text-gray-500">
                  {t("admin.common.col.views")}: {detailNotice.viewCount}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>{t("admin.common.col.createdAt")}: {formatDateTime(detailNotice.createdAt, dateLocale)}</p>
                {detailNotice.publishedAt && (
                  <p>{t("admin.notices.publishedAtLabel")}: {formatDateTime(detailNotice.publishedAt, dateLocale)}</p>
                )}
              </div>
              <div className="rounded-lg border bg-gray-50 p-4 max-h-[50vh] overflow-y-auto">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{detailNotice.content}</p>
              </div>
            </div>
          )}

          {detailNotice && detailEditing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.notices.titleLabel")}</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={t("admin.notices.titlePlaceholder")} disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.notices.contentLabel")}</Label>
                <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder={t("admin.notices.contentPlaceholder")} rows={12} disabled={submitting} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formPinned} onChange={(e) => setFormPinned(e.target.checked)} disabled={submitting} />
                {t("admin.notices.pinned")}
              </label>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!detailEditing ? (
              <>
                <Button variant="outline" onClick={closeDetail}>{t("admin.common.cancel")}</Button>
                <Button variant="destructive" onClick={() => handleDelete(detailNotice!.id, true)}>{t("admin.common.delete")}</Button>
                <Button onClick={() => setDetailEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {t("admin.common.edit")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={cancelDetailEdit} disabled={submitting}>{t("admin.common.cancel")}</Button>
                <Button onClick={handleDetailSave} disabled={submitting}>
                  {submitting ? t("admin.common.saving") : t("admin.common.save")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공지 작성 팝업 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.notices.createTitle")}</DialogTitle>
            <DialogDescription>{t("admin.notices.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.notices.titleLabel")}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={t("admin.notices.titlePlaceholder")} disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.notices.contentLabel")}</Label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder={t("admin.notices.contentPlaceholder")} rows={10} disabled={submitting} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formPinned} onChange={(e) => setFormPinned(e.target.checked)} />
                {t("admin.notices.pinned")}
              </label>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.notices.publishMethod")}</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">{t("admin.notices.publishNow")}</SelectItem>
                  <SelectItem value="SCHEDULED">{t("admin.notices.publishScheduled")}</SelectItem>
                  <SelectItem value="DRAFT">{t("admin.notices.saveDraft")}</SelectItem>
                </SelectContent>
              </Select>
              {formStatus === "SCHEDULED" && (
                <Input type="datetime-local" value={formScheduledAt} onChange={(e) => setFormScheduledAt(e.target.value)} disabled={submitting} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>{t("admin.common.cancel")}</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? t("admin.common.saving") : t("admin.common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
