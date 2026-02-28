import { Outlet } from "react-router";
import { Toaster } from "./ui/sonner";

export default function Root() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  );
}
