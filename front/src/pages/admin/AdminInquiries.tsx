import { useCallback, useEffect, useState } from "react";
import { Search, Send, Pencil, Trash2, MessageSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { AdminInquiryListItem, Inquiry, InquiryStatus, InquiryCategory, PageResponse } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import { EmptyState, Field, LoadingState, PageHeader, Pager, Toolbar } from "../../components/page";

/** pending → outline, answered → black fill, closed → grey. */
const statusVariants: Record<InquiryStatus, "default" | "secondary" | "outline"> = {
  PENDING: "outline",
  REPLIED: "default",
  CLOSED: "secondary",
};

const BADGE_CLASS = "px-2 py-0.5 text-[10px] font-medium";

const INQUIRY_STATUSES: InquiryStatus[] = ["PENDING", "REPLIED", "CLOSED"];

interface TemplateItem { id: number; key: string; value: string; }

function inquiryStatusKey(status: InquiryStatus) {
  return `inquiry.status.${status.toLowerCase()}` as "inquiry.status.pending" | "inquiry.status.replied" | "inquiry.status.closed";
}

function inquiryCategoryKey(category: InquiryCategory) {
  return `inquiry.category.${category.toLowerCase()}` as "inquiry.category.order" | "inquiry.category.shipping" | "inquiry.category.payment" | "inquiry.category.etc";
}

export default function AdminInquiries() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
  const [items, setItems] = useState<AdminInquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
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
      .catch(() => { toast.error(t("admin.inquiries.loadError")); setItems([]); })
      .finally(() => setLoading(false));
  }, [t]);

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
      toast.error(t("admin.inquiries.detailLoadError"));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const sendReply = async () => {
    if (selectedId == null || !replyContent.trim()) {
      toast.error(t("admin.inquiries.replyRequired")); return;
    }
    setReplySubmitting(true);
    try {
      const res = await api.post<Inquiry>(`/v1/admin/inquiries/${selectedId}/replies`, { content: replyContent.trim() });
      setDetail(unwrap(res));
      setReplyContent("");
      toast.success(t("admin.inquiries.replyCreated"));
      loadList(page, size);
    } catch { toast.error(t("admin.inquiries.replyCreateError")); }
    finally { setReplySubmitting(false); }
  };

  const updateReply = async (replyId: number) => {
    if (selectedId == null || !editContent.trim()) return;
    try {
      const res = await api.put<Inquiry>(`/v1/admin/inquiries/${selectedId}/replies/${replyId}`, { content: editContent.trim() });
      setDetail(unwrap(res));
      setEditingReplyId(null);
      toast.success(t("admin.inquiries.replyUpdated"));
    } catch { toast.error(t("admin.inquiries.replyUpdateError")); }
  };

  const deleteReply = async (replyId: number) => {
    if (selectedId == null) return;
    try {
      const res = await api.delete<Inquiry>(`/v1/admin/inquiries/${selectedId}/replies/${replyId}`);
      setDetail(unwrap(res));
      toast.success(t("admin.inquiries.replyDeleted"));
      loadList(page, size);
    } catch { toast.error(t("admin.inquiries.replyDeleteError")); }
  };

  const changeStatus = async (newStatus: InquiryStatus) => {
    if (selectedId == null) return;
    try {
      const res = await api.patch<Inquiry>(`/v1/admin/inquiries/${selectedId}/status`, { status: newStatus });
      setDetail(unwrap(res));
      toast.success(t("admin.common.statusChanged"));
      loadList(page, size);
    } catch { toast.error(t("admin.common.statusChangeError")); }
  };

  const filtered = search.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || String(i.id).includes(search))
    : items;

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader title={t("admin.inquiries.title")} description={t("admin.inquiries.subtitle")} />

      <div>
        <Toolbar>
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder={t("admin.inquiries.searchPlaceholder")}
              aria-label={t("admin.inquiries.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Toolbar>

        {loading ? (
          <LoadingState label={t("admin.common.loading")} className="mt-4" />
        ) : (
          <>
            {filtered.length === 0 ? (
              <EmptyState compact icon={MessageSquare} title={t("admin.inquiries.empty")} className="mt-4" />
            ) : (
              <div className="mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.common.col.category")}</TableHead>
                      <TableHead>{t("admin.common.col.title")}</TableHead>
                      <TableHead>{t("admin.common.col.author")}</TableHead>
                      <TableHead>{t("admin.common.col.status")}</TableHead>
                      <TableHead>{t("admin.common.col.createdAt")}</TableHead>
                      <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inq) => (
                      <TableRow key={inq.id}>
                        <TableCell>
                          <Badge variant="outline" className={BADGE_CLASS}>{t(inquiryCategoryKey(inq.category))}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-medium">{inq.title}</TableCell>
                        <TableCell className="text-sm">
                          <span className="block">{inq.nickname ?? t("admin.common.memberHash", { id: inq.userId })}</span>
                          {inq.email && <span className="block text-xs text-muted-foreground">{inq.email}</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[inq.status]} className={BADGE_CLASS}>{t(inquiryStatusKey(inq.status))}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground figure">
                          {new Date(inq.createdAt).toLocaleDateString(dateLocale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(inq.id)}>
                            {inq.status === "PENDING" ? t("admin.common.reply") : t("admin.common.view")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setSelectedId(null); setDetail(null); setEditingReplyId(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.inquiries.detailTitle")}</DialogTitle>
            <DialogDescription className="figure">
              {detail && formatDateTime(detail.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {detailLoading && <LoadingState compact label={t("admin.common.loading")} />}
          {!detailLoading && detail && (
            <div className="space-y-6">
              <div className="bg-muted p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={BADGE_CLASS}>{t(inquiryCategoryKey(detail.category))}</Badge>
                  <Badge variant={statusVariants[detail.status]} className={BADGE_CLASS}>{t(inquiryStatusKey(detail.status))}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {detail.nickname ?? t("admin.common.memberHash", { id: detail.userId })}
                    {detail.email && ` (${detail.email})`}
                  </span>
                  <div className="ml-auto">
                    <Select value={detail.status} onValueChange={(v) => changeStatus(v as InquiryStatus)}>
                      <SelectTrigger size="sm" className="w-[130px] text-xs" aria-label={t("admin.common.col.status")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INQUIRY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{t(inquiryStatusKey(s))}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <h3 className="mt-4 break-words">{detail.title}</h3>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{detail.content}</p>
              </div>

              {detail.replies && detail.replies.length > 0 && (
                <div>
                  <p className="text-sm font-medium">{t("admin.inquiries.repliesTitle")}</p>
                  <ul className="mt-2 border-t border-border">
                    {detail.replies.map((reply) => (
                      <li key={reply.id} className="border-b border-border py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background"
                              aria-hidden
                            >
                              MP
                            </span>
                            <span className="text-sm font-medium">{t("admin.common.adminLabel")}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <span className="text-xs text-muted-foreground figure">{formatDateTime(reply.createdAt)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title={t("admin.common.edit")}
                              aria-label={t("admin.common.edit")}
                              onClick={() => { setEditingReplyId(reply.id); setEditContent(reply.content); }}
                            >
                              <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              title={t("admin.common.delete")}
                              aria-label={t("admin.common.delete")}
                              onClick={() => deleteReply(reply.id)}
                            >
                              <Trash2 className="size-3.5" strokeWidth={1.5} aria-hidden />
                            </Button>
                          </div>
                        </div>
                        {editingReplyId === reply.id ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={4}
                              aria-label={t("admin.common.edit")}
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingReplyId(null)}>{t("admin.common.cancel")}</Button>
                              <Button size="sm" onClick={() => updateReply(reply.id)}>{t("admin.common.save")}</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.status !== "CLOSED" && (
                <div className="space-y-3 border-t border-border pt-5">
                  <Field htmlFor="admin-inquiry-reply" label={t("admin.inquiries.writeReply")}>
                    <Textarea
                      id="admin-inquiry-reply"
                      placeholder={t("admin.inquiries.replyPlaceholder")}
                      rows={6}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      disabled={replySubmitting}
                    />
                  </Field>
                  <div className="flex flex-wrap items-center gap-2">
                    {templates.length > 0 && (
                      <Select onValueChange={(v) => { const tpl = templates.find(tpl => String(tpl.id) === v); if (tpl) setReplyContent(tpl.value); }}>
                        <SelectTrigger size="sm" className="w-[200px] text-xs" aria-label={t("admin.inquiries.templatePlaceholder")}>
                          <SelectValue placeholder={t("admin.inquiries.templatePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((tpl) => <SelectItem key={tpl.id} value={String(tpl.id)}>{tpl.key}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Button className="ml-auto" onClick={sendReply} disabled={replySubmitting}>
                      <Send className="size-4" strokeWidth={1.5} aria-hidden />
                      {t("admin.common.registerReply")}
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
