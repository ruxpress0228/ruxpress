import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { getLedgerReceipt } from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/format";
import type { LedgerReceipt as LedgerReceiptType } from "../../types/bankTransfer";

export default function BankTransferReceipt() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const [data, setData] = useState<LedgerReceiptType | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await getLedgerReceipt(Number(id));
        setData(r);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("bankTransfer.receiptLoadError"));
      }
    })();
  }, [id, t]);

  const onPrint = () => window.print();

  if (!data) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-gray-500">
        {t("bankTransfer.receiptLoading")}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/bank-transfer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("bankTransfer.back")}
          </Link>
        </Button>
        <Button onClick={onPrint}>
          <Printer className="w-4 h-4 mr-2" />
          {t("bankTransfer.print")}
        </Button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:text-center border-b print:border-gray-300 pb-4">
          <CardTitle className="text-2xl">{t("bankTransfer.receiptTitle")}</CardTitle>
          <p className="text-sm text-gray-500 mt-2">Main Proxy · {t("bankTransfer.receiptSubtitle")}</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-500">{t("bankTransfer.receipt.entryId")}</span>
            <span className="font-mono font-medium">{data.entryId}</span>
            <span className="text-gray-500">{t("bankTransfer.receipt.type")}</span>
            <span>{data.entryType}</span>
            <span className="text-gray-500">{t("bankTransfer.receipt.status")}</span>
            <span>{data.status}</span>
            <span className="text-gray-500">{t("bankTransfer.field.amount")}</span>
            <span className="font-semibold">
              {data.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")} {data.currency}
            </span>
            {data.depositorName ? (
              <>
                <span className="text-gray-500">{t("bankTransfer.field.depositorName")}</span>
                <span>{data.depositorName}</span>
              </>
            ) : null}
            <span className="text-gray-500">{t("bankTransfer.receipt.confirmedAt")}</span>
            <span>{data.confirmedAt ? formatDate(data.confirmedAt, locale) : "—"}</span>
            <span className="text-gray-500">{t("bankTransfer.receipt.bank")}</span>
            <span>{data.settlementAccount.bankName}</span>
            <span className="text-gray-500">{t("bankTransfer.receipt.account")}</span>
            <span className="font-mono">{data.settlementAccount.accountNumber}</span>
            <span className="text-gray-500">{t("bankTransfer.receipt.holder")}</span>
            <span>{data.settlementAccount.accountHolder}</span>
          </div>
          <p className="text-xs text-gray-400 pt-4 border-t">{t("bankTransfer.receiptFooter")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
