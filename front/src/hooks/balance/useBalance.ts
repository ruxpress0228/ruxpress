import { useCallback, useEffect, useRef, useState } from "react";
import { getMyBalance } from "../../api/balance";
import { STORAGE_KEYS, USER_AUTH_CHANGE_EVENT, BALANCE_CHANGE_EVENT } from "../../utils/constants";

const POLL_INTERVAL_MS = 10_000;

/**
 * 잔액이 변경되었음을 모든 useBalance 인스턴스에 알림.
 * 구매 제출, 입금 신청 등 잔액 변동 후 호출.
 */
export function notifyBalanceChange(): void {
  window.dispatchEvent(new Event(BALANCE_CHANGE_EVENT));
}

export function useBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const isLoggedIn = () => !!localStorage.getItem(STORAGE_KEYS.TOKEN);

  const fetchBalance = useCallback(async () => {
    if (!isLoggedIn()) {
      setBalance(null);
      return;
    }
    try {
      setLoading(true);
      const res = await getMyBalance();
      setBalance(res.balance);
    } catch {
      /* keep previous value */
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    notifyBalanceChange();
  }, []);

  useEffect(() => {
    fetchBalance();

    intervalRef.current = setInterval(fetchBalance, POLL_INTERVAL_MS);

    const onAuthChange = () => fetchBalance();
    window.addEventListener(USER_AUTH_CHANGE_EVENT, onAuthChange);

    const onBalanceChange = () => fetchBalance();
    window.addEventListener(BALANCE_CHANGE_EVENT, onBalanceChange);

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchBalance();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener(USER_AUTH_CHANGE_EVENT, onAuthChange);
      window.removeEventListener(BALANCE_CHANGE_EVENT, onBalanceChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchBalance]);

  return { balance, loading, refetch };
}
