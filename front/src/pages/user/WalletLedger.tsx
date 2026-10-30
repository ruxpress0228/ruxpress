import { useEffect, useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { LoadingState, PageHeader, Pager, Section } from "../../components/page";
import { useTranslation } from "../../hooks/useTranslation";
import { useBalance } from "../../hooks/balance/useBalance";
import { BalanceEquivalents } from "../../components/balance/BalanceEquivalents";
import { getMyWalletLedger, type WalletLedgerEntry } from "../../api/balance";
import { formatDate, formatNumber } from "../../utils/format";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import type { PageResponse } from "../../types";

function entryLabel(t: (k: string) => string, type: string): string {
  const key = `wallet.entry.${type}`;
  const label = t(key);
  return label === key ? type : label;
}

export default function WalletLedger() {
  const { t, locale } = useTranslation();
  const { balance } = useBalance();
  const prevBalanceRef = useRef(balance);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<PageResponse<WalletLedgerEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (p: number, s: number, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const res = await getMyWalletLedger(p, s);
      setData(res);
      setPage(res.page ?? p);
    } catch {
      setData(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load(0, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevBalanceRef.current !== balance && prevBalanceRef.current != null) {
      void load(page, size, { silent: true });
    }
    prevBalanceRef.current = balance;
  }, [balance, page, size]);

  const rows = data?.content ?? [];
  const numOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader title={t("wallet.title")} description={t("wallet.subtitle")} />

      <section className="border border-border p-5 md:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{t("wallet.balanceCard.title")}</p>
            <p className="mt-3 text-4xl font-light figure md:text-5xl">
              {balance == null ? "—" : `₩${formatNumber(balance, locale, numOpt)}`}
            </p>
            <BalanceEquivalents
              balance={balance}
              hintKey="wallet.balanceEquivalentsHint"
              className="mt-2 text-sm text-muted-foreground figure"
            />
          </div>
          <p className="max-w-xs text-xs leading-snug text-muted-foreground md:text-right">
            {t("wallet.balanceCard.desc")}
          </p>
        </div>
      </section>

      <Section title={t("wallet.ledger.title")} description={t("wallet.ledger.desc")}>
        {loading ? (
          <LoadingState label={t("wallet.ledger.loading")} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("wallet.ledger.colDate")}</TableHead>
                  <TableHead>{t("wallet.ledger.colType")}</TableHead>
                  <TableHead className="text-right">{t("wallet.ledger.colAmount")}</TableHead>
                  <TableHead>{t("wallet.ledger.colMemo")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      {t("wallet.ledger.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground figure">
                        {formatDate(e.createdAt, locale)}
                      </TableCell>
                      <TableCell>{entryLabel(t, e.entryType)}</TableCell>
                      <TableCell className="text-right font-medium figure">
                        {e.entryType === "DEBIT_PURCHASE" || e.entryType === "DEBIT_BANK_REFUND" ? "−" : ""}
                        ₩{formatNumber(e.amount, locale, numOpt)}
                      </TableCell>
                      <TableCell className="min-w-[8rem] max-w-[14rem] whitespace-normal break-words text-muted-foreground figure">
                        {e.memo ?? (e.purchaseRequestId ? `#${e.purchaseRequestId}` : "")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pager
              page={page}
              totalPages={data?.totalPages ?? 1}
              onPrev={() => void load(page - 1, size)}
              onNext={() => void load(page + 1, size)}
              prevLabel={t("wallet.ledger.prev")}
              nextLabel={t("wallet.ledger.next")}
              leading={
                <>
                  <span>{t("purchase.list.perPage")}</span>
                  <Select
                    value={String(size)}
                    onValueChange={(v) => { const s = Number(v); setSize(s); void load(0, s); }}
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
          </>
        )}
      </Section>
    </div>
  );
}
