import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { Field, FormActions, FormSection, PageHeader, Pager, Section } from "../../components/page";
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
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const BADGE_CLASS = "px-2 py-0.5 text-[10px] font-medium";

/** Pending is outlined, confirmed is black, cancelled/failed is red-outlined. */
function statusBadgeProps(s: string): { variant: "default" | "secondary" | "outline"; className?: string } {
  switch (s) {
    case "CONFIRMED":
      return { variant: "default" };
    case "PENDING":
      return { variant: "outline" };
    case "CANCELLED":
    case "FAILED":
      return { variant: "outline", className: "border-destructive/30 bg-destructive/10 text-destructive" };
    default:
      return { variant: "outline" };
  }
}

export default function BankTransfer() {
  const { t, locale } = useTranslation();
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [noticeImages, setNoticeImages] = useState<BankTransferAttachment[]>([]);
  const [entries, setEntries] = useState<TransferLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesPage, setEntriesPage] = useState(0);
  const [entriesSize, setEntriesSize] = useState(DEFAULT_PAGE_SIZE);
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
    <div className="space-y-10 md:space-y-12">
      <PageHeader title={t("bankTransfer.title")} description={t("bankTransfer.subtitle")} />

      <Section title={t("bankTransfer.accountsTitle")} description={t("bankTransfer.accountsDesc")} flush>
        {loading ? (
          <p className="border-b border-border py-8 text-sm text-muted-foreground" role="status" aria-live="polite">
            {t("bankTransfer.loading")}
          </p>
        ) : accounts.length === 0 ? (
          <p className="border-b border-border py-8 text-sm text-muted-foreground">{t("bankTransfer.noAccounts")}</p>
        ) : (
          <ul>
            {accounts.map((a) => (
              <li
                key={a.id}
                className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.bankName}</p>
                  <p className="mt-1 break-all text-2xl font-light figure md:text-3xl">{a.accountNumber}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.accountHolder}</p>
                </div>
                {a.displayMemo ? (
                  <p className="text-sm text-muted-foreground md:max-w-xs md:text-right">{a.displayMemo}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {noticeImages.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium">{t("bankTransfer.guideImages")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {noticeImages.map((img) => {
                const src = img.viewUrl || img.storedUrl;
                return (
                  <a
                    key={img.id}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-border transition-colors hover:border-foreground"
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
      </Section>

      <form onSubmit={onSubmit}>
        <FormSection title={t("bankTransfer.reportTitle")} description={t("bankTransfer.reportDesc")}>
          <Field htmlFor="bt-account" label={t("bankTransfer.field.account")}>
            <Select value={accountId} onValueChange={setAccountId} disabled={!accounts.length}>
              <SelectTrigger id="bt-account">
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
          </Field>
          <Field htmlFor="bt-amount" label={t("bankTransfer.field.amount")}>
            <Input
              id="bt-amount"
              className="figure"
              value={amount}
              onChange={(ev) => setAmount(ev.target.value)}
              placeholder="100000"
              inputMode="numeric"
            />
          </Field>
          <Field htmlFor="bt-depositor-name" label={t("bankTransfer.field.depositorName")}>
            <Input
              id="bt-depositor-name"
              value={depositorName}
              onChange={(ev) => setDepositorName(ev.target.value)}
              placeholder={t("bankTransfer.field.depositorNamePh")}
            />
          </Field>
          <Field htmlFor="bt-memo" label={t("bankTransfer.field.memo")}>
            <Input
              id="bt-memo"
              value={depositorMemo}
              onChange={(ev) => setDepositorMemo(ev.target.value)}
              placeholder={t("bankTransfer.field.memoPh")}
            />
          </Field>
          <Field label={t("bankTransfer.proofPhotoOptional")}>
            <div
              className="border border-dashed border-input p-8 text-center text-sm text-muted-foreground transition-colors hover:border-foreground"
              onClick={() => imageInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") imageInputRef.current?.click();
              }}
            >
              <Upload className="mx-auto size-6" strokeWidth={1.25} aria-hidden />
              <p className="mt-3 text-xs">{t("bankTransfer.proofPhotoHint")}</p>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={onImageInput}
            />
            {imagePreviews.length > 0 && (
              <ul className="border-t border-border">
                {imagePreviews.map((p, idx) => (
                  <li
                    key={`${p.file.name}-${idx}`}
                    className="flex items-center gap-3 border-b border-border py-2.5 text-sm"
                  >
                    <img src={p.url} alt="" className="size-10 shrink-0 border border-border object-cover" />
                    <span className="min-w-0 flex-1 truncate">{p.file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground figure">
                      {(p.file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      title={t("admin.common.delete")}
                      aria-label={t("admin.common.delete")}
                      onClick={() => removeImage(idx)}
                    >
                      <X className="size-4" strokeWidth={1.5} aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
        </FormSection>
        <FormActions>
          <Button type="submit" disabled={submitting || !accounts.length}>
            {submitting ? t("bankTransfer.submitting") : t("bankTransfer.submit")}
          </Button>
        </FormActions>
      </form>

      <Section title={t("bankTransfer.historyTitle")} description={t("bankTransfer.historyDesc")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("bankTransfer.table.id")}</TableHead>
              <TableHead>{t("bankTransfer.table.type")}</TableHead>
              <TableHead className="text-right">{t("bankTransfer.table.amount")}</TableHead>
              <TableHead>{t("bankTransfer.table.status")}</TableHead>
              <TableHead>{t("bankTransfer.table.date")}</TableHead>
              <TableHead className="text-right">{t("bankTransfer.table.receipt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t("bankTransfer.empty")}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((row) => {
                const badge = statusBadgeProps(row.status);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="figure">{row.id}</TableCell>
                    <TableCell>{row.entryType}</TableCell>
                    <TableCell className="text-right font-medium figure">
                      {row.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")} {row.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className={cn(BADGE_CLASS, badge.className)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground figure">{formatDate(row.createdAt, locale)}</TableCell>
                    <TableCell className="text-right">
                      {row.status === "CONFIRMED" ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/bank-transfer/receipt/${row.id}`}>
                            <FileText className="size-4" strokeWidth={1.5} aria-hidden />
                            {t("bankTransfer.receipt")}
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <Pager
          page={entriesPage}
          totalPages={entriesTotalPages}
          onPrev={() => setEntriesPage((p) => p - 1)}
          onNext={() => setEntriesPage((p) => p + 1)}
          prevLabel={t("purchase.list.prev")}
          nextLabel={t("purchase.list.next")}
          leading={
            <>
              <span>{t("purchase.list.perPage")}</span>
              <Select
                value={String(entriesSize)}
                onValueChange={(v) => { setEntriesSize(Number(v)); setEntriesPage(0); }}
              >
                <SelectTrigger size="sm" className="w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{t("purchase.list.perPageOption", { n: s })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
      </Section>
    </div>
  );
}
