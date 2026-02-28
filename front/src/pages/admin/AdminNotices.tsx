import { useState } from "react";
import { Plus, Edit, Trash2, Pin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { mockNotices } from "../../data/mockData";
import type { NoticeStatus } from "../../types";

const statusLabels: Record<NoticeStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  DRAFT: { label: '작성중', variant: 'outline' },
  SCHEDULED: { label: '예약', variant: 'secondary' },
  PUBLISHED: { label: '발행됨', variant: 'default' },
  HIDDEN: { label: '숨김', variant: 'destructive' },
};

export default function AdminNotices() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const createNotice = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }
    toast.success("공지사항이 등록되었습니다");
    setIsCreateOpen(false);
    setTitle("");
    setContent("");
    setIsPinned(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-gray-600 mt-1">공지사항을 작성하고 관리합니다</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 공지사항
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>공지사항 작성</DialogTitle>
              <DialogDescription>
                새로운 공지사항을 작성합니다
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notice-title">제목 *</Label>
                <Input
                  id="notice-title"
                  placeholder="공지사항 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notice-content">내용 *</Label>
                <Textarea
                  id="notice-content"
                  placeholder="공지사항 내용을 입력하세요 (HTML 지원)"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  HTML 태그를 사용할 수 있습니다 (예: &lt;p&gt;, &lt;strong&gt;, &lt;br&gt;)
                </p>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <Label htmlFor="notice-pinned" className="cursor-pointer">
                    상단 고정
                  </Label>
                  <p className="text-sm text-gray-500">
                    중요 공지사항을 맨 위에 고정합니다
                  </p>
                </div>
                <Switch
                  id="notice-pinned"
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  취소
                </Button>
                <Button variant="outline">
                  임시저장
                </Button>
                <Button onClick={createNotice}>
                  발행
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>조회수</TableHead>
                <TableHead>발행일</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockNotices.map((notice) => {
                const statusInfo = statusLabels[notice.status];
                return (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {notice.isPinned && (
                          <Pin className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="font-medium">{notice.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {notice.viewCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {notice.publishedAt
                        ? new Date(notice.publishedAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      관리자
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
