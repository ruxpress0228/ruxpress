import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, X, Download, ChevronLeft, ChevronRight, MessageSquare, MapPin, Truck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseAttachment, PurchaseRequestDetail, PurchaseShipping } from "../../types/purchase";

function hasShippingSnapshot(s?: PurchaseShipping | null): boolean {
  if (!s) return false;
  return Boolean(s.addressLine1 || s.recipientName);
}

function isImageMime(mimeType: string | undefined): boolean {
  return (mimeType ?? "").toLowerCase().startsWith("image/");
}

/**
 * 구매 첨부의 관리자 업로드 여부. JSON 키·타입 차이(camel/snake, 0/1)를 흡수한다.
 * 명시적으로 관리자 업로드가 아닌 것은 모두 고객 첨부로 본다.
 */
function isAttachmentUploadedByAdmin(att: PurchaseAttachment): boolean {
  const r = att as unknown as Record<string, unknown>;
  const v = r.uploadedByAdmin ?? r.uploaded_by_admin;
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

const statusLabels: Record<PurchaseRequestStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  REQUESTED: { label: "요청접수", variant: "secondary" },
  PURCHASING: { label: "구매진행중", variant: "default" },
  SHIPPING: { label: "배송중", variant: "default" },
  COMPLETED: { label: "완료", variant: "default" },
  CANCELLED: { label: "취소", variant: "destructive" },
};

function optionRecordEntries(opt: unknown): [string, string][] {
  if (opt == null || typeof opt !== "object" || Array.isArray(opt)) return [];
  return Object.entries(opt as Record<string, unknown>)
    .filter(([, v]) => v != null && String(v) !== "")
    .map(([k, v]) => [k, String(v)]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative flex flex-col items-center max-w-5xl w-full max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
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
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="relative flex items-center justify-center w-full">
          {hasPrev && (
            <Button variant="ghost" size="icon" className="absolute left-0 text-white hover:bg-white/20 z-10" onClick={() => setCurrent((c) => c - 1)}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <img src={img.viewUrl ?? img.storedUrl} alt={img.originalFilename} className="max-h-[75vh] max-w-full object-contain rounded" />
          {hasNext && (
            <Button variant="ghost" size="icon" className="absolute right-0 text-white hover:bg-white/20 z-10" onClick={() => setCurrent((c) => c + 1)}>
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>
        {images.length > 1 && (
          <p className="text-white/60 text-xs mt-2">{current + 1} / {images.length}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminPurchaseRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAdminPurchaseRequest } = usePurchase();
  const [data, setData] = useState<PurchaseRequestDetail | null>(null);
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
    getAdminPurchaseRequest(numericId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
        <Button variant="link" className="mt-2" onClick={() => navigate("/admin/purchase-requests")}>
          목록으로
        </Button>
      </div>
    );
  }

  const statusInfo = statusLabels[data.status];
  const legacyOptionsEntries = optionRecordEntries(data.options);
  const allAttachments = data.attachments ?? [];
  const imageAttachments = allAttachments.filter((a) => isImageMime(a.mimeType));
  const userImageAttachments = imageAttachments.filter((a) => !isAttachmentUploadedByAdmin(a));
  const adminImageAttachments = imageAttachments.filter((a) => isAttachmentUploadedByAdmin(a));
  const userOtherAttachments = allAttachments.filter(
    (a) => !isImageMime(a.mimeType) && !isAttachmentUploadedByAdmin(a)
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate("/admin/purchase-requests")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/chat")}>
          <MessageSquare className="w-4 h-4 mr-2" />
          채팅으로 이동
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-2xl">{data.requestName}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">요청번호: {data.requestNumber}</p>
              {(data.userNickname || data.userEmail) && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="text-gray-500">회원</span>{" "}
                  <span className="font-medium text-gray-900">{data.userNickname ?? "—"}</span>
                  {data.userEmail ? (
                    <span className="text-gray-600"> · {data.userEmail}</span>
                  ) : null}
                </p>
              )}
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
              <p className="font-semibold">{new Date(data.createdAt).toLocaleString("ko-KR")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">수정일</p>
              <p className="font-semibold">{new Date(data.updatedAt).toLocaleString("ko-KR")}</p>
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
                      <a className="text-blue-600 underline break-all" href={it.url} target="_blank" rel="noreferrer">
                        {it.shop ? `[${it.shop}] ` : ""}{it.url}
                      </a>
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
              <ul className="space-y-1">
                {data.urls.map((u, idx) => (
                  <li key={`${u}-${idx}`}>
                    <a className="text-blue-600 underline break-all" href={u} target="_blank" rel="noreferrer">{u}</a>
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

          <div className="rounded-lg border border-slate-200 bg-gradient-to-b from-slate-50/90 to-white p-4 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
              배송 정보
            </div>

            {hasShippingSnapshot(data.shipping) && data.shipping ? (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {data.shipping.label ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">배송지 라벨</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">{data.shipping.label}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">수령인</dt>
                  <dd className="mt-0.5 text-gray-900">{data.shipping.recipientName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">연락처</dt>
                  <dd className="mt-0.5 text-gray-900">{data.shipping.recipientPhone ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">주소</dt>
                  <dd className="mt-0.5 break-words leading-relaxed text-gray-900">
                    {data.shipping.postalCode ? <span className="text-gray-600">({data.shipping.postalCode}) </span> : null}
                    {data.shipping.addressLine1}
                    {data.shipping.addressLine2 ? (
                      <>
                        <br />
                        <span className="text-gray-800">{data.shipping.addressLine2}</span>
                      </>
                    ) : null}
                  </dd>
                </div>
                {data.shipping.userAddressId != null && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">회원 배송지 ID</dt>
                    <dd className="mt-0.5 font-mono text-xs text-gray-600">{data.shipping.userAddressId}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="rounded-md border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-amber-900">
                배송지 스냅샷이 없습니다. 구버전 요청이거나 DB 마이그레이션 전 데이터일 수 있습니다.
              </p>
            )}

            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Truck className="h-3.5 w-3.5" aria-hidden />
                운송장번호
              </div>
              {data.trackingNumber ? (
                <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{data.trackingNumber}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">등록된 운송장번호가 없습니다. 목록의 빠른 관리에서 입력할 수 있습니다.</p>
              )}
            </div>
          </div>

          {data.memo && (
            <div className="space-y-2">
              <p className="font-semibold">고객 요청 메모</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.memo}</p>
            </div>
          )}

          {(data.adminMemo?.trim() || adminImageAttachments.length > 0) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-4">
              {data.adminMemo?.trim() ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">내부 메모</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{data.adminMemo}</p>
                </div>
              ) : null}
              {adminImageAttachments.length > 0 ? (
                <div className={data.adminMemo?.trim() ? "space-y-2 border-t border-slate-200 pt-4" : "space-y-2"}>
                  <p className="text-sm font-semibold text-gray-900">관리자 사진 첨부 · 피드백</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {adminImageAttachments.map((att) => {
                      const idx = imageAttachments.findIndex((a) => a.id === att.id);
                      return (
                        <div
                          key={att.id}
                          className="relative group cursor-pointer rounded overflow-hidden border bg-white"
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
              ) : null}
            </div>
          )}

          {(userImageAttachments.length > 0 || userOtherAttachments.length > 0) && (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <p className="text-sm font-medium text-gray-700">고객 등록 첨부</p>
              {userImageAttachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {userImageAttachments.map((att) => {
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
              ) : null}
              {userOtherAttachments.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {userOtherAttachments.map((att) => (
                    <li key={att.id}>
                      <a
                        href={att.viewUrl ?? att.storedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {att.originalFilename}
                      </a>
                      <span className="text-gray-400"> ({att.mimeType})</span>
                    </li>
                  ))}
                </ul>
              ) : null}
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
