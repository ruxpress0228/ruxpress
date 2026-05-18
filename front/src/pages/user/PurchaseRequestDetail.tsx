import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseAttachment, PurchaseRequestDetail as PurchaseRequestDetailType } from "../../types/purchase";

const statusLabels: Record<PurchaseRequestStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "작성중", variant: "outline" },
  SUBMITTED: { label: "제출됨", variant: "secondary" },
  REVIEWING: { label: "검토중", variant: "secondary" },
  CONFIRMED: { label: "확정", variant: "default" },
  PURCHASING: { label: "구매중", variant: "default" },
  PURCHASED: { label: "구매완료", variant: "default" },
  SHIPPING: { label: "배송중", variant: "default" },
  DELIVERED: { label: "배송완료", variant: "default" },
  CANCELLED: { label: "취소됨", variant: "destructive" },
  REFUNDED: { label: "환불됨", variant: "destructive" },
};

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: PurchaseAttachment[];
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
            src={img.viewUrl ?? img.storedUrl}
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

export default function PurchaseRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMyPurchaseRequest } = usePurchase();
  const [data, setData] = useState<PurchaseRequestDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const numericId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  useEffect(() => {
    if (!numericId) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMyPurchaseRequest(numericId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">구매요청을 찾을 수 없습니다.</p>
        <Button variant="link" className="mt-2" onClick={() => navigate("/purchase")}>
          목록으로
        </Button>
      </div>
    );
  }

  const statusInfo = statusLabels[data.status];
  const optionsEntries = data.options && typeof data.options === "object" ? Object.entries(data.options) : [];

  const imageAttachments = (data.attachments ?? []).filter((a) => a.mimeType.startsWith("image/"));

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-6" onClick={() => navigate("/purchase")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        목록으로
      </Button>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-2xl">{data.productName}</CardTitle>
              <p className="text-sm text-gray-500 mt-1 break-words">
                요청번호: {data.requestNumber}
              </p>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">수량</p>
              <p className="font-semibold">{data.quantity}개</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">총 금액(원)</p>
              <p className="font-semibold">₩{(data.totalAmountKrw ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">작성일</p>
              <p className="font-semibold">
                {new Date(data.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">수정일</p>
              <p className="font-semibold">
                {new Date(data.updatedAt).toLocaleString("ko-KR")}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-semibold">상품 URL</p>
            {data.urls && data.urls.length > 0 ? (
              <ul className="space-y-1">
                {data.urls.map((u, idx) => (
                  <li key={`${u}-${idx}`}>
                    <a className="text-blue-600 underline break-all" href={u} target="_blank" rel="noreferrer">
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">등록된 URL이 없습니다.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-semibold">옵션</p>
            {optionsEntries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {optionsEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded border p-3">
                    <span className="text-sm text-gray-600">{k}</span>
                    <span className="text-sm font-medium text-gray-900 truncate ml-2">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">등록된 옵션이 없습니다.</p>
            )}
          </div>

          {data.memo && (
            <div className="space-y-2">
              <p className="font-semibold">메모</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.memo}</p>
            </div>
          )}

          {imageAttachments.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">첨부 이미지</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imageAttachments.map((att, idx) => (
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
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

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

