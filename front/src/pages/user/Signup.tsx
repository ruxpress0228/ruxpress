import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";

export default function Signup() {
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const sendEmailVerification = () => {
    toast.success("인증 메일이 발송되었습니다");
  };

  const sendPhoneVerification = () => {
    toast.success("인증번호가 발송되었습니다");
  };

  const verifyEmailCode = () => {
    if (emailCode === "123456") {
      setEmailVerified(true);
      toast.success("이메일이 인증되었습니다");
    } else {
      toast.error("인증번호가 올바르지 않습니다");
    }
  };

  const verifyPhoneCode = () => {
    if (phoneCode === "123456") {
      setPhoneVerified(true);
      toast.success("휴대폰이 인증되었습니다");
    } else {
      toast.error("인증번호가 올바르지 않습니다");
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
          <CardTitle className="text-2xl text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            Ruxpress 계정을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">이메일</TabsTrigger>
              <TabsTrigger value="phone">휴대폰</TabsTrigger>
            </TabsList>

            {/* Email Signup */}
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일</Label>
                <div className="flex space-x-2">
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="email@example.com"
                    className="flex-1"
                    disabled={emailVerified}
                  />
                  {!emailVerified && (
                    <Button variant="outline" onClick={sendEmailVerification}>
                      인증
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
                      className="flex-1"
                    />
                    <Button onClick={verifyEmailCode}>확인</Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    인증번호 유효시간: 10분
                  </p>
                </div>
              )}

              {emailVerified && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="8자 이상 입력"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-confirm">비밀번호 확인</Label>
                    <Input
                      id="password-confirm"
                      type="password"
                      placeholder="비밀번호 재입력"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <Input
                      id="nickname"
                      placeholder="닉네임을 입력하세요"
                    />
                  </div>
                  <Button className="w-full" size="lg">
                    가입하기
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Phone Signup */}
            <TabsContent value="phone" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-phone">휴대폰 번호</Label>
                <div className="flex space-x-2">
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    className="flex-1"
                    disabled={phoneVerified}
                  />
                  {!phoneVerified && (
                    <Button variant="outline" onClick={sendPhoneVerification}>
                      인증
                    </Button>
                  )}
                </div>
              </div>

              {!phoneVerified && (
                <div className="space-y-2">
                  <Label htmlFor="phone-code">인증번호</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="phone-code"
                      placeholder="6자리 숫자"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={verifyPhoneCode}>확인</Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    인증번호 유효시간: 3분
                  </p>
                </div>
              )}

              {phoneVerified && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone-password">비밀번호</Label>
                    <Input
                      id="phone-password"
                      type="password"
                      placeholder="8자 이상 입력"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-password-confirm">비밀번호 확인</Label>
                    <Input
                      id="phone-password-confirm"
                      type="password"
                      placeholder="비밀번호 재입력"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-nickname">닉네임</Label>
                    <Input
                      id="phone-nickname"
                      placeholder="닉네임을 입력하세요"
                    />
                  </div>
                  <Button className="w-full" size="lg">
                    가입하기
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">또는</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" size="lg">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 가입하기
            </Button>
          </div>

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
