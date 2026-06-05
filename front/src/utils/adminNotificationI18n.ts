import type { AdminNotification, AdminNotificationType } from "../types";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

function parseDataJson(raw?: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function num(data: Record<string, unknown>, key: string): number | undefined {
  const v = data[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function str(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key];
  return typeof v === "string" ? v : undefined;
}

function extractMemberId(body: string): number | undefined {
  const m = body.match(/회원\s*#(\d+)/);
  return m ? Number(m[1]) : undefined;
}

function extractChatPreview(body: string): string | undefined {
  const m = body.match(/회원\s*#\d+:\s*(.+)/);
  return m?.[1]?.trim();
}

function isChatRoomNotification(item: AdminNotification, data: Record<string, unknown>): boolean {
  if (str(data, "kind") === "ROOM_OPEN") return true;
  if (item.title === "새 채팅 상담 요청") return true;
  return /채팅\s*상담을\s*시작/.test(item.body);
}

function resolveChatNotification(
  item: AdminNotification,
  data: Record<string, unknown>,
  t: TranslateFn,
): { title: string; body: string } {
  const userId = num(data, "userId") ?? extractMemberId(item.body);
  if (isChatRoomNotification(item, data)) {
    return {
      title: t("admin.notification.chat.room.title"),
      body: userId != null
        ? t("admin.notification.chat.room.body", { userId })
        : item.body,
    };
  }
  const preview = str(data, "preview") ?? extractChatPreview(item.body) ?? "";
  return {
    title: t("admin.notification.chat.message.title"),
    body: userId != null
      ? t("admin.notification.chat.message.body", { userId, preview })
      : item.body,
  };
}

function resolvePurchaseNotification(
  item: AdminNotification,
  data: Record<string, unknown>,
  t: TranslateFn,
): { title: string; body: string } {
  const id = num(data, "purchaseRequestId");
  const m = item.body.match(/새로운 구매 요청이 등록되었습니다:\s*(.+?)\s*\(#(\d+)\)/);
  const name = m?.[1] ?? t("admin.notification.noTitle");
  const requestId = id ?? (m?.[2] ? Number(m[2]) : undefined);
  return {
    title: t("admin.notification.purchase.title"),
    body: requestId != null
      ? t("admin.notification.purchase.body", { name, id: requestId })
      : item.body,
  };
}

function resolveDepositNotification(
  item: AdminNotification,
  data: Record<string, unknown>,
  t: TranslateFn,
): { title: string; body: string } {
  const id = num(data, "entryId");
  const m = item.body.match(/^(.+?)\s*입금 신고가 접수되었습니다\.\s*\(#(\d+)\)/);
  const amount = m?.[1]?.trim() ?? "";
  const entryId = id ?? (m?.[2] ? Number(m[2]) : undefined);
  return {
    title: t("admin.notification.deposit.title"),
    body: entryId != null
      ? t("admin.notification.deposit.body", { amount, id: entryId })
      : item.body,
  };
}

function resolveInquiryNotification(
  item: AdminNotification,
  data: Record<string, unknown>,
  t: TranslateFn,
): { title: string; body: string } {
  const id = num(data, "inquiryId");
  const m = item.body.match(/새로운 문의가 등록되었습니다:\s*(.+?)\s*\(#(\d+)\)/);
  const title = m?.[1] ?? t("admin.notification.noTitle");
  const inquiryId = id ?? (m?.[2] ? Number(m[2]) : undefined);
  return {
    title: t("admin.notification.inquiry.title"),
    body: inquiryId != null
      ? t("admin.notification.inquiry.body", { title, id: inquiryId })
      : item.body,
  };
}

function resolveNegativeWalletNotification(
  item: AdminNotification,
  data: Record<string, unknown>,
  t: TranslateFn,
): { title: string; body: string } {
  const userId = num(data, "userId");
  const refundEntryId = num(data, "refundEntryId");
  const parentEntryId = num(data, "parentEntryId");
  const balanceAfter = str(data, "balanceAfter");
  const m = item.body.match(/^(.+?)\s*—\s*환불\s*(.+?)원\s*처리 후 잔액\s*(.+?)원\s*\(입금\s*#(\d+),\s*환불\s*#(\d+)\)/);
  if (m || (userId != null && refundEntryId != null && parentEntryId != null && balanceAfter)) {
    return {
      title: t("admin.notification.negativeWallet.title"),
      body: t("admin.notification.negativeWallet.body", {
        user: m?.[1] ?? (userId != null ? `#${userId}` : ""),
        refund: m?.[2] ?? "",
        balance: m?.[3] ?? balanceAfter ?? "",
        depositId: m?.[4] ?? parentEntryId ?? "",
        refundId: m?.[5] ?? refundEntryId ?? "",
      }),
    };
  }
  return { title: item.title, body: item.body };
}

const resolvers: Record<
  AdminNotificationType,
  (item: AdminNotification, data: Record<string, unknown>, t: TranslateFn) => { title: string; body: string }
> = {
  NEW_CHAT_MESSAGE: resolveChatNotification,
  NEW_PURCHASE_REQUEST: resolvePurchaseNotification,
  NEW_DEPOSIT_REPORT: resolveDepositNotification,
  NEW_INQUIRY: resolveInquiryNotification,
  NEGATIVE_WALLET_AFTER_REFUND: resolveNegativeWalletNotification,
};

/** Translate admin notification title/body from type + dataJson (fallback to stored text). */
export function resolveAdminNotificationText(
  item: AdminNotification,
  t: TranslateFn,
): { title: string; body: string } {
  const data = parseDataJson(item.dataJson);
  const resolver = resolvers[item.type];
  if (!resolver) {
    return { title: item.title, body: item.body };
  }
  return resolver(item, data, t);
}
