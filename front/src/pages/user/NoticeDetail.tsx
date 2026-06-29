import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Eye, Pin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { renderTextWithLinks } from "../../utils/linkify";
import type { Notice } from "../../types";

export default function NoticeDetail() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
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
      <div className="text-center py-12 text-gray-500">{t("notice.loading")}</div>
    );
  }

  if (!notice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("notice.detail.notFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/notice")}>
          {t("notice.detail.backToList")}
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
        {t("notice.detail.backToList")}
      </Button>

      <Card>
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {notice.isPinned && (
                <>
                  <Pin className="w-4 h-4 text-yellow-600" />
                  <Badge variant="destructive">{t("notice.important")}</Badge>
                </>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {notice.title}
            </h1>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>
                {new Date(dateRaw).toLocaleDateString(dateLocale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {t("notice.detail.viewCount", { n: notice.viewCount.toLocaleString() })}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {renderTextWithLinks(notice.content)}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => navigate("/notice")}>
          {t("notice.detail.backToList")}
        </Button>
      </div>
    </div>
  );
}
