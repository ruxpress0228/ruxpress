import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Landmark, Send, FileText, Upload, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  getPublicSettlementAccounts,
  getMyLedgerEntries,
  reportDeposit,
  listNoticeImages,
} from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/format";
import type { BankTransferAttachment, SettlementAccount, TransferLedgerEntry } from "../../types/bankTransfer";
import type { PageResponse } from "../../types";

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function statusBadgeVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "CONFIRMED":
      return "default";
    case "PENDING":
      return "secondary";
    case "CANCELLED":
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
}

export default function BankTransfer() {
  const { t, locale } = useTranslation();
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [noticeImages, setNoticeImages] = useState<BankTransferAttachment[]>([]);
  const [entries, setEntries] = useState<TransferLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesPage, setEntriesPage] = useState(0);
  const [entriesSize, setEntriesSize] = useState(20);
  const [entriesTotalPages, setEntriesTotalPages] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [accountId, setAccountId] = useState<string>("");
  const entryType = "DEPOSIT" as const;
  const [amount, setAmount] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [depositorMemo, setDepositorMemo] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images]
  );
  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  const addImages = (selected: File[]) => {
    if (selected.length === 0) return;
    const next: File[] = [];
    for (const f of selected) {
      if (!ALLOWED_IMAGE_TYPES.has(f.type)) continue;
      if (f.size > MAX_IMAGE_SIZE) continue;
      next.push(f);
    }
    const combined = [...images, ...next].slice(0, MAX_IMAGES);
    if (next.length < selected.length || images.length + next.length > MAX_IMAGES) {
      toast.error(t("bankTransfer.attachInvalid"));
    }
    setImages(combined);
  };
  const onImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImages(Array.from(e.target.files || []));
    e.target.value = "";
  };
  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const loadEntries = useCallback(async (p: number, s: number) => {
    try {
      const res: PageResponse<TransferLedgerEntry> = await getMyLedgerEntries(p, s);
      setEntries(res.content ?? []);
      setEntriesTotalPages(res.totalPages ?? 0);
      setEntriesPage(res.page ?? p);
    } catch {
      // errors surfaced by initial load
    }
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [acc, res, notices] = await Promise.all([
        getPublicSettlementAccounts(),
        getMyLedgerEntries(0, entriesSize),
        listNoticeImages().catch(() => [] as BankTransferAttachment[]),
      ]);
      setAccounts(acc);
      setNoticeImages(notices);
      setEntries(res.content ?? []);
      setEntriesTotalPages(res.totalPages ?? 0);
      setEntriesPage(0);
      if (acc.length && !accountId) {
        setAccountId(String(acc[0].id));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("bankTransfer.toast.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) void loadEntries(entriesPage, entriesSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesPage, entriesSize]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount.replace(/,/g, ""));
    if (!accountId || Number.isNaN(num) || num <= 0) {
      toast.error(t("bankTransfer.toast.invalidAmount"));
      return;
    }
    try {
      setSubmitting(true);
      await reportDeposit({
        settlementAccountId: Number(accountId),
        entryType,
        amount: num,
        currency: "KRW",
        depositorName: depositorName.trim() || undefined,
        depositorMemo: depositorMemo.trim() || undefined,
        files: images.length > 0 ? images : undefined,
      });
      toast.success(t("bankTransfer.toast.reportSuccess"));
      setAmount("");
      setDepositorMemo("");
      setImages([]);
      setEntriesPage(0);
      await loadEntries(0, entriesSize);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("bankTransfer.toast.reportError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Landmark className="w-8 h-8 text-blue-600" />
          {t("bankTransfer.title")}
        </h1>
        <p className="text-gray-600 mt-1">{t("bankTransfer.subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("bankTransfer.accountsTitle")}</CardTitle>
            <CardDescription>{t("bankTransfer.accountsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500">{t("bankTransfer.loading")}</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-gray-500">{t("bankTransfer.noAccounts")}</p>
            ) : (
              accounts.map((a) => (
                <div key={a.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="font-semibold text-gray-900">{a.bankName}</p>
                  <p className="text-lg font-mono tracking-tight mt-1">{a.accountNumber}</p>
                  <p className="text-sm text-gray-700">{a.accountHolder}</p>
                  {a.displayMemo ? <p className="text-sm text-blue-800 mt-2">{a.displayMemo}</p> : null}
                </div>
              ))
            )}

            {noticeImages.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-sm font-semibold text-gray-800">{t("bankTransfer.guideImages")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {noticeImages.map((img) => {
                    const src = img.viewUrl || img.storedUrl;
                    return (
                      <a
                        key={img.id}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded overflow-hidden hover:opacity-90"
                        title={img.originalFilename}
                      >
                        <img
                          src={img.thumbnailUrl || src}
                          alt={img.originalFilename}
                          className="h-32 w-full object-cover"
                          loading="lazy"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bankTransfer.reportTitle")}</CardTitle>
            <CardDescription>{t("bankTransfer.reportDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("bankTransfer.field.account")}</Label>
                <Select value={accountId} onValueChange={setAccountId} disabled={!accounts.length}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("bankTransfer.field.accountPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.bankName} · {a.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("bankTransfer.field.amount")}</Label>
                <Input
                  value={amount}
                  onChange={(ev) => setAmount(ev.target.value)}
                  placeholder="100000"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("bankTransfer.field.depositorName")}</Label>
                <Input
                  value={depositorName}
                  onChange={(ev) => setDepositorName(ev.target.value)}
                  placeholder={t("bankTransfer.field.depositorNamePh")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("bankTransfer.field.memo")}</Label>
                <Input
                  value={depositorMemo}
                  onChange={(ev) => setDepositorMemo(ev.target.value)}
                  placeholder={t("bankTransfer.field.memoPh")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("bankTransfer.proofPhotoOptional")}</Label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500"
                  onClick={() => imageInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") imageInputRef.current?.click();
                  }}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={onImageInput}
                  />
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">
                    {t("bankTransfer.proofPhotoHint")}
                  </p>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {imagePreviews.map((p, idx) => (
                      <div key={`${p.file.name}-${idx}`} className="relative group">
                        <img
                          src={p.url}
                          alt={p.file.name}
                          className="h-20 w-full object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 h-6 w-6 bg-white/80 hover:bg-white"
                          onClick={() => removeImage(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !accounts.length}>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? t("bankTransfer.submitting") : t("bankTransfer.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("bankTransfer.historyTitle")}</CardTitle>
          <CardDescription>{t("bankTransfer.historyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("bankTransfer.table.id")}</TableHead>
                <TableHead>{t("bankTransfer.table.type")}</TableHead>
                <TableHead>{t("bankTransfer.table.amount")}</TableHead>
                <TableHead>{t("bankTransfer.table.status")}</TableHead>
                <TableHead>{t("bankTransfer.table.date")}</TableHead>
                <TableHead className="text-right">{t("bankTransfer.table.receipt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    {t("bankTransfer.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono">{row.id}</TableCell>
                    <TableCell>{row.entryType}</TableCell>
                    <TableCell>
                      {row.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")} {row.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(row.createdAt, locale)}</TableCell>
                    <TableCell className="text-right">
                      {row.status === "CONFIRMED" ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/bank-transfer/receipt/${row.id}`}>
                            <FileText className="w-4 h-4 mr-1" />
                            {t("bankTransfer.receipt")}
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-4 border-t flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{t("purchase.list.perPage")}</span>
              <Select
                value={String(entriesSize)}
                onValueChange={(v) => { setEntriesSize(Number(v)); setEntriesPage(0); }}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{t("purchase.list.perPageOption", { n: s })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={entriesPage <= 0} onClick={() => setEntriesPage((p) => p - 1)}>{t("purchase.list.prev")}</Button>
              <span className="text-sm text-gray-500">{entriesPage + 1} / {Math.max(1, entriesTotalPages)}</span>
              <Button variant="outline" size="sm" disabled={entriesPage >= entriesTotalPages - 1} onClick={() => setEntriesPage((p) => p + 1)}>{t("purchase.list.next")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
