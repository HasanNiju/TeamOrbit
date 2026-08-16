import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  return (
    <div className="app-shell app-shell--with-nav">
      <AppHeader />
      <Outlet />
      <BottomNav />
    </div>
  );
}
