import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, X, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
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
  "h-9 min-w-0 w-full border-0 border-b border-gray-200 rounded-none bg-transparent px-1 py-1 shadow-none " +
  "focus-visible:ring-0 focus-visible:border-gray-500 focus-visible:ring-offset-0 " +
  "placeholder:text-gray-400 text-sm text-gray-900";

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("purchase.title")}</h1>
        <p className="text-gray-600 mt-2">{t("purchase.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("purchase.productCard.title")}</CardTitle>
            <CardDescription>{t("purchase.productCard.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestName">{t("purchase.requestName")}</Label>
              <Input
                id="requestName"
                placeholder={t("purchase.requestNamePlaceholder")}
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("purchase.itemLinesLabel")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  항목 추가
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Input
                      placeholder={t("purchase.shopName")}
                      value={item.shop}
                      onChange={(e) => updateItem(index, "shop", e.target.value)}
                      className="w-1/3"
                    />
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-500">{t("purchase.itemUrlsLabel")}</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addUrl(index)}>
                        <Plus className="w-3 h-3 mr-1" />
                        {t("purchase.addUrl")}
                      </Button>
                    </div>
                    {item.urls.map((url, urlIndex) => (
                      <div key={urlIndex} className="flex items-center gap-2">
                        <Input
                          placeholder="https://..."
                          value={url}
                          onChange={(e) => updateUrl(index, urlIndex, e.target.value)}
                          className="flex-1"
                          required={index === 0 && urlIndex === 0}
                        />
                        {item.urls.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeUrl(index, urlIndex)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">단가 (KRW)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.priceKrw || ""}
                        onChange={(e) => updateItem(index, "priceKrw", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">수량</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-600">{t("purchase.optionHeading")}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 gap-1 text-xs text-gray-600 hover:text-gray-900"
                        onClick={() => addLineOption(index)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t("purchase.addLineOption")}
                      </Button>
                    </div>
                    {item.options.length > 0 ? (
                      <ul className="space-y-2 pl-0.5">
                        {item.options.map((option, optIdx) => (
                          <li key={optIdx} className="flex items-start gap-2">
                            <span className="mt-2 shrink-0 text-gray-300 select-none" aria-hidden>
                              -
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                              <Input
                                aria-label={t("purchase.optionNamePlaceholder")}
                                placeholder={t("purchase.optionNamePlaceholder")}
                                value={option.name}
                                onChange={(e) => updateLineOption(index, optIdx, "name", e.target.value)}
                                className={`${OPTION_FIELD_CLASS} sm:max-w-[40%]`}
                              />
                              <span className="hidden shrink-0 text-gray-300 sm:inline" aria-hidden>
                                :
                              </span>
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
                              className="h-9 w-9 shrink-0 text-gray-400 hover:text-gray-700"
                              onClick={() => removeLineOption(index, optIdx)}
                              aria-label="옵션 줄 삭제"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="text-xs text-gray-400">{t("purchase.itemOptionHint")}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    소계: ₩{formatNumber((item.priceKrw || 0) * (item.quantity || 0), locale, numOpt)}
                  </p>
                </div>
              ))}
              <p className="text-xs text-gray-500">{t("purchase.urlHint")}</p>
              <p className="text-sm text-gray-700">
                전체 수량 합계: <span className="font-semibold">{totalQuantity}</span> 개 · 상품가 합계:{" "}
                <span className="font-semibold">₩{formatNumber(aggregatedPriceKrw, locale, numOpt)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("purchase.shipping.title")}</CardTitle>
            <CardDescription>{t("purchase.shipping.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {addressesLoading ? (
              <p className="text-sm text-gray-500">{t("purchase.shipping.loading")}</p>
            ) : addresses.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{t("purchase.shipping.empty")}</p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to="/mypage">{t("purchase.shipping.manage")}</Link>
                </Button>
              </div>
            ) : (
              <RadioGroup
                value={selectedShippingId != null ? String(selectedShippingId) : ""}
                onValueChange={(v) => setSelectedShippingId(v ? Number(v) : null)}
                className="gap-3"
              >
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      selectedShippingId === a.id ? "border-gray-900 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <RadioGroupItem value={String(a.id)} id={`ship-addr-${a.id}`} className="mt-1" />
                    <Label htmlFor={`ship-addr-${a.id}`} className="flex-1 cursor-pointer space-y-1 text-sm leading-relaxed">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{a.label?.trim() || t("purchase.shipping.title")}</span>
                        {a.isDefault ? (
                          <Badge variant="secondary" className="text-xs">
                            {t("purchase.shipping.defaultBadge")}
                          </Badge>
                        ) : null}
                      </div>
                      {a.recipientName ? (
                        <p className="text-gray-800">
                          {a.recipientName}
                          {a.recipientPhone ? <span className="text-gray-500"> · {a.recipientPhone}</span> : null}
                        </p>
                      ) : null}
                      <p className="text-gray-700 break-words">
                        {a.postalCode ? <span className="mr-1">({a.postalCode})</span> : null}
                        {a.addressLine1}
                        {a.addressLine2 ? ` ${a.addressLine2}` : ""}
                      </p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("purchase.image.title")}</CardTitle>
            <CardDescription>{t("purchase.image.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={[
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500",
              ].join(" ")}
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
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">{t("purchase.image.upload")}</p>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imagePreviews.map((p, index) => (
                  <div key={`${p.file.name}-${p.file.size}-${index}`} className="relative group">
                    <img src={p.url} alt={p.file.name} className="h-28 w-full object-cover rounded border" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="mt-1 text-xs text-gray-600 truncate">{p.file.name}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("purchase.notes.title")}</CardTitle>
            <CardDescription>{t("purchase.notes.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t("purchase.notes.placeholder")}
              rows={4}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("purchase.summary.title")}</CardTitle>
            <CardDescription>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-2">{t("purchase.summary.quoteCurrency")}</p>
                <Tabs value={quoteCurrency} onValueChange={(v) => setQuoteCurrency(v as QuoteCurrency)}>
                  <TabsList className="grid w-full grid-cols-4">
                    {QUOTE_CURRENCIES.map((c) => (
                      <TabsTrigger key={c} value={c} className="text-xs sm:text-sm">
                        {c}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {quoteCurrency !== "KRW" && selectedQuoteRate ? (
                  <div>
                    <Badge variant="secondary" className="mr-2">
                      {t("purchase.summary.rate")
                        .replace("{{currency}}", quoteCurrency)
                        .replace("{{rate}}", Number(selectedQuoteRate.rateToKrw).toFixed(2))}
                    </Badge>
                    <span className="text-xs">
                      ({formatDate(selectedQuoteRate.fetchedAt, locale)} {t("purchase.summary.asOf")}) ·{" "}
                      {t("purchase.summary.paymentNote").replace("{{currency}}", quoteCurrency)}
                    </span>
                  </div>
                ) : quoteCurrency === "KRW" ? (
                  <span className="text-xs text-gray-600">
                    {t("purchase.summary.paymentNote").replace("{{currency}}", "KRW")}
                  </span>
                ) : (
                  <span className="text-gray-500">{t("purchase.summary.loading")}</span>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {t("purchase.summary.adminWalletNote")}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("purchase.summary.productPrice")}</span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-medium">{formatNumber(totals.priceKrw, locale, numOpt)}원</span>
                {quoteCurrency !== "KRW" && (
                  <span className="text-xs text-gray-500">
                    ~ {formatNumber(totals.priceQuote, locale, numOpt)} {quoteCurrency}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t("purchase.summary.feeLabel").replace("{{percent}}", String(feeRatePercent))}
              </span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-medium">{formatNumber(totals.feeKrw, locale, numOpt)}원</span>
                {quoteCurrency !== "KRW" && (
                  <span className="text-xs text-gray-500">
                    ~ {formatNumber(totals.feeQuote, locale, numOpt)} {quoteCurrency}
                  </span>
                )}
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-lg">{t("purchase.summary.total")}</span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-bold text-xl text-blue-600">
                  {formatNumber(totals.totalKrw, locale, numOpt)}원
                </span>
                {quoteCurrency !== "KRW" && (
                  <span className="text-xs font-normal text-gray-500">
                    ~ {formatNumber(totals.totalQuote, locale, numOpt)} {quoteCurrency}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">{t("purchase.summary.disclaimer")}</p>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate(-1)}>
            {t("purchase.cancel")}
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
            {t("purchase.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
