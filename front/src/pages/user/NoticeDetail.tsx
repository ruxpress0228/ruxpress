import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Eye, Pin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { Notice } from "../../types";

export default function NoticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id || Number.isNaN(Number(id))) {
      setNotice(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<Notice>(`/v1/notices/${id}`)
      .then((res) => setNotice(unwrap(res)))
      .catch(() => setNotice(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">불러오는 중...</div>
    );
  }

  if (!notice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">공지사항을 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/notice")}>
          목록으로
        </Button>
      </div>
    );
  }

  const dateRaw = notice.publishedAt ?? notice.createdAt;

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
                {new Date(dateRaw).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                조회 {notice.viewCount.toLocaleString()}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {notice.content}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => navigate("/notice")}>
          목록으로
        </Button>
      </div>
    </div>
  );
}
