import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, Paperclip, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import type { InquiryStatus, InquiryCategory, Inquiry, Attachment } from "../../types";

const LOCALE_MAP: Record<string, string> = { ko: "ko-KR", ru: "ru-RU", en: "en-US" };

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-5xl w-full max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-white text-sm truncate max-w-xs">{img.originalFilename}</span>
          <div className="flex items-center gap-2">
            <a
              href={img.viewUrl ?? img.storedUrl}
              download={img.originalFilename}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-white hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-5 h-5" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="relative flex items-center justify-center w-full">
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 text-white hover:bg-white/20 z-10"
              onClick={() => setCurrent((c) => c - 1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <img
            src={img.viewUrl ?? img.thumbnailUrl ?? img.storedUrl}
            alt={img.originalFilename}
            className="max-h-[75vh] max-w-full object-contain rounded"
          />
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 text-white hover:bg-white/20 z-10"
              onClick={() => setCurrent((c) => c + 1)}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>
        {images.length > 1 && (
          <p className="text-white/60 text-xs mt-2">
            {current + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}

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

export default function InquiryDetail() {
  const { t, locale } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const dateLocale = LOCALE_MAP[locale] || "ko-KR";
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
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t("inquiry.detail.loading")}</p>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("inquiry.detail.notFound")}</p>
        <Button variant="link" className="mt-2" onClick={() => navigate("/inquiry")}>
          {t("inquiry.detail.backToList")}
        </Button>
      </div>
    );
  }

  const statusInfo = statusLabels[inquiry.status];
  const attachments = inquiry.attachments ?? [];
  const imageAttachments = attachments.filter(isImageAttachment);
  const otherAttachments = attachments.filter((a) => !isImageAttachment(a));

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/inquiry")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("inquiry.detail.backToList")}
      </Button>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {categoryLabels[inquiry.category]}
              </Badge>
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(inquiry.createdAt).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {inquiry.title}
          </h1>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {inquiry.content}
            </p>
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{t("inquiry.detail.attachments")}</span>
              </div>
              {imageAttachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                  {imageAttachments.map((att) => {
                    const idx = imageAttachments.findIndex((a) => a.id === att.id);
                    return (
                      <div
                        key={att.id}
                        className="relative group cursor-pointer rounded overflow-hidden border"
                        onClick={() => setLightboxIndex(idx)}
                      >
                        <img
                          src={att.thumbnailUrl ?? att.viewUrl ?? att.storedUrl}
                          alt={att.originalFilename}
                          className="h-28 w-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
              {otherAttachments.length > 0 && (
                <ul className="space-y-1">
                  {otherAttachments.map((att) => (
                    <li key={att.id}>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-blue-600"
                        onClick={() => handleDownload(att.id, att.originalFilename)}
                      >
                        {att.originalFilename} ({(att.fileSize / 1024).toFixed(1)} KB)
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {inquiry.replies && inquiry.replies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {t("inquiry.detail.replies")} ({inquiry.replies.length})
            </h2>
          </div>

          {inquiry.replies.map((reply) => (
            <Card key={reply.id} className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">R</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t("inquiry.detail.admin")}</p>
                      <p className="text-xs text-gray-500">{t("inquiry.detail.supportTeam")}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(reply.createdAt).toLocaleDateString(dateLocale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <Separator className="my-3 bg-blue-200" />

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {inquiry.status === 'PENDING' && (
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">
              {t("inquiry.detail.pendingMessage")}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t("inquiry.detail.pendingNote")}
            </p>
          </CardContent>
        </Card>
      )}

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
