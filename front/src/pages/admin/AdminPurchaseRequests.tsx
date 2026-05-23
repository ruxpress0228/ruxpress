import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, MapPin, ExternalLink } from "lucide-react";
import { useNavigate } from 'react-router';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import type { PurchaseRequestStatus } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { PurchaseRequestDetail, PurchaseShipping } from "../../types/purchase";
import {
  adminListPurchaseRequests,
  adminUpdatePurchaseStatus,
  adminCreditPurchaseWallet,
  adminUploadPurchaseAttachments,
} from "../../api/adminPurchase";
import { useTranslation } from "../../hooks/useTranslation";
import { formatNumber } from "../../utils/format";
import { readAuthValue } from "../../utils/api";

const ADMIN_STORAGE_KEY = "ruxpress_admin";

function getAdminRole(): string | null {
  try {
    const raw = readAuthValue(ADMIN_STORAGE_KEY);
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

function hasShippingSnapshot(s?: PurchaseShipping | null): boolean {
  if (!s) return false;
  return Boolean(s.addressLine1 || s.recipientName);
}

function shippingSummaryLines(s: PurchaseShipping): { title: string; subtitle: string } {
  const name = s.recipientName?.trim() || "수령인 미입력";
  const phone = s.recipientPhone?.trim();
  const line1 = [s.postalCode ? `(${s.postalCode})` : null, s.addressLine1].filter(Boolean).join(" ").trim();
  const line2 = s.addressLine2?.trim();
  const addrMain = [line1, line2].filter(Boolean).join(", ");
  const subtitle = [phone, addrMain].filter(Boolean).join(" · ") || "주소 없음";
  const label = s.label?.trim();
  const title = label ? `${label} · ${name}` : name;
  return { title, subtitle };
}

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
  const [userKeyword, setUserKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseRequestDetail | null>(null);
  const [newStatus, setNewStatus] = useState<PurchaseRequestStatus>("REVIEWING");
  const [statusMemo, setStatusMemo] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminFiles, setAdminFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const navigate = useNavigate();

  const [walletAmount, setWalletAmount] = useState("");
  const [walletMemo, setWalletMemo] = useState("");
  const [walletIdem, setWalletIdem] = useState("");

  const fetchPage = useCallback(
    async (p: number, status: string, keyword: string) => {
      setLoading(true);
      try {
        const statusParam =
          status && status !== "all" ? (status as PurchaseRequestStatus) : undefined;
        const res = await adminListPurchaseRequests({
          page: p,
          size: 20,
          status: statusParam,
          sort,
          userKeyword: keyword.trim() || undefined,
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
    void fetchPage(0, statusFilter, userKeyword);
  }, [statusFilter, sort, fetchPage, userKeyword]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (newStatus === "SHIPPING" || newStatus === "DELIVERED") {
      const id = window.setTimeout(() => {
        document.getElementById("purchase-admin-tracking")?.focus();
      }, 120);
      return () => window.clearTimeout(id);
    }
  }, [newStatus, dialogOpen]);

  const changePage = (next: number) => {
    void fetchPage(next, statusFilter, userKeyword);
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
    setTrackingNumber(r.trackingNumber ?? "");
    setAdminFiles([]);
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
        trackingNumber: trackingNumber.trim() || undefined,
      });
      toast.success("저장되었습니다");
      setSelected(updated);
      void fetchPage(page, statusFilter, userKeyword);
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const uploadAdminFiles = async () => {
    if (!selected || adminFiles.length === 0) return;
    try {
      setUploadingFiles(true);
      const updated = await adminUploadPurchaseAttachments(selected.id, adminFiles);
      toast.success(`사진 ${adminFiles.length}장이 업로드되었습니다`);
      setSelected(updated);
      setAdminFiles([]);
      void fetchPage(page, statusFilter, userKeyword);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploadingFiles(false);
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
      void fetchPage(page, statusFilter, userKeyword);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const num0 = { maximumFractionDigits: 0 };

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim() !== "") {
      const q = search.trim().toLowerCase();
      const needle = search.trim();
      list = list.filter((r) => {
        if (r.requestNumber.includes(needle) || r.requestName.toLowerCase().includes(q)) return true;
        const sh = r.shipping;
        if (!sh) return false;
        const blob = [
          sh.label,
          sh.recipientName,
          sh.recipientPhone,
          sh.postalCode,
          sh.addressLine1,
          sh.addressLine2,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list;
  }, [rows, search]);

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
                placeholder="요청번호, 요청명, 배송지(수령인·주소) 검색"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Input
              placeholder="회원 이름/이메일"
              value={userKeyword}
              onChange={(e) => setUserKeyword(e.target.value)}
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
            <Button type="button" variant="secondary" onClick={() => void fetchPage(page, statusFilter, userKeyword)}>
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
                <TableHead>회원</TableHead>
                <TableHead>상품명</TableHead>
                <TableHead className="min-w-[200px] max-w-[280px]">배송지</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>금액(원)</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                    구매 요청이 없습니다
                  </TableCell>
                </TableRow>
              ) : filtered.map((request) => {
                const statusInfo = statusLabels[request.status];
                const sh = request.shipping;
                const shipLines = hasShippingSnapshot(sh) && sh ? shippingSummaryLines(sh) : null;
                const shipTitle =
                  hasShippingSnapshot(sh) && sh
                    ? [sh.label, sh.recipientName, sh.recipientPhone, sh.postalCode, sh.addressLine1, sh.addressLine2]
                        .filter(Boolean)
                        .join("\n")
                    : undefined;
                return (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openManage(request)}
                  >
                    <TableCell className="font-medium text-sm">{request.requestNumber}</TableCell>
                    <TableCell className="text-sm">
                      {request.userNickname || request.userEmail ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{request.userNickname ?? "—"}</span>
                          <span className="text-xs text-gray-500">{request.userEmail ?? `#${request.userId}`}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">#{request.userId}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{request.requestName}</TableCell>
                    <TableCell
                      className="text-sm align-top"
                      title={shipTitle}
                    >
                      {shipLines ? (
                        <div className="flex gap-2 min-w-0">
                          <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" aria-hidden />
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-medium text-gray-900 truncate">{shipLines.title}</p>
                            <p className="text-xs text-gray-600 line-clamp-2 leading-snug">{shipLines.subtitle}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
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
        <DialogContent
          className="flex h-[min(90vh,880px)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onKeyDown={(e) => {
            if (!selected) return;
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void saveStatus();
            }
          }}
        >
          {selected && (
            <>
              <div className="shrink-0 space-y-3 border-b bg-muted/20 px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pr-14">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <DialogTitle className="line-clamp-2 text-left text-base font-semibold leading-snug text-gray-900 sm:text-lg">
                      {selected.requestName}
                    </DialogTitle>
                    <DialogDescription className="text-left text-xs text-gray-500 sm:text-sm">
                      {selected.requestNumber}
                    </DialogDescription>
                  </div>
                  <Badge variant={statusLabels[selected.status].variant} className="shrink-0">
                    {statusLabels[selected.status].label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                  <p className="min-w-0 truncate">
                    <span className="text-gray-500">회원</span>{" "}
                    <span className="font-medium text-gray-900">{selected.userNickname ?? `#${selected.userId}`}</span>
                    {selected.userEmail ? (
                      <span className="hidden sm:inline"> · {selected.userEmail}</span>
                    ) : null}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 gap-1 text-xs text-gray-600 hover:text-gray-900"
                    onClick={() => navigate(`/admin/purchase-requests/${selected.id}`)}
                  >
                    전체 상세
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-4">
                  <Card className="border-gray-200 shadow-none">
                    <CardHeader className="space-y-1 pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-900">주문 요약</CardTitle>
                      <CardDescription className="text-xs">선차감·금액을 한눈에 확인합니다</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">수량</p>
                        <p className="mt-0.5 font-semibold text-gray-900">{selected.quantity}개</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">총 금액(원)</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {selected.totalAmountKrw != null
                            ? `₩${formatNumber(selected.totalAmountKrw, locale, num0)}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">선차감</p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {selected.chargedAmountKrw != null
                            ? `₩${formatNumber(selected.chargedAmountKrw, locale, num0)}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">등록일</p>
                        <p className="mt-0.5 text-gray-800">
                          {new Date(selected.createdAt).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {hasShippingSnapshot(selected.shipping) && selected.shipping ? (
                    <Accordion type="single" collapsible className="rounded-lg border border-gray-200 bg-white px-3">
                      <AccordionItem value="shipping" className="border-0">
                        <AccordionTrigger className="py-3 text-sm hover:no-underline">
                          <span className="flex min-w-0 flex-1 items-start gap-2 text-left">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                            <span className="min-w-0">
                              <span className="block font-semibold text-gray-900">배송지</span>
                              <span className="mt-0.5 block truncate text-xs font-normal text-gray-600">
                                {shippingSummaryLines(selected.shipping).title} ·{" "}
                                {shippingSummaryLines(selected.shipping).subtitle}
                              </span>
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3 pt-0">
                          <div className="space-y-2 rounded-md border border-blue-100 bg-blue-50/50 p-3 text-sm text-gray-800">
                            {selected.shipping.label ? (
                              <p>
                                <span className="text-gray-500">라벨</span> {selected.shipping.label}
                              </p>
                            ) : null}
                            {(selected.shipping.recipientName || selected.shipping.recipientPhone) && (
                              <p>
                                <span className="text-gray-500">수령</span>{" "}
                                {[selected.shipping.recipientName, selected.shipping.recipientPhone]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                            <p className="break-words leading-relaxed">
                              <span className="text-gray-500">주소</span>{" "}
                              {selected.shipping.postalCode ? `(${selected.shipping.postalCode}) ` : null}
                              {selected.shipping.addressLine1}
                              {selected.shipping.addressLine2 ? ` ${selected.shipping.addressLine2}` : ""}
                            </p>
                            {selected.shipping.userAddressId != null && (
                              <p className="text-xs text-gray-500">회원 배송지 ID: {selected.shipping.userAddressId}</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-900">
                      배송지 스냅샷이 없습니다. 구버전 요청이거나 데이터 누락일 수 있습니다.
                    </p>
                  )}

                  <Card className="border-gray-900/10 shadow-sm ring-1 ring-gray-900/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-900">처리</CardTitle>
                      <CardDescription className="text-xs">상태·운송장·메모 변경 후 하단에서 저장합니다</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchase-admin-status">상태</Label>
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PurchaseRequestStatus)}>
                          <SelectTrigger id="purchase-admin-status" className="w-full">
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
                        <Label htmlFor="purchase-admin-tracking">운송장번호</Label>
                        <Input
                          id="purchase-admin-tracking"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="예: 1234-5678-9012"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purchase-admin-memo">관리자 메모</Label>
                        <Textarea
                          id="purchase-admin-memo"
                          rows={2}
                          value={statusMemo}
                          onChange={(e) => setStatusMemo(e.target.value)}
                          className="min-h-[72px] resize-y"
                          placeholder="내부 메모 (고객에게 노출되지 않음)"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Accordion type="multiple" className="space-y-2">
                    <AccordionItem
                      value="attachments"
                      className="rounded-lg border border-gray-200 bg-white px-3 data-[state=open]:shadow-sm"
                    >
                      <AccordionTrigger className="py-3 text-sm hover:no-underline">
                        <span className="font-semibold text-gray-900">관리자 사진 첨부</span>
                        <span className="ml-2 text-xs font-normal text-gray-500">배송/수령 등</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pb-1">
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(e) => setAdminFiles(Array.from(e.target.files || []))}
                          />
                          {adminFiles.length > 0 ? (
                            <p className="text-xs text-gray-500">{adminFiles.length}개 선택됨</p>
                          ) : null}
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            disabled={adminFiles.length === 0 || uploadingFiles}
                            onClick={() => void uploadAdminFiles()}
                          >
                            {uploadingFiles ? "업로드 중..." : `사진 업로드 (${adminFiles.length})`}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {isSuper ? (
                      <AccordionItem
                        value="wallet"
                        className="rounded-lg border border-amber-200/80 bg-amber-50/40 px-3 data-[state=open]:shadow-sm"
                      >
                        <AccordionTrigger className="py-3 text-sm hover:no-underline">
                          <span className="font-semibold text-amber-950">지갑 환급 · 차액 정산</span>
                          <span className="ml-2 text-xs font-normal text-amber-900/80">SUPER · 신중히 입력</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pb-1">
                            <p className="text-sm font-semibold text-amber-950">{t("adminPurchase.walletCreditTitle")}</p>
                            <div className="rounded-md border border-amber-200/90 bg-white px-3 py-2 text-sm">
                              <span className="text-gray-600">현재 선차감</span>{" "}
                              <span className="font-semibold text-gray-900">
                                {selected.chargedAmountKrw != null
                                  ? `₩${formatNumber(selected.chargedAmountKrw, locale, num0)}`
                                  : "—"}
                              </span>
                            </div>
                            <p className="text-xs text-amber-900/90">{t("adminPurchase.walletIdempotencyHint")}</p>
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
                              <p className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                                {selected.chargedAmountKrw != null && walletAmount !== ""
                                  ? `₩${formatNumber(
                                      selected.chargedAmountKrw -
                                        parseFloat(walletAmount.replace(/,/g, "") || "0"),
                                      locale,
                                      num0
                                    )}`
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
                            <Button
                              type="button"
                              variant="destructive"
                              className="w-full"
                              onClick={() => void submitWallet()}
                            >
                              {t("adminPurchase.walletSubmit")}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}
                  </Accordion>

                  {!isSuper ? (
                    <p className="text-center text-xs text-amber-800">{t("admin.bank.superOnly")}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="hidden text-[11px] text-gray-500 sm:block">
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">⌘</kbd> 또는{" "}
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd> +{" "}
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd> 로 상태 저장
                </p>
                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    닫기
                  </Button>
                  <Button type="button" className="min-w-[8.5rem] font-semibold" onClick={() => void saveStatus()}>
                    상태·운송장 저장
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
