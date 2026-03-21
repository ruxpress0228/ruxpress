import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, Edit } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  api,
  getCurrentExchangeRate,
  getExchangeRateHistory,
  triggerExchangeRateFetch,
  setManualExchangeRate,
} from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate, formatNumber } from "../../utils/format";
import type { ExchangeRate } from "../../types";

const fetchedAtOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export default function AdminExchangeRate() {
  const { t, locale } = useTranslation();
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
  const [history, setHistory] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [feeRate, setFeeRate] = useState("12");

  const loadData = async () => {
    try {
      setLoading(true);
      const [current, historyRes] = await Promise.all([
        getCurrentExchangeRate(),
        getExchangeRateHistory(0, 20),
      ]);
      setCurrentRate(current);
      setHistory(historyRes.content ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.exchange.toast.loadError');
      toast.error(msg);
      setCurrentRate(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeRate = async () => {
    try {
      const res = await api.get<{ key: string; value: string }>("/v1/admin/settings/fee-rate");
      setFeeRate(unwrap(res).value);
    } catch { /* keep default */ }
  };

  useEffect(() => {
    loadData();
    loadFeeRate();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      setFetching(true);
      await triggerExchangeRateFetch();
      await loadData();
      toast.success(t('admin.exchange.toast.refreshSuccess'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.exchange.toast.refreshError');
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  };

  const updateManualRate = async () => {
    const num = parseFloat(newRate);
    if (!newRate || isNaN(num) || num <= 0) {
      toast.error(t('admin.exchange.toast.invalidRate'));
      return;
    }
    try {
      await setManualExchangeRate(num);
      await loadData();
      toast.success(t('admin.exchange.toast.manualSuccess'));
      setIsManualDialogOpen(false);
      setNewRate("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('admin.exchange.toast.manualError');
      toast.error(msg);
    }
  };

  const updateFeeRate = async () => {
    try {
      await api.put<{ key: string; value: string }>("/v1/admin/settings/fee-rate", { value: feeRate });
      toast.success(t('admin.exchange.toast.feeSuccess'));
    } catch {
      toast.error("수수료율 저장에 실패했습니다");
    }
  };

  if (loading && !currentRate) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t('admin.exchange.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.exchange.title')}</h1>
        <p className="text-gray-600 mt-1">{t('admin.exchange.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>{t('admin.exchange.currentTitle')}</span>
              </CardTitle>
              <CardDescription>
                {currentRate?.fetchedAt
                  ? formatDate(currentRate.fetchedAt, locale, fetchedAtOptions) + " " + t('admin.exchange.asOf')
                  : "—"}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchExchangeRate} disabled={fetching}>
                <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
                {t('admin.exchange.apiRefresh')}
              </Button>
              <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    {t('admin.exchange.manual')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('admin.exchange.manualDialog.title')}</DialogTitle>
                    <DialogDescription>
                      {t('admin.exchange.manualDialog.desc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-rate">{t('admin.exchange.manualDialog.rateLabel')}</Label>
                      <Input
                        id="manual-rate"
                        type="number"
                        step="0.01"
                        placeholder={t('admin.exchange.manualDialog.placeholder')}
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={updateManualRate}>
                        {t('common.apply')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentRate ? (
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-900">
                1 RUB = {Number(currentRate.rate).toFixed(2)} KRW
              </span>
              <Badge variant={currentRate.source === "API" ? "default" : "secondary"}>
                {currentRate.source === "API" ? t('admin.exchange.sourceApi') : t('admin.exchange.sourceManual')}
              </Badge>
            </div>
          ) : (
            <p className="text-gray-500">{t('admin.exchange.noRate')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.exchange.feeCard.title')}</CardTitle>
          <CardDescription>
            {t('admin.exchange.feeCard.desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="fee-rate">{t('admin.exchange.feeCard.label')}</Label>
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
              {t('common.save')}
            </Button>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>{t('admin.exchange.feeCard.current')}</strong> {feeRate}%
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t('admin.exchange.feeCard.example').replace('{{fee}}', formatNumber(100000 * parseFloat(feeRate || "0") / 100, locale))}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.exchange.history.title')}</CardTitle>
          <CardDescription>
            {t('admin.exchange.history.desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.exchange.history.rate')}</TableHead>
                <TableHead>{t('admin.exchange.history.source')}</TableHead>
                <TableHead>{t('admin.exchange.history.status')}</TableHead>
                <TableHead>{t('admin.exchange.history.fetchedAt')}</TableHead>
                <TableHead>{t('admin.exchange.history.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    {t('admin.exchange.historyEmpty')}
                  </TableCell>
                </TableRow>
              ) : (
                history.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">
                      1 RUB = {Number(rate.rate).toFixed(2)} KRW
                    </TableCell>
                    <TableCell>
                      <Badge variant={rate.source === "API" ? "default" : "secondary"}>
                        {rate.source === "API" ? t('admin.exchange.badgeApi') : t('admin.exchange.badgeManual')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rate.isCurrent ? (
                        <Badge variant="default">{t('admin.exchange.statusCurrent')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('admin.exchange.statusPrevious')}</Badge>
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
