import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { ShoppingCart, MessageSquare, FileText, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { formatDate } from "../../utils/format";
import type { Notice, PageResponse } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";
import {
  type QuoteCurrency,
  type CurrentExchangeRates,
  QUOTE_CURRENCIES,
  buildRateMap,
  formatCrossRateLine,
  normalizeBaseAmount,
  otherCurrencies,
} from "../../utils/exchange";

export default function Home() {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRates } = useExchangeRate();
  const { getRecentPurchaseRequests } = usePurchase();
  const [ratesData, setRatesData] = useState<CurrentExchangeRates | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<QuoteCurrency>("KRW");
  const [baseAmountInput, setBaseAmountInput] = useState("1");
  const [myRequests, setMyRequests] = useState<PurchaseRequestListItem[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);

  const rateMap = useMemo(
    () => (ratesData ? buildRateMap(ratesData.quotes) : new Map<string, number>()),
    [ratesData]
  );
  const baseAmount = useMemo(() => normalizeBaseAmount(baseAmountInput), [baseAmountInput]);

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRatesData)
      .catch(() => setRatesData(null));

    getRecentPurchaseRequests()
      .then(setMyRequests)
      .catch(() => setMyRequests([]));

    api
      .get<PageResponse<Notice>>("/v1/notices?page=0&size=3")
      .then((res) => setRecentNotices(unwrap(res).content))
      .catch(() => setRecentNotices([]));
  }, []);

  const currencyLabel = (c: QuoteCurrency) => t(`home.exchange.currencies.${c}`);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-8 md:p-12 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("home.hero.title")}</h1>
        <p className="text-lg md:text-xl text-blue-50 mb-6">{t("home.hero.subtitle")}</p>
        <Link to="/purchase/new">
          <Button size="lg" variant="secondary" className="font-semibold">
            {t("home.hero.cta")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("home.recentNotices.title")}</CardTitle>
            <Link to="/notice">
              <Button variant="ghost" size="sm">
                {t("home.recentNotices.viewAll")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentNotices.length > 0 ? (
            <div className="space-y-3">
              {recentNotices.map((notice) => (
                <Link
                  key={notice.id}
                  to={`/notice/${notice.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{notice.title}</span>
                    <span className="text-sm text-gray-500">{formatDate(notice.createdAt, locale)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">{t("home.recentNotices.empty")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("home.recentRequests.title")}</CardTitle>
            <Link to="/purchase">
              <Button variant="ghost" size="sm">
                {t("home.recentRequests.viewAll")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {myRequests.length > 0 ? (
            <div className="space-y-3">
              {myRequests.map((request) => (
                <Link
                  key={request.id}
                  to={`/purchase/${request.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{request.productName}</p>
                      <p className="text-sm text-gray-500">{request.requestNumber}</p>
                    </div>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>{t("home.recentRequests.empty")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <CardTitle>{t("home.exchange.title")}</CardTitle>
            </div>
            {ratesData?.fetchedAt && (
              <Badge variant="secondary">
                {formatDate(ratesData.fetchedAt, locale)} {t("home.exchange.asOf")}
              </Badge>
            )}
          </div>
          <CardDescription>{t("home.exchange.autoUpdate")}</CardDescription>
        </CardHeader>
        <CardContent>
          {ratesData && ratesData.quotes.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500 mb-2">{t("home.exchange.baseCurrency")}</p>
                  <Tabs
                    value={baseCurrency}
                    onValueChange={(v) => setBaseCurrency(v as QuoteCurrency)}
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      {QUOTE_CURRENCIES.map((c) => (
                        <TabsTrigger key={c} value={c} className="text-xs sm:text-sm">
                          {c}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div>
                  <Label htmlFor="exchange-base-amount" className="text-sm text-gray-500">
                    {t("home.exchange.baseAmount")}
                  </Label>
                  <Input
                    id="exchange-base-amount"
                    type="number"
                    min="0"
                    step="any"
                    className="mt-2"
                    value={baseAmountInput}
                    onChange={(e) => setBaseAmountInput(e.target.value)}
                    onBlur={() => {
                      const normalized = normalizeBaseAmount(baseAmountInput);
                      setBaseAmountInput(String(normalized));
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t("home.exchange.baseAmountHint").replace("{{currency}}", baseCurrency)}
                  </p>
                </div>
              </div>
              <ul className="space-y-3 rounded-lg border bg-muted/30 p-4">
                {otherCurrencies(baseCurrency).map((target) => {
                  const line = formatCrossRateLine(
                    baseCurrency,
                    target,
                    rateMap,
                    locale,
                    baseAmount
                  );
                  return (
                    <li
                      key={target}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-lg font-semibold text-gray-900"
                    >
                      <span className="text-sm font-normal text-gray-500">
                        {currencyLabel(target)}
                      </span>
                      <span className="tabular-nums">
                        {line ?? t("home.exchange.rateUnavailable")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">{t("home.exchange.loading")}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/purchase/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardHeader>
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>{t("home.quick.purchase.title")}</CardTitle>
              <CardDescription>{t("home.quick.purchase.desc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/inquiry">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>{t("home.quick.inquiry.title")}</CardTitle>
              <CardDescription>{t("home.quick.inquiry.desc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/notice">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardHeader>
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>{t("home.quick.notice.title")}</CardTitle>
              <CardDescription>{t("home.quick.notice.desc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
