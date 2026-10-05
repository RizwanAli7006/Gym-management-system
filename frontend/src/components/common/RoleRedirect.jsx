import { Navigate } from "react-router-dom";
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

// Sends the user from "/" (or any unmatched path) to the right place:
// their role dashboard when logged in, otherwise the login page.
export default function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={roleHome(user.role)} replace />;
}
