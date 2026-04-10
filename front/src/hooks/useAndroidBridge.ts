import { useCallback, useEffect, useState } from "react";

/** Android WebView JS bridge (window.Android) */
interface AndroidBridge {
  getFcmToken(): string;
}

/** Foreground push payload sent via window.onPushReceived() */
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
 * Android WebView 브릿지 hook.
 *
 * - `isAndroid`: 현재 Android WebView 환경인지 여부
 * - `getFcmToken`: FCM 토큰 조회 (Android 환경에서만 유효, 그 외 빈 문자열)
 * - `pushNotification`: 포그라운드 푸시 수신 시 최신 payload (초기값 null)
 * - `clearPushNotification`: pushNotification을 null로 초기화
 */
export function useAndroidBridge() {
  const isAndroid = typeof window !== "undefined" && !!window.Android;

  const [pushNotification, setPushNotification] = useState<PushPayload | null>(null);

  const getFcmToken = useCallback((): string => {
    return window.Android?.getFcmToken() ?? "";
  }, []);

  const clearPushNotification = useCallback(() => {
    setPushNotification(null);
  }, []);

  useEffect(() => {
    if (!isAndroid) return;

    window.onPushReceived = (payload: PushPayload) => {
      setPushNotification(payload);
    };

    return () => {
      window.onPushReceived = undefined;
    };
  }, [isAndroid]);

  return { isAndroid, getFcmToken, pushNotification, clearPushNotification };
}
