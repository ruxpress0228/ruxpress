import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Upload, ImageIcon, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
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
      toast.error(e instanceof Error ? e.message : "안내 이미지 조회 실패");
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
      toast.error("이미지 5MB 이하 jpg/png/webp만 업로드 가능합니다");
    }
    if (valid.length === 0) return;
    if (noticeImages.length + valid.length > MAX_NOTICE_IMAGES) {
      toast.error(`최대 ${MAX_NOTICE_IMAGES}개까지 등록 가능합니다`);
      return;
    }
    void (async () => {
      try {
        setNoticeUploading(true);
        const next = await adminUploadNoticeImages(valid);
        setNoticeImages(next);
        toast.success("안내 이미지가 업로드되었습니다");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "업로드 실패");
      } finally {
        setNoticeUploading(false);
      }
    })();
  };

  const onDeleteNoticeImage = async (attachmentId: number) => {
    if (!confirm("이 이미지를 삭제하시겠습니까?")) return;
    try {
      await adminDeleteNoticeImage(attachmentId);
      setNoticeImages((prev) => prev.filter((x) => x.id !== attachmentId));
      toast.success("이미지가 삭제되었습니다");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제 실패");
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.bank.settlement.title")}</h1>
          <p className="text-gray-600 text-sm">{t("admin.bank.settlement.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t("admin.bank.settlement.add")}
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editId == null ? t("admin.bank.settlement.add") : t("admin.bank.settlement.edit")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label>{t("admin.bank.settlement.bankName")}</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.bank.settlement.accountNumber")}</Label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.bank.settlement.accountHolder")}</Label>
                <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.bank.settlement.memo")}</Label>
                <Input value={displayMemo} onChange={(e) => setDisplayMemo(e.target.value)} />
              </div>
              {editId != null ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  {t("admin.bank.settlement.active")}
                </label>
              ) : null}
              <Button className="w-full" onClick={onSave}>
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.bank.settlement.listTitle")}</CardTitle>
          <CardDescription>{t("admin.bank.settlement.listDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">{t("admin.bank.loading")}</p>
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
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      {t("admin.bank.settlement.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.id}</TableCell>
                      <TableCell>{a.bankName}</TableCell>
                      <TableCell className="font-mono">{a.accountNumber}</TableCell>
                      <TableCell>{a.accountHolder}</TableCell>
                      <TableCell>{a.active ? "Y" : "N"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete(a.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                안내 이미지
              </CardTitle>
              <CardDescription>
                사용자 계좌이체 페이지에서 입금계좌 아래에 노출됩니다. (jpg/png/webp, 5MB, 최대 {MAX_NOTICE_IMAGES}장)
              </CardDescription>
            </div>
            <div>
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
                onClick={() => noticeInputRef.current?.click()}
                disabled={noticeUploading || noticeImages.length >= MAX_NOTICE_IMAGES}
              >
                <Upload className="w-4 h-4 mr-2" />
                {noticeUploading ? "업로드 중..." : "이미지 추가"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {noticeLoading ? (
            <p className="text-sm text-gray-500">불러오는 중...</p>
          ) : noticeImages.length === 0 ? (
            <p className="text-sm text-gray-500">등록된 안내 이미지가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {noticeImages.map((img) => {
                const src = img.viewUrl || img.storedUrl;
                return (
                  <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                    <a href={src} target="_blank" rel="noopener noreferrer" title={img.originalFilename}>
                      <img
                        src={img.thumbnailUrl || src}
                        alt={img.originalFilename}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-90"
                      onClick={() => void onDeleteNoticeImage(img.id)}
                      title="삭제"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-gray-600 truncate px-2 py-1 bg-white">{img.originalFilename}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
