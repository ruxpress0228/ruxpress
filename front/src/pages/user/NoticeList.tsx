import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Eye, Pin } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { Notice, PageResponse } from "../../types";

export default function NoticeList() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api
      .get<PageResponse<Notice>>("/v1/notices?page=0&size=100")
      .then((res) => setNotices(unwrap(res).content))
      .catch(() => {
        setError(true);
        setNotices([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pinnedNotices = notices.filter((n) => n.isPinned);
  const regularNotices = notices.filter((n) => !n.isPinned);

  const formatDate = (n: Notice) => {
    const raw = n.publishedAt ?? n.createdAt;
    return new Date(raw).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">불러오는 중...</div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600">
        공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">공지사항</h1>
        <p className="text-gray-600 mt-1">Ruxpress의 최신 소식을 확인하세요</p>
      </div>

      <div className="space-y-3">
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
                      <span>{formatDate(notice)}</span>
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
                      <span>{formatDate(notice)}</span>
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

      {notices.length === 0 && (
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
