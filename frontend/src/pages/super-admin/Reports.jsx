import { useEffect, useState } from "react";
import {
  Wallet,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  DataTable,
  Loading,
} from "../../components/ui";
import { getReports } from "../../services/reportService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

function BarRows({ data }) {
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    return <p className="cell-sub">No data for this period.</p>;
  }
  const max = Math.max(...rows.map((r) => Number(r.value || 0)), 1);
  return (
    <div className="ui-form-grid">
      {rows.map((r, i) => {
        const pct = (Number(r.value || 0) / max) * 100;
        return (
          <div className="cell-primary" key={i}>
            <div className="cell-contact">
              <span className="cell-sub">{r.label}</span>
              <span className="ui-toolbar-spacer" />
              <span className="cell-title">
                {Number(r.value || 0).toLocaleString()}
              </span>
            </div>
            <span
              style={{
                display: "block",
                height: 8,
                borderRadius: 999,
                width: `${pct}%`,
                background: "var(--accent, #7c6cf5)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function CountRows({ data }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) {
    return <p className="cell-sub">No data available.</p>;
  }
  return (
    <div className="cell-contact">
      {entries.map(([key, value]) => (
        <span key={key}>
          <Badge tone="gray">{key}</Badge> {Number(value || 0).toLocaleString()}
        </span>
      ))}
    </div>
  );
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReport(data);
      setError("");
    } catch {
      setError("Unable to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = report?.totals || {};
  const membersByStatus = report?.membersByStatus || {};
  const topPlans = Array.isArray(report?.topPlans) ? report.topPlans : [];

  const planColumns = [
    { key: "name", header: "Plan", render: (p) => p.name },
    {
      key: "count",
      header: "Members",
      align: "right",
      render: (p) => Number(p.count || 0).toLocaleString(),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="ANALYTICS"
        title="Reports"
        subtitle="Platform-wide revenue and membership analytics."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {loading ? (
        <Card>
          <Loading label="Loading reports..." />
        </Card>
      ) : (
        <>
          <div className="ui-grid ui-grid--stats">
            <StatCard
              icon={Wallet}
              label="Total Revenue"
              value={money(totals.revenue)}
              tone="green"
            />
            <StatCard
              icon={Users}
              label="Total Members"
              value={Number(totals.members || 0).toLocaleString()}
              tone="blue"
            />
            <StatCard
              icon={UserCheck}
              label="Active Members"
              value={Number(membersByStatus.ACTIVE || 0).toLocaleString()}
              tone="purple"
            />
            <StatCard
              icon={UserX}
              label="Inactive Members"
              value={Number(membersByStatus.INACTIVE || 0).toLocaleString()}
              tone="gray"
            />
          </div>

          <div className="ui-grid ui-grid--cards">
            <Card title="Revenue" subtitle="Last 6 months">
              <BarRows data={report?.revenueByMonth} />
            </Card>

            <Card title="New Members" subtitle="Last 6 months">
              <BarRows data={report?.newMembersByMonth} />
            </Card>
          </div>

          <Card title="Top Plans" subtitle="By active members">
            <DataTable
              columns={planColumns}
              rows={topPlans}
              rowKey={(p) => p.name}
            />
          </Card>

          <div className="ui-grid ui-grid--cards">
            <Card title="Fee Status">
              <CountRows data={report?.feeStatus} />
            </Card>

            <Card title="Membership Status">
              <CountRows data={report?.membershipStatus} />
            </Card>
          </div>
        </>
      )}
    </MotionPage>
  );
}
