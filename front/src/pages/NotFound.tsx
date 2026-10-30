import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Mark } from "../components/brand/BrandMark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16 md:px-6">
      <div className="w-full max-w-md">
        <Mark size="md" />
        <p className="mt-10 text-7xl font-light leading-none figure md:text-8xl">404</p>
        <h1 className="mt-6">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link to="/">
              <Home strokeWidth={1.5} aria-hidden />
              홈으로
            </Link>
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft strokeWidth={1.5} aria-hidden />
            이전 페이지
          </Button>
        </div>
      </div>
    </div>
  );
}
