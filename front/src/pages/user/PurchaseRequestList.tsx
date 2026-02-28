import { Link } from "react-router";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
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

export default function PurchaseRequestList() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">구매 요청</h1>
          <p className="text-gray-600 mt-1">내 구매 요청 내역을 확인하세요</p>
        </div>
        <Link to="/purchase/new">
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            새 요청
          </Button>
        </Link>
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
                <SelectItem value="price-high">가격 높은순</SelectItem>
                <SelectItem value="price-low">가격 낮은순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="space-y-4">
        {mockPurchaseRequests.map((request) => {
          const statusInfo = statusLabels[request.status];
          return (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.productName}
                      </h3>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      요청번호: {request.requestNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ₩{request.totalAmountKrw?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {request.priceRub?.toLocaleString()} RUB
                    </p>
                  </div>
                </div>

                {request.urls && request.urls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">상품 URL:</p>
                    {request.urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block truncate"
                      >
                        {url.shop}: {url.url}
                      </a>
                    ))}
                  </div>
                )}

                {request.options && request.options.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {request.options.map((option, idx) => (
                        <Badge key={idx} variant="outline">
                          {option.name}: {option.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.memo && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">메모:</span> {request.memo}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    수량: {request.quantity}개
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                    {request.status === 'REVIEWING' && (
                      <Button variant="ghost" size="sm" className="text-red-600">
                        취소하기
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mockPurchaseRequests.length === 0 && (
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
