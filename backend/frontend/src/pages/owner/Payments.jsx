import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  DataTable,
  Toolbar,
  SearchBox,
  Loading,
  EmptyState,
} from "../../components/ui";
import { getPayments, getPaymentStats } from "../../services/paymentService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

const statusTone = (s) => {
  switch (s) {
    case "PAID":
      return "green";
    case "PENDING":
      return "amber";
    case "FAILED":
      return "red";
    case "REFUNDED":
      return "gray";
    default:
      return "gray";
  }
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await getPayments();
        const data = response.payments || response.data || response;
        setPayments(Array.isArray(data) ? data : []);

        try {
          const s = await getPaymentStats();
          setStats(s || null);
        } catch {
          setStats(null);
        }
      } catch {
        setError("Unable to load payments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalRevenue = useMemo(() => {
    if (!stats) return null;
    return stats.totalRevenue ?? stats.revenue ?? stats.stats?.revenue ?? null;
  }, [stats]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      p.customerId?.name?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (p) => (
        <div className="cell-primary">
          <span className="cell-title">{p.customerId?.name || "—"}</span>
          {p.customerId?.memberId && (
            <span className="cell-sub">{p.customerId.memberId}</span>
          )}
        </div>
      ),
    },
    { key: "amount", header: "Amount", render: (p) => money(p.amount) },
    {
      key: "method",
      header: "Method",
      render: (p) => <Badge tone="gray">{p.method || "—"}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <Badge tone={statusTone(p.status)}>{p.status || "—"}</Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (p) => fmtDate(p.paidAt || p.createdAt),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="FINANCE"
        title="Payments"
        subtitle="Member payments and transactions across your gyms."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {totalRevenue != null && (
        <div className="ui-grid ui-grid--stats">
          <StatCard
            icon={CreditCard}
            label="Total Revenue"
            value={money(totalRevenue)}
            tone="amber"
          />
        </div>
      )}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by member name..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading payments..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(p) => p._id}
            empty={
              <EmptyState
                icon={CreditCard}
                title="No payments found"
                message="Payment records will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
