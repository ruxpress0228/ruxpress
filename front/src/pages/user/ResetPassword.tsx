import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { api } from "../../utils/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenFromUrl.trim();
    if (!token) {
      toast.error("유효한 재설정 링크가 아닙니다. 메일의 링크를 다시 확인해 주세요.");
      return;
    }
    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<unknown>("/v1/users/password/reset", {
        token,
        newPassword: password,
      });
      if (res.code === 200) {
        toast.success(res.message ?? "비밀번호가 변경되었습니다");
        navigate("/login", { replace: true });
      } else {
        toast.error(res.message ?? "재설정에 실패했습니다");
      }
    } catch {
      toast.error("재설정에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">새 비밀번호 설정</CardTitle>
          <CardDescription className="text-center">
            영문, 숫자, 특수문자를 포함한 8자 이상으로 입력해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tokenFromUrl ? (
            <p className="text-sm text-center text-gray-600 mb-4">
              링크가 올바르지 않습니다. 비밀번호 찾기를 다시 진행해 주세요.
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상 (영문, 숫자, 특수문자)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!tokenFromUrl}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-confirm">새 비밀번호 확인</Label>
              <Input
                id="new-password-confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={!tokenFromUrl}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading || !tokenFromUrl}>
              {loading ? "처리 중..." : "비밀번호 변경"}
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
