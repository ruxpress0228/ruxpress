import { Search, UserCheck, UserX, Mail, Phone } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { mockUsers } from "../../data/mockData";
import type { UserStatus } from "../../types";

const statusLabels: Record<UserStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  ACTIVE: { label: '정상', variant: 'default' },
  SUSPENDED: { label: '정지', variant: 'destructive' },
  WITHDRAWN: { label: '탈퇴', variant: 'secondary' },
};

export default function AdminUsers() {
  const updateUserStatus = (_userId: number, _newStatus: UserStatus) => {
    toast.success("회원 상태가 변경되었습니다");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-gray-600 mt-1">회원 정보를 조회하고 관리합니다</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 회원</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {mockUsers.length}명
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">정상 회원</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {mockUsers.filter(u => u.status === 'ACTIVE').length}명
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">정지/탈퇴</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {mockUsers.filter(u => u.status !== 'ACTIVE').length}명
                </p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="이메일, 닉네임, 전화번호 검색"
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="ACTIVE">정상</SelectItem>
                <SelectItem value="SUSPENDED">정지</SelectItem>
                <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회원 정보</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>가입 유형</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => {
                const statusInfo = statusLabels[user.status];
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{user.nickname}</p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          <span className="text-gray-600">{user.email}</span>
                          {user.emailVerified && (
                            <Badge variant="default" className="ml-2 text-xs bg-green-500">인증</Badge>
                          )}
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="text-gray-600">{user.phone}</span>
                            {user.phoneVerified && (
                              <Badge variant="default" className="ml-2 text-xs bg-green-500">인증</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.signupType === 'EMAIL' ? '이메일' :
                         user.signupType === 'PHONE' ? '휴대폰' :
                         'Google'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            관리
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>회원 상세 정보</DialogTitle>
                            <DialogDescription>
                              회원 정보를 조회하고 상태를 변경합니다
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold">기본 정보</h4>
                              <div className="text-sm space-y-1">
                                <p><strong>닉네임:</strong> {user.nickname}</p>
                                <p><strong>이메일:</strong> {user.email}</p>
                                {user.phone && <p><strong>휴대폰:</strong> {user.phone}</p>}
                                <p><strong>가입 유형:</strong> {user.signupType}</p>
                                <p><strong>가입일:</strong> {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
                                {user.lastLoginAt && (
                                  <p><strong>마지막 로그인:</strong> {new Date(user.lastLoginAt).toLocaleDateString('ko-KR')}</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-semibold">상태 변경</h4>
                              <Select
                                defaultValue={user.status}
                                onValueChange={(value) => updateUserStatus(user.id, value as UserStatus)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ACTIVE">정상</SelectItem>
                                  <SelectItem value="SUSPENDED">정지</SelectItem>
                                  <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
