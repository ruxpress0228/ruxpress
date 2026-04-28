import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseRequestListItem } from "../../types/purchase";

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

const PAGE_SIZE = 20;

export default function AdminPurchaseRequests() {
  const navigate = useNavigate();
  const { getAdminPurchaseRequests } = usePurchase();
  const [requests, setRequests] = useState<PurchaseRequestListItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | "all">("all");
  const [sort, setSort] = useState<"createdAt,desc" | "createdAt,asc">("createdAt,desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminPurchaseRequests({
        page,
        size: PAGE_SIZE,
        sort,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setRequests(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as PurchaseRequestStatus | "all");
    setPage(0);
  };

  const handleSort = (value: string) => {
    setSort(value as "createdAt,desc" | "createdAt,asc");
    setPage(0);
  };

  const filtered = search.trim()
    ? requests.filter((r) =>
        r.requestNumber.includes(search) ||
        r.productName.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">구매 요청 관리</h1>
          <p className="text-gray-600 mt-1">고객 구매 요청을 관리합니다</p>
        </div>
        <span className="text-sm text-gray-500">총 {totalElements}건</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="요청번호, 상품명 검색"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="DRAFT">작성중</SelectItem>
                <SelectItem value="SUBMITTED">제출됨</SelectItem>
                <SelectItem value="REVIEWING">검토중</SelectItem>
                <SelectItem value="CONFIRMED">확정</SelectItem>
                <SelectItem value="PURCHASING">구매중</SelectItem>
                <SelectItem value="PURCHASED">구매완료</SelectItem>
                <SelectItem value="SHIPPING">배송중</SelectItem>
                <SelectItem value="DELIVERED">배송완료</SelectItem>
                <SelectItem value="CANCELLED">취소됨</SelectItem>
                <SelectItem value="REFUNDED">환불됨</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={handleSort}>
              <SelectTrigger>
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt,desc">최신순</SelectItem>
                <SelectItem value="createdAt,asc">오래된순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>요청번호</TableHead>
                <TableHead>상품명</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>금액(원)</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    구매 요청이 없습니다
                  </TableCell>
                </TableRow>
              ) : filtered.map((request) => {
                const statusInfo = statusLabels[request.status];
                return (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/admin/purchase-requests/${request.id}`)}
                  >
                    <TableCell className="font-medium text-sm">{request.requestNumber}</TableCell>
                    <TableCell className="font-medium">{request.productName}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>
                      {request.totalAmountKrw != null
                        ? `₩${request.totalAmountKrw.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
