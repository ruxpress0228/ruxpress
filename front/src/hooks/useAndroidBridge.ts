import { useCallback, useEffect, useState } from "react";

/** 로그인/로그아웃 시에만 사용 ([Login], [api.clearUserSession]) */
export interface AndroidBridge {
  setAuthToken(json: string): void;
  clearAuthToken(): void;
}

/** 포그라운드 푸시 — 네이티브 [RuxpressFcmService]가 [window.onPushReceived] 호출 */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

declare global {
  interface Window {
    Android?: AndroidBridge;
    onPushReceived?: (payload: PushPayload) => void;
  }
}

/**
 * Android WebView: 포그라운드 푸시 콜백만 등록.
 * FCM·push-context는 네이티브 [setAuthToken]에서 처리.
 */
export function useAndroidBridge() {
  const [pushNotification, setPushNotification] = useState<PushPayload | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Android) return;

    window.onPushReceived = (payload: PushPayload) => {
      setPushNotification(payload);
    };

    return () => {
      window.onPushReceived = undefined;
    };
  }, []);

  const clearPushNotification = useCallback(() => {
    setPushNotification(null);
  }, []);

  return { pushNotification, clearPushNotification };
}
