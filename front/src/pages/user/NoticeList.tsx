import { Link } from "react-router";
import { Eye, Pin } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { mockNotices } from "../../data/mockData";

export default function NoticeList() {
  const pinnedNotices = mockNotices.filter(n => n.isPinned && n.status === 'PUBLISHED');
  const regularNotices = mockNotices.filter(n => !n.isPinned && n.status === 'PUBLISHED');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">공지사항</h1>
        <p className="text-gray-600 mt-1">Ruxpress의 최신 소식을 확인하세요</p>
      </div>

      <div className="space-y-3">
        {/* Pinned Notices */}
        {pinnedNotices.map((notice) => (
          <Link key={notice.id} to={`/notice/${notice.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Pin className="w-4 h-4 text-yellow-600" />
                      <Badge variant="destructive">중요</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {notice.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {new Date(notice.publishedAt!).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {notice.viewCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Regular Notices */}
        {regularNotices.map((notice) => (
          <Link key={notice.id} to={`/notice/${notice.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {notice.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {new Date(notice.publishedAt!).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {notice.viewCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {mockNotices.filter(n => n.status === 'PUBLISHED').length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              공지사항이 없습니다
            </h3>
            <p className="text-gray-500">
              새로운 공지사항이 등록되면 알려드리겠습니다
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
