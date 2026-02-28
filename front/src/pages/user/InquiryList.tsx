import { Link } from "react-router";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { mockInquiries } from "../../data/mockData";
import type { InquiryStatus, InquiryCategory } from "../../types";

const statusLabels: Record<InquiryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  PENDING: { label: '답변대기', variant: 'secondary' },
  REPLIED: { label: '답변완료', variant: 'default' },
  CLOSED: { label: '종료', variant: 'outline' },
};

const categoryLabels: Record<InquiryCategory, string> = {
  ORDER: '주문',
  SHIPPING: '배송',
  PAYMENT: '결제',
  ETC: '기타',
};

export default function InquiryList() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">1:1 문의</h1>
          <p className="text-gray-600 mt-1">궁금한 점을 문의하세요</p>
        </div>
        <Link to="/inquiry/new">
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            새 문의
          </Button>
        </Link>
      </div>

      {/* Inquiry List */}
      <div className="space-y-4">
        {mockInquiries.map((inquiry) => {
          const statusInfo = statusLabels[inquiry.status];
          const hasUnreadReply = inquiry.replies?.some(r => !r.isRead);

          return (
            <Link key={inquiry.id} to={`/inquiry/${inquiry.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">
                          {categoryLabels[inquiry.category]}
                        </Badge>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                        {hasUnreadReply && (
                          <Badge variant="destructive" className="text-xs">
                            새 답변
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {inquiry.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {inquiry.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {inquiry.replies && inquiry.replies.length > 0 && (
                      <div className="flex items-center text-sm text-blue-600">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        답변 {inquiry.replies.length}개
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {mockInquiries.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              문의 내역이 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              궁금한 점이 있으시면 언제든지 문의해주세요
            </p>
            <Link to="/inquiry/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                문의하기
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
