import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ShoppingCart, MessageSquare, FileText, TrendingUp, ArrowRight, Calculator } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { mockNotices } from "../../data/mockData";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { formatDate, formatNumber } from "../../utils/format";
import type { ExchangeRate } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";

export default function Home() {
  const { t, locale } = useTranslation();
  const { getCurrentExchangeRate } = useExchangeRate();
  const { getRecentPurchaseRequests } = usePurchase();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<ExchangeRate | null>(null);
  const [myRequests, setMyRequests] = useState<PurchaseRequestListItem[]>([]);
  const [converterRub, setConverterRub] = useState<string>("");
  const [converterKrw, setConverterKrw] = useState<string>("");
  const recentNotices = mockNotices.filter(n => n.status === 'PUBLISHED').slice(0, 3);

  useEffect(() => {
    getCurrentExchangeRate()
      .then(setCurrentExchangeRate)
      .catch(() => setCurrentExchangeRate(null));

    getRecentPurchaseRequests()
      .then(setMyRequests)
      .catch(() => setMyRequests([]));
  }, []);

  const numOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

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
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{t('home.exchange.calcTitle')}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="home-converter-krw-input">{t('home.exchange.krwToRub')}</Label>
                    <Input
                      id="home-converter-krw-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder=""
                      value={converterKrw}
                      onChange={(e) => setConverterKrw(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="flex items-center justify-center sm:justify-start text-gray-400">
                    <span className="text-xl">→</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="home-converter-rub-result">{t('home.exchange.rub')}</Label>
                    <Input
                      id="home-converter-rub-result"
                      readOnly
                      className="text-lg font-semibold bg-gray-50"
                      value={
                        converterKrw !== "" && !Number.isNaN(Number(converterKrw)) && Number(currentExchangeRate.rate) > 0
                          ? formatNumber(Math.round((Number(converterKrw) / Number(currentExchangeRate.rate)) * 100) / 100, locale, numOpt)
                          : ""
                      }
                      placeholder={t('home.exchange.placeholder')}
                    />
                  </div>
                </div>
                {converterKrw !== "" && !Number.isNaN(Number(converterKrw)) && Number(converterKrw) > 0 && Number(currentExchangeRate.rate) > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ₩{formatNumber(Number(converterKrw), locale)} = {formatNumber(Math.round((Number(converterKrw) / Number(currentExchangeRate.rate)) * 100) / 100, locale, numOpt)} RUB
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-end gap-4 mt-6">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="home-converter-rub">{t('home.exchange.rubToKrw')}</Label>
                    <Input
                      id="home-converter-rub"
                      type="number"
                      min="0"
                      step="1"
                      placeholder=""
                      value={converterRub}
                      onChange={(e) => setConverterRub(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="flex items-center justify-center sm:justify-start text-gray-400">
                    <span className="text-xl">→</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="home-converter-krw">{t('home.exchange.krw')}</Label>
                    <Input
                      id="home-converter-krw"
                      readOnly
                      className="text-lg font-semibold bg-gray-50"
                      value={
                        converterRub !== "" && !Number.isNaN(Number(converterRub))
                          ? `₩${formatNumber(Math.round(Number(converterRub) * Number(currentExchangeRate.rate) * 100) / 100, locale, numOpt)}`
                          : ""
                      }
                      placeholder={t('home.exchange.placeholder')}
                    />
                  </div>
                </div>
                {converterRub !== "" && !Number.isNaN(Number(converterRub)) && Number(converterRub) > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {formatNumber(Number(converterRub), locale)} RUB = ₩{formatNumber(Math.round(Number(converterRub) * Number(currentExchangeRate.rate) * 100) / 100, locale, numOpt)}
                  </p>
                )}
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
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
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
                    <p className="text-sm text-gray-500">
                      {request.requestNumber} · {formatDate(request.createdAt, locale)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₩{request.totalAmountKrw != null ? formatNumber(request.totalAmountKrw, locale) : ""}
                    </p>
                  </div>
                </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
