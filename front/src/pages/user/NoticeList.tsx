import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Eye, Pin } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import type { Notice, PageResponse } from "../../types";

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

export default function NoticeList() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback((p: number, s: number) => {
    setLoading(true);
    setError(false);
    api
      .get<PageResponse<Notice>>(`/v1/notices?page=${p}&size=${s}`)
      .then((res) => {
        const data = unwrap(res);
        setNotices(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        setError(true);
        setNotices([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(page, size);
  }, [page, size, load]);

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(0);
  };

  const pinnedNotices = notices.filter((n) => n.isPinned);
  const regularNotices = notices.filter((n) => !n.isPinned);

  const formatDate = (n: Notice) => {
    const raw = n.publishedAt ?? n.createdAt;
    return new Date(raw).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">{t("notice.loading")}</div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600">
        {t("notice.list.loadError")}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("notice.list.title")}</h1>
        <p className="text-gray-600 mt-1">{t("notice.list.subtitle")}</p>
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
                      <Badge variant="destructive">{t("notice.important")}</Badge>
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
              {t("notice.list.emptyTitle")}
            </h3>
            <p className="text-gray-500">
              {t("notice.list.emptyDesc")}
            </p>
          </div>
        </Card>
      )}

      {totalPages > 0 && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t("purchase.list.perPage")}</span>
            <Select value={String(size)} onValueChange={(v) => handleSizeChange(Number(v))}>
              <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>{t("purchase.list.perPageOption", { n: s })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>{t("purchase.list.prev")}</Button>
            <span className="text-sm text-gray-500">{page + 1} / {Math.max(1, totalPages)}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>{t("purchase.list.next")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
