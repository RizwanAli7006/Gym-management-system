import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { roleHome } from "../../utils/roles";

function AuthLoading() {
  return (
    <div className="app-loading">
      <div className="app-loading-spinner" />
      <span>Loading...</span>
    </div>
  );
}

// Role gate for a protected route tree.
//  - still loading      -> spinner
//  - not authenticated  -> /login
//  - wrong role         -> redirect to the user's own dashboard
//  - allowed            -> render the layout (children) / nested Outlet
export default function RoleRoute({ allow = [], children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children ? children : <Outlet />;
}
