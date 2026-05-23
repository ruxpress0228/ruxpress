import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import type { InquiryStatus, InquiryCategory, InquiryListItem } from "../../types";
import type { PageResponse } from "../../types";

const LOCALE_MAP: Record<string, string> = { ko: "ko-KR", ru: "ru-RU", en: "en-US" };

function getStatusLabels(t: (key: string) => string): Record<InquiryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> {
  return {
    PENDING: { label: t("inquiry.status.pending"), variant: 'secondary' },
    REPLIED: { label: t("inquiry.status.replied"), variant: 'default' },
    CLOSED: { label: t("inquiry.status.closed"), variant: 'outline' },
  };
}

function getCategoryLabels(t: (key: string) => string): Record<InquiryCategory, string> {
  return {
    ORDER: t("inquiry.category.order"),
    SHIPPING: t("inquiry.category.shipping"),
    PAYMENT: t("inquiry.category.payment"),
    ETC: t("inquiry.category.etc"),
  };
}

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

export default function InquiryList() {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<InquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback((p: number, s: number) => {
    setLoading(true);
    api
      .get<PageResponse<InquiryListItem>>(`/v1/inquiries?page=${p}&size=${s}`)
      .then((res) => {
        const data = unwrap(res);
        setItems(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(page, size);
  }, [page, size, load]);

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(0);
  };

  const dateLocale = LOCALE_MAP[locale] || "ko-KR";
  const statusLabels = getStatusLabels(t);
  const categoryLabels = getCategoryLabels(t);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("inquiry.title")}</h1>
          <p className="text-gray-600 mt-1">{t("inquiry.subtitle")}</p>
        </div>
        <Link to="/inquiry/new">
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            {t("inquiry.newInquiry")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">{t("inquiry.loading")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((inquiry) => {
              const statusInfo = statusLabels[inquiry.status];
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
                            {inquiry.hasUnreadReply && (
                              <Badge variant="destructive" className="text-xs">
                                {t("inquiry.newReply")}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {inquiry.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          {new Date(inquiry.createdAt).toLocaleDateString(dateLocale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {inquiry.replyCount > 0 && (
                          <div className="flex items-center text-sm text-blue-600">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {t("inquiry.replies")} {inquiry.replyCount}{t("inquiry.repliesUnit")}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {items.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("inquiry.empty.title")}
                </h3>
                <p className="text-gray-500 mb-6">
                  {t("inquiry.empty.description")}
                </p>
                <Link to="/inquiry/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("inquiry.inquire")}
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>페이지당</span>
                <Select value={String(size)} onValueChange={(v) => handleSizeChange(Number(v))}>
                  <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}건</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>이전</Button>
                <span className="text-sm text-gray-500">{page + 1} / {Math.max(1, totalPages)}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>다음</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
