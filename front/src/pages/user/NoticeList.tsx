import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Megaphone } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { EmptyState, LoadingState, PageHeader, Pager } from "../../components/page";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../utils/constants";
import type { Notice, PageResponse } from "../../types";

export default function NoticeList() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
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
  const orderedNotices = [...pinnedNotices, ...regularNotices];

  const formatDate = (n: Notice) => {
    const raw = n.publishedAt ?? n.createdAt;
    return new Date(raw).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <PageHeader align="center" title={t("notice.list.title")} description={t("notice.list.subtitle")} />

      {loading ? (
        <LoadingState label={t("notice.loading")} />
      ) : error ? (
        <EmptyState title={t("notice.list.loadError")} className="text-destructive" />
      ) : (
        <>
          {orderedNotices.length > 0 ? (
            <ul className="border-t border-border">
              {orderedNotices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    to={`/notice/${notice.id}`}
                    className="grid gap-1 border-b border-border py-5 transition-colors hover:bg-muted/60 md:grid-cols-[10rem_minmax(0,1fr)_auto] md:items-baseline md:gap-6"
                  >
                    <time
                      dateTime={notice.publishedAt ?? notice.createdAt}
                      className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground figure"
                    >
                      {formatDate(notice)}
                    </time>
                    <span className="flex min-w-0 items-center gap-2">
                      {notice.isPinned ? <Badge>{t("notice.important")}</Badge> : null}
                      <span className="min-w-0 truncate text-base font-light tracking-[0.02em]">{notice.title}</span>
                    </span>
                    <span className="hidden text-[11px] tracking-[0.12em] text-muted-foreground figure md:block">
                      {t("notice.detail.viewCount", { n: notice.viewCount.toLocaleString() })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Megaphone}
              title={t("notice.list.emptyTitle")}
              description={t("notice.list.emptyDesc")}
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
