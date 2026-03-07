import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, Paperclip } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { useTranslation } from "../../hooks/useTranslation";
import type { InquiryStatus, InquiryCategory, Inquiry } from "../../types";

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

export default function InquiryDetail() {
  const { t, locale } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
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

          {inquiry.attachments && inquiry.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{t("inquiry.detail.attachments")}</span>
              </div>
              <ul className="space-y-1">
                {inquiry.attachments.map((att) => (
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
    </div>
  );
}
