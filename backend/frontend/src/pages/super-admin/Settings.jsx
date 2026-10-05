import MotionPage from "../../components/common/MotionPage.jsx";
import { PageHeader, Card } from "../../components/ui";
import useAuth from "../../hooks/useAuth";

function Row({ label, value }) {
  return (
    <div className="cell-contact">
      <span className="cell-sub">{label}</span>
      <span className="ui-toolbar-spacer" />
      <span className="cell-title">{value || "—"}</span>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();

  return (
    <MotionPage>
      <PageHeader
        eyebrow="ACCOUNT"
        title="Settings"
        subtitle="Your account details and product information."
      />

      <div className="ui-grid ui-grid--cards">
        <Card title="Account" subtitle="Your signed-in profile.">
          <div className="ui-form-grid">
            <Row label="Name" value={user?.name} />
            <Row label="Email" value={user?.email} />
            <Row label="Role" value={user?.role} />
          </div>
        </Card>

        <Card title="About">
          <div className="ui-form-grid">
            <Row label="Product" value="GymPro" />
            <p className="cell-sub">
              GymPro is a multi-gym management platform for running branches,
              members, trainers, plans and payments from one place.
            </p>
          </div>
        </Card>
      </div>
    </MotionPage>
  );
}
