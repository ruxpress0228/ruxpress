import { useEffect, useState } from "react";
import Home from "./Home";
import Landing from "./Landing";
import { currentSession } from "../../utils/auth";
import { USER_AUTH_CHANGE_EVENT } from "../../utils/constants";

/** `/` shows the member dashboard when signed in and the public landing otherwise. */
export default function HomeIndex() {
  const [session, setSession] = useState(currentSession);

  useEffect(() => {
    const sync = () => setSession(currentSession());
    window.addEventListener(USER_AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(USER_AUTH_CHANGE_EVENT, sync);
  }, []);

  return session === "user" ? <Home /> : <Landing />;
}
