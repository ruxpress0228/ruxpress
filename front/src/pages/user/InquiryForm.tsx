import { useNavigate } from "react-router";
import { Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";

export default function InquiryForm() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("문의가 등록되었습니다");
    navigate("/inquiry");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">1:1 문의 작성</h1>
        <p className="text-gray-600 mt-2">
          궁금하신 점을 자세히 적어주시면 빠르게 답변드리겠습니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>문의 내용</CardTitle>
            <CardDescription>
              문의 유형을 선택하고 내용을 작성해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">문의 유형 *</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORDER">주문</SelectItem>
                  <SelectItem value="SHIPPING">배송</SelectItem>
                  <SelectItem value="PAYMENT">결제</SelectItem>
                  <SelectItem value="ETC">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="문의 제목을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                placeholder="문의 내용을 자세히 입력해주세요"
                rows={8}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>파일 첨부</CardTitle>
            <CardDescription>
              최대 5개, 파일당 최대 10MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                클릭하거나 파일을 드래그하여 업로드
              </p>
              <p className="text-xs text-gray-500 mt-1">
                이미지, PDF, 문서 파일 등을 첨부할 수 있습니다
              </p>
            </div>
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
            취소
          </Button>
          <Button type="submit" size="lg" className="flex-1">
            문의 등록
          </Button>
        </div>
      </form>
    </div>
  );
}
