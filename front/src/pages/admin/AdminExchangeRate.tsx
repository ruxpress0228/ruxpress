import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
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
  findQuoteRate,
  foreignPerKrwToRateToKrw,
  formatKrwBasisRate,
  krwPerOneToForeign,
} from "../../utils/exchange";

const fetchedAtOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

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
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState<string | null>(null);
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({
    RUB: "",
    USD: "",
    CNY: "",
  });
  const [feeRate, setFeeRate] = useState("12");

  const loadData = async () => {
    try {
      setLoading(true);
      const [current, historyRes] = await Promise.all([
        getCurrentExchangeRates(),
        getExchangeRateHistory(0, 30),
      ]);
      setCurrentRates(current);
      setHistory(historyRes.content ?? []);
      const nextInputs: Record<string, string> = { RUB: "", USD: "", CNY: "" };
      for (const c of FOREIGN_QUOTE_CURRENCIES) {
        const q = findQuoteRate(current.quotes, c);
        if (q) {
          const perKrw = krwPerOneToForeign(q.rateToKrw);
          nextInputs[c] = perKrw != null ? String(perKrw) : "";
        }
      }
      setManualInputs(nextInputs);
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
      await triggerExchangeRateFetch();
      await loadData();
      toast.success(t("admin.exchange.toast.refreshSuccess"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("admin.exchange.toast.refreshError");
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  };

  const saveManualRate = async (currency: string) => {
    const raw = manualInputs[currency] ?? "";
    const num = parseFloat(raw);
    if (!raw || isNaN(num) || num <= 0) {
      toast.error(t("admin.exchange.toast.invalidRate"));
      return;
    }
    const rateToKrw = foreignPerKrwToRateToKrw(num);
    if (rateToKrw == null) {
      toast.error(t("admin.exchange.toast.invalidRate"));
      return;
    }
    try {
      setSavingCurrency(currency);
      await setManualExchangeRate(currency, rateToKrw);
      await loadData();
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
      toast.error("수수료율 저장에 실패했습니다");
    }
  };

  if (loading && !currentRates) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t("admin.exchange.loading")}</p>
      </div>
    );
  }

  const latestFetchedAt = currentRates?.fetchedAt;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.exchange.title")}</h1>
        <p className="text-gray-600 mt-1">{t("admin.exchange.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>{t("admin.exchange.quote.title")}</span>
              </CardTitle>
              <CardDescription>
                {t("admin.exchange.quote.desc")}
                {latestFetchedAt && (
                  <span className="block mt-1 text-sm">
                    {formatDate(latestFetchedAt, locale, fetchedAtOptions)} {t("admin.exchange.asOf")}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={fetchRubFromApi} disabled={fetching} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
              {t("admin.exchange.apiRefresh")} (RUB)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {FOREIGN_QUOTE_CURRENCIES.map((currency) => {
            const quote = currentRates ? findQuoteRate(currentRates.quotes, currency) : undefined;
            return (
              <div key={currency} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{currency}</span>
                  {quote && (
                    <Badge variant={quote.source === "API" ? "default" : "secondary"}>
                      {quote.source === "API"
                        ? t("admin.exchange.sourceApi")
                        : t("admin.exchange.sourceManual")}
                    </Badge>
                  )}
                </div>
                {quote ? (
                  <p className="text-2xl font-bold tabular-nums">
                    {formatKrwBasisRate(currency, quote.rateToKrw, locale)}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">{t("admin.exchange.noRate")}</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor={`manual-${currency}`}>
                    {t("admin.exchange.quote.rateLabel")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`manual-${currency}`}
                      type="number"
                      step="any"
                      min="0"
                      placeholder={t("admin.exchange.quote.placeholder")}
                      value={manualInputs[currency] ?? ""}
                      onChange={(e) =>
                        setManualInputs((prev) => ({ ...prev, [currency]: e.target.value }))
                      }
                    />
                    <span className="self-center text-sm text-gray-500 shrink-0">
                      {t("admin.exchange.quote.unitForeign").replace("{{currency}}", currency)}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => saveManualRate(currency)}
                    disabled={savingCurrency === currency}
                  >
                    {t("admin.exchange.quote.save")}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.exchange.feeCard.title")}</CardTitle>
          <CardDescription>{t("admin.exchange.feeCard.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="fee-rate">{t("admin.exchange.feeCard.label")}</Label>
              <Input
                id="fee-rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={feeRate}
                onChange={(e) => setFeeRate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={updateFeeRate} className="mt-6">
              {t("common.save")}
            </Button>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>{t("admin.exchange.feeCard.current")}</strong> {feeRate}%
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t("admin.exchange.feeCard.example").replace(
                "{{fee}}",
                formatNumber(100000 * parseFloat(feeRate || "0") / 100, locale)
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.exchange.history.title")}</CardTitle>
          <CardDescription>{t("admin.exchange.history.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.exchange.history.currency")}</TableHead>
                <TableHead>{t("admin.exchange.history.rate")}</TableHead>
                <TableHead>{t("admin.exchange.history.source")}</TableHead>
                <TableHead>{t("admin.exchange.history.status")}</TableHead>
                <TableHead>{t("admin.exchange.history.fetchedAt")}</TableHead>
                <TableHead>{t("admin.exchange.history.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    {t("admin.exchange.historyEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                history.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.baseCurrency}</TableCell>
                    <TableCell>
                      {formatKrwBasisRate(rate.baseCurrency, Number(rate.rate), locale) ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rate.source === "API" ? "default" : "secondary"}>
                        {rate.source === "API"
                          ? t("admin.exchange.badgeApi")
                          : t("admin.exchange.badgeManual")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rate.isCurrent ? (
                        <Badge variant="default">{t("admin.exchange.statusCurrent")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("admin.exchange.statusPrevious")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {rate.fetchedAt ? formatDate(rate.fetchedAt, locale, fetchedAtOptions) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {rate.createdAt ? formatDate(rate.createdAt, locale) : "—"}
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
