import type { PurchaseRequestStatus } from "../types";

/** 홈 대시보드·최근 요청 뱃지와 동일한 구매 요청 상태 색상 (리스트 좌측 바·배경·뱃지) */
export function purchaseStatusAccent(status: PurchaseRequestStatus): {
  bar: string;
  softBg: string;
  badgeClass: string;
} {
  switch (status) {
    case "REQUESTED":
      return {
        bar: "border-l-slate-500",
        softBg: "bg-slate-50/90",
        badgeClass: "border-0 bg-slate-50 text-slate-900 ring-1 ring-slate-200/80",
      };
    case "PURCHASING":
      return {
        bar: "border-l-blue-600",
        softBg: "bg-blue-50/60",
        badgeClass: "border-0 bg-blue-50 text-blue-900 ring-1 ring-blue-200/90",
      };
    case "SHIPPING":
      return {
        bar: "border-l-blue-700",
        softBg: "bg-blue-50/70",
        badgeClass: "border-0 bg-blue-100 text-blue-800 ring-1 ring-blue-200/90",
      };
    case "COMPLETED":
      return {
        bar: "border-l-cyan-700",
        softBg: "bg-cyan-50/50",
        badgeClass: "border-0 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200/90",
      };
    case "CANCELLED":
    default:
      return {
        bar: "border-l-rose-600",
        softBg: "bg-rose-50/50",
        badgeClass: "border-0 bg-rose-100 text-rose-900 ring-1 ring-rose-200/90",
      };
  }
}

export function purchaseStatusBadgeClass(status: PurchaseRequestStatus): string {
  return purchaseStatusAccent(status).badgeClass;
}

/** 구매요청 목록 상단 요약 칩 선택 상태 — 홈 `dashboardCards` 주문현황 톤과 맞춤 */
export type PurchaseListSummaryFilter = "all" | "progress" | PurchaseRequestStatus;

export function purchaseListSummaryChipActiveClasses(filter: PurchaseListSummaryFilter): {
  shell: string;
  countClass: string;
} {
  switch (filter) {
    case "SHIPPING":
      return {
        shell:
          "border-blue-300 bg-blue-50/90 shadow-[0_0_18px_rgba(29,78,216,0.2)] ring-2 ring-blue-400/35",
        countClass: "text-blue-950",
      };
    case "COMPLETED":
      return {
        shell: "border-cyan-300 bg-cyan-50/90 ring-2 ring-cyan-400/35",
        countClass: "text-cyan-950",
      };
    default:
      return {
        shell: "border-blue-300 bg-blue-50/90 ring-2 ring-blue-400/35",
        countClass: "text-blue-900",
      };
  }
}
