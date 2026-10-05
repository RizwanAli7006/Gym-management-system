import { useEffect, useState } from "react";
import { ShieldCheck, CreditCard, CalendarCheck, Clock } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
  Card,
  Loading,
} from "../../components/ui";
import { getDashboard } from "../../services/dashboardService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function CustomerDashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboard();
        setProfile(data.profile || null);
        setStats(data.stats || null);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const membershipStatus = stats?.membershipStatus || "NONE";
  const statusTone =
    membershipStatus === "ACTIVE"
      ? "green"
      : membershipStatus === "EXPIRED"
      ? "amber"
      : "purple";

  return (
    <MotionPage>
      <PageHeader
        eyebrow="MEMBER"
        title="Dashboard"
        subtitle="Your gym account overview."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {loading ? (
        <Loading label="Loading dashboard..." />
      ) : (
        <>
          <div className="ui-grid ui-grid--stats">
            <StatCard
              icon={ShieldCheck}
              label="Membership"
              value={membershipStatus}
              tone={statusTone}
            />
            <StatCard
              icon={CreditCard}
              label="Total Payments"
              value={money(stats?.totalPayments)}
              tone="amber"
            />
            <StatCard
              icon={CalendarCheck}
              label="Check-ins"
              value={stats?.totalCheckIns ?? 0}
              tone="green"
            />
            <StatCard
              icon={Clock}
              label="Last Payment"
              value={fmtDate(stats?.lastPaymentAt)}
              tone="blue"
            />
          </div>

          <Card title={`Welcome, ${profile?.name || "Member"}`}>
            <p>
              {profile
                ? "Here is a snapshot of your membership, payments and gym activity. Use the menu to view the full details."
                : "Your gym has not linked a member profile to this account yet. Once they do, your membership details will appear here."}
            </p>
          </Card>
        </>
      )}
    </MotionPage>
  );
}
