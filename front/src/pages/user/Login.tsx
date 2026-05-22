import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { api, notifyUserAuthChange } from "../../utils/api";
import { STORAGE_KEYS } from "../../utils/constants";

interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  nickname: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("이메일을 입력하세요");
      return;
    }
    if (!password) {
      toast.error("비밀번호를 입력하세요");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/v1/users/login", {
        email: trimmedEmail,
        password,
      });
      if (res.code === 200 && res.data?.token) {
        // 자동로그인 체크 시 localStorage(영속), 미체크 시 sessionStorage(브라우저 세션 동안만).
        const storage: Storage = rememberMe ? localStorage : sessionStorage;
        // 양쪽 잔존 토큰 정리 후 한 곳에만 저장.
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        sessionStorage.removeItem(STORAGE_KEYS.USER_ID);
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
        sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
        localStorage.removeItem(STORAGE_KEYS.USER_NICKNAME);
        sessionStorage.removeItem(STORAGE_KEYS.USER_NICKNAME);

        storage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
        storage.setItem(STORAGE_KEYS.USER_ID, String(res.data.userId));
        storage.setItem(STORAGE_KEYS.USER_EMAIL, res.data.email);
        storage.setItem(STORAGE_KEYS.USER_NICKNAME, res.data.nickname);
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "1");
        } else {
          localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        }
        window.Android?.setAuthToken?.(
          JSON.stringify({
            token: res.data.token,
            userId: res.data.userId,
            email: res.data.email,
            nickname: res.data.nickname,
          }),
        );
        notifyUserAuthChange();
        toast.success(res.message ?? "로그인되었습니다");
        navigate("/");
      } else {
        toast.error(res.message ?? "로그인에 실패했습니다");
      }
    } catch {
      toast.error("로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">R</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            Ruxpress에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">비밀번호</Label>
              <Button variant="link" className="px-0 h-auto text-sm" asChild>
                <Link to="/forgot-password">비밀번호 찾기</Link>
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(v === true)}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
              자동 로그인 (다음 접속 시 로그인 유지)
            </Label>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            아직 계정이 없으신가요?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              회원가입
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
