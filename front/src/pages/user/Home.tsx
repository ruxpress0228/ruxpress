import { Link } from "react-router";
import { ShoppingCart, MessageSquare, FileText, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { mockNotices, currentExchangeRate, mockPurchaseRequests } from "../../data/mockData";

export default function Home() {
  const recentNotices = mockNotices.filter(n => n.status === 'PUBLISHED').slice(0, 3);
  const myRequests = mockPurchaseRequests.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-8 md:p-12 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          러시아 상품, 간편하게 구매하세요
        </h1>
        <p className="text-lg md:text-xl text-blue-50 mb-6">
          Wildberries, Ozon 등 러시아 주요 쇼핑몰의 상품을<br />
          안전하고 빠르게 한국으로 배송해드립니다
        </p>
        <Link to="/purchase/new">
          <Button size="lg" variant="secondary" className="font-semibold">
            구매 요청하기
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Exchange Rate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <CardTitle>현재 환율</CardTitle>
            </div>
            <Badge variant="secondary">
              {new Date(currentExchangeRate.fetchedAt).toLocaleDateString('ko-KR')} 기준
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900">
              1 RUB = {currentExchangeRate.rate.toFixed(2)} KRW
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            환율은 매일 자동으로 업데이트됩니다
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/purchase/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardHeader>
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>구매 요청</CardTitle>
              <CardDescription>
                원하는 상품의 URL을 입력하여 구매 요청을 시작하세요
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/inquiry/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>1:1 문의</CardTitle>
              <CardDescription>
                궁금한 점이 있으신가요? 언제든지 문의해주세요
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/notice">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <CardHeader>
              <FileText className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>공지사항</CardTitle>
              <CardDescription>
                서비스 관련 최신 소식을 확인하세요
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* My Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>최근 구매 요청</CardTitle>
            <Link to="/purchase">
              <Button variant="ghost" size="sm">
                전체보기
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {myRequests.length > 0 ? (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {request.productName}
                      </span>
                      <Badge variant={
                        request.status === 'DELIVERED' ? 'default' :
                        request.status === 'PURCHASING' ? 'secondary' :
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>아직 구매 요청이 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>공지사항</CardTitle>
            <Link to="/notice">
              <Button variant="ghost" size="sm">
                전체보기
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentNotices.map((notice) => (
              <Link key={notice.id} to={`/notice/${notice.id}`}>
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {notice.isPinned && (
                          <Badge variant="destructive" className="text-xs">중요</Badge>
                        )}
                        <span className="font-medium text-gray-900">{notice.title}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(notice.publishedAt!).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
