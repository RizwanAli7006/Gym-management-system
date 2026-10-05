import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, CreditCard, UserCheck, UserX } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  DataTable,
  Loading,
  EmptyState,
} from "../../components/ui";
import { getReports } from "../../services/reportService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

function BarSeries({ series }) {
  const rows = series || [];
  if (rows.length === 0) {
    return <p className="cell-sub">No data for this period.</p>;
  }
  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <span className="cell-sub" style={{ width: 56, flexShrink: 0 }}>
            {r.label}
          </span>
          <div
            style={{
              flex: 1,
              height: 10,
              borderRadius: 999,
              background: "rgba(148,163,184,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((Number(r.value) || 0) / max) * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
              }}
            />
          </div>
          <span
            className="cell-title"
            style={{ width: 90, flexShrink: 0, textAlign: "right" }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const feeTone = (key) =>
  key === "PAID" ? "green" : key === "DUE" ? "amber" : "red";

const membershipTone = (key) =>
  key === "ACTIVE"
    ? "green"
    : key === "EXPIRING"
    ? "amber"
    : key === "EXPIRED"
    ? "red"
    : "gray";

function StatusChips({ data, tone }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) {
    return <p className="cell-sub">No data available.</p>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {entries.map(([key, count]) => (
        <Badge key={key} tone={tone(key)}>
          {key}: {count ?? 0}
        </Badge>
      ))}
    </div>
  );
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getReports();
        setReport(data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const planColumns = useMemo(
    () => [
      { key: "name", header: "Plan", render: (p) => p.name },
      { key: "count", header: "Members", align: "right", render: (p) => p.count ?? 0 },
    ],
    []
  );

  if (loading) {
    return (
      <MotionPage>
        <PageHeader
          eyebrow="ANALYTICS"
          title="Reports"
          subtitle="Performance and business insights across your gyms."
        />
        <Loading label="Loading reports..." />
      </MotionPage>
    );
  }

  if (error) {
    return (
      <MotionPage>
        <PageHeader
          eyebrow="ANALYTICS"
          title="Reports"
          subtitle="Performance and business insights across your gyms."
        />
        <div className="ui-alert ui-alert--error">{error}</div>
      </MotionPage>
    );
  }

  if (!report) {
    return (
      <MotionPage>
        <PageHeader
          eyebrow="ANALYTICS"
          title="Reports"
          subtitle="Performance and business insights across your gyms."
        />
        <EmptyState
          icon={BarChart3}
          title="No report data"
          message="There is nothing to report yet."
        />
      </MotionPage>
    );
  }

  const totals = report.totals || {};
  const membersByStatus = report.membersByStatus || {};

  return (
    <MotionPage>
      <PageHeader
        eyebrow="ANALYTICS"
        title="Reports"
        subtitle="Performance and business insights across your gyms."
      />

      <div className="ui-grid ui-grid--stats">
        <StatCard
          icon={CreditCard}
          label="Total Revenue"
          value={money(totals.revenue)}
          tone="amber"
        />
        <StatCard
          icon={Users}
          label="Total Members"
          value={totals.members || 0}
          tone="purple"
        />
        <StatCard
          icon={UserCheck}
          label="Active Members"
          value={membersByStatus.ACTIVE || 0}
          tone="green"
        />
        <StatCard
          icon={UserX}
          label="Inactive Members"
          value={membersByStatus.INACTIVE || 0}
          tone="pink"
        />
      </div>

      <div className="ui-grid ui-grid--cards">
        <Card title="Revenue" subtitle="Last 6 months">
          <BarSeries series={report.revenueByMonth} />
        </Card>

        <Card title="New Members" subtitle="Last 6 months">
          <BarSeries series={report.newMembersByMonth} />
        </Card>
      </div>

      <Card title="Top Plans" subtitle="Most popular membership plans">
        <DataTable
          columns={planColumns}
          rows={report.topPlans || []}
          rowKey={(p) => p._id || p.name}
          empty={
            <EmptyState
              icon={BarChart3}
              title="No plan data"
              message="Plan performance will appear here once members subscribe."
            />
          }
        />
      </Card>

      <div className="ui-grid ui-grid--cards">
        <Card title="Fee Status" subtitle="Payment status across members">
          <StatusChips data={report.feeStatus} tone={feeTone} />
        </Card>

        <Card title="Membership Status" subtitle="Membership lifecycle">
          <StatusChips data={report.membershipStatus} tone={membershipTone} />
        </Card>
      </div>
    </MotionPage>
  );
}
