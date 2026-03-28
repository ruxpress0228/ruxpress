import { useCallback, useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "../../hooks/useTranslation";
import {
  adminListPurchaseRequests,
  adminUpdatePurchaseStatus,
} from "../../api/adminPurchase";
import type { PurchaseRequest, PurchaseRequestStatus } from "../../types";

const statusLabels: Record<PurchaseRequestStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
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

export default function AdminPurchaseRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [newStatus, setNewStatus] = useState<PurchaseRequestStatus>("REVIEWING");
  const [adminMemo, setAdminMemo] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const status = statusFilter !== "ALL" ? (statusFilter as PurchaseRequestStatus) : undefined;
      const page = await adminListPurchaseRequests({ page: 0, size: 100, status });
      setRequests(page.content);
    } catch {
      toast.error(t("admin.purchase.loadError"));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (req: PurchaseRequest) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setAdminMemo(req.adminMemo ?? "");
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    try {
      await adminUpdatePurchaseStatus(selectedRequest.id, newStatus, adminMemo || undefined);
      toast.success(t("admin.purchase.statusUpdated"));
      setDialogOpen(false);
      load();
    } catch {
      toast.error(t("admin.purchase.statusError"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.purchase.title")}</h1>
        <p className="text-gray-600 mt-1">{t("admin.purchase.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t("admin.purchase.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("admin.purchase.all")}</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.purchase.table.requestNumber")}</TableHead>
                <TableHead>{t("admin.purchase.table.productName")}</TableHead>
                <TableHead>{t("admin.purchase.table.totalAmount")}</TableHead>
                <TableHead>{t("admin.purchase.table.status")}</TableHead>
                <TableHead>{t("admin.purchase.table.createdAt")}</TableHead>
                <TableHead>{t("admin.purchase.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    ...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    {t("admin.purchase.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => {
                  const info = statusLabels[req.status];
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">{req.requestNumber}</TableCell>
                      <TableCell>{req.productName}</TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {req.totalAmountKrw != null ? `₩${req.totalAmountKrw.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={info.variant}>{info.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openDetail(req)}>
                          관리
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.purchase.title")}</DialogTitle>
            <DialogDescription>{selectedRequest?.requestNumber}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>상품명:</strong> {selectedRequest.productName}</p>
                <p><strong>수량:</strong> {selectedRequest.quantity}개</p>
                <p><strong>총액:</strong> ₩{selectedRequest.totalAmountKrw?.toLocaleString()}</p>
                {selectedRequest.memo && (
                  <div>
                    <strong>메모:</strong>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{selectedRequest.memo}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("admin.purchase.status")}</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PurchaseRequestStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

              <div className="space-y-2">
                <Label>관리자 메모</Label>
                <Textarea
                  placeholder="내부 메모를 입력하세요"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
                <Button onClick={handleUpdateStatus}>저장</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
