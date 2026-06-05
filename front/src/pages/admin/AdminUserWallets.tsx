import { useCallback, useEffect, useState } from "react";
import { Coins, Minus, Plus, Search, History } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate, formatNumber } from "../../utils/format";
import {
  adminCreditUserWallet,
  adminDebitUserWallet,
  adminGetUserWalletLedger,
  adminListUserWallets,
  type AdminUserWallet,
} from "../../api/adminWallet";
import type { WalletLedgerEntry } from "../../api/balance";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

function entryLabel(t: (k: string) => string, type: string): string {
  const key = `wallet.entry.${type}`;
  const label = t(key);
  return label === key ? type : label;
}

export default function AdminUserWallets() {
  const { t, locale } = useTranslation();
  const [rows, setRows] = useState<AdminUserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selected, setSelected] = useState<AdminUserWallet | null>(null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerUser, setLedgerUser] = useState<AdminUserWallet | null>(null);
  const [ledgerRows, setLedgerRows] = useState<WalletLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(0);

  const numOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const load = useCallback(
    async (p = page, s = size) => {
      try {
        setLoading(true);
        const res = await adminListUserWallets({
          page: p,
          size: s,
          keyword: keyword.trim() || undefined,
        });
        setRows(res.content ?? []);
        setTotalPages(res.totalPages ?? 0);
        setPage(res.page ?? p);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("admin.wallets.loadError"));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [keyword, page, size, t]
  );

  useEffect(() => {
    void load(0, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdjust = (user: AdminUserWallet) => {
    setSelected(user);
    setAmount("");
    setMemo("");
    setAdjustOpen(true);
  };

  const openLedger = async (user: AdminUserWallet) => {
    setLedgerUser(user);
    setLedgerOpen(true);
    setLedgerPage(0);
    await loadLedger(user.userId, 0);
  };

  const loadLedger = async (userId: number, p: number) => {
    try {
      setLedgerLoading(true);
      const res = await adminGetUserWalletLedger(userId, p, 20);
      setLedgerRows(res.content ?? []);
      setLedgerTotalPages(res.totalPages ?? 0);
      setLedgerPage(res.page ?? p);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.wallets.ledgerLoadError"));
      setLedgerRows([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const submitAdjust = async (kind: "credit" | "debit") => {
    if (!selected) return;
    const num = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(num) || num <= 0) {
      toast.error(t("admin.wallets.invalidAmount"));
      return;
    }
    try {
      setSubmitting(true);
      const result =
        kind === "credit"
          ? await adminCreditUserWallet(selected.userId, num, memo.trim() || undefined)
          : await adminDebitUserWallet(selected.userId, num, memo.trim() || undefined);
      toast.success(
        kind === "credit" ? t("admin.wallets.creditDone") : t("admin.wallets.debitDone")
      );
      setAdjustOpen(false);
      setRows((prev) =>
        prev.map((r) =>
          r.userId === selected.userId ? { ...r, balance: result.balanceAfter } : r
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.wallets.actionError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.wallets.title")}</h1>
        <p className="text-gray-600 mt-1">{t("admin.wallets.subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t("admin.wallets.searchTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label>{t("admin.wallets.keyword")}</Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("admin.wallets.keywordPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(0);
                  void load(0, size);
                }
              }}
            />
          </div>
          <Button
            onClick={() => {
              setPage(0);
              void load(0, size);
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            {t("admin.bank.apply")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600" />
            {t("admin.wallets.listTitle")}
          </CardTitle>
          <CardDescription>{t("admin.wallets.listDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">{t("admin.bank.loading")}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">{t("admin.wallets.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.wallets.col.email")}</TableHead>
                  <TableHead>{t("admin.wallets.col.nickname")}</TableHead>
                  <TableHead>{t("admin.wallets.col.status")}</TableHead>
                  <TableHead className="text-right">{t("admin.wallets.col.balance")}</TableHead>
                  <TableHead className="text-right">{t("admin.bank.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell className="max-w-[220px] truncate" title={r.email}>
                      {r.email}
                    </TableCell>
                    <TableCell>{r.nickname ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      ₩{formatNumber(r.balance, locale, numOpt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex flex-col gap-1 min-w-[120px]">
                        <Button size="sm" variant="default" onClick={() => openAdjust(r)}>
                          <Plus className="w-4 h-4 mr-1" />
                          {t("admin.wallets.adjust")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void openLedger(r)}>
                          <History className="w-4 h-4 mr-1" />
                          {t("admin.wallets.ledger")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between p-4 border-t flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{t("admin.wallets.pageSize")}</span>
              <Select
                value={String(size)}
                onValueChange={(v) => {
                  const s = Number(v);
                  setSize(s);
                  setPage(0);
                  void load(0, s);
                }}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => load(page - 1, size)}>
                {t("admin.wallets.prev")}
              </Button>
              <span className="text-sm text-gray-500">
                {page + 1} / {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => load(page + 1, size)}
              >
                {t("admin.wallets.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.wallets.adjustTitle")}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.email} · ${t("admin.wallets.currentBalance")} ₩${formatNumber(selected.balance, locale, numOpt)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("admin.bank.ledger.amount")}</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" />
            </div>
            <div>
              <Label>{t("admin.bank.memo")}</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder={t("admin.wallets.memoPlaceholder")}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                className="w-full"
                disabled={submitting}
                onClick={() => void submitAdjust("credit")}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("admin.wallets.credit")}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                disabled={submitting}
                onClick={() => void submitAdjust("debit")}
              >
                <Minus className="w-4 h-4 mr-1" />
                {t("admin.wallets.debit")}
              </Button>
            </div>
            <p className="text-xs text-gray-500">{t("admin.wallets.debitHint")}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.wallets.ledgerTitle")}</DialogTitle>
            <DialogDescription>
              {ledgerUser
                ? `${ledgerUser.email} · ₩${formatNumber(ledgerUser.balance, locale, numOpt)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {ledgerLoading ? (
            <p className="text-sm text-gray-500 py-4">{t("admin.bank.loading")}</p>
          ) : ledgerRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">{t("admin.wallets.ledgerEmpty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.wallets.col.type")}</TableHead>
                  <TableHead className="text-right">{t("admin.bank.ledger.amount")}</TableHead>
                  <TableHead>{t("admin.bank.memo")}</TableHead>
                  <TableHead>{t("admin.bank.table.created")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">{entryLabel(t, row.entryType)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ₩{formatNumber(row.amount, locale, numOpt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[180px] truncate" title={row.memo ?? ""}>
                      {row.memo ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(row.createdAt, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {ledgerTotalPages > 1 ? (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ledgerPage <= 0 || ledgerLoading || !ledgerUser}
                onClick={() => ledgerUser && void loadLedger(ledgerUser.userId, ledgerPage - 1)}
              >
                {t("admin.wallets.prev")}
              </Button>
              <span className="text-sm text-gray-500 self-center">
                {ledgerPage + 1} / {ledgerTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={ledgerPage >= ledgerTotalPages - 1 || ledgerLoading || !ledgerUser}
                onClick={() => ledgerUser && void loadLedger(ledgerUser.userId, ledgerPage + 1)}
              >
                {t("admin.wallets.next")}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
