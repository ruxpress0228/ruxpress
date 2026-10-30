import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Plus, X, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { cn } from "../../components/ui/utils";
import {
  DescriptionList,
  EmptyState,
  Field,
  FormActions,
  FormSection,
  LoadingState,
  PageHeader,
} from "../../components/page";
import { toast } from "sonner";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { api } from "../../utils/api";
import { formatDate, formatNumber } from "../../utils/format";
import { USER_BALANCE_CHANGE_EVENT } from "../../utils/constants";
import type { PurchaseRequestStatus } from "../../types";
import type { UserAddress } from "../../types/domain";
import {
  type QuoteCurrency,
  type CurrentExchangeRates,
  QUOTE_CURRENCIES,
  buildRateMap,
  findQuoteRate,
  krwToQuote,
  rateToKrw,
} from "../../utils/exchange";

const DEFAULT_FEE_PERCENT = 12;
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 옵션: 전형적인 입력 박스보다 덜 강조된 밑줄 스타일(상품 속성 메모 느낌) */
const OPTION_FIELD_CLASS =
  "h-9 w-full min-w-0 border-0 border-b border-border bg-transparent px-1 py-1 text-sm " +
  "focus-visible:border-foreground focus-visible:ring-0 placeholder:text-muted-foreground/70";

type LineOption = { name: string; value: string };
type PurchaseLineItem = { urls: string[]; shop: string; priceKrw: number; quantity: number; options: LineOption[] };

const emptyLineItem = (): PurchaseLineItem => ({
  urls: [""],
  shop: "",
  priceKrw: 0,
  quantity: 1,
  options: [],
});

function optionsToRecord(rows: LineOption[]): Record<string, string> | undefined {
  const acc: Record<string, string> = {};
  for (const cur of rows) {
    const key = cur.name.trim();
    const value = cur.value.trim();
    if (key && value) acc[key] = value;
  }
  return Object.keys(acc).length ? acc : undefined;
}

export default function PurchaseRequestForm() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { getCurrentExchangeRates } = useExchangeRate();
  const { createPurchaseRequest } = usePurchase();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [ratesData, setRatesData] = useState<CurrentExchangeRates | null>(null);
  const [quoteCurrency, setQuoteCurrency] = useState<QuoteCurrency>("RUB");
  const [feeRatePercent, setFeeRatePercent] = useState<number>(DEFAULT_FEE_PERCENT);
  const [items, setItems] = useState<PurchaseLineItem[]>([emptyLineItem()]);
  const [requestName, setRequestName] = useState("");
  const [memo, setMemo] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null);

  const rateMap = useMemo(
    () => (ratesData ? buildRateMap(ratesData.quotes) : new Map<string, number>()),
    [ratesData]
  );
  const selectedQuoteRate = useMemo(
    () => (quoteCurrency === "KRW" ? undefined : findQuoteRate(ratesData?.quotes ?? [], quoteCurrency)),
    [ratesData, quoteCurrency]
  );

  useEffect(() => {
    getCurrentExchangeRates()
      .then(setRatesData)
      .catch(() => setRatesData(null));

    api
      .get<{ feeRatePercent: number }>("/v1/settings/fee-rate")
      .then((res) => {
        const v = res?.data?.feeRatePercent;
        if (v != null && Number.isFinite(Number(v))) {
          setFeeRatePercent(Number(v));
        }
      })
      .catch(() => {
        // 기본값 유지
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAddressesLoading(true);
    api
      .get<UserAddress[]>("/v1/users/me/addresses")
      .then((res) => {
        if (cancelled) return;
        if (res.code === 200 && Array.isArray(res.data)) {
          setAddresses(res.data);
          const preferred = res.data.find((a) => a.isDefault) ?? res.data[0];
          setSelectedShippingId(preferred?.id ?? null);
        } else {
          setAddresses([]);
          setSelectedShippingId(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddresses([]);
          setSelectedShippingId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({ file, url: URL.createObjectURL(file) }));
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  const addItem = () => {
    setItems([...items, emptyLineItem()]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addUrl = (itemIndex: number) => {
    const next = [...items];
    next[itemIndex] = { ...next[itemIndex], urls: [...next[itemIndex].urls, ""] };
    setItems(next);
  };

  const removeUrl = (itemIndex: number, urlIndex: number) => {
    const next = [...items];
    const urls = next[itemIndex].urls.filter((_, i) => i !== urlIndex);
    next[itemIndex] = { ...next[itemIndex], urls: urls.length > 0 ? urls : [""] };
    setItems(next);
  };

  const updateUrl = (itemIndex: number, urlIndex: number, value: string) => {
    const next = [...items];
    const urls = [...next[itemIndex].urls];
    urls[urlIndex] = value;
    next[itemIndex] = { ...next[itemIndex], urls };
    setItems(next);
  };

  const updateItem = (
    index: number,
    field: "shop" | "priceKrw" | "quantity",
    value: string | number
  ) => {
    const next = [...items];
    if (field === "priceKrw") {
      next[index].priceKrw = typeof value === "number" ? value : parseFloat(value) || 0;
    } else if (field === "quantity") {
      const n = typeof value === "number" ? value : parseInt(value, 10) || 1;
      next[index].quantity = Math.max(1, n);
    } else {
      next[index][field] = typeof value === "string" ? value : String(value);
    }
    setItems(next);
  };

  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const aggregatedPriceKrw = items.reduce(
    (sum, it) => sum + (Number(it.priceKrw) || 0) * (Number(it.quantity) || 0),
    0
  );

  const addLineOption = (itemIndex: number) => {
    const next = [...items];
    next[itemIndex] = {
      ...next[itemIndex],
      options: [...next[itemIndex].options, { name: "", value: "" }],
    };
    setItems(next);
  };

  const removeLineOption = (itemIndex: number, optIndex: number) => {
    const next = [...items];
    next[itemIndex] = {
      ...next[itemIndex],
      options: next[itemIndex].options.filter((_, i) => i !== optIndex),
    };
    setItems(next);
  };

  const updateLineOption = (itemIndex: number, optIndex: number, field: "name" | "value", value: string) => {
    const next = [...items];
    const rowOpts = [...next[itemIndex].options];
    rowOpts[optIndex] = { ...rowOpts[optIndex], [field]: value };
    next[itemIndex] = { ...next[itemIndex], options: rowOpts };
    setItems(next);
  };

  const calculateTotal = () => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const feeRate = feeRatePercent / 100;
    const productPrice = aggregatedPriceKrw;
    const feeKrw = productPrice * feeRate;
    const totalKrw = productPrice + feeKrw;
    const toQuote = (krw: number) => {
      if (quoteCurrency === "KRW") return round2(krw);
      const converted = krwToQuote(krw, quoteCurrency, rateMap);
      return converted != null ? converted : 0;
    };
    return {
      priceKrw: round2(productPrice),
      feeKrw: round2(feeKrw),
      totalKrw: round2(totalKrw),
      priceQuote: toQuote(productPrice),
      feeQuote: toQuote(feeKrw),
      totalQuote: toQuote(totalKrw),
    };
  };

  const addImages = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const next: File[] = [];
    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        continue;
      }
      next.push(file);
    }

    const combined = [...images, ...next].slice(0, MAX_IMAGES);

    const tooMany = images.length + next.length > MAX_IMAGES;
    const droppedByTypeOrSize = next.length < selectedFiles.length;
    if (droppedByTypeOrSize) {
      toast.error(t("purchase.image.desc"));
    }
    if (tooMany) {
      toast.error(t("purchase.image.desc"));
    }

    setImages(combined);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    addImages(selected);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    addImages(dropped);
  };
  const totals = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const cleanedItems = items
        .map((it) => {
          const urls = it.urls.map((u) => u.trim()).filter((u) => u !== "");
          return {
            urls,
            shop: it.shop.trim(),
            priceKrw: Number(it.priceKrw) || 0,
            quantity: Math.max(1, Number(it.quantity) || 1),
            options: it.options,
          };
        })
        .filter((it) => it.urls.length > 0 && it.priceKrw > 0);

      if (cleanedItems.length === 0) {
        toast.error("최소 1개 이상의 상품(URL/단가/수량)을 입력해주세요.");
        setSubmitting(false);
        return;
      }

      if (selectedShippingId == null) {
        toast.error(t("purchase.shipping.required"));
        setSubmitting(false);
        return;
      }

      const feeAmount = totals.feeKrw;
      const status: PurchaseRequestStatus = "REQUESTED";
      const quoteRate = quoteCurrency === "KRW" ? 1 : rateToKrw(quoteCurrency, rateMap);
      if (quoteCurrency !== "KRW" && (quoteRate == null || !selectedQuoteRate)) {
        toast.error("선택한 통화의 환율 정보가 없습니다.");
        setSubmitting(false);
        return;
      }

      const payload = {
        requestName: requestName.trim(),
        items: cleanedItems.map((it) => {
          const opt = optionsToRecord(it.options);
          return {
            url: it.urls[0],
            urls: it.urls,
            shop: it.shop || undefined,
            priceKrw: it.priceKrw,
            quantity: it.quantity,
            ...(opt ? { options: opt } : {}),
          };
        }),
        quoteCurrency,
        priceRub: totals.priceQuote,
        exchangeRateId: selectedQuoteRate?.id,
        feeAmount,
        totalAmountKrw: totals.totalKrw,
        memo: memo.trim() || undefined,
        status,
        shippingUserAddressId: selectedShippingId,
        files: images.length > 0 ? images : undefined,
      };

      await createPurchaseRequest(payload);
      window.dispatchEvent(new Event(USER_BALANCE_CHANGE_EVENT));
      toast.success(t("purchase.toastSuccess"));
      navigate("/purchase");
    } catch (e) {
      const raw = e instanceof Error ? e.message.trim() : "";
      if (raw === "error.insufficient_balance") {
        toast.error(t("purchase.errorInsufficientBalance"));
      } else if (raw.startsWith("error.")) {
        const localized = t(raw);
        toast.error(localized !== raw ? localized : t("purchase.toastSubmitError"));
      } else if (raw) {
        toast.error(raw);
      } else {
        toast.error(t("purchase.toastSubmitError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const numOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  /** KRW amount with the optional quote-currency equivalent underneath, right-aligned. */
  const amountCell = (krw: number, quote: number) => (
    <span className="block text-right">
      <span className="font-medium figure">{formatNumber(krw, locale, numOpt)}원</span>
      {quoteCurrency !== "KRW" && (
        <span className="block text-xs text-muted-foreground figure">
          ~ {formatNumber(quote, locale, numOpt)} {quoteCurrency}
        </span>
      )}
    </span>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("purchase.title")} description={t("purchase.subtitle")} />

      <form onSubmit={handleSubmit}>
        <FormSection title={t("purchase.productCard.title")} description={t("purchase.productCard.desc")}>
          <Field htmlFor="requestName" label={t("purchase.requestName")}>
            <Input
              id="requestName"
              placeholder={t("purchase.requestNamePlaceholder")}
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              required
            />
          </Field>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{t("purchase.itemLinesLabel")}</p>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus strokeWidth={1.5} aria-hidden />
                항목 추가
              </Button>
            </div>

            <ul className="border-t border-border">
              {items.map((item, index) => (
                <li key={index} className="space-y-4 border-b border-border py-5">
                  <div className="flex items-start gap-2">
                    <Input
                      aria-label={t("purchase.shopName")}
                      placeholder={t("purchase.shopName")}
                      value={item.shop}
                      onChange={(e) => updateItem(index, "shop", e.target.value)}
                      className="sm:max-w-xs"
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
                        title={t("admin.common.delete")}
                        aria-label={t("admin.common.delete")}
                        onClick={() => removeItem(index)}
                      >
                        <X strokeWidth={1.5} aria-hidden />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-muted-foreground">{t("purchase.itemUrlsLabel")}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => addUrl(index)}
                      >
                        <Plus strokeWidth={1.5} aria-hidden />
                        {t("purchase.addUrl")}
                      </Button>
                    </div>
                    {item.urls.map((url, urlIndex) => (
                      <div key={urlIndex} className="flex items-center gap-2">
                        <Input
                          aria-label={t("purchase.itemUrlsLabel")}
                          placeholder="https://..."
                          value={url}
                          onChange={(e) => updateUrl(index, urlIndex, e.target.value)}
                          className="flex-1"
                          required={index === 0 && urlIndex === 0}
                        />
                        {item.urls.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            title={t("admin.common.delete")}
                            aria-label={t("admin.common.delete")}
                            onClick={() => removeUrl(index, urlIndex)}
                          >
                            <X strokeWidth={1.5} aria-hidden />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field htmlFor={`item-${index}-price`} label="단가 (KRW)">
                      <Input
                        id={`item-${index}-price`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="figure"
                        value={item.priceKrw || ""}
                        onChange={(e) => updateItem(index, "priceKrw", e.target.value)}
                        required
                      />
                    </Field>
                    <Field htmlFor={`item-${index}-qty`} label="수량">
                      <Input
                        id={`item-${index}-qty`}
                        type="number"
                        min="1"
                        className="figure"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        required
                      />
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-muted-foreground">{t("purchase.optionHeading")}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => addLineOption(index)}
                      >
                        <Plus strokeWidth={1.5} aria-hidden />
                        {t("purchase.addLineOption")}
                      </Button>
                    </div>
                    {item.options.length > 0 ? (
                      <ul className="space-y-2">
                        {item.options.map((option, optIdx) => (
                          <li key={optIdx} className="flex items-center gap-2">
                            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                              <Input
                                aria-label={t("purchase.optionNamePlaceholder")}
                                placeholder={t("purchase.optionNamePlaceholder")}
                                value={option.name}
                                onChange={(e) => updateLineOption(index, optIdx, "name", e.target.value)}
                                className={OPTION_FIELD_CLASS}
                              />
                              <Input
                                aria-label={t("purchase.optionValuePlaceholder")}
                                placeholder={t("purchase.optionValuePlaceholder")}
                                value={option.value}
                                onChange={(e) => updateLineOption(index, optIdx, "value", e.target.value)}
                                className={OPTION_FIELD_CLASS}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                              onClick={() => removeLineOption(index, optIdx)}
                              title="옵션 줄 삭제"
                              aria-label="옵션 줄 삭제"
                            >
                              <X className="size-4" strokeWidth={1.5} aria-hidden />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{t("purchase.itemOptionHint")}</p>
                  </div>

                  <p className="text-xs text-muted-foreground figure">
                    소계: ₩{formatNumber((item.priceKrw || 0) * (item.quantity || 0), locale, numOpt)}
                  </p>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground">{t("purchase.urlHint")}</p>
            <p className="text-sm">
              전체 수량 합계: <span className="font-medium figure">{totalQuantity}</span> 개 · 상품가 합계:{" "}
              <span className="font-medium figure">₩{formatNumber(aggregatedPriceKrw, locale, numOpt)}</span>
            </p>
          </div>
        </FormSection>

        <FormSection title={t("purchase.shipping.title")} description={t("purchase.shipping.desc")}>
          {addressesLoading ? (
            <LoadingState compact label={t("purchase.shipping.loading")} />
          ) : addresses.length === 0 ? (
            <EmptyState
              compact
              icon={MapPin}
              title={t("purchase.shipping.empty")}
              action={
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to="/mypage">{t("purchase.shipping.manage")}</Link>
                </Button>
              }
            />
          ) : (
            <RadioGroup
              value={selectedShippingId != null ? String(selectedShippingId) : ""}
              onValueChange={(v) => setSelectedShippingId(v ? Number(v) : null)}
              className="gap-2"
            >
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-start gap-3 border p-4 transition-colors",
                    selectedShippingId === a.id ? "border-foreground bg-muted/60" : "border-border hover:border-foreground/40",
                  )}
                >
                  <RadioGroupItem value={String(a.id)} id={`ship-addr-${a.id}`} className="mt-0.5" />
                  <Label
                    htmlFor={`ship-addr-${a.id}`}
                    className="flex-1 cursor-pointer flex-col items-start gap-1 text-sm font-normal leading-relaxed"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{a.label?.trim() || t("purchase.shipping.title")}</span>
                      {a.isDefault ? (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
                          {t("purchase.shipping.defaultBadge")}
                        </Badge>
                      ) : null}
                    </span>
                    {a.recipientName ? (
                      <span className="block">
                        {a.recipientName}
                        {a.recipientPhone ? (
                          <span className="text-muted-foreground figure"> · {a.recipientPhone}</span>
                        ) : null}
                      </span>
                    ) : null}
                    <span className="block break-words text-muted-foreground">
                      {a.postalCode ? <span className="mr-1 figure">({a.postalCode})</span> : null}
                      {a.addressLine1}
                      {a.addressLine2 ? ` ${a.addressLine2}` : ""}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </FormSection>

        <FormSection title={t("purchase.image.title")} description={t("purchase.image.desc")}>
          <div
            className={cn(
              "cursor-pointer border border-dashed p-8 text-center text-sm text-muted-foreground transition-colors",
              isDragOver ? "border-foreground bg-muted/60" : "border-input hover:border-foreground",
            )}
            onClick={() => imageInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") imageInputRef.current?.click();
            }}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
            <Upload className="mx-auto mb-3 size-6" strokeWidth={1.25} aria-hidden />
            <p>{t("purchase.image.upload")}</p>
          </div>
          {imagePreviews.length > 0 && (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {imagePreviews.map((p, index) => (
                <li key={`${p.file.name}-${p.file.size}-${index}`} className="relative min-w-0">
                  <img src={p.url} alt={p.file.name} className="aspect-square w-full border border-border object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 size-7 bg-background/80 hover:bg-background"
                    title={t("admin.common.delete")}
                    aria-label={t("admin.common.delete")}
                    onClick={() => removeImage(index)}
                  >
                    <X className="size-4" strokeWidth={1.5} aria-hidden />
                  </Button>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{p.file.name}</p>
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        <FormSection title={t("purchase.notes.title")} description={t("purchase.notes.desc")}>
          <Textarea
            id="memo"
            aria-label={t("purchase.notes.title")}
            placeholder={t("purchase.notes.placeholder")}
            rows={4}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </FormSection>

        <FormSection title={t("purchase.summary.title")}>
          <div className="space-y-2">
            <p id="quote-currency-label" className="text-sm font-medium">
              {t("purchase.summary.quoteCurrency")}
            </p>
            <Tabs value={quoteCurrency} onValueChange={(v) => setQuoteCurrency(v as QuoteCurrency)}>
              <TabsList aria-labelledby="quote-currency-label">
                {QUOTE_CURRENCIES.map((c) => (
                  <TabsTrigger key={c} value={c} className="px-4 figure">
                    {c}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground figure">
              {quoteCurrency !== "KRW" && selectedQuoteRate ? (
                <>
                  {t("purchase.summary.rate")
                    .replace("{{currency}}", quoteCurrency)
                    .replace("{{rate}}", Number(selectedQuoteRate.rateToKrw).toFixed(2))}{" "}
                  ({formatDate(selectedQuoteRate.fetchedAt, locale)} {t("purchase.summary.asOf")}) ·{" "}
                  {t("purchase.summary.paymentNote").replace("{{currency}}", quoteCurrency)}
                </>
              ) : quoteCurrency === "KRW" ? (
                t("purchase.summary.paymentNote").replace("{{currency}}", "KRW")
              ) : (
                t("purchase.summary.loading")
              )}
            </p>
          </div>

          <p className="border border-border p-4 text-sm leading-relaxed">{t("purchase.summary.adminWalletNote")}</p>

          <div>
            <DescriptionList
              items={[
                {
                  key: "price",
                  label: t("purchase.summary.productPrice"),
                  value: amountCell(totals.priceKrw, totals.priceQuote),
                },
                {
                  key: "fee",
                  label: t("purchase.summary.feeLabel").replace("{{percent}}", String(feeRatePercent)),
                  value: amountCell(totals.feeKrw, totals.feeQuote),
                },
              ]}
            />
            <div className="flex items-start justify-between gap-4 border-b border-border py-4">
              <span className="text-sm font-medium">{t("purchase.summary.total")}</span>
              <div className="text-right">
                <p className="text-3xl font-light figure">{formatNumber(totals.totalKrw, locale, numOpt)}원</p>
                {quoteCurrency !== "KRW" && (
                  <p className="mt-1 text-xs text-muted-foreground figure">
                    ~ {formatNumber(totals.totalQuote, locale, numOpt)} {quoteCurrency}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("purchase.summary.disclaimer")}</p>
          </div>
        </FormSection>

        <FormActions>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            {t("purchase.cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {t("purchase.submit")}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
