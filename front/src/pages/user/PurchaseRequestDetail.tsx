import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { X, Download, ChevronLeft, ChevronRight, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { purchaseStatusBadgeClass } from "../../utils/purchaseStatusStyle";
import { DescriptionList, EmptyState, LoadingState, PageHeader, Section } from "../../components/page";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { useTranslation } from "../../hooks/useTranslation";
import type { PurchaseRequestStatus } from "../../types";
import type { PurchaseAttachment, PurchaseRequestDetail as PurchaseRequestDetailType, PurchaseShipping } from "../../types/purchase";

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

const TIMELINE_STEPS: PurchaseRequestStatus[] = ["REQUESTED", "PURCHASING", "SHIPPING", "COMPLETED"];

function hasShippingSnapshot(s?: PurchaseShipping | null): boolean {
  if (!s) return false;
  return Boolean(s.addressLine1 || s.recipientName);
}

function optionRecordEntries(opt: unknown): [string, string][] {
  if (opt == null || typeof opt !== "object" || Array.isArray(opt)) return [];
  return Object.entries(opt as Record<string, unknown>)
    .filter(([, v]) => v != null && String(v) !== "")
    .map(([k, v]) => [k, String(v)]);
}

function itemUrls(it: { url: string; urls?: string[] }): string[] {
  if (it.urls && it.urls.length > 0) return it.urls;
  return it.url ? [it.url] : [];
}

/** Ordered status steps for the timeline; a cancelled request shows only "received" and "cancelled". */
function timelineFor(status: PurchaseRequestStatus): { status: PurchaseRequestStatus; done: boolean; current: boolean }[] {
  const steps: PurchaseRequestStatus[] = status === "CANCELLED" ? ["REQUESTED", "CANCELLED"] : TIMELINE_STEPS;
  const idx = steps.indexOf(status);
  return steps.map((s, i) => ({ status: s, done: i <= idx, current: i === idx }));
}

function StatusTimeline({ status, t }: { status: PurchaseRequestStatus; t: TFunc }) {
  return (
    <ol className="space-y-4">
      {timelineFor(status).map((step) => (
        <li key={step.status} className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-[5px] size-2.5 shrink-0 rounded-full border",
              step.done
                ? step.status === "CANCELLED"
                  ? "border-destructive bg-destructive"
                  : "border-foreground bg-foreground"
                : "border-foreground/30 bg-background",
            )}
          />
          <div className="min-w-0">
            <p
              className={cn("text-sm", step.current ? "font-medium" : step.done ? "" : "text-muted-foreground")}
              aria-current={step.current ? "step" : undefined}
            >
              {t(`purchase.status.${step.status}`)}
            </p>
            {step.current ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{t(`home.recentRequests.hint.${step.status}`)}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ProductUrlBlock({ shop, urls, t }: { shop?: string | null; urls: string[]; t: TFunc }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1 space-y-1">
        {shop ? (
          <p className="text-xs text-muted-foreground">
            {t("purchaseDetail.shop")} <span className="text-foreground">{shop}</span>
          </p>
        ) : null}
        <ul className="space-y-1">
          {urls.map((url, i) => (
            <li key={`${url}-${i}`} className="break-all text-sm leading-relaxed">
              {url}
            </li>
          ))}
        </ul>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 self-start"
        onClick={() => window.open(urls[0], "_blank", "noopener,noreferrer")}
      >
        <ExternalLink strokeWidth={1.5} aria-hidden />
        {t("purchaseDetail.openInNewWindow")}
      </Button>
    </div>
  );
}

function OptionAttributesReadonlyList({ entries }: { entries: [string, string][] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="space-y-0.5 text-sm leading-relaxed">
      {entries.map(([name, value], i) => (
        <li key={`${name}-${i}`}>
          <span className="text-muted-foreground">{name}</span>
          <span className="text-muted-foreground">: </span>
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

function PhotoGrid({
  items,
  all,
  onOpen,
}: {
  items: PurchaseAttachment[];
  all: PurchaseAttachment[];
  onOpen: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {items.map((att) => {
        const idx = all.findIndex((a) => a.id === att.id);
        return (
          <li key={att.id} className="min-w-0">
            <button
              type="button"
              className="block w-full border border-border transition-colors hover:border-foreground"
              title={att.originalFilename}
              onClick={() => onOpen(idx)}
            >
              <img
                src={att.thumbnailUrl ?? att.viewUrl ?? att.storedUrl}
                alt={att.originalFilename}
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ImageLightbox({
  images,
  initialIndex,
  onClose,
  t,
}: {
  images: PurchaseAttachment[];
  initialIndex: number;
  onClose: () => void;
  t: TFunc;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-screen w-full max-w-5xl flex-col items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex w-full items-center justify-between gap-4">
          <span className="max-w-xs truncate text-sm text-background">{img.originalFilename}</span>
          <div className="flex items-center gap-2">
            <a
              href={img.viewUrl ?? img.storedUrl}
              download={img.originalFilename}
              title={img.originalFilename}
              aria-label={img.originalFilename}
              className="inline-flex size-9 items-center justify-center text-background transition-colors hover:bg-background/20"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="size-5" strokeWidth={1.5} aria-hidden />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="text-background hover:bg-background/20 hover:text-background"
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
              className="absolute left-0 z-10 text-background hover:bg-background/20 hover:text-background"
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
              className="absolute right-0 z-10 text-background hover:bg-background/20 hover:text-background"
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

export default function PurchaseRequestDetail() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
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
    return <LoadingState label={t("purchaseDetail.loading")} />;
  }

  if (!data) {
    return (
      <EmptyState
        title={t("purchaseDetail.notFound")}
        action={
          <Button variant="outline" onClick={() => navigate("/purchase")}>
            {t("inquiry.detail.backToList")}
          </Button>
        }
      />
    );
  }

  const legacyOptionsEntries = optionRecordEntries(data.options);

  const imageAttachments = (data.attachments ?? []).filter((a) => a.mimeType.startsWith("image/"));
  const userAttachments = imageAttachments.filter((a) => !a.uploadedByAdmin);
  const adminAttachments = imageAttachments.filter((a) => a.uploadedByAdmin);

  const showShipping = Boolean((hasShippingSnapshot(data.shipping) && data.shipping) || data.trackingNumber);
  const shippingItems = [
    ...(hasShippingSnapshot(data.shipping) && data.shipping
      ? [
          ...(data.shipping.recipientName || data.shipping.recipientPhone
            ? [
                {
                  key: "recipient",
                  label: t("myPage.recipient"),
                  value: (
                    <>
                      {data.shipping.recipientName ?? ""}
                      {data.shipping.recipientPhone ? (
                        <span className="text-muted-foreground figure"> · {data.shipping.recipientPhone}</span>
                      ) : null}
                    </>
                  ),
                },
              ]
            : []),
          {
            key: "address",
            label: t("myPage.address"),
            value: (
              <>
                {data.shipping.label ? <p className="font-medium">{data.shipping.label}</p> : null}
                <p className="break-words leading-relaxed">
                  {data.shipping.postalCode ? <span className="mr-1 figure">({data.shipping.postalCode})</span> : null}
                  {data.shipping.addressLine1}
                  {data.shipping.addressLine2 ? ` ${data.shipping.addressLine2}` : ""}
                </p>
              </>
            ),
          },
        ]
      : []),
    ...(data.trackingNumber
      ? [
          {
            key: "tracking",
            label: t("purchaseDetail.trackingNumber"),
            value: <span className="figure">{data.trackingNumber}</span>,
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        back={{ to: "/purchase", label: t("inquiry.detail.backToList") }}
        title={data.requestName}
        meta={
          <>
            <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-medium", purchaseStatusBadgeClass(data.status))}>
              {t(`purchase.status.${data.status}`)}
            </Badge>
            <span className="figure">{data.requestNumber}</span>
            <span aria-hidden>·</span>
            <time dateTime={data.createdAt} className="figure">
              {new Date(data.createdAt).toLocaleString(dateLocale)}
            </time>
          </>
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/chat")}>
            <MessageSquare strokeWidth={1.5} aria-hidden />
            {t("purchaseDetail.chatInquiry")}
          </Button>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="min-w-0 space-y-10 md:space-y-12">
          <Section id="purchase-status-heading" title={t("purchase.list.summaryTitle")}>
            <StatusTimeline status={data.status} t={t} />
          </Section>

          <Section id="purchase-items-heading" title={t("purchaseDetail.items")} flush>
            {data.items && data.items.length > 0 ? (
              <ul>
                {data.items.map((it, idx) => {
                  const itemOptions = optionRecordEntries(it.options);
                  return (
                    <li key={`${it.url}-${idx}`} className="space-y-3 border-b border-border py-4">
                      <ProductUrlBlock shop={it.shop} urls={itemUrls(it)} t={t} />
                      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground figure">
                          {t("purchaseDetail.unitPrice")} ₩{(it.priceKrw ?? 0).toLocaleString()} ×{" "}
                          {t("purchaseDetail.quantityUnit", { n: it.quantity ?? 0 })}
                        </span>
                        <span className="font-medium figure">
                          ₩{((it.priceKrw ?? 0) * (it.quantity ?? 0)).toLocaleString()}
                        </span>
                      </p>
                      {itemOptions.length > 0 ? (
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">{t("purchaseDetail.options")}</p>
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
                  <li key={`${u}-${idx}`} className="border-b border-border py-4">
                    <ProductUrlBlock urls={[u]} t={t} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-b border-border py-4 text-sm text-muted-foreground">{t("purchaseDetail.noItems")}</p>
            )}
          </Section>

          {legacyOptionsEntries.length > 0 && (
            <Section id="purchase-common-options-heading" title={t("purchaseDetail.commonOptions")}>
              <OptionAttributesReadonlyList entries={legacyOptionsEntries} />
            </Section>
          )}

          {showShipping ? (
            <div id="purchase-shipping" className="scroll-mt-28">
              <Section id="purchase-shipping-heading" title={t("purchaseDetail.shipping")}>
                <DescriptionList items={shippingItems} />
              </Section>
            </div>
          ) : null}

          {data.memo && (
            <Section id="purchase-memo-heading" title={t("purchaseDetail.memo")}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.memo}</p>
            </Section>
          )}

          {userAttachments.length > 0 && (
            <Section id="purchase-my-photos-heading" title={t("purchaseDetail.myPhotos")}>
              <PhotoGrid items={userAttachments} all={imageAttachments} onOpen={setLightboxIndex} />
            </Section>
          )}

          {adminAttachments.length > 0 && (
            <Section id="purchase-admin-photos-heading" title={t("purchaseDetail.adminPhotos")}>
              <PhotoGrid items={adminAttachments} all={imageAttachments} onOpen={setLightboxIndex} />
            </Section>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border p-5 md:p-6">
            <p className="text-xs text-muted-foreground">{t("purchaseDetail.totalAmount")}</p>
            <p className="mt-2 text-3xl font-light figure md:text-4xl">₩{(data.totalAmountKrw ?? 0).toLocaleString()}</p>
            <DescriptionList
              dense
              className="mt-6"
              items={[
                {
                  key: "number",
                  label: t("purchaseDetail.requestNumber"),
                  value: <span className="figure">{data.requestNumber}</span>,
                },
                {
                  key: "quantity",
                  label: t("purchaseDetail.quantity"),
                  value: <span className="figure">{t("purchaseDetail.quantityUnit", { n: data.quantity })}</span>,
                },
                {
                  key: "createdAt",
                  label: t("purchaseDetail.createdAt"),
                  value: (
                    <time dateTime={data.createdAt} className="figure">
                      {new Date(data.createdAt).toLocaleString(dateLocale)}
                    </time>
                  ),
                },
                {
                  key: "updatedAt",
                  label: t("purchaseDetail.updatedAt"),
                  value: (
                    <time dateTime={data.updatedAt} className="figure">
                      {new Date(data.updatedAt).toLocaleString(dateLocale)}
                    </time>
                  ),
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
          t={t}
        />
      )}
    </div>
  );
}
