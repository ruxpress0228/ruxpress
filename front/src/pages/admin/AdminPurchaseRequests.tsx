import { useCallback, useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { PurchaseRequestStatus } from "../../types/domain";
import type { PurchaseRequestDetail } from "../../types/purchase";
import {
  adminListPurchaseRequests,
  adminUpdatePurchaseStatus,
  adminCreditPurchaseWallet,
} from "../../api/adminPurchase";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate, formatNumber } from "../../utils/format";

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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [emailSearch, setEmailSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseRequestDetail | null>(null);
  const [newStatus, setNewStatus] = useState<PurchaseRequestStatus>("REVIEWING");
  const [statusMemo, setStatusMemo] = useState("");

  const [walletAmount, setWalletAmount] = useState("");
  const [walletSettled, setWalletSettled] = useState("");
  const [walletMemo, setWalletMemo] = useState("");
  const [walletIdem, setWalletIdem] = useState("");

  const fetchPage = useCallback(
    async (p: number, status: string) => {
      setLoading(true);
      try {
        const res = await adminListPurchaseRequests({
          page: p,
          size: 20,
          status: status ? (status as PurchaseRequestStatus) : undefined,
        });
        setRows((res.content ?? []) as PurchaseRequestDetail[]);
        setTotalPages(res.totalPages ?? 0);
        setPage(res.page ?? p);
      } catch {
        toast.error(t("adminPurchase.loadError"));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void fetchPage(0, statusFilter);
  }, [statusFilter, fetchPage]);

  const changePage = (next: number) => {
    void fetchPage(next, statusFilter);
  };

  const openManage = (r: PurchaseRequestDetail) => {
    setSelected(r);
    setNewStatus(r.status);
    setStatusMemo(r.adminMemo ?? "");
    setWalletAmount("");
    setWalletSettled("");
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
    const settledRaw = walletSettled.trim();
    const settled =
      settledRaw === "" ? undefined : parseFloat(settledRaw.replace(/,/g, ""));
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

  const filteredRows =
    emailSearch.trim() === ""
      ? rows
      : rows.filter((r) => String(r.userId).includes(emailSearch.trim()));

  const num0 = { maximumFractionDigits: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("nav.admin.purchaseRequests")}</h1>
          <p className="text-gray-600 mt-1">고객 구매 요청 · 선차감 확인 및 차액 환급</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="userId 검색"
                className="pl-10"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabels[s].label}
                  </SelectItem>
                ))}
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
          {loading ? (
            <p className="p-8 text-center text-gray-500">로딩 중…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>요청번호</TableHead>
                  <TableHead>회원</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead>예상</TableHead>
                  <TableHead>{t("adminPurchase.colCharged")}</TableHead>
                  <TableHead>{t("adminPurchase.colSettled")}</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-12">
                      구매 요청이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((request) => {
                    const statusInfo = statusLabels[request.status];
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium whitespace-nowrap">{request.requestNumber}</TableCell>
                        <TableCell className="text-sm text-gray-600">#{request.userId}</TableCell>
                        <TableCell>
                          <p className="font-medium">{request.productName}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.totalAmountKrw != null
                            ? `₩${formatNumber(request.totalAmountKrw, locale, num0)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.chargedAmountKrw != null
                            ? `₩${formatNumber(request.chargedAmountKrw, locale, num0)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.settledAmountKrw != null
                            ? `₩${formatNumber(request.settledAmountKrw, locale, num0)}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(request.createdAt, locale)}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openManage(request)}>
                            관리
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between p-4 border-t">
            <Button type="button" variant="outline" size="sm" disabled={page <= 0} onClick={() => changePage(page - 1)}>
              이전
            </Button>
            <span className="text-sm text-gray-500">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => changePage(page + 1)}
            >
              다음
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>구매 요청</DialogTitle>
            <DialogDescription>{selected?.requestNumber}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
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
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={walletSettled}
                        onChange={(e) => setWalletSettled(e.target.value)}
                      />
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
