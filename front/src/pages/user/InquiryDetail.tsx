import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
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

export default function InquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inquiry = mockInquiries.find(i => i.id === Number(id));

  if (!inquiry) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">문의를 찾을 수 없습니다</p>
      </div>
    );
  }

  const statusInfo = statusLabels[inquiry.status];

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        목록으로
      </Button>

      {/* Inquiry */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {categoryLabels[inquiry.category]}
              </Badge>
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {inquiry.title}
          </h1>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {inquiry.content}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {inquiry.replies && inquiry.replies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              답변 ({inquiry.replies.length})
            </h2>
          </div>

          {inquiry.replies.map((reply) => (
            <Card key={reply.id} className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">R</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">관리자</p>
                      <p className="text-xs text-gray-500">Ruxpress 고객지원팀</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(reply.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <Separator className="my-3 bg-blue-200" />

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {inquiry.status === 'PENDING' && (
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">
              관리자가 답변을 작성중입니다. 조금만 기다려주세요.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              답변이 등록되면 알림을 보내드립니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
