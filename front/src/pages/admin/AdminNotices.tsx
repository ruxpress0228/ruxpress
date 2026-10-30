import { useCallback, useEffect, useState } from "react";
import { Plus, Pin, PinOff, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { Notice, NoticeStatus, PageResponse } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import { renderTextWithLinks } from "../../utils/linkify";
import { DescriptionList, EmptyState, Field, LoadingState, PageHeader, Pager } from "../../components/page";

/** published → black fill; draft/scheduled → outline; hidden → grey. */
const statusVariants: Record<NoticeStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "outline",
  SCHEDULED: "outline",
  PUBLISHED: "default",
  HIDDEN: "secondary",
};

const BADGE_CLASS = "px-2 py-0.5 text-[10px] font-medium";

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
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("admin.notices.title")}
        description={t("admin.notices.subtitle")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            {t("admin.notices.create")}
          </Button>
        }
      />

      <div>
        {loading ? (
          <LoadingState label={t("admin.common.loading")} />
        ) : (
          <>
            {notices.length === 0 ? (
              <EmptyState compact icon={FileText} title={t("admin.notices.empty")} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.common.col.title")}</TableHead>
                    <TableHead>{t("admin.common.col.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.common.col.views")}</TableHead>
                    <TableHead>{t("admin.common.col.createdAt")}</TableHead>
                    <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((n) => (
                    <TableRow
                      key={n.id}
                      className="cursor-pointer"
                      onClick={() => openDetailView(n)}
                    >
                      <TableCell className="max-w-md truncate font-medium">
                        {n.isPinned && (
                          <Badge className="mr-2 px-1.5 py-0 align-middle text-[10px] font-medium">{t("home.notice.pinned")}</Badge>
                        )}
                        {n.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[n.status]} className={BADGE_CLASS}>{t(noticeStatusKey(n.status))}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm figure">{n.viewCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground figure">
                        {new Date(n.createdAt).toLocaleDateString(dateLocale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => togglePin(n.id)}
                            title={n.isPinned ? t("admin.common.unpin") : t("admin.common.pin")}
                            aria-label={n.isPinned ? t("admin.common.unpin") : t("admin.common.pin")}
                          >
                            {n.isPinned ? (
                              <PinOff className="size-4" strokeWidth={1.5} aria-hidden />
                            ) : (
                              <Pin className="size-4" strokeWidth={1.5} aria-hidden />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openDetailEdit(n)}
                            title={t("admin.common.edit")}
                            aria-label={t("admin.common.edit")}
                          >
                            <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(n.id)}
                            title={t("admin.common.delete")}
                            aria-label={t("admin.common.delete")}
                          >
                            <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Pager
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
              prevLabel={t("admin.common.prev")}
              nextLabel={t("admin.common.next")}
              leading={
                <>
                  <span>{t("admin.common.pageSize")}</span>
                  <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}>
                    <SelectTrigger size="sm" className="w-[5.5rem] text-xs" aria-label={t("admin.common.pageSize")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{t("admin.common.pageSizeSuffix", { n: s })}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </>
        )}
      </div>

      {/* 공지 상세 / 편집 팝업 */}
      <Dialog open={detailOpen} onOpenChange={(o) => { if (!o) closeDetail(); else setDetailOpen(true); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="break-words">
              {detailEditing ? t("admin.notices.editTitle") : (detailNotice?.title ?? t("admin.common.detail"))}
            </DialogTitle>
            <DialogDescription>
              {detailEditing ? t("admin.notices.editDesc") : t("admin.notices.viewDesc")}
            </DialogDescription>
          </DialogHeader>

          {detailNotice && !detailEditing && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {detailNotice.isPinned && (
                  <Badge className={BADGE_CLASS}>
                    <Pin className="size-3" strokeWidth={1.5} aria-hidden />
                    {t("admin.notices.pinned")}
                  </Badge>
                )}
                <Badge variant={statusVariants[detailNotice.status]} className={BADGE_CLASS}>{t(noticeStatusKey(detailNotice.status))}</Badge>
              </div>
              <DescriptionList
                dense
                items={[
                  {
                    key: "views",
                    label: t("admin.common.col.views"),
                    value: <span className="figure">{detailNotice.viewCount}</span>,
                  },
                  {
                    key: "createdAt",
                    label: t("admin.common.col.createdAt"),
                    value: <span className="figure">{formatDateTime(detailNotice.createdAt, dateLocale)}</span>,
                  },
                  ...(detailNotice.publishedAt
                    ? [
                        {
                          key: "publishedAt",
                          label: t("admin.notices.publishedAtLabel"),
                          value: <span className="figure">{formatDateTime(detailNotice.publishedAt, dateLocale)}</span>,
                        },
                      ]
                    : []),
                ]}
              />
              <div className="max-h-[50vh] overflow-y-auto bg-muted/40 p-4 md:p-5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {renderTextWithLinks(detailNotice.content)}
                </p>
              </div>
            </div>
          )}

          {detailNotice && detailEditing && (
            <div className="space-y-5">
              <Field htmlFor="notice-edit-title" label={t("admin.notices.titleLabel")}>
                <Input
                  id="notice-edit-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t("admin.notices.titlePlaceholder")}
                  disabled={submitting}
                />
              </Field>
              <Field htmlFor="notice-edit-content" label={t("admin.notices.contentLabel")}>
                <Textarea
                  id="notice-edit-content"
                  className="min-h-40"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={t("admin.notices.contentPlaceholder")}
                  rows={12}
                  disabled={submitting}
                />
              </Field>
              <div className="flex items-center justify-between gap-4 border-y border-border py-3">
                <label htmlFor="notice-edit-pinned" className="text-sm font-medium">{t("admin.notices.pinned")}</label>
                <Switch
                  id="notice-edit-pinned"
                  checked={formPinned}
                  onCheckedChange={(checked) => setFormPinned(checked)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {!detailEditing ? (
              <>
                <Button variant="ghost" onClick={closeDetail}>{t("admin.common.cancel")}</Button>
                <Button variant="destructive" onClick={() => handleDelete(detailNotice!.id, true)}>{t("admin.common.delete")}</Button>
                <Button onClick={() => setDetailEditing(true)}>
                  <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
                  {t("admin.common.edit")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={cancelDetailEdit} disabled={submitting}>{t("admin.common.cancel")}</Button>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.notices.createTitle")}</DialogTitle>
            <DialogDescription>{t("admin.notices.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <Field htmlFor="notice-create-title" label={t("admin.notices.titleLabel")}>
              <Input
                id="notice-create-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("admin.notices.titlePlaceholder")}
                disabled={submitting}
              />
            </Field>
            <Field htmlFor="notice-create-content" label={t("admin.notices.contentLabel")}>
              <Textarea
                id="notice-create-content"
                className="min-h-40"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={t("admin.notices.contentPlaceholder")}
                rows={10}
                disabled={submitting}
              />
            </Field>
            <div className="flex items-center justify-between gap-4 border-y border-border py-3">
              <label htmlFor="notice-create-pinned" className="text-sm font-medium">{t("admin.notices.pinned")}</label>
              <Switch
                id="notice-create-pinned"
                checked={formPinned}
                onCheckedChange={(checked) => setFormPinned(checked)}
              />
            </div>
            <Field htmlFor="notice-create-publish" label={t("admin.notices.publishMethod")}>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger id="notice-create-publish" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">{t("admin.notices.publishNow")}</SelectItem>
                  <SelectItem value="SCHEDULED">{t("admin.notices.publishScheduled")}</SelectItem>
                  <SelectItem value="DRAFT">{t("admin.notices.saveDraft")}</SelectItem>
                </SelectContent>
              </Select>
              {formStatus === "SCHEDULED" && (
                <Input
                  type="datetime-local"
                  aria-label={t("admin.notices.publishScheduled")}
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                  disabled={submitting}
                />
              )}
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={submitting}>{t("admin.common.cancel")}</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? t("admin.common.saving") : t("admin.common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
