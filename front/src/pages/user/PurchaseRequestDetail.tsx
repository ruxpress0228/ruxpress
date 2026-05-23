import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, X, Download, ChevronLeft, ChevronRight, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { purchaseStatusBadgeClass } from "../../utils/purchaseStatusStyle";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseAttachment, PurchaseRequestDetail as PurchaseRequestDetailType, PurchaseShipping } from "../../types/purchase";

function hasShippingSnapshot(s?: PurchaseShipping | null): boolean {
  if (!s) return false;
  return Boolean(s.addressLine1 || s.recipientName);
}

const statusLabels: Record<PurchaseRequestStatus, { label: string }> = {
  REQUESTED: { label: "요청접수" },
  PURCHASING: { label: "구매진행중" },
  SHIPPING: { label: "배송중" },
  COMPLETED: { label: "완료" },
  CANCELLED: { label: "취소" },
};

function optionRecordEntries(opt: unknown): [string, string][] {
  if (opt == null || typeof opt !== "object" || Array.isArray(opt)) return [];
  return Object.entries(opt as Record<string, unknown>)
    .filter(([, v]) => v != null && String(v) !== "")
    .map(([k, v]) => [k, String(v)]);
}

function ProductUrlBlock({ shop, url }: { shop?: string | null; url: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        {shop ? (
          <p className="text-xs font-medium text-gray-500">
            쇼핑몰 <span className="text-gray-800">{shop}</span>
          </p>
        ) : null}
        <p className="text-sm text-gray-900 break-all font-mono leading-relaxed">{url}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 self-start gap-1.5"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        새 창에서 열기
      </Button>
    </div>
  );
}

function OptionAttributesReadonlyList({ entries }: { entries: [string, string][] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-sm leading-relaxed text-gray-800">
      {entries.map(([name, value], i) => (
        <li key={`${name}-${i}`} className="pl-0.5">
          <span className="text-gray-400 select-none" aria-hidden>
            -{" "}
          </span>
          <span className="text-gray-600">{name}</span>
          <span className="text-gray-400">: </span>
          <span className="text-gray-900">{value}</span>
        </li>
      ))}
    </ul>
  );
}

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
  const legacyOptionsEntries = optionRecordEntries(data.options);

  const imageAttachments = (data.attachments ?? []).filter((a) => a.mimeType.startsWith("image/"));
  const userAttachments = imageAttachments.filter((a) => !a.uploadedByAdmin);
  const adminAttachments = imageAttachments.filter((a) => a.uploadedByAdmin);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate("/purchase")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
        <Button variant="outline" onClick={() => navigate("/chat")}>
          <MessageSquare className="w-4 h-4 mr-2" />
          채팅으로 문의
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-2xl">{data.requestName}</CardTitle>
              <p className="text-sm text-gray-500 mt-1 break-words">
                요청번호: {data.requestNumber}
              </p>
            </div>
            <Badge variant="outline" className={cn("border-transparent font-semibold", purchaseStatusBadgeClass(data.status))}>
              {statusInfo.label}
            </Badge>
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
            <p className="font-semibold">상품 항목</p>
            {data.items && data.items.length > 0 ? (
              <ul className="space-y-2">
                {data.items.map((it, idx) => {
                  const itemOptions = optionRecordEntries(it.options);
                  return (
                    <li key={`${it.url}-${idx}`} className="border rounded-lg p-3 sm:p-4 space-y-2">
                      <ProductUrlBlock shop={it.shop} url={it.url} />
                      <div className="text-sm text-gray-700 pt-1 border-t border-gray-100">
                        단가 ₩{(it.priceKrw ?? 0).toLocaleString()} × {it.quantity ?? 0}개 =
                        <span className="font-semibold ml-1">
                          ₩{((it.priceKrw ?? 0) * (it.quantity ?? 0)).toLocaleString()}
                        </span>
                      </div>
                      {itemOptions.length > 0 ? (
                        <div className="pt-2 border-t border-gray-50">
                          <p className="text-sm font-medium text-gray-600 mb-1">옵션</p>
                          <OptionAttributesReadonlyList entries={itemOptions} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : data.urls && data.urls.length > 0 ? (
              <ul className="space-y-3">
                {data.urls.map((u, idx) => (
                  <li key={`${u}-${idx}`} className="border rounded-lg p-3">
                    <ProductUrlBlock url={u} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">등록된 상품 항목이 없습니다.</p>
            )}
          </div>

          {legacyOptionsEntries.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">공통 옵션</p>
              <OptionAttributesReadonlyList entries={legacyOptionsEntries} />
            </div>
          )}

          {(hasShippingSnapshot(data.shipping) && data.shipping) || data.trackingNumber ? (
            <div id="purchase-shipping" className="scroll-mt-28 space-y-4">
              {hasShippingSnapshot(data.shipping) && data.shipping && (
                <div className="space-y-2">
                  <p className="font-semibold">배송지</p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-sm text-gray-800 space-y-1">
                    {data.shipping.label ? <p className="font-medium text-gray-900">{data.shipping.label}</p> : null}
                    {(data.shipping.recipientName || data.shipping.recipientPhone) && (
                      <p>
                        {data.shipping.recipientName ?? ""}
                        {data.shipping.recipientPhone ? (
                          <span className="text-gray-600"> · {data.shipping.recipientPhone}</span>
                        ) : null}
                      </p>
                    )}
                    <p className="break-words leading-relaxed">
                      {data.shipping.postalCode ? <span className="mr-1">({data.shipping.postalCode})</span> : null}
                      {data.shipping.addressLine1}
                      {data.shipping.addressLine2 ? ` ${data.shipping.addressLine2}` : ""}
                    </p>
                  </div>
                </div>
              )}

              {data.trackingNumber && (
                <div className="space-y-1">
                  <p className="font-semibold">운송장번호</p>
                  <p className="text-sm font-mono text-gray-900">{data.trackingNumber}</p>
                </div>
              )}
            </div>
          ) : null}

          {data.memo && (
            <div className="space-y-2">
              <p className="font-semibold">메모</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.memo}</p>
            </div>
          )}

          {userAttachments.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">내가 등록한 사진</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {userAttachments.map((att) => {
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
            </div>
          )}

          {adminAttachments.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">관리자가 등록한 사진 (배송/수령 등)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {adminAttachments.map((att) => {
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

