import { Users, ShoppingCart, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { mockPurchaseRequests, mockInquiries, mockUsers, currentExchangeRate } from "../../data/mockData";

export default function AdminDashboard() {
  const stats = {
    totalUsers: mockUsers.length,
    newUsersToday: 2,
    totalRequests: mockPurchaseRequests.length,
    pendingRequests: mockPurchaseRequests.filter(r => r.status === 'REVIEWING').length,
    totalInquiries: mockInquiries.length,
    pendingInquiries: mockInquiries.filter(i => i.status === 'PENDING').length,
    currentExchangeRate: currentExchangeRate.rate,
  };

  const recentRequests = mockPurchaseRequests.slice(0, 5);
  const recentInquiries = mockInquiries.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">Ruxpress 관리자 현황</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 회원
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalUsers}명
            </div>
            <p className="text-xs text-green-600 mt-1">
              오늘 +{stats.newUsersToday}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              구매 요청
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalRequests}건
            </div>
            <p className="text-xs text-orange-600 mt-1">
              검토 대기 {stats.pendingRequests}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              1:1 문의
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalInquiries}건
            </div>
            <p className="text-xs text-orange-600 mt-1">
              답변 대기 {stats.pendingInquiries}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              현재 환율
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.currentExchangeRate.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 RUB = {stats.currentExchangeRate.toFixed(2)} KRW
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>최근 구매 요청</CardTitle>
              <CardDescription>최근 제출된 구매 요청 목록</CardDescription>
            </div>
            {stats.pendingRequests > 0 && (
              <Badge variant="destructive" className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {stats.pendingRequests}건 대기중
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {request.productName}
                    </span>
                    <Badge variant={
                      request.status === 'REVIEWING' ? 'secondary' :
                      request.status === 'PURCHASING' ? 'default' :
                      'outline'
                    }>
                      {request.status === 'REVIEWING' && '검토중'}
                      {request.status === 'PURCHASING' && '구매중'}
                      {request.status === 'DELIVERED' && '배송완료'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {request.requestNumber} · {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₩{request.totalAmountKrw?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Inquiries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>최근 문의</CardTitle>
              <CardDescription>최근 등록된 1:1 문의 목록</CardDescription>
            </div>
            {stats.pendingInquiries > 0 && (
              <Badge variant="destructive" className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {stats.pendingInquiries}건 대기중
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {inquiry.title}
                    </span>
                    <Badge variant={
                      inquiry.status === 'PENDING' ? 'secondary' :
                      inquiry.status === 'REPLIED' ? 'default' :
                      'outline'
                    }>
                      {inquiry.status === 'PENDING' && '답변대기'}
                      {inquiry.status === 'REPLIED' && '답변완료'}
                      {inquiry.status === 'CLOSED' && '종료'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {inquiry.category} · {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
