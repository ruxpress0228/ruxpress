import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Bell, Shield, LogOut, Mail, Phone, MapPin, Wallet, Plus, Pencil, Trash2, Star } from "lucide-react";
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
import { api, clearUserSession, notifyUserAuthChange, readAuthValue, writeAuthValue } from "../../utils/api";
import { STORAGE_KEYS } from "../../utils/constants";
import { useBalance } from "../../hooks/balance/useBalance";
import type { User as UserProfile, UserAddress } from "../../types/domain";

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
  const { balance } = useBalance();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editPostal, setEditPostal] = useState("");
  const [editLine1, setEditLine1] = useState("");
  const [editLine2, setEditLine2] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [addrEditingId, setAddrEditingId] = useState<number | null>(null);
  const [addrLabel, setAddrLabel] = useState("");
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrSubmitting, setAddrSubmitting] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = readAuthValue(STORAGE_KEYS.TOKEN);
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
        writeAuthValue(STORAGE_KEYS.USER_NICKNAME, res.data.nickname);
        writeAuthValue(STORAGE_KEYS.USER_EMAIL, res.data.email);
        writeAuthValue(STORAGE_KEYS.USER_ID, String(res.data.id));
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

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const res = await api.get<UserAddress[]>("/v1/users/me/addresses");
      if (res.code === 200 && Array.isArray(res.data)) {
        setAddresses(res.data);
      } else if (res.code !== 401) {
        toast.error(res.message ?? "배송지를 불러오지 못했습니다");
      }
    } catch {
      toast.error("배송지를 불러오지 못했습니다");
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) void loadAddresses();
  }, [profile, loadAddresses]);

  const resetAddressForm = () => {
    setAddrEditingId(null);
    setAddrLabel("");
    setAddrRecipient("");
    setAddrPhone("");
    setAddrPostal("");
    setAddrLine1("");
    setAddrLine2("");
    setAddrIsDefault(false);
  };

  const openAddressCreate = () => {
    resetAddressForm();
    setAddrIsDefault(addresses.length === 0);
    setAddrDialogOpen(true);
  };

  const openAddressEdit = (a: UserAddress) => {
    setAddrEditingId(a.id);
    setAddrLabel(a.label ?? "");
    setAddrRecipient(a.recipientName ?? "");
    setAddrPhone(a.recipientPhone ?? "");
    setAddrPostal(a.postalCode ?? "");
    setAddrLine1(a.addressLine1 ?? "");
    setAddrLine2(a.addressLine2 ?? "");
    setAddrIsDefault(a.isDefault);
    setAddrDialogOpen(true);
  };

  const submitAddress = async () => {
    const line1 = addrLine1.trim();
    if (!line1) {
      toast.error("주소를 입력하세요");
      return;
    }
    const payload = {
      label: addrLabel.trim() || null,
      recipientName: addrRecipient.trim() || null,
      recipientPhone: addrPhone.trim() || null,
      postalCode: addrPostal.trim() || null,
      addressLine1: line1,
      addressLine2: addrLine2.trim() || null,
      isDefault: addrIsDefault,
    };
    setAddrSubmitting(true);
    try {
      const res = addrEditingId == null
        ? await api.post<UserAddress>("/v1/users/me/addresses", payload)
        : await api.patch<UserAddress>(`/v1/users/me/addresses/${addrEditingId}`, payload);
      if (res.code === 200) {
        toast.success(res.message ?? (addrEditingId == null ? "배송지가 추가되었습니다" : "배송지가 수정되었습니다"));
        setAddrDialogOpen(false);
        resetAddressForm();
        await loadAddresses();
        await loadProfile();
      } else {
        toast.error(res.message ?? "처리에 실패했습니다");
      }
    } catch {
      toast.error("처리에 실패했습니다");
    } finally {
      setAddrSubmitting(false);
    }
  };

  const deleteAddress = async (a: UserAddress) => {
    if (!window.confirm("이 배송지를 삭제하시겠습니까?")) return;
    try {
      const res = await api.delete<unknown>(`/v1/users/me/addresses/${a.id}`);
      if (res.code === 200) {
        toast.success(res.message ?? "배송지가 삭제되었습니다");
        await loadAddresses();
        await loadProfile();
      } else {
        toast.error(res.message ?? "삭제에 실패했습니다");
      }
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  };

  const markAsDefault = async (a: UserAddress) => {
    if (a.isDefault) return;
    try {
      const res = await api.post<UserAddress>(`/v1/users/me/addresses/${a.id}/default`, {});
      if (res.code === 200) {
        toast.success(res.message ?? "기본 배송지로 설정되었습니다");
        await loadAddresses();
        await loadProfile();
      } else {
        toast.error(res.message ?? "기본 설정에 실패했습니다");
      }
    } catch {
      toast.error("기본 설정에 실패했습니다");
    }
  };

  const handleLogout = () => {
    clearUserSession();
    toast.success("로그아웃되었습니다");
    navigate("/login", { replace: true });
  };

  const openEditDialog = () => {
    if (!profile) return;
    setEditNickname(profile.nickname ?? "");
    setEditPostal(profile.addressPostalCode ?? "");
    setEditLine1(profile.addressLine1 ?? "");
    setEditLine2(profile.addressLine2 ?? "");
    setEditOpen(true);
  };

  const submitProfileEdit = async () => {
    const nickname = editNickname.trim();
    if (!nickname) {
      toast.error("닉네임을 입력하세요");
      return;
    }
    const line1 = editLine1.trim() || profile?.addressLine1?.trim() || "";
    if (!line1) {
      toast.error("기본 배송지를 먼저 등록해 주세요");
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await api.patch<UserProfile>("/v1/users/me", {
        nickname,
        addressPostalCode: editPostal.trim() || profile?.addressPostalCode || null,
        addressLine1: line1,
        addressLine2: editLine2.trim() || profile?.addressLine2 || null,
      });
      if (res.code === 200 && res.data) {
        setProfile(res.data);
        writeAuthValue(STORAGE_KEYS.USER_NICKNAME, res.data.nickname);
        notifyUserAuthChange();
        toast.success(res.message ?? "프로필이 수정되었습니다");
        setEditOpen(false);
      } else {
        toast.error(res.message ?? "프로필 수정에 실패했습니다");
      }
    } catch {
      toast.error("프로필 수정에 실패했습니다");
    } finally {
      setEditSubmitting(false);
    }
  };

  const resetPwdForm = () => {
    setCurrentPwd("");
    setNewPwd("");
    setNewPwdConfirm("");
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
              <Button type="button" variant="outline" onClick={openEditDialog}>
                프로필 수정
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">현재 잔액</p>
                  <p className="font-semibold text-blue-700">
                    ₩{(balance ?? 0).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link to="/wallet">지갑·내역</Link>
                </Button>
              </div>

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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <CardTitle>배송지 관리</CardTitle>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={openAddressCreate}>
                <Plus className="w-4 h-4 mr-1" />
                추가
              </Button>
            </div>
            <CardDescription>여러 배송지를 등록하고 기본 배송지를 지정할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {addressesLoading && addresses.length === 0 ? (
              <p className="text-sm text-gray-500">불러오는 중…</p>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 배송지가 없습니다. 우측 상단의 "추가" 버튼으로 등록해 주세요.</p>
            ) : (
              addresses.map((a) => (
                <div key={a.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{a.label || "배송지"}</span>
                      {a.isDefault && (
                        <Badge className="bg-blue-500 hover:bg-blue-500">
                          <Star className="w-3 h-3 mr-1" />
                          기본
                        </Badge>
                      )}
                    </div>
                    {(a.recipientName || a.recipientPhone) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {[a.recipientName, a.recipientPhone].filter(Boolean).join(" / ")}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 mt-1 break-words">
                      {[a.postalCode, a.addressLine1, a.addressLine2].filter(Boolean).join(" ")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!a.isDefault && (
                      <Button type="button" size="sm" variant="ghost" className="text-blue-600" onClick={() => void markAsDefault(a)}>
                        기본 설정
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="ghost" onClick={() => openAddressEdit(a)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => void deleteAddress(a)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="hidden">
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
            <Button type="button" variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>프로필 수정</DialogTitle>
              <DialogDescription>닉네임을 수정할 수 있습니다. 배송지는 아래 "배송지 관리"에서 관리하세요.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-nickname">닉네임</Label>
                <Input id="edit-nickname" maxLength={50} value={editNickname} onChange={(e) => setEditNickname(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editSubmitting}>
                취소
              </Button>
              <Button type="button" onClick={() => void submitProfileEdit()} disabled={editSubmitting}>
                {editSubmitting ? "처리 중…" : "저장"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={addrDialogOpen}
          onOpenChange={(open) => {
            setAddrDialogOpen(open);
            if (!open) resetAddressForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{addrEditingId == null ? "배송지 추가" : "배송지 수정"}</DialogTitle>
              <DialogDescription>수령인 정보와 주소를 입력해 주세요.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="addr-label">별칭 (예: 집, 회사)</Label>
                <Input id="addr-label" maxLength={50} value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="addr-recipient">수령인</Label>
                  <Input id="addr-recipient" maxLength={50} value={addrRecipient} onChange={(e) => setAddrRecipient(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-phone">연락처</Label>
                  <Input id="addr-phone" maxLength={20} value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-postal">우편번호</Label>
                <Input id="addr-postal" maxLength={10} value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-line1">주소 *</Label>
                <Input id="addr-line1" maxLength={255} value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-line2">상세 주소</Label>
                <Input id="addr-line2" maxLength={255} value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="addr-default"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                />
                <Label htmlFor="addr-default" className="cursor-pointer text-sm">
                  기본 배송지로 설정
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddrDialogOpen(false)} disabled={addrSubmitting}>
                취소
              </Button>
              <Button type="button" onClick={() => void submitAddress()} disabled={addrSubmitting}>
                {addrSubmitting ? "처리 중…" : "저장"}
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
