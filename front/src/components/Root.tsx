import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Toaster } from "./ui/sonner";

/** New page, top of the page; a hash link keeps scrolling to its target. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function Root() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
      <Toaster position="top-right" />
    </>
  );
}
