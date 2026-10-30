import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { useAuthGate } from "../auth/AuthGate";
import { addWish, getWishlistIds, removeWish } from "../../api/wishlist";
import { useTranslation } from "../../hooks/useTranslation";

type WishlistValue = {
  /** Product ids the member has saved. Empty for guests. */
  ids: ReadonlySet<number>;
  count: number;
  isWished: (productId: number) => boolean;
  /** Saves or removes; guests get the login sheet and come back to the same page. */
  toggle: (productId: number) => Promise<void>;
  /** Re-read from the server (after bulk removals on the wishlist page). */
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistValue | null>(null);

/** Shared heart state for every product card and page. Lives in the user layout. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isLoggedIn, requireLogin } = useAuthGate();
  const [ids, setIds] = useState<Set<number>>(() => new Set());

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      setIds(new Set());
      return;
    }
    try {
      setIds(new Set(await getWishlistIds()));
    } catch {
      // The hearts simply stay empty; nothing else depends on this.
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: number) => {
      if (!isLoggedIn) {
        requireLogin(`${location.pathname}${location.search}`);
        return;
      }
      const wished = ids.has(productId);
      // Optimistic: the heart answers immediately, the server confirms.
      setIds((prev) => {
        const next = new Set(prev);
        if (wished) next.delete(productId);
        else next.add(productId);
        return next;
      });
      try {
        if (wished) {
          await removeWish(productId);
          toast(t("wishlist.removed"));
        } else {
          await addWish(productId);
          toast(t("wishlist.added"));
        }
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (wished) next.add(productId);
          else next.delete(productId);
          return next;
        });
        toast.error(t("wishlist.failed"));
      }
    },
    [ids, isLoggedIn, requireLogin, location.pathname, location.search, t],
  );

  const value = useMemo<WishlistValue>(
    () => ({ ids, count: ids.size, isWished: (id) => ids.has(id), toggle, refresh }),
    [ids, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

const EMPTY: WishlistValue = {
  ids: new Set(),
  count: 0,
  isWished: () => false,
  toggle: async () => {},
  refresh: async () => {},
};

export function useWishlist(): WishlistValue {
  return useContext(WishlistContext) ?? EMPTY;
}
