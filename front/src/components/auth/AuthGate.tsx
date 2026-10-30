import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { useIsMobile } from "../ui/use-mobile";
import { Mark } from "../brand/BrandMark";
import { LoginForm } from "./LoginForm";
import { useTranslation } from "../../hooks/useTranslation";
import { USER_AUTH_CHANGE_EVENT } from "../../utils/constants";
import { currentSession, loginPath, safeNextPath, signupPath } from "../../utils/auth";

type AuthGateValue = {
  /** True when a member session exists (admin sessions do not count). */
  isLoggedIn: boolean;
  /**
   * Returns true when already signed in. Otherwise opens the login sheet,
   * remembers `next` (default: the current location) and returns false.
   */
  requireLogin: (next?: string) => boolean;
};

const AuthGateContext = createContext<AuthGateValue | null>(null);

/**
 * Just-in-time login. Guests can browse; the first account action opens a
 * login sheet in place (dialog on desktop, bottom drawer on phones) and the
 * flow continues to the intended page after signing in.
 */
export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [session, setSession] = useState(currentSession);
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setSession(currentSession());
    window.addEventListener(USER_AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(USER_AUTH_CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    setSession(currentSession());
  }, [location.pathname]);

  const isLoggedIn = session === "user";

  const requireLogin = useCallback(
    (target?: string) => {
      if (currentSession() === "user") return true;
      setNext(safeNextPath(target ?? `${location.pathname}${location.search}`));
      setOpen(true);
      return false;
    },
    [location.pathname, location.search],
  );

  const handleSuccess = () => {
    setOpen(false);
    setSession("user");
    navigate(next ?? "/");
  };

  const value = useMemo(() => ({ isLoggedIn, requireLogin }), [isLoggedIn, requireLogin]);

  const body = (
    <>
      <LoginForm onSuccess={handleSuccess} idPrefix="gate" autoFocus={!isMobile} />
      <p className="mt-5 text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link
          to={signupPath(next)}
          onClick={() => setOpen(false)}
          className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
        >
          {t("login.signupLink")}
        </Link>
      </p>
    </>
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
            <DrawerHeader className="px-6 pt-5 text-left">
              <Mark size="sm" />
              <DrawerTitle className="mt-4 text-xl font-medium">{t("auth.gate.title")}</DrawerTitle>
              <DrawerDescription>{t("auth.gate.description")}</DrawerDescription>
            </DrawerHeader>
            <div className="px-6 pb-8">{body}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-left">
              <Mark size="sm" />
              <DialogTitle className="mt-4 text-xl font-medium">{t("auth.gate.title")}</DialogTitle>
              <DialogDescription>{t("auth.gate.description")}</DialogDescription>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      )}
    </AuthGateContext.Provider>
  );
}

/** Access the login gate. Outside the provider it falls back to the login page. */
export function useAuthGate(): AuthGateValue {
  const ctx = useContext(AuthGateContext);
  const navigate = useNavigate();
  const location = useLocation();
  return useMemo(() => {
    if (ctx) return ctx;
    return {
      isLoggedIn: currentSession() === "user",
      requireLogin: (target?: string) => {
        if (currentSession() === "user") return true;
        navigate(loginPath(target ?? `${location.pathname}${location.search}`));
        return false;
      },
    };
  }, [ctx, navigate, location.pathname, location.search]);
}
