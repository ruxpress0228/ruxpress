import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-600 mt-2 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 페이지
          </Button>
        </div>
      </div>
    </div>
  );
}
