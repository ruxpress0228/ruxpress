import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, X, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { getCurrentExchangeRate } from "../../utils/api";
import type { ExchangeRate } from "../../types";

export default function PurchaseRequestForm() {
  const navigate = useNavigate();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<ExchangeRate | null>(null);
  const [urls, setUrls] = useState<Array<{ url: string; shop: string }>>([{ url: "", shop: "" }]);
  const [options, setOptions] = useState<Array<{ name: string; value: string }>>([]);
  const [priceKrw, setPriceKrw] = useState<number>(0);

  useEffect(() => {
    getCurrentExchangeRate()
      .then(setCurrentExchangeRate)
      .catch(() => setCurrentExchangeRate(null));
  }, []);

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
    // 사용자 입력: 한국 상품 가격(KRW). 수수료 12% 적용 후 RUB로 표시
    const feeRate = 0.12;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("구매 요청이 제출되었습니다");
    navigate("/purchase");
  };

  const totals = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">구매 요청 작성</h1>
        <p className="text-gray-600 mt-2">
          구매를 원하는 상품의 정보를 입력해주세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle>상품 정보</CardTitle>
            <CardDescription>
              한국 굿즈(상품)의 가격을 원화로 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="productName">상품명 *</Label>
              <Input
                id="productName"
                placeholder="한국 굿즈(상품) 이름"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>상품 URL *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addUrl}>
                  <Plus className="w-4 h-4 mr-1" />
                  URL 추가
                </Button>
              </div>
              {urls.map((url, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="쇼핑몰 이름"
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
                한국 쇼핑몰·굿즈 상품 링크를 입력해주세요
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">수량 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceKrw">상품 가격 (KRW) *</Label>
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
                <p className="text-xs text-gray-500">한국 상품의 원화 가격을 입력하세요</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>옵션</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" />
                  옵션 추가
                </Button>
              </div>
              {options.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="옵션명 (예: 색상)"
                    value={option.name}
                    onChange={(e) => updateOption(index, 'name', e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="값 (예: Black)"
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
                색상, 사이즈 등의 옵션이 있다면 추가해주세요
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>상품 이미지</CardTitle>
            <CardDescription>
              최대 10장, 파일당 최대 5MB (JPG, PNG, WEBP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                클릭하거나 파일을 드래그하여 업로드
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>특이사항</CardTitle>
            <CardDescription>
              요청사항이나 참고사항을 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="예: 빠른 배송 부탁드립니다"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Price Summary */}
        <Card>
          <CardHeader>
            <CardTitle>예상 금액</CardTitle>
            <CardDescription>
              {currentExchangeRate ? (
                <>
                  <Badge variant="secondary" className="mr-2">
                    환율: 1 RUB = {Number(currentExchangeRate.rate).toFixed(2)} KRW
                  </Badge>
                  <span className="text-xs">
                    ({new Date(currentExchangeRate.fetchedAt).toLocaleDateString("ko-KR")} 기준) · 결제 금액은 루블(RUB)로 표시됩니다
                  </span>
                </>
              ) : (
                <span className="text-gray-500">환율 정보를 불러오는 중...</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">상품 가격</span>
              <span className="font-medium">
                ₩{totals.priceKrw.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ≈ {totals.priceRub.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RUB
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">수수료 (12%)</span>
              <span className="font-medium">{totals.feeRub.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RUB</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-lg">총 예상 금액</span>
              <span className="font-bold text-xl text-blue-600">
                {totals.totalRub.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RUB
              </span>
            </div>
            <p className="text-xs text-gray-500">
              * 실제 금액은 환율 변동 및 배송비에 따라 달라질 수 있습니다
            </p>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            취소
          </Button>
          <Button type="submit" size="lg" className="flex-1">
            구매 요청 제출
          </Button>
        </div>
      </form>
    </div>
  );
}
