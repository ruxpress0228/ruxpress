import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from 'react-router';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import type { PurchaseRequestStatus } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { PurchaseRequestDetail } from "../../types/purchase";
import {
  adminListPurchaseRequests,
  adminUpdatePurchaseStatus,
  adminCreditPurchaseWallet,
} from "../../api/adminPurchase";
import { useTranslation } from "../../hooks/useTranslation";
import { formatNumber } from "../../utils/format";

function getAdminRole(): string | null {
  try {
    const raw = localStorage.getItem("ruxpress_admin");
    if (!raw) return null;
    return JSON.parse(raw).role as string;
  } catch {
    return null;
  }
}

const statusLabels: Record<
  PurchaseRequestStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "작성중", variant: "outline" },
  SUBMITTED: { label: "제출됨", variant: "secondary" },
  REVIEWING: { label: "검토중", variant: "secondary" },
  CONFIRMED: { label: "확정", variant: "default" },
  PURCHASING: { label: "구매중", variant: "default" },
  PURCHASED: { label: "구매완료", variant: "default" },
  SHIPPING: { label: "배송중", variant: "default" },
  DELIVERED: { label: "배송완료", variant: "default" },
  CANCELLED: { label: "취소됨", variant: "destructive" },
  REFUNDED: { label: "환불됨", variant: "destructive" },
};

const ALL_STATUSES: PurchaseRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "REVIEWING",
  "CONFIRMED",
  "PURCHASING",
  "PURCHASED",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function AdminPurchaseRequests() {
  const { t, locale } = useTranslation();
  const isSuper = getAdminRole() === "SUPER_ADMIN";
  const [rows, setRows] = useState<PurchaseRequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState<"createdAt,desc" | "createdAt,asc">("createdAt,desc");
  const [emailSearch, setEmailSearch] = useState("");
  const [search, setSearch] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseRequestDetail | null>(null);
  const [newStatus, setNewStatus] = useState<PurchaseRequestStatus>("REVIEWING");
  const [statusMemo, setStatusMemo] = useState("");
  const navigate = useNavigate();
  

  const [walletAmount, setWalletAmount] = useState("");
  const [walletMemo, setWalletMemo] = useState("");
  const [walletIdem, setWalletIdem] = useState("");

  const fetchPage = useCallback(
    async (p: number, status: string) => {
      setLoading(true);
      try {
        const statusParam =
          status && status !== "all" ? (status as PurchaseRequestStatus) : undefined;
        const res = await adminListPurchaseRequests({
          page: p,
          size: 20,
          status: statusParam,
          sort,
        });
        setRows(res.content ?? []);
        setTotalPages(res.totalPages ?? 0);
        setTotalElements(res.totalElements);
        setPage(res.page ?? p);
      } catch {
        toast.error(t("adminPurchase.loadError"));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [t, sort]
  );

  useEffect(() => {
    void fetchPage(0, statusFilter);
  }, [statusFilter, sort, fetchPage]);

  const changePage = (next: number) => {
    void fetchPage(next, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handleSort = (value: string) => {
    setSort(value as "createdAt,desc" | "createdAt,asc");
    setPage(0);
  };

  const openManage = (r: PurchaseRequestDetail) => {
    setSelected(r);
    setNewStatus(r.status);
    setStatusMemo(r.adminMemo ?? "");
    setWalletAmount("");
    setWalletMemo("");
    setWalletIdem(`purchase-${r.id}-${Date.now()}`);
    setDialogOpen(true);
  };

  const saveStatus = async () => {
    if (!selected) return;
    try {
      const updated = await adminUpdatePurchaseStatus(selected.id, {
        status: newStatus,
        adminMemo: statusMemo.trim() || undefined,
      });
      toast.success("저장되었습니다");
      setSelected(updated);
      void fetchPage(page, statusFilter);
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const submitWallet = async () => {
    if (!selected || !isSuper) return;
    const amount = parseFloat(walletAmount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t("admin.bank.invalidAmount"));
      return;
    }
    const settled =
      selected.chargedAmountKrw != null ? selected.chargedAmountKrw - amount : undefined;
    try {
      await adminCreditPurchaseWallet(selected.id, {
        amount,
        idempotencyKey: walletIdem.trim() || `purchase-${selected.id}-${Date.now()}`,
        settledAmountKrw: settled != null && Number.isFinite(settled) ? settled : undefined,
        adminMemo: walletMemo.trim() || undefined,
      });
      toast.success(t("adminPurchase.walletSuccess"));
      setDialogOpen(false);
      void fetchPage(page, statusFilter);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const num0 = { maximumFractionDigits: 0 };

  const filtered = useMemo(() => {
    let list = rows;
    if (emailSearch.trim() !== "") {
      list = list.filter((r) => String(r.userId).includes(emailSearch.trim()));
    }
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.requestNumber.includes(search.trim()) ||
          r.productName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, emailSearch, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("nav.admin.purchaseRequests")}</h1>
          <p className="text-gray-600 mt-1">고객 구매 요청 · 선차감 확인 및 차액 환급</p>
        </div>
        <span className="text-sm text-gray-500">총 {totalElements}건</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="요청번호, 상품명 검색"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Input
              placeholder="회원 ID"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="상태" />
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
            <Button type="button" variant="secondary" onClick={() => void fetchPage(page, statusFilter)}>
              새로고침
            </Button>
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
                    onClick={() => openManage(request)}
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
          <div className="flex items-center justify-between p-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => changePage(page - 1)}
            >
              이전
            </Button>
            <span className="text-sm text-gray-500">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={totalPages <= 0 || page >= totalPages - 1}
              onClick={() => changePage(page + 1)}
            >
              다음
            </Button>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 0}
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={totalPages <= 0 || page >= totalPages - 1}
            onClick={() => changePage(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>구매 요청</DialogTitle>
            <DialogDescription>{selected?.requestNumber}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={() => navigate(`/admin/purchase-requests/${selected.id}`)}
              >
                상세 페이지로 이동 →
              </Button>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-500">회원</span> #{selected.userId}
                </p>
                <p>
                  <span className="text-gray-500">상품</span> {selected.productName}
                </p>
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PurchaseRequestStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.filter((s) => s !== "DRAFT").map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>관리자 메모</Label>
                <Textarea rows={3} value={statusMemo} onChange={(e) => setStatusMemo(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  닫기
                </Button>
                <Button type="button" onClick={() => void saveStatus()}>
                  상태 저장
                </Button>
              </div>

              {isSuper && (
                <div className="border-t pt-4 space-y-3">
                  <div className="text-sm rounded-md bg-gray-50 border px-3 py-2">
                    <span className="text-gray-600">현재 선차감 금액:</span>{" "}
                    <span className="font-semibold">
                      {selected.chargedAmountKrw != null
                        ? `₩${formatNumber(selected.chargedAmountKrw, locale, num0)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="font-semibold">{t("adminPurchase.walletCreditTitle")}</p>
                    <p className="text-xs text-gray-500">{t("adminPurchase.walletIdempotencyHint")}</p>
                    <div className="space-y-2">
                      <Label>{t("adminPurchase.walletAmount")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={walletAmount}
                        onChange={(e) => setWalletAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("adminPurchase.walletSettled")}</Label>
                      <p className="text-sm font-semibold border rounded-md px-3 py-2 bg-gray-50">
                        {selected.chargedAmountKrw != null && walletAmount !== ""
                          ? `₩${formatNumber(selected.chargedAmountKrw - parseFloat(walletAmount.replace(/,/g, "") || "0"), locale, num0)}`
                          : "—"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Idempotency key</Label>
                      <Input value={walletIdem} onChange={(e) => setWalletIdem(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("adminPurchase.walletMemo")}</Label>
                      <Textarea rows={2} value={walletMemo} onChange={(e) => setWalletMemo(e.target.value)} />
                    </div>
                    <Button type="button" className="w-full" onClick={() => void submitWallet()}>
                      {t("adminPurchase.walletSubmit")}
                    </Button>
                  </div>
                </div>
              )}
              {!isSuper && <p className="text-xs text-amber-700">{t("admin.bank.superOnly")}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
