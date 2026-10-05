import { ROLE_LABELS, portalFor } from "../../utils/nav";

// Shared sticky topbar. Shows the portal heading on the left and the real
// signed-in user on the right. No fake search / notification controls.
export default function Topbar({ user, role }) {
  const portal = portalFor(role);
  const name = user?.name || "User";
  const initial = name.charAt(0).toUpperCase();
  const roleLabel = ROLE_LABELS[user?.role] || portal.eyebrow;

  return (
    <header className="sa-header">
      <div className="topbar-title">
        <span className="sa-eyebrow">{portal.eyebrow}</span>
        <h1>{portal.heading}</h1>
      </div>

      <div className="sa-header-right">
        <div className="sa-profile">
          <div className="sa-avatar">{initial}</div>

          <div className="sa-profile-info">
            <strong>{name}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
