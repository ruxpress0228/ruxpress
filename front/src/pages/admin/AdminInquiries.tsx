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
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

const statusVariants: Record<InquiryStatus, "default" | "secondary" | "outline"> = {
  PENDING: "secondary",
  REPLIED: "default",
  CLOSED: "outline",
};

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.inquiries.title")}</h1>
        <p className="text-gray-600 mt-1">{t("admin.inquiries.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t("admin.inquiries.searchPlaceholder")} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">{t("admin.common.loading")}</div>
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
                    <TableHead>{t("admin.common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">{t("admin.inquiries.empty")}</TableCell></TableRow>
                  ) : filtered.map((inq) => (
                    <TableRow key={inq.id}>
                      <TableCell><Badge variant="outline">{t(inquiryCategoryKey(inq.category))}</Badge></TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{inq.title}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {inq.nickname ?? t("admin.common.memberHash", { id: inq.userId })}
                        {inq.email && <span className="block text-xs text-gray-400">{inq.email}</span>}
                      </TableCell>
                      <TableCell><Badge variant={statusVariants[inq.status]}>{t(inquiryStatusKey(inq.status))}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(inq.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openDetail(inq.id)}>
                          {inq.status === "PENDING" ? t("admin.common.reply") : t("admin.common.view")}
                        </Button>
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

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setSelectedId(null); setDetail(null); setEditingReplyId(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.inquiries.detailTitle")}</DialogTitle>
            <DialogDescription>
              {detail && new Date(detail.createdAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </DialogDescription>
          </DialogHeader>
          {detailLoading && <div className="py-8 text-center text-gray-500">{t("admin.common.loading")}</div>}
          {!detailLoading && detail && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="outline">{t(inquiryCategoryKey(detail.category))}</Badge>
                  <Badge variant={statusVariants[detail.status]}>{t(inquiryStatusKey(detail.status))}</Badge>
                  <span className="text-sm text-gray-500">
                    {detail.nickname ?? t("admin.common.memberHash", { id: detail.userId })}
                    {detail.email && ` (${detail.email})`}
                  </span>
                  <div className="ml-auto">
                    <Select value={detail.status} onValueChange={(v) => changeStatus(v as InquiryStatus)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INQUIRY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{t(inquiryStatusKey(s))}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{detail.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{detail.content}</p>
              </div>

              {detail.replies && detail.replies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">{t("admin.inquiries.repliesTitle")}</h4>
                  {detail.replies.map((reply) => (
                    <div key={reply.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold tracking-tight">MP</span>
                          </div>
                          <span className="font-medium text-sm">{t("admin.common.adminLabel")}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                            <Button size="sm" onClick={() => updateReply(reply.id)}>{t("admin.common.save")}</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingReplyId(null)}>{t("admin.common.cancel")}</Button>
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
                      <Label>{t("admin.inquiries.writeReply")}</Label>
                      {templates.length > 0 && (
                        <Select onValueChange={(v) => { const tpl = templates.find(tpl => String(tpl.id) === v); if (tpl) setReplyContent(tpl.value); }}>
                          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder={t("admin.inquiries.templatePlaceholder")} /></SelectTrigger>
                          <SelectContent>
                            {templates.map((tpl) => <SelectItem key={tpl.id} value={String(tpl.id)}>{tpl.key}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Textarea placeholder={t("admin.inquiries.replyPlaceholder")} rows={6} value={replyContent} onChange={(e) => setReplyContent(e.target.value)} disabled={replySubmitting} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={sendReply} disabled={replySubmitting}>
                      <Send className="w-4 h-4 mr-2" />{t("admin.common.registerReply")}
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
