import { NavLink } from "react-router-dom";
import { LogOut, Dumbbell } from "lucide-react";
import { navFor, portalFor } from "../../utils/nav";

// Shared, role-driven sidebar. Reuses the polished .sa-* shell styles and
// renders its items from the per-role config in utils/nav.js.
export default function Sidebar({ role, onLogout }) {
  const items = navFor(role);
  const portal = portalFor(role);

  return (
    <aside className="sa-sidebar">
      <div className="sa-brand">
        <div className="sa-brand-icon">
          <Dumbbell size={22} />
        </div>

        <div>
          <h2>{portal.title}</h2>
          <span>{portal.subtitle}</span>
        </div>

        <span className="sa-brand-badge">{portal.badge}</span>
      </div>

      <nav className="sa-nav">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sa-nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sa-sidebar-bottom">
        <div className="sa-help-card">
          <div className="sa-help-icon">?</div>

          <div>
            <strong>Need Help?</strong>
            <span>support@gympro.com</span>
          </div>
        </div>

        <button className="sa-logout" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
