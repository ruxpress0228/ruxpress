import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Shield, LogOut, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
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
import { useTranslation } from "../../hooks/useTranslation";
import { BalanceEquivalents } from "../../components/balance/BalanceEquivalents";
import {
  DescriptionList,
  EmptyState,
  Field,
  LoadingState,
  PageHeader,
  Section,
  type DescriptionItem,
} from "../../components/page";
import type { User as UserProfile, UserAddress } from "../../types/domain";

function formatDate(iso: string | undefined, dateLocale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(iso: string | undefined, dateLocale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function signupTypeKey(type: UserProfile["signupType"]): string {
  if (type === "EMAIL") return "myPage.signupType.email";
  if (type === "PHONE") return "myPage.signupType.phone";
  return "myPage.signupType.google";
}

/** Notification channels and items, in the order the rows are rendered. Switch ids are `${channel}-${item}`. */
const NOTIF_CHANNELS = [
  { id: "push", titleKey: "myPage.notif.push" },
  { id: "email", titleKey: "myPage.notif.email" },
  { id: "sms", titleKey: "myPage.notif.sms" },
] as const;

const NOTIF_ITEMS = [
  { id: "inquiry", field: "inquiryReply", labelKey: "myPage.notif.inquiryReply" },
  { id: "notice", field: "notice", labelKey: "myPage.notif.notice" },
  { id: "promotion", field: "promotion", labelKey: "myPage.notif.promotion" },
  { id: "purchase", field: "purchaseStatus", labelKey: "myPage.notif.purchaseStatus" },
] as const;

export default function MyPage() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ru" ? "ru-RU" : "en-US";
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
      toast.error(t("myPage.toast.loginRequired"));
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
        toast.error(t("myPage.toast.reLogin"));
        navigate("/login", { replace: true });
      } else {
        toast.error(res.message ?? t("myPage.toast.profileLoadError"));
        setProfile(null);
      }
    } catch {
      toast.error(t("myPage.toast.profileLoadError"));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const res = await api.get<UserAddress[]>("/v1/users/me/addresses");
      if (res.code === 200 && Array.isArray(res.data)) {
        setAddresses(res.data);
      } else if (res.code !== 401) {
        toast.error(res.message ?? t("myPage.toast.addressLoadError"));
      }
    } catch {
      toast.error(t("myPage.toast.addressLoadError"));
    } finally {
      setAddressesLoading(false);
    }
  }, [t]);

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
      toast.error(t("myPage.toast.addressRequired"));
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
        toast.success(res.message ?? (addrEditingId == null ? t("myPage.toast.addressAdded") : t("myPage.toast.addressUpdated")));
        setAddrDialogOpen(false);
        resetAddressForm();
        await loadAddresses();
        await loadProfile();
      } else {
        toast.error(res.message ?? t("myPage.toast.processFailed"));
      }
    } catch {
      toast.error(t("myPage.toast.processFailed"));
    } finally {
      setAddrSubmitting(false);
    }
  };

  const deleteAddress = async (a: UserAddress) => {
    if (!window.confirm(t("myPage.confirm.deleteAddress"))) return;
    try {
      const res = await api.delete<unknown>(`/v1/users/me/addresses/${a.id}`);
      if (res.code === 200) {
        toast.success(res.message ?? t("myPage.toast.addressDeleted"));
        await loadAddresses();
        await loadProfile();
      } else {
        toast.error(res.message ?? t("myPage.toast.deleteFailed"));
      }
    } catch {
      toast.error(t("myPage.toast.deleteFailed"));
    }
  };

  const markAsDefault = async (a: UserAddress) => {
    if (a.isDefault) return;
    try {
      const res = await api.post<UserAddress>(`/v1/users/me/addresses/${a.id}/default`, {});
      if (res.code === 200) {
        toast.success(res.message ?? t("myPage.toast.defaultSet"));
        await loadAddresses();
        await loadProfile();
      } else {
        toast.error(res.message ?? t("myPage.toast.defaultFailed"));
      }
    } catch {
      toast.error(t("myPage.toast.defaultFailed"));
    }
  };

  const handleLogout = () => {
    clearUserSession();
    toast.success(t("myPage.toast.loggedOut"));
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
      toast.error(t("myPage.toast.nicknameRequired"));
      return;
    }
    const line1 = editLine1.trim() || profile?.addressLine1?.trim() || "";
    if (!line1) {
      toast.error(t("myPage.toast.addressFirst"));
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
        toast.success(res.message ?? t("myPage.toast.profileUpdated"));
        setEditOpen(false);
      } else {
        toast.error(res.message ?? t("myPage.toast.profileUpdateFailed"));
      }
    } catch {
      toast.error(t("myPage.toast.profileUpdateFailed"));
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
      toast.error(t("myPage.toast.currentPwdRequired"));
      return;
    }
    if (!newPwd || newPwd.length < 8) {
      toast.error(t("myPage.toast.newPwdTooShort"));
      return;
    }
    if (newPwd !== newPwdConfirm) {
      toast.error(t("myPage.toast.newPwdMismatch"));
      return;
    }
    setPwdSubmitting(true);
    try {
      const res = await api.post<unknown>("/v1/users/me/password", {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      if (res.code === 200) {
        toast.success(res.message ?? t("resetPassword.toast.success"));
        setPwdOpen(false);
        resetPwdForm();
      } else {
        toast.error(res.message ?? t("myPage.toast.pwdChangeFailed"));
      }
    } catch {
      toast.error(t("myPage.toast.pwdChangeFailed"));
    } finally {
      setPwdSubmitting(false);
    }
  };

  const notif = profile?.notificationSettings;

  if (loading && !profile) {
    return (
      <div>
        <PageHeader title={t("myPage.title")} />
        <LoadingState label={t("myPage.profileLoading")} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <PageHeader title={t("myPage.title")} />
        <EmptyState
          icon={User}
          title={t("myPage.noProfile")}
          action={
            <Button asChild variant="outline">
              <Link to="/login">{t("nav.login")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const detailItems: DescriptionItem[] = [
    {
      key: "email",
      label: t("myPage.email"),
      value: (
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-all">{profile.email}</span>
          {profile.emailVerified ? <Badge>{t("myPage.verified")}</Badge> : null}
        </span>
      ),
    },
    ...(profile.phone
      ? [
          {
            key: "phone",
            label: t("myPage.phone"),
            value: (
              <span className="flex flex-wrap items-center gap-2">
                <span className="figure">{profile.phone}</span>
                {profile.phoneVerified ? <Badge>{t("myPage.verified")}</Badge> : null}
              </span>
            ),
          },
        ]
      : []),
    {
      key: "joinedAt",
      label: t("myPage.joinedAt"),
      value: <span className="figure">{formatDate(profile.createdAt, dateLocale)}</span>,
    },
    ...(profile.lastLoginAt
      ? [
          {
            key: "lastLogin",
            label: t("myPage.lastLogin"),
            value: <span className="figure">{formatDateTime(profile.lastLoginAt, dateLocale)}</span>,
          },
        ]
      : []),
  ];

  const accountRowClass =
    "flex w-full items-center gap-3 border-b border-border py-4 text-left text-sm font-medium transition-colors hover:bg-muted/60";

  return (
    <div>
      <PageHeader title={t("myPage.title")} />

      <div className="space-y-10 md:space-y-12">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
            aria-hidden
          >
            <User className="size-7" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate">{profile.nickname}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={profile.status === "ACTIVE" ? "default" : "outline"}>
                {profile.status === "ACTIVE" ? t("myPage.status.active") : profile.status}
              </Badge>
              <Badge variant="outline">{t(signupTypeKey(profile.signupType))}</Badge>
            </div>
          </div>
          <Button type="button" variant="outline" className="self-start sm:self-center" onClick={openEditDialog}>
            {t("myPage.editProfile")}
          </Button>
        </section>

        <Section title={t("myPage.profileInfo")} description={t("myPage.profileInfoDesc")}>
          <DescriptionList columns={2} items={detailItems} />
        </Section>

        <Section title={t("myPage.currentBalance")}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-4xl font-light figure md:text-5xl">
                ₩{(balance ?? 0).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <BalanceEquivalents balance={balance} className="mt-2 text-sm text-muted-foreground figure" />
            </div>
            <Button asChild variant="outline" className="shrink-0 self-start sm:self-end">
              <Link to="/wallet">{t("nav.wallet")}</Link>
            </Button>
          </div>
        </Section>

        <Section
          title={t("myPage.addressMgmt")}
          description={t("myPage.addressMgmtDesc")}
          action={
            <Button type="button" size="sm" variant="outline" onClick={openAddressCreate}>
              <Plus strokeWidth={1.5} aria-hidden />
              {t("myPage.add")}
            </Button>
          }
          flush
        >
          {addressesLoading && addresses.length === 0 ? (
            <LoadingState compact className="border-t-0" label={t("myPage.loading")} />
          ) : addresses.length === 0 ? (
            <EmptyState compact className="border-t-0" icon={MapPin} title={t("myPage.noAddresses")} />
          ) : (
            <ul>
              {addresses.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 border-b border-border py-4 md:flex-row md:items-start md:justify-between md:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{a.label || t("myPage.addressFallback")}</span>
                      {a.isDefault ? (
                        <Badge className="px-1.5 py-0 text-[10px] font-medium">{t("myPage.default")}</Badge>
                      ) : null}
                    </div>
                    {a.recipientName || a.recipientPhone ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[a.recipientName, a.recipientPhone].filter(Boolean).join(" / ")}
                      </p>
                    ) : null}
                    <p className="mt-1 break-words text-sm">
                      {[a.postalCode, a.addressLine1, a.addressLine2].filter(Boolean).join(" ")}
                    </p>
                  </div>
                  <div className="-ml-2 flex shrink-0 flex-wrap items-center gap-1 md:ml-0">
                    {!a.isDefault ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => void markAsDefault(a)}>
                        {t("myPage.setDefault")}
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" variant="ghost" onClick={() => openAddressEdit(a)}>
                      <Pencil strokeWidth={1.5} aria-hidden />
                      {t("myPage.edit")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void deleteAddress(a)}
                    >
                      <Trash2 strokeWidth={1.5} aria-hidden />
                      {t("myPage.delete")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("myPage.notif.title")} description={t("myPage.notif.desc")} className="hidden" flush>
          {NOTIF_CHANNELS.map((channel) => (
            <div key={channel.id}>
              <h3 className="pb-2 pt-6">{t(channel.titleKey)}</h3>
              <div className="border-t border-border">
                {NOTIF_ITEMS.map((item) => {
                  const id = `${channel.id}-${item.id}`;
                  return (
                    <div key={id} className="flex items-center justify-between gap-4 border-b border-border py-3.5">
                      <Label htmlFor={id} className="cursor-pointer font-normal">
                        {t(item.labelKey)}
                      </Label>
                      <Switch id={id} defaultChecked={notif?.[channel.id]?.[item.field] ?? false} disabled />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </Section>

        <Section title={t("myPage.accountMgmt")} flush>
          <ul>
            <li>
              <button type="button" className={accountRowClass} onClick={() => setPwdOpen(true)}>
                <Shield className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {t("myPage.changePassword")}
              </button>
            </li>
            <li>
              <button type="button" className={accountRowClass} onClick={handleLogout}>
                <LogOut className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {t("myPage.logout")}
              </button>
            </li>
          </ul>
        </Section>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("myPage.editProfile")}</DialogTitle>
            <DialogDescription>{t("myPage.editProfileDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field htmlFor="edit-nickname" label={t("myPage.nickname")}>
              <Input id="edit-nickname" maxLength={50} value={editNickname} onChange={(e) => setEditNickname(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={editSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={() => void submitProfileEdit()} disabled={editSubmitting}>
              {editSubmitting ? t("myPage.processing") : t("common.save")}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{addrEditingId == null ? t("myPage.addressAdd") : t("myPage.addressEdit")}</DialogTitle>
            <DialogDescription>{t("myPage.addressDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field htmlFor="addr-label" label={t("myPage.addrLabel")}>
              <Input id="addr-label" maxLength={50} value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field htmlFor="addr-recipient" label={t("myPage.recipient")}>
                <Input id="addr-recipient" maxLength={50} value={addrRecipient} onChange={(e) => setAddrRecipient(e.target.value)} />
              </Field>
              <Field htmlFor="addr-phone" label={t("myPage.contact")}>
                <Input id="addr-phone" maxLength={20} value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} />
              </Field>
            </div>
            <Field htmlFor="addr-postal" label={t("myPage.postalCode")}>
              <Input id="addr-postal" maxLength={10} value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} />
            </Field>
            <Field htmlFor="addr-line1" label={t("myPage.address")} required>
              <Input id="addr-line1" maxLength={255} value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} />
            </Field>
            <Field htmlFor="addr-line2" label={t("myPage.addressDetail")}>
              <Input id="addr-line2" maxLength={255} value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} />
            </Field>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="addr-default"
                checked={addrIsDefault}
                onCheckedChange={(v) => setAddrIsDefault(v === true)}
              />
              <Label htmlFor="addr-default" className="cursor-pointer font-normal">
                {t("myPage.setAsDefault")}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAddrDialogOpen(false)} disabled={addrSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={() => void submitAddress()} disabled={addrSubmitting}>
              {addrSubmitting ? t("myPage.processing") : t("common.save")}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("myPage.changePassword")}</DialogTitle>
            <DialogDescription>{t("myPage.changePasswordDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field htmlFor="cur-pwd" label={t("myPage.currentPassword")}>
              <Input id="cur-pwd" type="password" autoComplete="current-password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
            </Field>
            <Field htmlFor="new-pwd" label={t("resetPassword.newPasswordLabel")}>
              <Input id="new-pwd" type="password" autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            </Field>
            <Field htmlFor="new-pwd2" label={t("resetPassword.newPasswordConfirmLabel")}>
              <Input id="new-pwd2" type="password" autoComplete="new-password" value={newPwdConfirm} onChange={(e) => setNewPwdConfirm(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPwdOpen(false)} disabled={pwdSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={() => void submitPasswordChange()} disabled={pwdSubmitting}>
              {pwdSubmitting ? t("myPage.processing") : t("myPage.change")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
