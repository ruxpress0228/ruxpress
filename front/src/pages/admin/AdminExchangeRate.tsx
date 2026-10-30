import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { cn } from "../../components/ui/utils";
import {
  PageHeader,
  Section,
  StatStrip,
  FormSection,
  FormActions,
  Field,
  Pager,
  LoadingState,
  type StatItem,
} from "../../components/page";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { formatDate, formatNumber } from "../../utils/format";
import type { ExchangeRate } from "../../types";
import {
  FOREIGN_QUOTE_CURRENCIES,
  type CurrentExchangeRates,
  type QuoteRate,
  findQuoteRate,
  formatKrwBasisRate,
  formatRateToKrwForInput,
  formatRateToKrwLine,
  parseRateToKrwInput,
} from "../../utils/exchange";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";

const fetchedAtOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const EMPTY_INPUTS: Record<string, string> = { RUB: "", USD: "", CNY: "", JPY: "", EUR: "" };

function mergeInputsFromQuotes(
  prev: Record<string, string>,
  quotes: QuoteRate[],
  options: { resetMissing: boolean; onlyCurrency?: string }
): Record<string, string> {
  const next = options.resetMissing ? { ...EMPTY_INPUTS } : { ...prev };
  const currencies = options.onlyCurrency ? [options.onlyCurrency] : FOREIGN_QUOTE_CURRENCIES;

  for (const c of currencies) {
    const q = findQuoteRate(quotes, c);
    if (q) {
      next[c] = formatRateToKrwForInput(q.rateToKrw);
    } else if (options.resetMissing) {
      next[c] = "";
    }
  }
  return next;
}

export default function AdminExchangeRate() {
  const { t, locale } = useTranslation();
  const {
    getCurrentExchangeRates,
    getExchangeRateHistory,
    triggerExchangeRateFetch,
    setManualExchangeRate,
  } = useExchangeRate();
  const [currentRates, setCurrentRates] = useState<CurrentExchangeRates | null>(null);
  const [history, setHistory] = useState<ExchangeRate[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historySize, setHistorySize] = useState(DEFAULT_PAGE_SIZE);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState<string | null>(null);
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({ ...EMPTY_INPUTS });
  const [feeRate, setFeeRate] = useState("12");

  const refreshHistory = async (p = historyPage, s = historySize) => {
    const historyRes = await getExchangeRateHistory(p, s);
    setHistory(historyRes.content ?? []);
    setHistoryTotalPages(historyRes.totalPages ?? 0);
    setHistoryPage(historyRes.number ?? p);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [current, historyRes] = await Promise.all([
        getCurrentExchangeRates(),
        getExchangeRateHistory(historyPage, historySize),
      ]);
      setCurrentRates(current);
      setHistory(historyRes.content ?? []);
      setHistoryTotalPages(historyRes.totalPages ?? 0);
      setHistoryPage(historyRes.number ?? 0);
      setManualInputs((prev) => mergeInputsFromQuotes(prev, current.quotes, { resetMissing: true }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("admin.exchange.toast.loadError");
      toast.error(msg);
      setCurrentRates(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeRate = async () => {
    try {
      const res = await api.get<{ key: string; value: string }>("/v1/admin/settings/fee-rate");
      setFeeRate(unwrap(res).value);
    } catch {
      /* keep default */
    }
  };

  useEffect(() => {
    loadData();
    loadFeeRate();
  }, []);

  const fetchRubFromApi = async () => {
    try {
      setFetching(true);
      const updated = await triggerExchangeRateFetch();
      setCurrentRates(updated);
      setManualInputs((prev) =>
        mergeInputsFromQuotes(prev, updated.quotes, { resetMissing: false, onlyCurrency: "RUB" })
      );
      await refreshHistory();
      toast.success(t("admin.exchange.toast.refreshSuccess"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("admin.exchange.toast.refreshError");
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  };

  const saveManualRate = async (currency: string) => {
    const rateToKrw = parseRateToKrwInput(manualInputs[currency] ?? "");
    if (rateToKrw == null) {
      toast.error(t("admin.exchange.toast.invalidRate"));
      return;
    }
    try {
      setSavingCurrency(currency);
      const updated = await setManualExchangeRate(currency, rateToKrw);
      setCurrentRates(updated);
      setManualInputs((prev) =>
        mergeInputsFromQuotes(prev, updated.quotes, { resetMissing: false, onlyCurrency: currency })
      );
      await refreshHistory();
      toast.success(t("admin.exchange.toast.manualSuccess"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("admin.exchange.toast.manualError");
      toast.error(msg);
    } finally {
      setSavingCurrency(null);
    }
  };

  const updateFeeRate = async () => {
    try {
      await api.put<{ key: string; value: string }>("/v1/admin/settings/fee-rate", { value: feeRate });
      toast.success(t("admin.exchange.toast.feeSuccess"));
    } catch {
      toast.error(t("admin.exchange.toast.feeError"));
    }
  };

  if (loading && !currentRates) {
    return (
      <div className="space-y-10 md:space-y-12">
        <PageHeader title={t("admin.exchange.title")} description={t("admin.exchange.subtitle")} />
        <LoadingState label={t("admin.exchange.loading")} />
      </div>
    );
  }

  const latestFetchedAt = currentRates?.fetchedAt;

  const rateItems: StatItem[] = FOREIGN_QUOTE_CURRENCIES.map((currency) => {
    const quote = currentRates ? findQuoteRate(currentRates.quotes, currency) : undefined;
    const rateText = quote ? formatRateToKrwForInput(quote.rateToKrw) : "";
    const basis = quote ? formatKrwBasisRate(currency, quote.rateToKrw, locale) : null;
    const sourceLabel = quote
      ? quote.source === "API"
        ? t("admin.exchange.sourceApi")
        : t("admin.exchange.sourceManual")
      : null;
    return {
      key: currency,
      label: currency,
      value: rateText ? (
        <>
          {rateText}
          <span className="ml-1.5 text-base text-muted-foreground">{t("admin.exchange.quote.unitKrw")}</span>
        </>
      ) : (
        "—"
      ),
      hint: quote ? [sourceLabel, basis].filter(Boolean).join(" · ") : t("admin.exchange.noRate"),
    };
  });

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        title={t("admin.exchange.title")}
        description={t("admin.exchange.subtitle")}
        meta={
          latestFetchedAt ? (
            <span className="figure">
              {formatDate(latestFetchedAt, locale, fetchedAtOptions)} {t("admin.exchange.asOf")}
            </span>
          ) : undefined
        }
        actions={
          <Button type="button" variant="outline" onClick={fetchRubFromApi} disabled={fetching}>
            <RefreshCw className={cn("size-4", fetching && "animate-spin")} strokeWidth={1.5} aria-hidden />
            {t("admin.exchange.apiRefresh")} (RUB)
          </Button>
        }
      />

      <StatStrip columns={5} size="md" items={rateItems} />

      <div>
        <FormSection title={t("admin.exchange.quote.title")} description={t("admin.exchange.quote.desc")}>
          {FOREIGN_QUOTE_CURRENCIES.map((currency) => (
            <Field
              key={currency}
              htmlFor={`manual-${currency}`}
              label={t("admin.exchange.quote.rateLabel").replace("{{currency}}", currency)}
            >
              <div className="flex items-center gap-2">
                <Input
                  id={`manual-${currency}`}
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder={t("admin.exchange.quote.placeholder")}
                  className="figure"
                  value={manualInputs[currency] ?? ""}
                  onChange={(e) =>
                    setManualInputs((prev) => ({ ...prev, [currency]: e.target.value }))
                  }
                />
                <span className="shrink-0 text-sm text-muted-foreground">
                  {t("admin.exchange.quote.unitKrw")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveManualRate(currency)}
                  disabled={savingCurrency === currency}
                >
                  {t("admin.exchange.quote.save")}
                </Button>
              </div>
            </Field>
          ))}
        </FormSection>
      </div>

      <div className="border-t border-border pt-10 md:pt-12">
        <FormSection title={t("admin.exchange.feeCard.title")} description={t("admin.exchange.feeCard.desc")}>
          <Field htmlFor="fee-rate" label={t("admin.exchange.feeCard.label")}>
            <Input
              id="fee-rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={feeRate}
              onChange={(e) => setFeeRate(e.target.value)}
              className="figure sm:max-w-xs"
            />
          </Field>
          <div className="border border-border p-5 md:p-6">
            <p className="text-sm">
              <span className="font-medium">{t("admin.exchange.feeCard.current")}</span>{" "}
              <span className="figure">{feeRate}%</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground figure">
              {t("admin.exchange.feeCard.example").replace(
                "{{fee}}",
                formatNumber(100000 * parseFloat(feeRate || "0") / 100, locale)
              )}
            </p>
          </div>
        </FormSection>
        <FormActions className="mt-8">
          <Button type="button" onClick={updateFeeRate}>
            {t("common.save")}
          </Button>
        </FormActions>
      </div>

      <Section title={t("admin.exchange.history.title")} description={t("admin.exchange.history.desc")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.exchange.history.currency")}</TableHead>
              <TableHead className="text-right">{t("admin.exchange.history.rate")}</TableHead>
              <TableHead>{t("admin.exchange.history.source")}</TableHead>
              <TableHead>{t("admin.exchange.history.status")}</TableHead>
              <TableHead>{t("admin.exchange.history.fetchedAt")}</TableHead>
              <TableHead>{t("admin.exchange.history.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {t("admin.exchange.historyEmpty")}
                </TableCell>
              </TableRow>
            ) : (
              history.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.baseCurrency}</TableCell>
                  <TableCell className="text-right figure">
                    {formatRateToKrwLine(rate.baseCurrency, Number(rate.rate))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rate.source === "API"
                        ? t("admin.exchange.badgeApi")
                        : t("admin.exchange.badgeManual")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rate.isCurrent ? (
                      <Badge>{t("admin.exchange.statusCurrent")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("admin.exchange.statusPrevious")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground figure">
                    {rate.fetchedAt ? formatDate(rate.fetchedAt, locale, fetchedAtOptions) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground figure">
                    {rate.createdAt ? formatDate(rate.createdAt, locale) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pager
          page={historyPage}
          totalPages={historyTotalPages}
          onPrev={() => { void refreshHistory(historyPage - 1, historySize); }}
          onNext={() => { void refreshHistory(historyPage + 1, historySize); }}
          prevLabel={t("admin.common.prev")}
          nextLabel={t("admin.common.next")}
          leading={
            <>
              <span>{t("admin.common.pageSize")}</span>
              <Select
                value={String(historySize)}
                onValueChange={(v) => { const s = Number(v); setHistorySize(s); setHistoryPage(0); void refreshHistory(0, s); }}
              >
                <SelectTrigger size="sm" className="w-[5.5rem] text-xs" aria-label={t("admin.common.pageSize")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{t("admin.common.pageSizeSuffix", { n: s })}</SelectItem>
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
