import { useState } from "react";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { mockPurchaseRequests } from "../../data/mockData";
import type { PurchaseRequestStatus } from "../../types";

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

export default function AdminPurchaseRequests() {
  const [selectedRequest, setSelectedRequest] = useState<typeof mockPurchaseRequests[0] | null>(null);
  const [newStatus, setNewStatus] = useState<PurchaseRequestStatus>('REVIEWING');

  const updateStatus = () => {
    toast.success("상태가 업데이트되었습니다");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">구매 요청 관리</h1>
          <p className="text-gray-600 mt-1">고객 구매 요청을 관리합니다</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="요청번호, 상품명, 회원 검색"
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="REVIEWING">검토중</SelectItem>
                <SelectItem value="CONFIRMED">확정</SelectItem>
                <SelectItem value="PURCHASING">구매중</SelectItem>
                <SelectItem value="SHIPPING">배송중</SelectItem>
                <SelectItem value="DELIVERED">배송완료</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="latest">
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

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>요청번호</TableHead>
                <TableHead>상품명</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPurchaseRequests.map((request) => {
                const statusInfo = statusLabels[request.status];
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.requestNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.productName}</p>
                        {request.urls && request.urls.length > 0 && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {request.urls[0].shop}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">₩{request.totalAmountKrw?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{request.priceRub?.toLocaleString()} RUB</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setNewStatus(request.status);
                            }}
                          >
                            관리
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>구매 요청 관리</DialogTitle>
                            <DialogDescription>
                              {selectedRequest?.requestNumber}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">상품 정보</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>상품명:</strong> {selectedRequest.productName}</p>
                                  <p><strong>수량:</strong> {selectedRequest.quantity}개</p>
                                  {selectedRequest.options && selectedRequest.options.length > 0 && (
                                    <div>
                                      <strong>옵션:</strong>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedRequest.options.map((opt, idx) => (
                                          <Badge key={idx} variant="outline">
                                            {opt.name}: {opt.value}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {selectedRequest.memo && (
                                    <div>
                                      <strong>메모:</strong>
                                      <p className="mt-1 p-2 bg-gray-50 rounded">{selectedRequest.memo}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>상태 변경</Label>
                                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as PurchaseRequestStatus)}>
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
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>관리자 메모</Label>
                                <Textarea
                                  placeholder="내부 메모를 입력하세요"
                                  defaultValue={selectedRequest.adminMemo}
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">취소</Button>
                                <Button onClick={updateStatus}>저장</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
