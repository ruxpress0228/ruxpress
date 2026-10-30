import { useCallback, useEffect, useState } from "react";
import { Minus, Plus, Search, Wallet } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DescriptionList,
  EmptyState,
  Field,
  LoadingState,
  PageHeader,
  Pager,
  Toolbar,
} from "../../components/page";
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

const DESTRUCTIVE_OUTLINE = "border-destructive/30 bg-destructive/10 text-destructive";

function entryLabel(t: (k: string) => string, type: string): string {
  const key = `wallet.entry.${type}`;
  const label = t(key);
  return label === key ? type : label;
}

/** Wallet rows carry the raw member status; reuse the member-status label when one exists. */
function walletStatusLabel(t: (k: string) => string, status: string): string {
  const key = `admin.user.status.${status}`;
  const label = t(key);
  return label === key ? status : label;
}

function WalletStatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "ACTIVE") return <Badge>{label}</Badge>;
  if (status === "SUSPENDED" || status === "WITHDRAWN") {
    return (
      <Badge variant="outline" className={DESTRUCTIVE_OUTLINE}>
        {label}
      </Badge>
    );
  }
  return <Badge variant="outline">{label}</Badge>;
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
    <div className="space-y-10 md:space-y-12">
      <PageHeader title={t("admin.wallets.title")} description={t("admin.wallets.subtitle")} />

      <div className="space-y-4">
        <Toolbar>
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <Input
              className="pl-9"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("admin.wallets.keywordPlaceholder")}
              aria-label={t("admin.wallets.keyword")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(0);
                  void load(0, size);
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(0);
              void load(0, size);
            }}
          >
            {t("admin.bank.apply")}
          </Button>
        </Toolbar>

        {loading ? (
          <LoadingState label={t("admin.bank.loading")} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Wallet} title={t("admin.wallets.empty")} />
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
                    <WalletStatusBadge status={r.status} label={walletStatusLabel(t, r.status)} />
                  </TableCell>
                  <TableCell className="text-right font-medium figure">
                    ₩{formatNumber(r.balance, locale, numOpt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openAdjust(r)}>
                        {t("admin.wallets.adjust")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void openLedger(r)}>
                        {t("admin.wallets.ledger")}
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
          onPrev={() => load(page - 1, size)}
          onNext={() => load(page + 1, size)}
          prevLabel={t("admin.wallets.prev")}
          nextLabel={t("admin.wallets.next")}
          leading={
            <>
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
                <SelectTrigger size="sm" className="w-[5.5rem] text-xs" aria-label={t("admin.wallets.pageSize")}>
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
            </>
          }
        />
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.wallets.adjustTitle")}</DialogTitle>
            <DialogDescription>{t("admin.wallets.listDesc")}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <DescriptionList
              dense
              items={[
                { key: "email", label: t("admin.wallets.col.email"), value: selected.email },
                {
                  key: "balance",
                  label: t("admin.wallets.currentBalance"),
                  value: (
                    <span className="font-medium figure">₩{formatNumber(selected.balance, locale, numOpt)}</span>
                  ),
                },
              ]}
            />
          ) : null}
          <div className="space-y-5">
            <Field htmlFor="wallet-adjust-amount" label={t("admin.bank.ledger.amount")} hint={t("admin.wallets.debitHint")}>
              <Input
                id="wallet-adjust-amount"
                className="figure"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
              />
            </Field>
            <Field htmlFor="wallet-adjust-memo" label={t("admin.bank.memo")}>
              <Textarea
                id="wallet-adjust-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder={t("admin.wallets.memoPlaceholder")}
                rows={3}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={submitting} onClick={() => setAdjustOpen(false)}>
              {t("admin.common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting}
              onClick={() => void submitAdjust("debit")}
            >
              <Minus className="size-4" strokeWidth={1.5} aria-hidden />
              {t("admin.wallets.debit")}
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitAdjust("credit")}>
              <Plus className="size-4" strokeWidth={1.5} aria-hidden />
              {t("admin.wallets.credit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.wallets.ledgerTitle")}</DialogTitle>
            <DialogDescription className="figure">
              {ledgerUser
                ? `${ledgerUser.email} · ₩${formatNumber(ledgerUser.balance, locale, numOpt)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {ledgerLoading ? (
            <LoadingState compact label={t("admin.bank.loading")} />
          ) : ledgerRows.length === 0 ? (
            <EmptyState compact title={t("admin.wallets.ledgerEmpty")} />
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
                    <TableCell>{entryLabel(t, row.entryType)}</TableCell>
                    <TableCell className="text-right font-medium figure">
                      ₩{formatNumber(row.amount, locale, numOpt)}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground" title={row.memo ?? ""}>
                      {row.memo ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground figure">
                      {formatDate(row.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {ledgerTotalPages > 1 ? (
            <Pager
              className="pt-0"
              page={ledgerPage}
              totalPages={ledgerTotalPages}
              onPrev={() => {
                if (ledgerLoading || !ledgerUser) return;
                void loadLedger(ledgerUser.userId, ledgerPage - 1);
              }}
              onNext={() => {
                if (ledgerLoading || !ledgerUser) return;
                void loadLedger(ledgerUser.userId, ledgerPage + 1);
              }}
              prevLabel={t("admin.wallets.prev")}
              nextLabel={t("admin.wallets.next")}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
