import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  Badge,
  Loading,
  EmptyState,
} from "../../components/ui";
import { getMyProfile } from "../../services/customerService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const feeTone = (s) =>
  s === "PAID" ? "green" : s === "OVERDUE" ? "red" : "amber";

const statusTone = (s) =>
  s === "ACTIVE" ? "green" : s === "EXPIRED" ? "red" : "amber";

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
      {value}
    </span>
  </div>
);

export default function Membership() {
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
          err.response?.data?.message || "Unable to load your membership."
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
        title="My Membership"
        subtitle="Your current plan and fee details."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {loading ? (
        <Loading label="Loading membership..." />
      ) : !customer ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="No membership profile"
            message="Your gym has not linked a member profile to this account yet."
          />
        </Card>
      ) : (
        <Card title="Membership Details" subtitle={customer.membershipPlan || "—"}>
          <Row label="Plan" value={customer.membershipPlan || "—"} />
          <Row
            label="Status"
            value={
              <Badge tone={statusTone(customer.membershipStatus)}>
                {customer.membershipStatus || "—"}
              </Badge>
            }
          />
          <Row label="Start Date" value={fmtDate(customer.membershipStartDate)} />
          <Row
            label="Expiry Date"
            value={fmtDate(customer.membershipExpiryDate)}
          />
          <Row label="Monthly Fee" value={money(customer.monthlyFee)} />
          <Row
            label="Fee Status"
            value={
              <Badge tone={feeTone(customer.feeStatus)}>
                {customer.feeStatus || "DUE"}
              </Badge>
            }
          />
        </Card>
      )}
    </MotionPage>
  );
}
