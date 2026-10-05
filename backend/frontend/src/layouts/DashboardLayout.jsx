import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "../components/common/Sidebar.jsx";
import Topbar from "../components/common/Topbar.jsx";
import useAuth from "../hooks/useAuth";

// Single shared shell for every role. The role prop selects the nav + portal
// copy; the signed-in user drives the profile chip.
export default function DashboardLayout({ role }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const effectiveRole = role || user?.role;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="super-admin-app">
      <Sidebar role={effectiveRole} onLogout={handleLogout} />

      <div className="sa-main">
        <Topbar user={user} role={effectiveRole} />

        <main className="sa-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
