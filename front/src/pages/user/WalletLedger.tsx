import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { useTranslation } from "../../hooks/useTranslation";
import { useBalance } from "../../hooks/balance/useBalance";
import { getMyWalletLedger, type WalletLedgerEntry } from "../../api/balance";
import { formatDate, formatNumber } from "../../utils/format";
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
  const [data, setData] = useState<PageResponse<WalletLedgerEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (p: number, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await getMyWalletLedger(p, 20);
      setData(res);
      setPage(res.page ?? p);
    } catch {
      setData(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load(0);
  }, []);

  useEffect(() => {
    if (prevBalanceRef.current !== balance && prevBalanceRef.current != null) {
      void load(page, { silent: true });
    }
    prevBalanceRef.current = balance;
  }, [balance, page]);

  const rows = data?.content ?? [];
  const numOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("wallet.title")}</h1>
        <p className="text-gray-600 mt-1">{t("wallet.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("wallet.balanceCard.title")}</CardTitle>
          <CardDescription>{t("wallet.balanceCard.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">
            {balance == null ? "—" : `₩${formatNumber(balance, locale, numOpt)}`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("wallet.ledger.title")}</CardTitle>
          <CardDescription>{t("wallet.ledger.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-gray-500">{t("wallet.ledger.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("wallet.ledger.colDate")}</TableHead>
                    <TableHead>{t("wallet.ledger.colType")}</TableHead>
                    <TableHead>{t("wallet.ledger.colAmount")}</TableHead>
                    <TableHead>{t("wallet.ledger.colMemo")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-10">
                        {t("wallet.ledger.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(e.createdAt, locale)}
                        </TableCell>
                        <TableCell className="text-sm">{entryLabel(t, e.entryType)}</TableCell>
                        <TableCell className="font-medium">
                          {e.entryType === "DEBIT_PURCHASE" || e.entryType === "DEBIT_BANK_REFUND" ? "−" : "+"}
                          ₩{formatNumber(e.amount, locale, numOpt)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                          {e.memo ?? (e.purchaseRequestId ? `#${e.purchaseRequestId}` : "")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between p-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => void load(page - 1)}
                >
                  {t("wallet.ledger.prev")}
                </Button>
                <span className="text-sm text-gray-500">
                  {page + 1} / {Math.max(1, data?.totalPages ?? 1)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={data != null && page >= (data.totalPages ?? 1) - 1}
                  onClick={() => void load(page + 1)}
                >
                  {t("wallet.ledger.next")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
