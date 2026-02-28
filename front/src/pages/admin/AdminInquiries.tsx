import { useState } from "react";
import { Search, Send } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
import { toast } from "sonner";
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

export default function AdminInquiries() {
  const [selectedInquiry, setSelectedInquiry] = useState<typeof mockInquiries[0] | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const sendReply = () => {
    if (!replyContent.trim()) {
      toast.error("답변 내용을 입력해주세요");
      return;
    }
    toast.success("답변이 등록되었습니다");
    setReplyContent("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">문의 관리</h1>
        <p className="text-gray-600 mt-1">고객 문의에 답변합니다</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="제목, 내용 검색"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInquiries.map((inquiry) => {
                const statusInfo = statusLabels[inquiry.status];
                return (
                  <TableRow key={inquiry.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[inquiry.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {inquiry.title}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      회원 #{inquiry.userId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInquiry(inquiry)}
                          >
                            {inquiry.status === 'PENDING' ? '답변하기' : '보기'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>문의 상세</DialogTitle>
                            <DialogDescription>
                              {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedInquiry && (
                            <div className="space-y-4">
                              {/* Inquiry Content */}
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Badge variant="outline">
                                    {categoryLabels[selectedInquiry.category]}
                                  </Badge>
                                  <Badge variant={statusLabels[selectedInquiry.status].variant}>
                                    {statusLabels[selectedInquiry.status].label}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">
                                  {selectedInquiry.title}
                                </h3>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                  {selectedInquiry.content}
                                </p>
                              </div>

                              {/* Existing Replies */}
                              {selectedInquiry.replies && selectedInquiry.replies.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-semibold">답변 내역</h4>
                                  {selectedInquiry.replies.map((reply) => (
                                    <div key={reply.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">R</span>
                                          </div>
                                          <span className="font-medium text-sm">관리자</span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {new Date(reply.createdAt).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      <Separator className="my-2 bg-blue-200" />
                                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply Form */}
                              {selectedInquiry.status !== 'CLOSED' && (
                                <div className="space-y-3">
                                  <Separator />
                                  <div className="space-y-2">
                                    <Label>답변 작성</Label>
                                    <Textarea
                                      placeholder="답변 내용을 입력하세요"
                                      rows={6}
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline">답변 템플릿</Button>
                                    <Button onClick={sendReply}>
                                      <Send className="w-4 h-4 mr-2" />
                                      답변 등록
                                    </Button>
                                  </div>
                                </div>
                              )}
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
