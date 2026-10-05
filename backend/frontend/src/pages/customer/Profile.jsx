import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  Loading,
  EmptyState,
} from "../../components/ui";
import { getMyProfile } from "../../services/customerService";

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const Row = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
      padding: "0.7rem 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}
  >
    <span className="cell-sub">{label}</span>
    <span className="cell-title" style={{ textAlign: "right" }}>
      {value || "—"}
    </span>
  </div>
);

export default function Profile() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyProfile();
        if (!active) return;
        setCustomer(data.customer || null);
      } catch (err) {
        if (!active) return;
        setError(
          err.response?.data?.message || "Unable to load your profile."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <MotionPage>
      <PageHeader
        eyebrow="MEMBER"
        title="My Profile"
        subtitle="Your personal information."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {loading ? (
        <Loading label="Loading profile..." />
      ) : !customer ? (
        <Card>
          <EmptyState
            icon={UserCircle}
            title="No profile found"
            message="Your gym has not linked a member profile to this account yet."
          />
        </Card>
      ) : (
        <Card title="Personal Information" subtitle={customer.name || "—"}>
          <Row label="Name" value={customer.name} />
          <Row label="Email" value={customer.email} />
          <Row label="Phone" value={customer.phone} />
          <Row label="Gender" value={customer.gender} />
          <Row label="Date of Birth" value={fmtDate(customer.dateOfBirth)} />
          <Row label="Address" value={customer.address} />
          <Row
            label="Emergency Contact"
            value={customer.emergencyContactName}
          />
          <Row
            label="Emergency Phone"
            value={customer.emergencyContactPhone}
          />
        </Card>
      )}
    </MotionPage>
  );
}
