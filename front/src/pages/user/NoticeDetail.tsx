import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Eye, Pin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { mockNotices } from "../../data/mockData";

export default function NoticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notice = mockNotices.find(n => n.id === Number(id));

  if (!notice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">공지사항을 찾을 수 없습니다</p>
      </div>
    );
  }

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

      <Card>
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {notice.isPinned && (
                <>
                  <Pin className="w-4 h-4 text-yellow-600" />
                  <Badge variant="destructive">중요</Badge>
                </>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {notice.title}
            </h1>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>
                {new Date(notice.publishedAt!).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                조회 {notice.viewCount.toLocaleString()}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Content */}
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          목록으로
        </Button>
      </div>
    </div>
  );
}
