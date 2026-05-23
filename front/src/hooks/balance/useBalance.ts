import { useCallback, useEffect, useState } from "react";
import { getMyBalance } from "../../api/balance";
import { readAuthValue } from "../../utils/api";
import {
  STORAGE_KEYS,
  USER_BALANCE_CHANGE_EVENT,
  USER_BALANCE_UPDATED_EVENT,
} from "../../utils/constants";

export function useBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const token = readAuthValue(STORAGE_KEYS.TOKEN);
    if (!token) {
      setBalance(null);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    try {
      const b = await getMyBalance();
      setBalance((prev) => {
        if (prev === b) {
          return prev;
        }
        // 서버에서 실제 잔액 값이 바뀐 경우에만 알림
        window.dispatchEvent(new Event(USER_BALANCE_UPDATED_EVENT));
        return b;
      });
    } catch {
      setBalance(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onBalanceChanged = () => {
      void refresh({ silent: true });
    };
    window.addEventListener(USER_BALANCE_CHANGE_EVENT, onBalanceChanged);
    return () => window.removeEventListener(USER_BALANCE_CHANGE_EVENT, onBalanceChanged);
  }, [refresh]);

  useEffect(() => {
    const token = readAuthValue(STORAGE_KEYS.TOKEN);
    if (!token) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh({ silent: true });
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [refresh]);

  return { balance, loading, refresh };
}
