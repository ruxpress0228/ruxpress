import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Bell, Shield, LogOut, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { api, clearUserSession, notifyUserAuthChange } from "../../utils/api";
import { STORAGE_KEYS } from "../../utils/constants";
import type { User as UserProfile } from "../../types/domain";

function formatDateKo(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTimeKo(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function signupTypeLabel(t: UserProfile["signupType"]): string {
  if (t === "EMAIL") return "이메일 가입";
  if (t === "PHONE") return "휴대폰 가입";
  return "Google 가입";
}

export default function MyPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editPostal, setEditPostal] = useState("");
  const [editLine1, setEditLine1] = useState("");
  const [editLine2, setEditLine2] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      toast.error("로그인이 필요합니다");
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<UserProfile>("/v1/users/me");
      if (res.code === 200 && res.data) {
        setProfile(res.data);
        localStorage.setItem(STORAGE_KEYS.USER_NICKNAME, res.data.nickname);
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, res.data.email);
        localStorage.setItem(STORAGE_KEYS.USER_ID, String(res.data.id));
        notifyUserAuthChange();
      } else if (res.code === 401) {
        clearUserSession();
        toast.error("다시 로그인해 주세요");
        navigate("/login", { replace: true });
      } else {
        toast.error(res.message ?? "프로필을 불러오지 못했습니다");
        setProfile(null);
      }
    } catch {
      toast.error("프로필을 불러오지 못했습니다");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    clearUserSession();
    toast.success("로그아웃되었습니다");
    navigate("/login", { replace: true });
  };

  const resetPwdForm = () => {
    setCurrentPwd("");
    setNewPwd("");
    setNewPwdConfirm("");
  };

  const openProfileEdit = () => {
    if (!profile) return;
    setEditNickname(profile.nickname);
    setEditPostal(profile.addressPostalCode ?? "");
    setEditLine1(profile.addressLine1 ?? "");
    setEditLine2(profile.addressLine2 ?? "");
    setProfileEditOpen(true);
  };

  const resetProfileEditForm = () => {
    setEditNickname("");
    setEditPostal("");
    setEditLine1("");
    setEditLine2("");
  };

  const submitProfileUpdate = async () => {
    const nickname = editNickname.trim();
    const line1 = editLine1.trim();
    if (!nickname) {
      toast.error("닉네임을 입력하세요");
      return;
    }
    if (!line1) {
      toast.error("기본 주소를 입력하세요");
      return;
    }
    const postal = editPostal.trim();
    const line2 = editLine2.trim();
    setProfileSubmitting(true);
    try {
      const res = await api.patch<UserProfile>("/v1/users/me", {
        nickname,
        addressPostalCode: postal || undefined,
        addressLine1: line1,
        addressLine2: line2 || undefined,
      });
      if (res.code === 200 && res.data) {
        setProfile(res.data);
        localStorage.setItem(STORAGE_KEYS.USER_NICKNAME, res.data.nickname);
        notifyUserAuthChange();
        toast.success(res.message ?? "프로필이 수정되었습니다");
        setProfileEditOpen(false);
        resetProfileEditForm();
      } else if (res.code === 401) {
        clearUserSession();
        toast.error("다시 로그인해 주세요");
        navigate("/login", { replace: true });
      } else {
        toast.error(res.message ?? "프로필 수정에 실패했습니다");
      }
    } catch {
      toast.error("프로필 수정에 실패했습니다");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const submitPasswordChange = async () => {
    if (!currentPwd) {
      toast.error("현재 비밀번호를 입력하세요");
      return;
    }
    if (!newPwd || newPwd.length < 8) {
      toast.error("새 비밀번호는 8자 이상이어야 합니다");
      return;
    }
    if (newPwd !== newPwdConfirm) {
      toast.error("새 비밀번호가 일치하지 않습니다");
      return;
    }
    setPwdSubmitting(true);
    try {
      const res = await api.post<unknown>("/v1/users/me/password", {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      if (res.code === 200) {
        toast.success(res.message ?? "비밀번호가 변경되었습니다");
        setPwdOpen(false);
        resetPwdForm();
      } else {
        toast.error(res.message ?? "비밀번호 변경에 실패했습니다");
      }
    } catch {
      toast.error("비밀번호 변경에 실패했습니다");
    } finally {
      setPwdSubmitting(false);
    }
  };

  const notif = profile?.notificationSettings;

  if (loading && !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">마이페이지</h1>
        <p className="text-gray-600">프로필을 불러오는 중…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">마이페이지</h1>
        <p className="text-gray-600 mb-4">회원 정보를 표시할 수 없습니다.</p>
        <Button asChild variant="outline">
          <Link to="/login">로그인</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">마이페이지</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>프로필 정보</CardTitle>
            <CardDescription>로그인한 계정 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{profile.nickname}</h3>
                <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                  <Badge variant={profile.status === "ACTIVE" ? "default" : "outline"}>
                    {profile.status === "ACTIVE" ? "정상" : profile.status}
                  </Badge>
                  <Badge variant="outline">{signupTypeLabel(profile.signupType)}</Badge>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={openProfileEdit}>
                프로필 수정
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="font-medium text-gray-900 break-all">{profile.email}</p>
                </div>
                {profile.emailVerified && <Badge className="bg-green-500 shrink-0">인증됨</Badge>}
              </div>

              {profile.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">휴대폰</p>
                    <p className="font-medium text-gray-900">{profile.phone}</p>
                  </div>
                  {profile.phoneVerified && <Badge className="bg-green-500">인증됨</Badge>}
                </div>
              )}

              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">배송지</p>
                  {profile.addressLine1 || profile.addressPostalCode ? (
                    <p className="font-medium text-gray-900">
                      {[profile.addressPostalCode, profile.addressLine1, profile.addressLine2]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  ) : (
                    <p className="font-medium text-gray-500">
                      등록된 배송지가 없습니다. 프로필 수정에서 입력해 주세요.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">가입일</p>
                  <p className="font-medium text-gray-900">{formatDateKo(profile.createdAt)}</p>
                </div>
              </div>

              {profile.lastLoginAt && (
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">마지막 로그인</p>
                    <p className="font-medium text-gray-900">{formatDateTimeKo(profile.lastLoginAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <CardTitle>알림 설정</CardTitle>
            </div>
            <CardDescription>알림 항목은 추후 계정과 연동될 예정입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">푸시 알림</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-inquiry" className="cursor-pointer">
                    문의 답변
                  </Label>
                  <Switch id="push-inquiry" defaultChecked={notif?.push?.inquiryReply ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notice" className="cursor-pointer">
                    공지사항
                  </Label>
                  <Switch id="push-notice" defaultChecked={notif?.push?.notice ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-promotion" className="cursor-pointer">
                    프로모션/이벤트
                  </Label>
                  <Switch id="push-promotion" defaultChecked={notif?.push?.promotion ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-purchase" className="cursor-pointer">
                    구매 상태 변경
                  </Label>
                  <Switch id="push-purchase" defaultChecked={notif?.push?.purchaseStatus ?? false} disabled />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">이메일 알림</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-inquiry" className="cursor-pointer">
                    문의 답변
                  </Label>
                  <Switch id="email-inquiry" defaultChecked={notif?.email?.inquiryReply ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notice" className="cursor-pointer">
                    공지사항
                  </Label>
                  <Switch id="email-notice" defaultChecked={notif?.email?.notice ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-promotion" className="cursor-pointer">
                    프로모션/이벤트
                  </Label>
                  <Switch id="email-promotion" defaultChecked={notif?.email?.promotion ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-purchase" className="cursor-pointer">
                    구매 상태 변경
                  </Label>
                  <Switch id="email-purchase" defaultChecked={notif?.email?.purchaseStatus ?? false} disabled />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">SMS 알림</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-inquiry" className="cursor-pointer">
                    문의 답변
                  </Label>
                  <Switch id="sms-inquiry" defaultChecked={notif?.sms?.inquiryReply ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notice" className="cursor-pointer">
                    공지사항
                  </Label>
                  <Switch id="sms-notice" defaultChecked={notif?.sms?.notice ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-promotion" className="cursor-pointer">
                    프로모션/이벤트
                  </Label>
                  <Switch id="sms-promotion" defaultChecked={notif?.sms?.promotion ?? false} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-purchase" className="cursor-pointer">
                    구매 상태 변경
                  </Label>
                  <Switch id="sms-purchase" defaultChecked={notif?.sms?.purchaseStatus ?? false} disabled />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setPwdOpen(true)}>
              <Shield className="w-4 h-4 mr-2" />
              비밀번호 변경
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/forgot-password">비밀번호를 잊으셨나요? (이메일 재설정)</Link>
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-gray-700" disabled>
              회원 탈퇴
            </Button>
          </CardContent>
        </Card>

        <Dialog
          open={profileEditOpen}
          onOpenChange={(open) => {
            setProfileEditOpen(open);
            if (!open) resetProfileEditForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>프로필 수정</DialogTitle>
              <DialogDescription>닉네임과 배송지 주소를 수정할 수 있습니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-nickname">닉네임</Label>
                <Input
                  id="edit-nickname"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  maxLength={50}
                  autoComplete="nickname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postal">우편번호</Label>
                <Input
                  id="edit-postal"
                  value={editPostal}
                  onChange={(e) => setEditPostal(e.target.value)}
                  maxLength={10}
                  placeholder="선택"
                  autoComplete="postal-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-line1">기본 주소</Label>
                <Input
                  id="edit-line1"
                  value={editLine1}
                  onChange={(e) => setEditLine1(e.target.value)}
                  maxLength={255}
                  autoComplete="street-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-line2">상세 주소</Label>
                <Input
                  id="edit-line2"
                  value={editLine2}
                  onChange={(e) => setEditLine2(e.target.value)}
                  maxLength={255}
                  placeholder="선택"
                  autoComplete="address-line2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileEditOpen(false)}
                disabled={profileSubmitting}
              >
                취소
              </Button>
              <Button type="button" onClick={() => void submitProfileUpdate()} disabled={profileSubmitting}>
                {profileSubmitting ? "저장 중…" : "저장"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={pwdOpen}
          onOpenChange={(open) => {
            setPwdOpen(open);
            if (!open) resetPwdForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>비밀번호 변경</DialogTitle>
              <DialogDescription>현재 비밀번호 확인 후 새 비밀번호를 입력하세요. (영문·숫자·특수문자 포함 8자 이상)</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="cur-pwd">현재 비밀번호</Label>
                <Input id="cur-pwd" type="password" autoComplete="current-password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pwd">새 비밀번호</Label>
                <Input id="new-pwd" type="password" autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pwd2">새 비밀번호 확인</Label>
                <Input id="new-pwd2" type="password" autoComplete="new-password" value={newPwdConfirm} onChange={(e) => setNewPwdConfirm(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPwdOpen(false)} disabled={pwdSubmitting}>
                취소
              </Button>
              <Button type="button" onClick={() => void submitPasswordChange()} disabled={pwdSubmitting}>
                {pwdSubmitting ? "처리 중…" : "변경"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
