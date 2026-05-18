import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ShoppingCart, MessageSquare, FileText, TrendingUp, ArrowRight, Calculator, ArrowLeftRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { formatDate, formatNumber } from "../../utils/format";
import type { ExchangeRate, Notice, PageResponse } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";

export default function Home() {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRate } = useExchangeRate();
  const { getRecentPurchaseRequests } = usePurchase();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<ExchangeRate | null>(null);
  const [myRequests, setMyRequests] = useState<PurchaseRequestListItem[]>([]);
  const [converterMode, setConverterMode] = useState<"krw-left" | "rub-left">("krw-left");
  const [converterAmount, setConverterAmount] = useState<string>("");
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);

  useEffect(() => {
    getCurrentExchangeRate()
      .then(setCurrentExchangeRate)
      .catch(() => setCurrentExchangeRate(null));

    getRecentPurchaseRequests()
      .then(setMyRequests)
      .catch(() => setMyRequests([]));

    api
      .get<PageResponse<Notice>>("/v1/notices?page=0&size=3")
      .then((res) => setRecentNotices(unwrap(res).content))
      .catch(() => setRecentNotices([]));
  }, []);

  const numOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const handleConverterSwap = () => {
    if (!currentExchangeRate) {
      setConverterMode((m) => (m === "krw-left" ? "rub-left" : "krw-left"));
      return;
    }
    const r = Number(currentExchangeRate.rate);
    if (converterAmount === "" || Number.isNaN(Number(converterAmount))) {
      setConverterMode((m) => (m === "krw-left" ? "rub-left" : "krw-left"));
      return;
    }
    const n = Number(converterAmount);
    if (converterMode === "krw-left") {
      setConverterAmount(String(round2(n / r)));
      setConverterMode("rub-left");
    } else {
      setConverterAmount(String(round2(n * r)));
      setConverterMode("krw-left");
    }
  };

  const converterRightDisplay = (): string => {
    if (!currentExchangeRate || converterAmount === "" || Number.isNaN(Number(converterAmount))) return "";
    const r = Number(currentExchangeRate.rate);
    if (r <= 0) return "";
    const n = Number(converterAmount);
    if (converterMode === "krw-left") {
      return formatNumber(round2(n / r), locale, numOpt);
    }
    return formatNumber(round2(n * r), locale, numOpt);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-8 md:p-12 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {t('home.hero.title')}
        </h1>
        <p className="text-lg md:text-xl text-blue-50 mb-6">
          {t('home.hero.subtitle')}
        </p>
        <Link to="/purchase/new">
          <Button size="lg" variant="secondary" className="font-semibold">
            {t('home.hero.cta')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Recent Notices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('home.recentNotices.title')}</CardTitle>
            <Link to="/notice">
              <Button variant="ghost" size="sm">
                {t('home.recentNotices.viewAll')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentNotices.length > 0 ? (
            <div className="space-y-3">
              {recentNotices.map((notice) => (
                <Link key={notice.id} to={`/notice/${notice.id}`}>
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {notice.isPinned && (
                            <Badge variant="destructive" className="text-xs">{t('home.notice.pinned')}</Badge>
                          )}
                          <span className="font-medium text-gray-900">{notice.title}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {notice.publishedAt ? formatDate(notice.publishedAt, locale) : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>{t('home.recentNotices.empty')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('home.recentRequests.title')}</CardTitle>
            <Link to="/purchase">
              <Button variant="ghost" size="sm">
                {t('home.recentRequests.viewAll')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {myRequests.length > 0 ? (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <Link key={request.id} to={`/purchase/${request.id}`}>
                  <div className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            {request.productName}
                          </span>
                          <Badge variant={
                            request.status === 'DELIVERED' ? 'default' :
                            request.status === 'PURCHASING' ? 'secondary' :
                            'outline'
                          }>
                            {request.status === 'REVIEWING' && t('home.status.reviewing')}
                            {request.status === 'PURCHASING' && t('home.status.purchasing')}
                            {request.status === 'DELIVERED' && t('home.status.delivered')}
                            {request.status !== 'REVIEWING' && request.status !== 'PURCHASING' && request.status !== 'DELIVERED' && request.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900">
                          ₩{request.totalAmountKrw != null ? formatNumber(request.totalAmountKrw, locale) : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-gray-500 min-w-0">
                      <span className="truncate min-w-0" title={request.requestNumber}>
                        {request.requestNumber}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatDate(request.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>{t('home.recentRequests.empty')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exchange Rate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <CardTitle>{t('home.exchange.title')}</CardTitle>
            </div>
            {currentExchangeRate?.fetchedAt && (
              <Badge variant="secondary">
                {formatDate(currentExchangeRate.fetchedAt, locale)} {t('home.exchange.asOf')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentExchangeRate ? (
            <>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">
                  1 RUB = {Number(currentExchangeRate.rate).toFixed(2)} KRW
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t('home.exchange.autoUpdate')}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{t('home.exchange.calcTitle')}</span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-h-10 flex-1 min-w-0 items-center rounded-md border border-input bg-background px-0 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                    {converterMode === "krw-left" ? (
                      <span className="pl-3 text-sm text-muted-foreground tabular-nums">₩</span>
                    ) : null}
                    <Input
                      id="home-converter-left"
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder={converterMode === "krw-left" ? "10000" : "1000"}
                      value={converterAmount}
                      onChange={(e) => setConverterAmount(e.target.value)}
                      aria-label={converterMode === "krw-left" ? t("home.exchange.krw") : t("home.exchange.rub")}
                      className="border-0 shadow-none focus-visible:ring-0 text-lg flex-1 min-w-0"
                    />
                    <span className="pr-3 text-xs font-medium text-gray-500 tabular-nums shrink-0">
                      {converterMode === "krw-left" ? "KRW" : "RUB"}
                    </span>
                  </div>

                  <div className="flex justify-center shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-full shrink-0"
                      onClick={handleConverterSwap}
                      title={t("home.exchange.swap")}
                      aria-label={t("home.exchange.swap")}
                    >
                      <ArrowLeftRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex min-h-10 flex-1 min-w-0 items-center rounded-md border border-input bg-muted/40 px-0 shadow-inner">
                    {converterMode === "rub-left" ? (
                      <span className="pl-3 text-sm text-muted-foreground tabular-nums">₩</span>
                    ) : null}
                    <Input
                      id="home-converter-right"
                      readOnly
                      tabIndex={-1}
                      value={converterRightDisplay()}
                      placeholder={t('home.exchange.placeholder')}
                      aria-label={
                        converterMode === "krw-left"
                          ? `${t("home.exchange.rub")} (${t("home.exchange.placeholder")})`
                          : `${t("home.exchange.krw")} (${t("home.exchange.placeholder")})`
                      }
                      className="border-0 shadow-none bg-transparent text-lg font-semibold flex-1 min-w-0 cursor-default"
                    />
                    <span className="pr-3 text-xs font-medium text-gray-500 tabular-nums shrink-0">
                      {converterMode === "krw-left" ? "RUB" : "KRW"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">{t('home.exchange.loading')}</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/purchase/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardHeader>
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>{t('home.quick.purchase.title')}</CardTitle>
              <CardDescription>
                {t('home.quick.purchase.desc')}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/inquiry/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>{t('home.quick.inquiry.title')}</CardTitle>
              <CardDescription>
                {t('home.quick.inquiry.desc')}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/notice">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <CardHeader>
              <FileText className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>{t('home.quick.notice.title')}</CardTitle>
              <CardDescription>
                {t('home.quick.notice.desc')}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
