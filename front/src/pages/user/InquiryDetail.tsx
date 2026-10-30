import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { MessageSquare, Paperclip, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { EmptyState, LoadingState, PageHeader, Section } from "../../components/page";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import type { InquiryStatus, InquiryCategory, Inquiry, Attachment } from "../../types";

const LOCALE_MAP: Record<string, string> = { ko: "ko-KR", ru: "ru-RU", en: "en-US" };

const BADGE_CLASS = "px-2 py-0.5 text-[10px] font-medium";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

function isImageAttachment(att: Attachment): boolean {
  return att.mimeType.startsWith("image/");
}

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: Attachment[];
  initialIndex: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(initialIndex);
  const img = images[current];
  const hasPrev = current > 0;
  const hasNext = current < images.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) setCurrent((c) => c - 1);
      if (e.key === "ArrowRight" && hasNext) setCurrent((c) => c + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasPrev, hasNext, onClose]);

  const ghostOnDark = "text-background hover:bg-background/20 hover:text-background";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/85"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={img.originalFilename}
        className="relative flex max-h-screen w-full max-w-5xl flex-col items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex w-full items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm text-background">{img.originalFilename}</span>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={img.viewUrl ?? img.storedUrl}
              download={img.originalFilename}
              title={img.originalFilename}
              className="inline-flex size-9 items-center justify-center text-background transition-colors hover:bg-background/20"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="size-5" strokeWidth={1.5} aria-hidden />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className={ghostOnDark}
              title={t("adminPurchase.modal.close")}
              aria-label={t("adminPurchase.modal.close")}
              onClick={onClose}
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
        </div>
        <div className="relative flex w-full items-center justify-center">
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute left-0 z-10 ${ghostOnDark}`}
              title={t("purchase.list.prev")}
              aria-label={t("purchase.list.prev")}
              onClick={() => setCurrent((c) => c - 1)}
            >
              <ChevronLeft className="size-6" strokeWidth={1.5} aria-hidden />
            </Button>
          )}
          <img
            src={img.viewUrl ?? img.thumbnailUrl ?? img.storedUrl}
            alt={img.originalFilename}
            className="max-h-[75vh] max-w-full object-contain"
          />
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-0 z-10 ${ghostOnDark}`}
              title={t("purchase.list.next")}
              aria-label={t("purchase.list.next")}
              onClick={() => setCurrent((c) => c + 1)}
            >
              <ChevronRight className="size-6" strokeWidth={1.5} aria-hidden />
            </Button>
          )}
        </div>
        {images.length > 1 && (
          <p className="mt-2 text-xs text-background/60 figure">
            {current + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}

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

export default function InquiryDetail() {
  const { t, locale } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const dateLocale = LOCALE_MAP[locale] || "ru-RU";
  const statusLabels = getStatusLabels(t);
  const categoryLabels = getCategoryLabels(t);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get<Inquiry>(`/v1/inquiries/${id}`)
      .then((res) => {
        if (cancelled) return;
        setInquiry(unwrap(res));
      })
      .catch(() => {
        if (!cancelled) setInquiry(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleDownload = (attachmentId: number, filename: string) => {
    api.downloadAttachment(attachmentId, filename);
  };

  if (loading) {
    return <LoadingState label={t("inquiry.detail.loading")} />;
  }

  if (!inquiry) {
    return (
      <EmptyState
        title={t("inquiry.detail.notFound")}
        action={
          <Button variant="outline" onClick={() => navigate("/inquiry")}>
            {t("inquiry.detail.backToList")}
          </Button>
        }
      />
    );
  }

  const statusInfo = statusLabels[inquiry.status];
  const attachments = inquiry.attachments ?? [];
  const imageAttachments = attachments.filter(isImageAttachment);
  const otherAttachments = attachments.filter((a) => !isImageAttachment(a));
  const formatDateTime = (iso: string) => new Date(iso).toLocaleDateString(dateLocale, DATE_OPTIONS);

  const attachmentRowClass =
    "flex w-full items-center gap-3 border-b border-border py-3 text-left text-sm transition-colors hover:bg-muted/60";

  return (
    <div className="max-w-3xl">
      <PageHeader
        back={{ to: "/inquiry", label: t("inquiry.detail.backToList") }}
        title={inquiry.title}
        meta={
          <>
            <Badge variant="outline" className={BADGE_CLASS}>
              {categoryLabels[inquiry.category]}
            </Badge>
            <Badge variant={statusInfo.variant} className={BADGE_CLASS}>
              {statusInfo.label}
            </Badge>
            <span aria-hidden>·</span>
            <time dateTime={inquiry.createdAt} className="figure">
              {formatDateTime(inquiry.createdAt)}
            </time>
          </>
        }
      />

      <div className="space-y-10 md:space-y-12">
        <Section title={t("inquiry.form.cardTitle")}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {inquiry.content}
          </p>
        </Section>

        {attachments.length > 0 && (
          <Section title={t("inquiry.detail.attachments")} flush>
            <ul>
              {imageAttachments.map((att, idx) => (
                <li key={att.id}>
                  <button type="button" className={attachmentRowClass} onClick={() => setLightboxIndex(idx)}>
                    <img
                      src={att.thumbnailUrl ?? att.viewUrl ?? att.storedUrl}
                      alt=""
                      className="size-12 shrink-0 border border-border object-cover"
                    />
                    <span className="min-w-0 flex-1 truncate">{att.originalFilename}</span>
                    <span className="shrink-0 text-xs text-muted-foreground figure">
                      {(att.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </button>
                </li>
              ))}
              {otherAttachments.map((att) => (
                <li key={att.id}>
                  <button
                    type="button"
                    className={attachmentRowClass}
                    onClick={() => handleDownload(att.id, att.originalFilename)}
                  >
                    <Paperclip className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{att.originalFilename}</span>
                    <span className="shrink-0 text-xs text-muted-foreground figure">
                      {(att.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {inquiry.replies && inquiry.replies.length > 0 && (
          <Section
            title={
              <>
                {t("inquiry.detail.replies")} <span className="figure">({inquiry.replies.length})</span>
              </>
            }
          >
            <ul className="space-y-6">
              {inquiry.replies.map((reply) => (
                <li key={reply.id} className="flex gap-3">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center bg-foreground text-background"
                    aria-hidden
                  >
                    <MessageSquare className="size-4" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{t("inquiry.detail.admin")}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{t("inquiry.detail.supportTeam")}</span>
                      </p>
                      <time dateTime={reply.createdAt} className="text-xs text-muted-foreground figure">
                        {formatDateTime(reply.createdAt)}
                      </time>
                    </div>
                    <div className="mt-2 bg-muted p-4 md:p-5">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {inquiry.status === 'PENDING' && (
          <EmptyState
            compact
            icon={MessageSquare}
            title={t("inquiry.detail.pendingMessage")}
            description={t("inquiry.detail.pendingNote")}
          />
        )}
      </div>

      {lightboxIndex !== null && imageAttachments.length > 0 && (
        <ImageLightbox
          images={imageAttachments}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
