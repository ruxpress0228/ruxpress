import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Landmark, Send, FileText } from "lucide-react";
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
} from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/format";
import type { SettlementAccount, TransferLedgerEntry } from "../../types/bankTransfer";

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
  const [entries, setEntries] = useState<TransferLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountId, setAccountId] = useState<string>("");
  const entryType = "DEPOSIT" as const;
  const [amount, setAmount] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [depositorMemo, setDepositorMemo] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [acc, page] = await Promise.all([
        getPublicSettlementAccounts(),
        getMyLedgerEntries(0, 50),
      ]);
      setAccounts(acc);
      setEntries(page.content ?? []);
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
    load();
  }, []);

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
      });
      toast.success(t("bankTransfer.toast.reportSuccess"));
      setAmount("");
      setDepositorMemo("");
      await load();
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
        <CardContent>
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
                  <TableCell colSpan={6} className="text-center text-gray-500">
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
        </CardContent>
      </Card>
    </div>
  );
}
