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
  getCurrentExchangeRate,
  getExchangeRateHistory,
  triggerExchangeRateFetch,
  setManualExchangeRate,
} from "../../utils/api";
import type { ExchangeRate } from "../../types";

function formatFetchedAt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminExchangeRate() {
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
      const msg = e instanceof Error ? e.message : "환율 정보를 불러오지 못했습니다";
      toast.error(msg);
      setCurrentRate(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      setFetching(true);
      await triggerExchangeRateFetch();
      await loadData();
      toast.success("환율이 업데이트되었습니다");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "환율 갱신에 실패했습니다";
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  };

  const updateManualRate = async () => {
    const num = parseFloat(newRate);
    if (!newRate || isNaN(num) || num <= 0) {
      toast.error("올바른 환율을 입력해주세요");
      return;
    }
    try {
      await setManualExchangeRate(num);
      await loadData();
      toast.success("환율이 수동으로 설정되었습니다");
      setIsManualDialogOpen(false);
      setNewRate("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "수동 환율 설정에 실패했습니다";
      toast.error(msg);
    }
  };

  const updateFeeRate = () => {
    toast.success("수수료율이 업데이트되었습니다");
  };

  if (loading && !currentRate) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">환율 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">환율 설정</h1>
        <p className="text-gray-600 mt-1">환율 및 수수료율을 관리합니다</p>
      </div>

      {/* Current Rate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>현재 적용 환율</span>
              </CardTitle>
              <CardDescription>
                {currentRate?.fetchedAt
                  ? formatFetchedAt(currentRate.fetchedAt) + " 기준"
                  : "—"}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchExchangeRate} disabled={fetching}>
                <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
                API 갱신
              </Button>
              <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    수동 입력
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>환율 수동 입력</DialogTitle>
                    <DialogDescription>
                      환율을 직접 입력하여 설정합니다
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-rate">환율 (1 RUB = ? KRW)</Label>
                      <Input
                        id="manual-rate"
                        type="number"
                        step="0.01"
                        placeholder="15.00"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                        취소
                      </Button>
                      <Button onClick={updateManualRate}>
                        적용
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
                {currentRate.source === "API" ? "API 자동" : "수동 입력"}
              </Badge>
            </div>
          ) : (
            <p className="text-gray-500">환율 정보가 없습니다. API 갱신을 실행해주세요.</p>
          )}
        </CardContent>
      </Card>

      {/* Fee Settings */}
      <Card>
        <CardHeader>
          <CardTitle>수수료 설정</CardTitle>
          <CardDescription>
            구매대행 수수료율을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="fee-rate">기본 수수료율 (%)</Label>
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
              저장
            </Button>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>현재 설정:</strong> {feeRate}%
            </p>
            <p className="text-sm text-blue-700 mt-1">
              예시: 100,000원 상품 → 수수료 {(100000 * parseFloat(feeRate || "0") / 100).toLocaleString()}원
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rate History */}
      <Card>
        <CardHeader>
          <CardTitle>환율 히스토리</CardTitle>
          <CardDescription>
            최근 환율 변경 이력을 확인합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>환율</TableHead>
                <TableHead>출처</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>조회/입력 시각</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    히스토리가 없습니다
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
                        {rate.source === "API" ? "API" : "수동"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rate.isCurrent ? (
                        <Badge variant="default">현재 적용중</Badge>
                      ) : (
                        <Badge variant="outline">이전</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {rate.fetchedAt ? formatFetchedAt(rate.fetchedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {rate.createdAt ? new Date(rate.createdAt).toLocaleDateString("ko-KR") : "—"}
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
