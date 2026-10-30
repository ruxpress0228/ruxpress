import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { MessageSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { EmptyState, LoadingState, PageHeader, Pager } from "../../components/page";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import type { InquiryStatus, InquiryCategory, InquiryListItem } from "../../types";
import type { PageResponse } from "../../types";

const LOCALE_MAP: Record<string, string> = { ko: "ko-KR", ru: "ru-RU", en: "en-US" };

const BADGE_CLASS = "px-2 py-0.5 text-[10px] font-medium";

/** Status badges: pending is outlined, replied is black, closed is grey. */
function getStatusLabels(t: (key: string) => string): Record<InquiryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> {
  return {
    PENDING: { label: t("inquiry.status.pending"), variant: 'outline' },
    REPLIED: { label: t("inquiry.status.replied"), variant: 'default' },
    CLOSED: { label: t("inquiry.status.closed"), variant: 'secondary' },
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

export default function InquiryList() {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<InquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
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

  const dateLocale = LOCALE_MAP[locale] || "ru-RU";
  const statusLabels = getStatusLabels(t);
  const categoryLabels = getCategoryLabels(t);

  return (
    <div>
      <PageHeader
        title={t("inquiry.title")}
        description={t("inquiry.subtitle")}
        actions={
          <Button asChild>
            <Link to="/inquiry/new">{t("inquiry.newInquiry")}</Link>
          </Button>
        }
      />

      {loading ? (
        <LoadingState label={t("inquiry.loading")} />
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="border-t border-border">
              {items.map((inquiry) => {
                const statusInfo = statusLabels[inquiry.status];
                return (
                  <li key={inquiry.id}>
                    <Link
                      to={`/inquiry/${inquiry.id}`}
                      className="grid gap-2 border-b border-border py-4 transition-colors hover:bg-muted/60 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-5"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={BADGE_CLASS}>
                          {categoryLabels[inquiry.category]}
                        </Badge>
                        <Badge variant={statusInfo.variant} className={BADGE_CLASS}>
                          {statusInfo.label}
                        </Badge>
                        {inquiry.hasUnreadReply && (
                          <Badge className="px-1.5 py-0 text-[10px] font-medium">{t("inquiry.newReply")}</Badge>
                        )}
                      </div>
                      <p className="min-w-0 truncate text-sm font-medium">{inquiry.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <time dateTime={inquiry.createdAt} className="figure">
                          {new Date(inquiry.createdAt).toLocaleDateString(dateLocale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                        {inquiry.replyCount > 0 && (
                          <span className="flex items-center gap-1 figure">
                            <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />
                            {t("inquiry.replies")} {inquiry.replyCount}{t("inquiry.repliesUnit")}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title={t("inquiry.empty.title")}
              description={t("inquiry.empty.description")}
              action={
                <Button variant="outline" asChild>
                  <Link to="/inquiry/new">{t("inquiry.inquire")}</Link>
                </Button>
              }
            />
          )}

          {totalPages > 0 && (
            <Pager
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
              prevLabel={t("purchase.list.prev")}
              nextLabel={t("purchase.list.next")}
              leading={
                <>
                  <span>{t("purchase.list.perPage")}</span>
                  <Select value={String(size)} onValueChange={(v) => handleSizeChange(Number(v))}>
                    <SelectTrigger size="sm" className="w-24 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{t("purchase.list.perPageOption", { n: s })}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
