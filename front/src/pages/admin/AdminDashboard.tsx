import { useCallback, useEffect, useState } from "react";
import { Users, MessageSquare, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { api } from "../../utils/api";
import { unwrap } from "../../utils/exception";
import type { AdminInquiryListItem, PageResponse } from "../../types";

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalInquiries: number;
  pendingInquiries: number;
  totalNotices: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<AdminInquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, inqRes] = await Promise.all([
        api.get<DashboardStats>("/v1/admin/stats/dashboard"),
        api.get<PageResponse<AdminInquiryListItem>>("/v1/admin/inquiries?page=0&size=5"),
      ]);
      setStats(unwrap(statsRes));
      setRecentInquiries(unwrap(inqRes).content);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !stats) {
    return <div className="py-12 text-center text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">Ruxpress 관리자 현황</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 회원</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}명</div>
            <p className="text-xs text-green-600 mt-1">오늘 +{stats.newUsersToday}명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">1:1 문의</CardTitle>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalInquiries}건</div>
            <p className="text-xs text-orange-600 mt-1">답변 대기 {stats.pendingInquiries}건</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">공지사항</CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalNotices}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">현재 환율</CardTitle>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <p className="text-xs text-gray-500 mt-1">환율 설정에서 확인</p>
          </CardContent>
        </Card>
      </div>

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
            {recentInquiries.length === 0 ? (
              <p className="text-center text-gray-500 py-4">최근 문의가 없습니다</p>
            ) : recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{inquiry.title}</span>
                    <Badge variant={inquiry.status === "PENDING" ? "secondary" : inquiry.status === "REPLIED" ? "default" : "outline"}>
                      {inquiry.status === "PENDING" && "답변대기"}
                      {inquiry.status === "REPLIED" && "답변완료"}
                      {inquiry.status === "CLOSED" && "종료"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {inquiry.category} · {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
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
