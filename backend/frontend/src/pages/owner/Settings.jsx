import { ShieldCheck } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
} from "../../components/ui";
import useAuth from "../../hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <MotionPage>
      <PageHeader
        eyebrow="ACCOUNT"
        title="Settings"
        subtitle="Your account details on GymPro."
      />

      {!user ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="Not signed in"
            message="Sign in to view your account details."
          />
        </Card>
      ) : (
        <>
          <Card title="Account" subtitle="Your signed-in profile">
            <div className="ui-form-grid">
              <div className="cell-primary">
                <span className="cell-sub">Name</span>
                <span className="cell-title">{user.name || "—"}</span>
              </div>
              <div className="cell-primary">
                <span className="cell-sub">Email</span>
                <span className="cell-title">{user.email || "—"}</span>
              </div>
              <div className="cell-primary">
                <span className="cell-sub">Role</span>
                <span className="cell-title">
                  <Badge tone="purple">{user.role || "—"}</Badge>
                </span>
              </div>
            </div>
          </Card>

          <Card title="About" subtitle="Platform information">
            <div className="ui-form-grid">
              <div className="cell-primary">
                <span className="cell-sub">Product</span>
                <span className="cell-title">GymPro</span>
              </div>
              <div className="cell-primary">
                <span className="cell-sub">Description</span>
                <span className="cell-title">
                  Role-based gym management platform.
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </MotionPage>
  );
}
