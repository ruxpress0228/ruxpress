import { User, Bell, Shield, LogOut, Mail, Phone } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { currentUser } from "../../data/mockData";

export default function MyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">마이페이지</h1>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 정보</CardTitle>
            <CardDescription>
              회원 정보를 확인하고 수정할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentUser.nickname}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={currentUser.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {currentUser.status === 'ACTIVE' ? '정상' : currentUser.status}
                  </Badge>
                  <Badge variant="outline">
                    {currentUser.signupType === 'EMAIL' ? '이메일 가입' : 
                     currentUser.signupType === 'PHONE' ? '휴대폰 가입' : 
                     'Google 가입'}
                  </Badge>
                </div>
              </div>
              <Button variant="outline">프로필 수정</Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="font-medium text-gray-900">{currentUser.email}</p>
                </div>
                {currentUser.emailVerified && (
                  <Badge variant="default" className="bg-green-500">인증됨</Badge>
                )}
              </div>

              {currentUser.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">휴대폰</p>
                    <p className="font-medium text-gray-900">{currentUser.phone}</p>
                  </div>
                  {currentUser.phoneVerified && (
                    <Badge variant="default" className="bg-green-500">인증됨</Badge>
                  )}
                </div>
              )}

              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">가입일</p>
                  <p className="font-medium text-gray-900">
                    {new Date(currentUser.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {currentUser.lastLoginAt && (
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">마지막 로그인</p>
                    <p className="font-medium text-gray-900">
                      {new Date(currentUser.lastLoginAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <CardTitle>알림 설정</CardTitle>
            </div>
            <CardDescription>
              받고 싶은 알림을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push Notifications */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">푸시 알림</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-inquiry" className="cursor-pointer">
                    문의 답변
                  </Label>
                  <Switch id="push-inquiry" defaultChecked={currentUser.notificationSettings?.push.inquiryReply} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notice" className="cursor-pointer">
                    공지사항
                  </Label>
                  <Switch id="push-notice" defaultChecked={currentUser.notificationSettings?.push.notice} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-promotion" className="cursor-pointer">
                    프로모션/이벤트
                  </Label>
                  <Switch id="push-promotion" defaultChecked={currentUser.notificationSettings?.push.promotion} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-purchase" className="cursor-pointer">
                    구매 상태 변경
                  </Label>
                  <Switch id="push-purchase" defaultChecked={currentUser.notificationSettings?.push.purchaseStatus} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Email Notifications */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">이메일 알림</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-inquiry" className="cursor-pointer">
                    문의 답변
                  </Label>
                  <Switch id="email-inquiry" defaultChecked={currentUser.notificationSettings?.email.inquiryReply} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notice" className="cursor-pointer">
                    공지사항
                  </Label>
                  <Switch id="email-notice" defaultChecked={currentUser.notificationSettings?.email.notice} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-promotion" className="cursor-pointer">
                    프로모션/이벤트
                  </Label>
                  <Switch id="email-promotion" defaultChecked={currentUser.notificationSettings?.email.promotion} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-purchase" className="cursor-pointer">
                    구매 상태 변경
                  </Label>
                  <Switch id="email-purchase" defaultChecked={currentUser.notificationSettings?.email.purchaseStatus} />
                </div>
              </div>
            </div>

            <Separator />

            {/* SMS Notifications */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">SMS 알림</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-inquiry" className="cursor-pointer">
                    문의 답변
                  </Label>
                  <Switch id="sms-inquiry" defaultChecked={currentUser.notificationSettings?.sms.inquiryReply} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notice" className="cursor-pointer">
                    공지사항
                  </Label>
                  <Switch id="sms-notice" defaultChecked={currentUser.notificationSettings?.sms.notice} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-promotion" className="cursor-pointer">
                    프로모션/이벤트
                  </Label>
                  <Switch id="sms-promotion" defaultChecked={currentUser.notificationSettings?.sms.promotion} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-purchase" className="cursor-pointer">
                    구매 상태 변경
                  </Label>
                  <Switch id="sms-purchase" defaultChecked={currentUser.notificationSettings?.sms.purchaseStatus} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              비밀번호 변경
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-gray-700">
              회원 탈퇴
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
