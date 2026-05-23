import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { api } from "../../utils/api";

const TERMS_OF_SERVICE = `1) Цель и назначение группы
• Эта группа предназначена для покупки и продажи товаров из Кореи, включая мерч и косметическую продукцию. Участники обязаны соблюдать правила и действовать добросовестно.

2) Регистрация и участие
• При необходимости можно указать, что пользователь должен быть совершеннолетним.
• Следует разъяснить, что, вступая в группу, пользователь автоматически соглашается с настоящими условиями.

3) Обязанности участников
• Участникам запрещается размещать спам, запрещённые товары или запрещённые материалы.
• Участники обязаны соблюдать правила безопасности (например, самостоятельно проверять продавцов и покупателей).

4) Оплата и доставка
• Администратор группы не несёт ответственности за сделки между пользователями.
• Рекомендуется использовать безопасные способы оплаты.

5) Ответственность
• Администратор не несёт ответственности за качество товара, сроки доставки и действия участников группы.

6) Изменение условий
• Администратор имеет право изменять правила без предварительного уведомления.`;

const PRIVACY_POLICY = `1) Сбор данных
• Собираемые данные: имя, контактные данные, сообщения в чате, платёжная информация.

2) Использование данных
• Собранные данные используются только для оформления продажи и связи с пользователями.

3) Передача третьим лицам
• Персональные данные покупателей не передаются внешним сервисам.

4) Безопасность данных
• Мы принимаем необходимые меры для защиты персональных данных, однако не можем гарантировать абсолютную безопасность внутри Telegram.

5) Права пользователя
• Пользователь имеет право запросить удаление своих данных или выйти из группы.

6) Контакты
• По всем вопросам, связанным с персональными данными:
  +10 5164 9833
  @danidani_y
  (администратор группы)`;

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [privacyViewed, setPrivacyViewed] = useState(false);

  const agreedAll = agreedTerms && agreedPrivacy;
  const canAgreeAll = termsViewed && privacyViewed;
  const toggleAgreeAll = (checked: boolean) => {
    if (checked && !canAgreeAll) {
      toast.error("이용약관과 개인정보 처리방침 내용을 먼저 확인해 주세요");
      return;
    }
    setAgreedTerms(checked);
    setAgreedPrivacy(checked);
  };
  const handleAgreeTerms = (checked: boolean) => {
    if (checked && !termsViewed) {
      toast.error("이용약관 내용을 먼저 확인해 주세요");
      return;
    }
    setAgreedTerms(checked);
  };
  const handleAgreePrivacy = (checked: boolean) => {
    if (checked && !privacyViewed) {
      toast.error("개인정보 처리방침 내용을 먼저 확인해 주세요");
      return;
    }
    setAgreedPrivacy(checked);
  };
  const openTerms = () => {
    setTermsOpen(true);
    setTermsViewed(true);
  };
  const openPrivacy = () => {
    setPrivacyOpen(true);
    setPrivacyViewed(true);
  };

  const sendEmailVerification = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("이메일을 입력하세요");
      return;
    }
    setEmailSending(true);
    try {
      const res = await api.post<unknown>("/v1/users/email/send-verification", { email: trimmed });
      if (res.code === 200) {
        toast.success(res.message ?? "인증 메일이 발송되었습니다");
      } else {
        toast.error(res.message ?? "발송에 실패했습니다");
      }
    } catch {
      toast.error("인증 메일 발송에 실패했습니다");
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmailCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("이메일을 입력하세요");
      return;
    }
    if (!emailCode || emailCode.length !== 6) {
      toast.error("인증번호 6자리를 입력하세요");
      return;
    }
    setEmailVerifying(true);
    try {
      const res = await api.post<unknown>("/v1/users/email/verify", {
        email: trimmedEmail,
        code: emailCode,
      });
      if (res.code === 200) {
        setEmailVerified(true);
        toast.success(res.message ?? "이메일이 인증되었습니다");
      } else {
        toast.error(res.message ?? "인증번호가 올바르지 않습니다");
      }
    } catch {
      toast.error("인증에 실패했습니다");
    } finally {
      setEmailVerifying(false);
    }
  };

  const submitSignup = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("이메일을 입력하세요");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("비밀번호는 8자 이상 입력하세요");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      toast.error("닉네임을 입력하세요");
      return;
    }
    const line1 = addressLine1.trim();
    if (!line1) {
      toast.error("주소를 입력하세요");
      return;
    }
    if (!agreedTerms) {
      toast.error("이용약관에 동의해 주세요");
      return;
    }
    if (!agreedPrivacy) {
      toast.error("개인정보 처리방침에 동의해 주세요");
      return;
    }
    setSignupLoading(true);
    try {
      const res = await api.post<unknown>("/v1/users/signup", {
        email: trimmedEmail,
        password,
        nickname: trimmedNickname,
        addressPostalCode: addressPostalCode.trim() || undefined,
        addressLine1: line1,
        addressLine2: addressLine2.trim() || undefined,
      });
      if (res.code === 200) {
        toast.success(res.message ?? "회원가입이 완료되었습니다");
        navigate("/login");
      } else {
        toast.error(res.message ?? "가입에 실패했습니다");
      }
    } catch {
      toast.error("가입에 실패했습니다");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">R</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            이메일 인증 후 비밀번호·닉네임·배송지 주소를 입력해 주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">
            메일로 받은 인증번호로 이메일을 확인한 뒤 나머지 정보를 입력합니다.
          </p>
          <div className="space-y-2">
            <Label htmlFor="signup-email">이메일 (아이디)</Label>
            <div className="flex space-x-2">
              <Input
                id="signup-email"
                type="email"
                placeholder="email@example.com"
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendEmailVerification()}
                disabled={emailVerified}
              />
              {!emailVerified && (
                <Button type="button" variant="outline" onClick={sendEmailVerification} disabled={emailSending}>
                  {emailSending ? "발송중..." : "인증"}
                </Button>
              )}
            </div>
          </div>

          {!emailVerified && (
            <div className="space-y-2">
              <Label htmlFor="email-code">인증번호</Label>
              <div className="flex space-x-2">
                <Input
                  id="email-code"
                  placeholder="6자리 숫자"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verifyEmailCode()}
                  className="flex-1"
                />
                <Button type="button" onClick={verifyEmailCode} disabled={emailVerifying}>
                  {emailVerifying ? "확인중..." : "확인"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">인증번호 유효시간: 10분</p>
            </div>
          )}

          {emailVerified && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="8자 이상 (영문, 숫자, 특수문자)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-confirm">비밀번호 확인</Label>
                <Input
                  id="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호 재입력"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  placeholder="닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <Separator className="my-2" />
              <p className="text-sm font-medium text-gray-800">배송지 주소</p>
              <div className="space-y-2">
                <Label htmlFor="addr-postal">우편번호 (선택)</Label>
                <Input
                  id="addr-postal"
                  placeholder="예: 06234"
                  value={addressPostalCode}
                  onChange={(e) => setAddressPostalCode(e.target.value)}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-line1">기본 주소</Label>
                <Input
                  id="addr-line1"
                  placeholder="시·구·동, 도로명 등"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-line2">상세 주소 (선택)</Label>
                <Input
                  id="addr-line2"
                  placeholder="동·호수 등"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSignup()}
                />
              </div>
              <Separator className="my-2" />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree-all"
                    checked={agreedAll}
                    disabled={!canAgreeAll}
                    onCheckedChange={(v) => toggleAgreeAll(Boolean(v))}
                  />
                  <Label
                    htmlFor="agree-all"
                    className={`text-sm font-medium ${canAgreeAll ? "cursor-pointer" : "cursor-not-allowed text-gray-400"}`}
                  >
                    전체 동의
                  </Label>
                </div>
                <div className="flex items-center justify-between pl-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agree-terms"
                      checked={agreedTerms}
                      disabled={!termsViewed}
                      onCheckedChange={(v) => handleAgreeTerms(Boolean(v))}
                    />
                    <Label
                      htmlFor="agree-terms"
                      className={`text-sm ${termsViewed ? "cursor-pointer" : "cursor-not-allowed text-gray-400"}`}
                    >
                      <span className="text-red-500">[필수]</span> 이용약관 동의
                      {!termsViewed && <span className="ml-1 text-xs text-gray-500">(내용 확인 필요)</span>}
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={openTerms}
                  >
                    보기
                  </button>
                </div>
                <div className="flex items-center justify-between pl-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agree-privacy"
                      checked={agreedPrivacy}
                      disabled={!privacyViewed}
                      onCheckedChange={(v) => handleAgreePrivacy(Boolean(v))}
                    />
                    <Label
                      htmlFor="agree-privacy"
                      className={`text-sm ${privacyViewed ? "cursor-pointer" : "cursor-not-allowed text-gray-400"}`}
                    >
                      <span className="text-red-500">[필수]</span> 개인정보 처리방침 동의
                      {!privacyViewed && <span className="ml-1 text-xs text-gray-500">(내용 확인 필요)</span>}
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={openPrivacy}
                  >
                    보기
                  </button>
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={submitSignup}
                disabled={signupLoading || !agreedAll}
              >
                {signupLoading ? "가입 중..." : "가입하기"}
              </Button>
            </>
          )}

          <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Условия пользования / 이용약관</DialogTitle>
                <DialogDescription>
                  Telegram 구매대행 그룹 이용약관입니다. 가입 시 본 약관에 동의한 것으로 간주됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
                {TERMS_OF_SERVICE}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Политика конфиденциальности / 개인정보 처리방침</DialogTitle>
                <DialogDescription>
                  수집·이용되는 개인정보 항목과 처리 방침입니다.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
                {PRIVACY_POLICY}
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-center text-sm text-gray-600 mt-6">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
