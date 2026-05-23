import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Filter, Wallet } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { useBalance } from "../../hooks/balance/useBalance";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";
import { toast } from "sonner";

const statusLabels: Record<PurchaseRequestStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  DRAFT: { label: '작성중', variant: 'outline' },
  SUBMITTED: { label: '제출됨', variant: 'secondary' },
  REVIEWING: { label: '검토중', variant: 'secondary' },
  CONFIRMED: { label: '확정', variant: 'default' },
  PURCHASING: { label: '구매중', variant: 'default' },
  PURCHASED: { label: '구매완료', variant: 'default' },
  SHIPPING: { label: '배송중', variant: 'default' },
  DELIVERED: { label: '배송완료', variant: 'default' },
  CANCELLED: { label: '취소됨', variant: 'destructive' },
  REFUNDED: { label: '환불됨', variant: 'destructive' },
};

export default function PurchaseRequestList() {
  const { getMyPurchaseRequests, getRecentPurchaseRequests } = usePurchase();
  const { balance } = useBalance();
  const [requests, setRequests] = useState<PurchaseRequestListItem[]>([]);
  const [recentRequests, setRecentRequests] = useState<PurchaseRequestListItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortValue, setSortValue] = useState<"latest" | "oldest">("latest");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const sort = sortValue === "oldest" ? "createdAt,asc" : "createdAt,desc";
        const status = statusFilter === "all" ? undefined : (statusFilter as PurchaseRequestStatus);
        const [pageData, recentData] = await Promise.all([
          getMyPurchaseRequests({ page: 0, size: 20, sort, status }),
          getRecentPurchaseRequests(),
        ]);
        setRequests(pageData.content);
        setRecentRequests(recentData);
      } catch {
        toast.error("구매 요청 목록 조회에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [statusFilter, sortValue]);

  const filteredRequests = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return requests;
    return requests.filter((r) =>
      r.requestNumber.toLowerCase().includes(keyword) || r.requestName.toLowerCase().includes(keyword)
    );
  }, [requests, searchKeyword]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">구매 요청</h1>
          <p className="text-gray-600 mt-1">내 구매 요청 내역을 확인하세요</p>
        </div>
        <div className="flex w-full shrink-0 items-center justify-between gap-3 md:w-auto md:justify-end">
          <Link
            to="/wallet"
            className="flex min-w-0 items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 hover:bg-blue-100 transition-colors sm:px-4"
            title="지갑·내역으로 이동"
          >
            <Wallet className="h-5 w-5 shrink-0 text-blue-700" />
            <div className="min-w-0 text-right leading-tight">
              <p className="text-xs text-blue-700">현재 잔액</p>
              <p className="truncate text-lg font-bold text-blue-700">
                ₩{(balance ?? 0).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </Link>
          <Link to="/purchase/new" className="shrink-0">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              새 요청
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="요청번호, 상품명 검색"
                className="pl-10"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="REVIEWING">검토중</SelectItem>
                <SelectItem value="PURCHASING">구매중</SelectItem>
                <SelectItem value="SHIPPING">배송중</SelectItem>
                <SelectItem value="DELIVERED">배송완료</SelectItem>
                <SelectItem value="DRAFT">작성중</SelectItem>
                <SelectItem value="SUBMITTED">제출됨</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortValue} onValueChange={(v) => setSortValue(v as "latest" | "oldest")}>
              <SelectTrigger>
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="oldest">오래된순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">최근 구매요청 3건</h3>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-gray-500">최근 구매요청이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {recentRequests.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm min-w-0">
                  <span className="truncate min-w-0">{item.requestName}</span>
                  <span
                    className="text-gray-500 truncate min-w-0 max-w-[45%] text-right"
                    title={item.requestNumber}
                  >
                    {item.requestNumber}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const statusInfo = statusLabels[request.status];
          return (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.requestName}
                      </h3>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 flex gap-x-1 min-w-0 items-baseline">
                      <span className="shrink-0">요청번호:</span>
                      <span className="truncate min-w-0" title={request.requestNumber}>
                        {request.requestNumber}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-gray-900">
                      ₩{(request.totalAmountKrw ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    수량: {request.quantity}개
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/purchase/${request.id}`}>
                      <Button variant="outline" size="sm">
                        상세보기
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && filteredRequests.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              구매 요청이 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              원하는 상품의 구매 요청을 시작해보세요
            </p>
            <Link to="/purchase/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                구매 요청하기
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
