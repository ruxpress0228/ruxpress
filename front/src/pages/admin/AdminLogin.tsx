import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { toast } from "sonner";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import { STORAGE_KEYS } from "../../utils/constants";

interface LoginResponse {
  token: string;
  adminId: number;
  email: string;
  name: string;
  role: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/v1/admin/auth/login", { email, password });
      const data = unwrap(res);
      // 자동로그인 체크 시 localStorage, 미체크 시 sessionStorage.
      const storage: Storage = rememberMe ? localStorage : sessionStorage;
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem("ruxpress_admin");
      sessionStorage.removeItem("ruxpress_admin");

      storage.setItem(STORAGE_KEYS.TOKEN, data.token);
      storage.setItem("ruxpress_admin", JSON.stringify({
        id: data.adminId,
        email: data.email,
        name: data.name,
        role: data.role,
      }));
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "1");
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
      toast.success(`${data.name}님, 환영합니다`);
      navigate("/admin");
    } catch {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">R</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">관리자 로그인</CardTitle>
          <CardDescription className="text-center">
            Ruxpress 관리자 페이지
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">이메일</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@ruxpress.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">비밀번호</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="admin-remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="admin-remember-me" className="text-sm font-normal cursor-pointer">
                자동 로그인 (다음 접속 시 로그인 유지)
              </Label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
