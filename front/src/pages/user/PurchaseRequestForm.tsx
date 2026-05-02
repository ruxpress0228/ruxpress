import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, X, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "../../hooks/useTranslation";
import { useExchangeRate } from "../../hooks/exchange/useExchangeRate";
import { usePurchase } from "../../hooks/purchase/usePurchase";
import { formatDate, formatNumber } from "../../utils/format";
import { USER_BALANCE_CHANGE_EVENT } from "../../utils/constants";
import type { ExchangeRate, PurchaseRequestStatus } from "../../types";

const FEE_PERCENT = 12;
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function PurchaseRequestForm() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { getCurrentExchangeRate } = useExchangeRate();
  const { createPurchaseRequest } = usePurchase();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<ExchangeRate | null>(null);
  const [urls, setUrls] = useState<Array<{ url: string; shop: string }>>([{ url: "", shop: "" }]);
  const [options, setOptions] = useState<Array<{ name: string; value: string }>>([]);
  const [priceKrw, setPriceKrw] = useState<number>(0);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [memo, setMemo] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentExchangeRate()
      .then(setCurrentExchangeRate)
      .catch(() => setCurrentExchangeRate(null));
  }, []);

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({ file, url: URL.createObjectURL(file) }));
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  const addUrl = () => {
    setUrls([...urls, { url: "", shop: "" }]);
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, field: 'url' | 'shop', value: string) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const addOption = () => {
    setOptions([...options, { name: "", value: "" }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'name' | 'value', value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const calculateTotal = () => {
    const rate = currentExchangeRate ? Number(currentExchangeRate.rate) : 0;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const feeRate = FEE_PERCENT / 100;
    const feeKrw = priceKrw * feeRate;
    const totalKrw = priceKrw + feeKrw;
    const priceRub = rate > 0 ? priceKrw / rate : 0;
    const feeRub = rate > 0 ? feeKrw / rate : 0;
    const totalRub = rate > 0 ? totalKrw / rate : 0;
    return {
      priceKrw: round2(priceKrw),
      feeKrw: round2(feeKrw),
      totalKrw: round2(totalKrw),
      priceRub: round2(priceRub),
      feeRub: round2(feeRub),
      totalRub: round2(totalRub)
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
      const filteredUrls = urls.map((u) => u.url.trim()).filter(Boolean);
      const optionMap = options.reduce<Record<string, string>>((acc, cur) => {
        const key = cur.name.trim();
        const value = cur.value.trim();
        if (key && value) acc[key] = value;
        return acc;
      }, {});

      const rate = currentExchangeRate ? Number(currentExchangeRate.rate) : 0;
      const priceRub = rate > 0 ? priceKrw / rate : undefined;
      const feeAmount = totals.feeKrw;
      const status: PurchaseRequestStatus = "SUBMITTED";

      const payload = {
        productName: productName.trim(),
        quantity,
        urls: filteredUrls.length ? filteredUrls : undefined,
        options: Object.keys(optionMap).length ? optionMap : undefined,
        priceRub,
        priceKrw,
        exchangeRateId: currentExchangeRate?.id,
        feeAmount,
        totalAmountKrw: totals.totalKrw,
        memo: memo.trim() || undefined,
        status,
        files: images.length > 0 ? images : undefined,
      };

      await createPurchaseRequest(payload);
      window.dispatchEvent(new Event(USER_BALANCE_CHANGE_EVENT));
      toast.success(t('purchase.toastSuccess'));
      navigate("/purchase");
    } catch {
      toast.error("구매 요청 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const numOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('purchase.title')}</h1>
        <p className="text-gray-600 mt-2">
          {t('purchase.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('purchase.productCard.title')}</CardTitle>
            <CardDescription>
              {t('purchase.productCard.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">{t('purchase.productName')}</Label>
              <Input
                id="productName"
                placeholder={t('purchase.productNamePlaceholder')}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('purchase.productUrl')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addUrl}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('purchase.addUrl')}
                </Button>
              </div>
              {urls.map((url, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder={t('purchase.shopName')}
                    value={url.shop}
                    onChange={(e) => updateUrl(index, 'shop', e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="https://..."
                    value={url.url}
                    onChange={(e) => updateUrl(index, 'url', e.target.value)}
                    className="flex-1"
                    required={index === 0}
                  />
                  {urls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrl(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-500">
                {t('purchase.urlHint')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('purchase.quantity')}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceKrw">{t('purchase.priceKrw')}</Label>
                <Input
                  id="priceKrw"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={priceKrw || ""}
                  onChange={(e) => setPriceKrw(parseFloat(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-gray-500">{t('purchase.priceKrwHint')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('purchase.option')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('purchase.addOption')}
                </Button>
              </div>
              {options.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder={t('purchase.optionNamePlaceholder')}
                    value={option.name}
                    onChange={(e) => updateOption(index, 'name', e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder={t('purchase.optionValuePlaceholder')}
                    value={option.value}
                    onChange={(e) => updateOption(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                {t('purchase.optionHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('purchase.image.title')}</CardTitle>
            <CardDescription>
              {t('purchase.image.desc')}
            </CardDescription>
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
              <p className="text-sm text-gray-600">
                {t('purchase.image.upload')}
              </p>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imagePreviews.map((p, index) => (
                  <div key={`${p.file.name}-${p.file.size}-${index}`} className="relative group">
                    <img
                      src={p.url}
                      alt={p.file.name}
                      className="h-28 w-full object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="mt-1 text-xs text-gray-600 truncate">
                      {p.file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('purchase.notes.title')}</CardTitle>
            <CardDescription>
              {t('purchase.notes.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t('purchase.notes.placeholder')}
              rows={4}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('purchase.summary.title')}</CardTitle>
            <CardDescription>
              {currentExchangeRate ? (
                <>
                  <Badge variant="secondary" className="mr-2">
                    {t('purchase.summary.rate').replace('{{rate}}', Number(currentExchangeRate.rate).toFixed(2))}
                  </Badge>
                  <span className="text-xs">
                    ({formatDate(currentExchangeRate.fetchedAt, locale)} {t('purchase.summary.asOf')}) · {t('purchase.summary.paymentNote')}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">{t('purchase.summary.loading')}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {t("purchase.summary.adminWalletNote")}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('purchase.summary.productPrice')}</span>
              <span className="font-medium">
                ₩{formatNumber(totals.priceKrw, locale, numOpt)} ≈ {formatNumber(totals.priceRub, locale, numOpt)} RUB
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('purchase.summary.feeLabel').replace('{{percent}}', String(FEE_PERCENT))}</span>
              <span className="font-medium">{formatNumber(totals.feeRub, locale, numOpt)} RUB</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-lg">{t('purchase.summary.total')}</span>
              <span className="font-bold text-xl text-blue-600">
                {formatNumber(totals.totalRub, locale, numOpt)} RUB
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {t('purchase.summary.disclaimer')}
            </p>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            {t('purchase.cancel')}
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
            {t('purchase.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
