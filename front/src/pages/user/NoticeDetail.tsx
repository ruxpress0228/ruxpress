import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { EmptyState, LoadingState, PageHeader, Section } from "../../components/page";
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
    return <LoadingState label={t("notice.loading")} />;
  }

  if (!notice) {
    return (
      <EmptyState
        title={t("notice.detail.notFound")}
        action={
          <Button variant="outline" onClick={() => navigate("/notice")}>
            {t("notice.detail.backToList")}
          </Button>
        }
      />
    );
  }

  const dateRaw = notice.publishedAt ?? notice.createdAt;

  return (
    <div className="max-w-3xl">
      <PageHeader
        back={{ to: "/notice", label: t("notice.detail.backToList") }}
        title={notice.title}
        meta={
          <>
            {notice.isPinned ? (
              <Badge className="px-1.5 py-0 text-[10px] font-medium">{t("notice.important")}</Badge>
            ) : null}
            <time dateTime={dateRaw} className="figure">
              {new Date(dateRaw).toLocaleDateString(dateLocale, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <span aria-hidden>·</span>
            <span className="figure">
              {t("notice.detail.viewCount", { n: notice.viewCount.toLocaleString() })}
            </span>
          </>
        }
      />

      <Section title={t("admin.notices.contentLabel")}>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {renderTextWithLinks(notice.content)}
        </div>
      </Section>

      <div className="mt-10 border-t border-border pt-6 md:mt-12">
        <Button variant="outline" onClick={() => navigate("/notice")}>
          {t("notice.detail.backToList")}
        </Button>
      </div>
    </div>
  );
}
