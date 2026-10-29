import type { PurchaseRequestStatus } from "../types";

/**
 * 구매 요청 상태 색상. 모노크롬 UI 기준:
 * 배송 중만 검정으로 채워 강조하고, 취소만 붉은 계열로 구분한다.
 * (홈 최근 요청 뱃지 · 목록 좌측 바 · 뱃지에서 공통 사용)
 */
export function purchaseStatusAccent(status: PurchaseRequestStatus): {
  bar: string;
  softBg: string;
  badgeClass: string;
} {
  switch (status) {
    case "REQUESTED":
      return {
        bar: "border-l-foreground/25",
        softBg: "",
        badgeClass: "border-0 bg-background text-foreground ring-1 ring-foreground/25",
      };
    case "PURCHASING":
      return {
        bar: "border-l-foreground/60",
        softBg: "",
        badgeClass: "border-0 bg-muted text-foreground ring-1 ring-foreground/20",
      };
    case "SHIPPING":
      return {
        bar: "border-l-foreground",
        softBg: "",
        badgeClass: "border-0 bg-foreground text-background",
      };
    case "COMPLETED":
      return {
        bar: "border-l-border",
        softBg: "",
        badgeClass: "border-0 bg-muted text-muted-foreground ring-1 ring-border",
      };
    case "CANCELLED":
    default:
      return {
        bar: "border-l-destructive/60",
        softBg: "",
        badgeClass: "border-0 bg-destructive/10 text-destructive ring-1 ring-destructive/30",
      };
  }
}

export function purchaseStatusBadgeClass(status: PurchaseRequestStatus): string {
  return purchaseStatusAccent(status).badgeClass;
}

/** 구매요청 목록 상단 요약 칩 선택 상태 — 선택된 칩은 검정으로 채운다 */
export type PurchaseListSummaryFilter = "all" | "progress" | PurchaseRequestStatus;

export function purchaseListSummaryChipActiveClasses(_filter: PurchaseListSummaryFilter): {
  shell: string;
  countClass: string;
} {
  return {
    shell: "border-foreground bg-foreground",
    countClass: "text-background",
  };
}
