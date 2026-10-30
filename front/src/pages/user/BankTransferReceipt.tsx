import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Printer } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { DescriptionList, LoadingState, PageHeader } from "../../components/page";
import { toast } from "sonner";
import { getLedgerReceipt } from "../../api/bankTransfer";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../utils/format";
import type { LedgerReceipt as LedgerReceiptType } from "../../types/bankTransfer";

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
    return <LoadingState label={t("bankTransfer.receiptLoading")} className="max-w-md" />;
  }

  const badge = statusBadgeProps(data.status);

  return (
    <div className="max-w-md print:max-w-none">
      <PageHeader
        className="print:[&_a]:hidden"
        back={{ to: "/bank-transfer", label: t("bankTransfer.back") }}
        title={t("bankTransfer.receiptTitle")}
        description={`Main Proxy · ${t("bankTransfer.receiptSubtitle")}`}
        actions={
          <Button variant="outline" className="print:hidden" onClick={onPrint}>
            <Printer className="size-4" strokeWidth={1.5} aria-hidden />
            {t("bankTransfer.print")}
          </Button>
        }
      />

      <section className="border border-border p-6 print:border-input">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("bankTransfer.field.amount")}</p>
            <p className="mt-2 text-4xl font-light figure">
              {data.amount.toLocaleString(locale === "en" ? "en-US" : "ko-KR")}{" "}
              <span className="text-xl text-muted-foreground">{data.currency}</span>
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-xs text-muted-foreground">{t("bankTransfer.receipt.status")}</p>
            <Badge variant={badge.variant} className={cn("px-2 py-0.5 text-[10px] font-medium", badge.className)}>
              {data.status}
            </Badge>
          </div>
        </div>

        <DescriptionList
          className="mt-6"
          dense
          items={[
            {
              key: "entryId",
              label: t("bankTransfer.receipt.entryId"),
              value: <span className="font-medium figure">{data.entryId}</span>,
            },
            { key: "type", label: t("bankTransfer.receipt.type"), value: data.entryType },
            ...(data.depositorName
              ? [{ key: "depositorName", label: t("bankTransfer.field.depositorName"), value: data.depositorName }]
              : []),
            {
              key: "confirmedAt",
              label: t("bankTransfer.receipt.confirmedAt"),
              value: <span className="figure">{data.confirmedAt ? formatDate(data.confirmedAt, locale) : "—"}</span>,
            },
            { key: "bank", label: t("bankTransfer.receipt.bank"), value: data.settlementAccount.bankName },
            {
              key: "account",
              label: t("bankTransfer.receipt.account"),
              value: <span className="figure">{data.settlementAccount.accountNumber}</span>,
            },
            { key: "holder", label: t("bankTransfer.receipt.holder"), value: data.settlementAccount.accountHolder },
          ]}
        />

        <p className="mt-6 text-xs text-muted-foreground">{t("bankTransfer.receiptFooter")}</p>
      </section>
    </div>
  );
}
