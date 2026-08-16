import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  return (
    <div className="app-shell app-shell--with-nav">
      <Outlet />
      <BottomNav />
    </div>
  );
}
