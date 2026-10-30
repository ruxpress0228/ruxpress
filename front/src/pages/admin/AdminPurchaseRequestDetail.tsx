import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { X, Download, ChevronLeft, ChevronRight, MessageSquare, Paperclip } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { purchaseStatusBadgeClass } from "../../utils/purchaseStatusStyle";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { useTranslation } from "../../hooks/useTranslation";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseAttachment, PurchaseRequestDetail, PurchaseShipping } from "../../types/purchase";
import {
  DescriptionList,
  EmptyState,
  LoadingState,
  PageHeader,
  Section,
  type DescriptionItem,
} from "../../components/page";

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

function optionRecordEntries(opt: unknown): [string, string][] {
  if (opt == null || typeof opt !== "object" || Array.isArray(opt)) return [];
  return Object.entries(opt as Record<string, unknown>)
    .filter(([, v]) => v != null && String(v) !== "")
    .map(([k, v]) => [k, String(v)]);
}

function OptionAttributesReadonlyList({ entries }: { entries: [string, string][] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-sm leading-relaxed">
      {entries.map(([name, value], i) => (
        <li key={`${name}-${i}`} className="break-words">
          <span className="text-muted-foreground">{name}: </span>
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

const LINK_CLASS =
  "break-all text-sm underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground";

/** Thumbnail grid; each tile opens the lightbox. */
function AttachmentImageGrid({
  images,
  onOpen,
}: {
  images: PurchaseAttachment[];
  onOpen: (att: PurchaseAttachment) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((att) => (
        <button
          key={att.id}
          type="button"
          onClick={() => onOpen(att)}
          title={att.originalFilename}
          className="block border border-border transition-colors hover:border-foreground"
        >
          <img
            src={att.thumbnailUrl ?? att.viewUrl ?? att.storedUrl}
            alt={att.originalFilename}
            className="h-28 w-full object-cover"
          />
        </button>
      ))}
    </div>
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

  const iconButtonClass = "text-background hover:bg-background/20 hover:text-background";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/85"
      role="dialog"
      aria-modal="true"
      aria-label={img.originalFilename}
      onClick={onClose}
    >
      <div
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
              aria-label={img.originalFilename}
              className={cn("inline-flex size-9 items-center justify-center transition-colors", iconButtonClass)}
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="size-5" strokeWidth={1.5} aria-hidden />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className={iconButtonClass}
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
              className={cn("absolute left-0 z-10", iconButtonClass)}
              title={t("admin.common.prev")}
              aria-label={t("admin.common.prev")}
              onClick={() => setCurrent((c) => c - 1)}
            >
              <ChevronLeft className="size-6" strokeWidth={1.5} aria-hidden />
            </Button>
          )}
          <img
            src={img.viewUrl ?? img.storedUrl}
            alt={img.originalFilename}
            className="max-h-[75vh] max-w-full object-contain"
          />
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("absolute right-0 z-10", iconButtonClass)}
              title={t("admin.common.next")}
              aria-label={t("admin.common.next")}
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

export default function AdminPurchaseRequestDetail() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
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
    return <LoadingState label={t("adminPurchase.detail.loading")} />;
  }

  if (!data) {
    return (
      <EmptyState
        title={t("adminPurchase.detail.notFound")}
        action={
          <Button variant="outline" onClick={() => navigate("/admin/purchase-requests")}>
            {t("adminPurchase.detail.backToList")}
          </Button>
        }
      />
    );
  }

  const statusLabel = t(`purchase.status.${data.status}` as `purchase.status.${PurchaseRequestStatus}`);
  const legacyOptionsEntries = optionRecordEntries(data.options);
  const allAttachments = data.attachments ?? [];
  const imageAttachments = allAttachments.filter((a) => isImageMime(a.mimeType));
  const userImageAttachments = imageAttachments.filter((a) => !isAttachmentUploadedByAdmin(a));
  const adminImageAttachments = imageAttachments.filter((a) => isAttachmentUploadedByAdmin(a));
  const userOtherAttachments = allAttachments.filter(
    (a) => !isImageMime(a.mimeType) && !isAttachmentUploadedByAdmin(a)
  );
  const openImage = (att: PurchaseAttachment) => {
    setLightboxIndex(imageAttachments.findIndex((a) => a.id === att.id));
  };

  const shippingItems: DescriptionItem[] = [];
  if (hasShippingSnapshot(data.shipping) && data.shipping) {
    const s = data.shipping;
    if (s.label) {
      shippingItems.push({
        key: "label",
        label: t("adminPurchase.detail.shippingLabel"),
        value: <span className="font-medium">{s.label}</span>,
        span: true,
      });
    }
    shippingItems.push({ key: "recipient", label: t("adminPurchase.detail.recipient"), value: s.recipientName ?? "—" });
    shippingItems.push({
      key: "phone",
      label: t("adminPurchase.detail.phone"),
      value: <span className="figure">{s.recipientPhone ?? "—"}</span>,
    });
    shippingItems.push({
      key: "address",
      label: t("adminPurchase.detail.address"),
      span: true,
      value: (
        <span className="leading-relaxed">
          {s.postalCode ? <span className="text-muted-foreground">({s.postalCode}) </span> : null}
          {s.addressLine1}
          {s.addressLine2 ? (
            <>
              <br />
              {s.addressLine2}
            </>
          ) : null}
        </span>
      ),
    });
    if (s.userAddressId != null) {
      shippingItems.push({
        key: "userAddressId",
        label: t("adminPurchase.detail.userAddressId"),
        value: <span className="text-xs text-muted-foreground figure">{s.userAddressId}</span>,
        span: true,
      });
    }
  }
  const trackingItem: DescriptionItem = {
    key: "tracking",
    label: t("adminPurchase.detail.tracking"),
    span: true,
    value: data.trackingNumber ? (
      <span className="font-medium figure">{data.trackingNumber}</span>
    ) : (
      <span className="text-muted-foreground">{t("adminPurchase.detail.noTracking")}</span>
    ),
  };

  return (
    <div>
      <PageHeader
        back={{ to: "/admin/purchase-requests", label: t("adminPurchase.detail.backToList") }}
        title={data.requestName}
        description={
          data.userNickname || data.userEmail ? (
            <>
              <span>{t("adminPurchase.detail.member")}</span>{" "}
              <span className="font-medium text-foreground">{data.userNickname ?? "—"}</span>
              {data.userEmail ? <span> · {data.userEmail}</span> : null}
            </>
          ) : undefined
        }
        meta={
          <>
            <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-medium", purchaseStatusBadgeClass(data.status))}>
              {statusLabel}
            </Badge>
            <span className="figure">{t("adminPurchase.detail.requestNumber", { n: data.requestNumber })}</span>
            <span aria-hidden>·</span>
            <time dateTime={data.createdAt} className="figure">
              {new Date(data.createdAt).toLocaleString(dateLocale)}
            </time>
          </>
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/admin/chat")}>
            <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />
            {t("adminPurchase.detail.goToChat")}
          </Button>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="min-w-0 space-y-10">
          <Section title={t("adminPurchase.detail.items")} flush>
            {data.items && data.items.length > 0 ? (
              <ul>
                {data.items.map((it, idx) => {
                  const itemOptions = optionRecordEntries(it.options);
                  const urls = it.urls && it.urls.length > 0 ? it.urls : it.url ? [it.url] : [];
                  return (
                    <li key={`${it.url}-${idx}`} className="border-b border-border py-4">
                      {urls.length > 0 ? (
                        <ul className="space-y-1">
                          {urls.map((u, uIdx) => (
                            <li key={`${u}-${uIdx}`}>
                              <a className={LINK_CLASS} href={u} target="_blank" rel="noreferrer">
                                {it.shop ? `[${it.shop}] ` : ""}
                                {urls.length > 1 ? `${uIdx + 1}. ` : ""}
                                {u}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p className="mt-2 text-sm text-muted-foreground figure">
                        {t("adminPurchase.detail.unitPrice", { price: (it.priceKrw ?? 0).toLocaleString(dateLocale), qty: it.quantity ?? 0 })}{" "}
                        <span className="font-medium text-foreground">
                          ₩{((it.priceKrw ?? 0) * (it.quantity ?? 0)).toLocaleString()}
                        </span>
                      </p>
                      {itemOptions.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">{t("adminPurchase.detail.options")}</p>
                          <OptionAttributesReadonlyList entries={itemOptions} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : data.urls && data.urls.length > 0 ? (
              <ul>
                {data.urls.map((u, idx) => (
                  <li key={`${u}-${idx}`} className="border-b border-border py-3">
                    <a className={LINK_CLASS} href={u} target="_blank" rel="noreferrer">{u}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-b border-border py-4 text-sm text-muted-foreground">{t("adminPurchase.detail.noItems")}</p>
            )}

            {legacyOptionsEntries.length > 0 && (
              <div className="pt-4">
                <p className="text-sm font-medium">{t("adminPurchase.detail.commonOptions")}</p>
                <OptionAttributesReadonlyList entries={legacyOptionsEntries} />
              </div>
            )}
          </Section>

          <Section title={t("adminPurchase.detail.shippingInfo")}>
            {shippingItems.length > 0 ? (
              <DescriptionList columns={2} items={[...shippingItems, trackingItem]} />
            ) : (
              <div className="space-y-4">
                <p className="border border-border p-4 text-sm text-muted-foreground">
                  {t("adminPurchase.detail.noShippingSnapshot")}
                </p>
                <DescriptionList items={[trackingItem]} />
              </div>
            )}
          </Section>

          {data.memo && (
            <Section title={t("adminPurchase.detail.customerMemo")}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.memo}</p>
            </Section>
          )}

          {data.adminMemo?.trim() ? (
            <Section title={t("adminPurchase.detail.internalMemo")}>
              <p className="bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap md:p-5">{data.adminMemo}</p>
            </Section>
          ) : null}

          {adminImageAttachments.length > 0 ? (
            <Section title={t("adminPurchase.detail.adminPhotos")}>
              <AttachmentImageGrid images={adminImageAttachments} onOpen={openImage} />
            </Section>
          ) : null}

          {(userImageAttachments.length > 0 || userOtherAttachments.length > 0) && (
            <Section title={t("adminPurchase.detail.customerAttachments")}>
              <div className="space-y-4">
                {userImageAttachments.length > 0 ? (
                  <AttachmentImageGrid images={userImageAttachments} onOpen={openImage} />
                ) : null}
                {userOtherAttachments.length > 0 ? (
                  <ul className="border-t border-border">
                    {userOtherAttachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-3 border-b border-border py-3 text-sm">
                        <Paperclip className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                        <a
                          href={att.viewUrl ?? att.storedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={cn("min-w-0", LINK_CLASS)}
                        >
                          {att.originalFilename}
                        </a>
                        <span className="shrink-0 text-xs text-muted-foreground">({att.mimeType})</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border p-5 md:p-6">
            <p className="text-xs text-muted-foreground">{t("adminPurchase.detail.totalKrw")}</p>
            <p className="mt-2 text-3xl font-light figure md:text-4xl">₩{(data.totalAmountKrw ?? 0).toLocaleString()}</p>
            <DescriptionList
              dense
              className="mt-6"
              items={[
                {
                  key: "quantity",
                  label: t("adminPurchase.detail.quantity"),
                  value: <span className="figure">{t("adminPurchase.detail.quantityUnit", { n: data.quantity })}</span>,
                },
                {
                  key: "createdAt",
                  label: t("adminPurchase.detail.createdAt"),
                  value: <span className="figure">{new Date(data.createdAt).toLocaleString(dateLocale)}</span>,
                },
                {
                  key: "updatedAt",
                  label: t("adminPurchase.detail.updatedAt"),
                  value: <span className="figure">{new Date(data.updatedAt).toLocaleString(dateLocale)}</span>,
                },
              ]}
            />
          </div>
        </aside>
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
