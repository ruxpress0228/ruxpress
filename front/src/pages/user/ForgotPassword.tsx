import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { api } from "../../utils/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("이메일을 입력하세요");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<unknown>("/v1/users/password/forgot", { email: trimmed });
      if (res.code === 200) {
        toast.success(res.message ?? "안내 메일을 확인해 주세요");
      } else {
        toast.error(res.message ?? "요청에 실패했습니다");
      }
    } catch {
      toast.error("요청에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">비밀번호 찾기</CardTitle>
          <CardDescription className="text-center">
            가입 시 사용한 이메일을 입력하시면 재설정 링크를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">이메일</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "전송 중..." : "재설정 링크 보내기"}
            </Button>
            <div className="text-center text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                로그인으로 돌아가기
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
