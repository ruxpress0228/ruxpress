import { useEffect, useRef, useState } from "react";
import { Plus, Upload, ImageIcon, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { EmptyState, Field, LoadingState, PageHeader, Section } from "../../components/page";
import { toast } from "sonner";
import {
  adminListSettlementAccounts,
  adminCreateSettlementAccount,
  adminUpdateSettlementAccount,
  adminDeleteSettlementAccount,
  adminListNoticeImages,
  adminUploadNoticeImages,
  adminDeleteNoticeImage,
} from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import type { BankTransferAttachment, SettlementAccount } from "../../types/bankTransfer";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_NOTICE_IMAGES = 20;

export default function AdminSettlementAccounts() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SettlementAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [displayMemo, setDisplayMemo] = useState("");
  const [active, setActive] = useState(true);

  const [noticeImages, setNoticeImages] = useState<BankTransferAttachment[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [noticeUploading, setNoticeUploading] = useState(false);
  const noticeInputRef = useRef<HTMLInputElement>(null);

  const loadNoticeImages = async () => {
    try {
      setNoticeLoading(true);
      const list = await adminListNoticeImages();
      setNoticeImages(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.settlement.noticeImages.loadError"));
    } finally {
      setNoticeLoading(false);
    }
  };

  const onPickNoticeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;
    const valid: File[] = [];
    for (const f of picked) {
      if (!ALLOWED_IMAGE_TYPES.has(f.type)) continue;
      if (f.size > MAX_IMAGE_SIZE) continue;
      valid.push(f);
    }
    if (valid.length < picked.length) {
      toast.error(t("admin.settlement.noticeImages.invalidType"));
    }
    if (valid.length === 0) return;
    if (noticeImages.length + valid.length > MAX_NOTICE_IMAGES) {
      toast.error(t("admin.settlement.noticeImages.maxCount", { max: MAX_NOTICE_IMAGES }));
      return;
    }
    void (async () => {
      try {
        setNoticeUploading(true);
        const next = await adminUploadNoticeImages(valid);
        setNoticeImages(next);
        toast.success(t("admin.settlement.noticeImages.uploaded"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("admin.common.uploadError"));
      } finally {
        setNoticeUploading(false);
      }
    })();
  };

  const onDeleteNoticeImage = async (attachmentId: number) => {
    if (!confirm(t("admin.settlement.noticeImages.deleteConfirm"))) return;
    try {
      await adminDeleteNoticeImage(attachmentId);
      setNoticeImages((prev) => prev.filter((x) => x.id !== attachmentId));
      toast.success(t("admin.settlement.noticeImages.deleted"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.common.deleteError"));
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const list = await adminListSettlementAccounts();
      setRows(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.settlement.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    void loadNoticeImages();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setDisplayMemo("");
    setActive(true);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (a: SettlementAccount) => {
    setEditId(a.id);
    setBankName(a.bankName);
    setAccountNumber(a.accountNumber);
    setAccountHolder(a.accountHolder);
    setDisplayMemo(a.displayMemo ?? "");
    setActive(a.active);
    setOpen(true);
  };

  const onSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      toast.error(t("admin.bank.settlement.validation"));
      return;
    }
    try {
      if (editId == null) {
        await adminCreateSettlementAccount({
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          displayMemo: displayMemo.trim() || undefined,
        });
        toast.success(t("admin.bank.settlement.created"));
      } else {
        await adminUpdateSettlementAccount(editId, {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          displayMemo: displayMemo.trim() || undefined,
          active,
        });
        toast.success(t("admin.bank.settlement.updated"));
      }
      setOpen(false);
      resetForm();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.settlement.saveError"));
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm(t("admin.bank.settlement.deleteConfirm"))) return;
    try {
      await adminDeleteSettlementAccount(id);
      toast.success(t("admin.bank.settlement.deleted"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.bank.settlement.deleteError"));
    }
  };

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("admin.bank.settlement.title")}
        description={t("admin.bank.settlement.subtitle")}
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            {t("admin.bank.settlement.add")}
          </Button>
        }
      />

      <Section title={t("admin.bank.settlement.listTitle")} description={t("admin.bank.settlement.listDesc")}>
        {loading ? (
          <LoadingState label={t("admin.bank.loading")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{t("admin.bank.settlement.bankName")}</TableHead>
                <TableHead>{t("admin.bank.settlement.accountNumber")}</TableHead>
                <TableHead>{t("admin.bank.settlement.accountHolder")}</TableHead>
                <TableHead>{t("admin.bank.settlement.active")}</TableHead>
                <TableHead className="text-right">{t("admin.bank.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {t("admin.bank.settlement.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-muted-foreground figure">{a.id}</TableCell>
                    <TableCell className="font-medium">{a.bankName}</TableCell>
                    <TableCell className="figure">{a.accountNumber}</TableCell>
                    <TableCell>{a.accountHolder}</TableCell>
                    <TableCell>
                      {a.active ? (
                        <Badge>{t("admin.bank.settlement.active")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("admin.admin.status.INACTIVE")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                          {t("admin.common.edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(a.id)}
                        >
                          {t("admin.common.delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section
        title={t("admin.settlement.noticeImages.title")}
        description={t("admin.settlement.noticeImages.desc", { max: MAX_NOTICE_IMAGES })}
        action={
          <>
            <input
              ref={noticeInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={onPickNoticeFiles}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => noticeInputRef.current?.click()}
              disabled={noticeUploading || noticeImages.length >= MAX_NOTICE_IMAGES}
            >
              <Upload className="size-4" strokeWidth={1.5} aria-hidden />
              {noticeUploading ? t("admin.common.uploading") : t("admin.settlement.noticeImages.add")}
            </Button>
          </>
        }
      >
        {noticeLoading ? (
          <LoadingState compact label={t("admin.common.loading")} />
        ) : noticeImages.length === 0 ? (
          <EmptyState compact icon={ImageIcon} title={t("admin.settlement.noticeImages.empty")} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {noticeImages.map((img) => {
              const src = img.viewUrl || img.storedUrl;
              return (
                <li key={img.id} className="border border-border">
                  <a href={src} target="_blank" rel="noopener noreferrer" title={img.originalFilename} className="block">
                    <img
                      src={img.thumbnailUrl || src}
                      alt={img.originalFilename}
                      className="h-32 w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                  <div className="flex items-center justify-between gap-2 border-t border-border py-1 pl-2 pr-1">
                    <p className="min-w-0 truncate text-xs text-muted-foreground">{img.originalFilename}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => void onDeleteNoticeImage(img.id)}
                      title={t("admin.common.delete")}
                      aria-label={t("admin.common.delete")}
                    >
                      <X className="size-4" strokeWidth={1.5} aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId == null ? t("admin.bank.settlement.add") : t("admin.bank.settlement.edit")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <Field htmlFor="settlement-bank" label={t("admin.bank.settlement.bankName")} required>
              <Input id="settlement-bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </Field>
            <Field htmlFor="settlement-number" label={t("admin.bank.settlement.accountNumber")} required>
              <Input
                id="settlement-number"
                className="figure"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </Field>
            <Field htmlFor="settlement-holder" label={t("admin.bank.settlement.accountHolder")} required>
              <Input id="settlement-holder" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            </Field>
            <Field htmlFor="settlement-memo" label={t("admin.bank.settlement.memo")}>
              <Input id="settlement-memo" value={displayMemo} onChange={(e) => setDisplayMemo(e.target.value)} />
            </Field>
            {editId != null ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-foreground"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                {t("admin.bank.settlement.active")}
              </label>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("admin.common.cancel")}
            </Button>
            <Button type="button" onClick={onSave}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
