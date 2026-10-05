import { useEffect, useMemo, useState } from "react";
import { CreditCard, Trash2, Wallet, Receipt } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
  Card,
  DataTable,
  Badge,
  Button,
  Toolbar,
  SearchBox,
  Loading,
  EmptyState,
} from "../../components/ui";
import {
  getPayments,
  getPaymentStats,
  deletePayment,
} from "../../services/paymentService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

const statusTone = (status) => {
  switch (status) {
    case "PAID":
      return "green";
    case "PENDING":
      return "amber";
    case "FAILED":
      return "red";
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

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPayments();
      setPayments(data.payments || []);
      setError("");
    } catch {
      setError("Unable to load payments");
    } finally {
      setLoading(false);
    }
    try {
      const data = await getPaymentStats();
      setStats(data.stats || null);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.customerId?.name?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalRevenue = useMemo(() => {
    const fromStats = stats?.totalRevenue ?? stats?.total;
    if (fromStats != null) return Number(fromStats);
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [stats, payments]);

  const totalCount = stats?.count ?? payments.length;

  const remove = async (payment) => {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      await deletePayment(payment._id);
      setPayments((list) => list.filter((p) => p._id !== payment._id));
    } catch {
      window.alert("Could not delete payment");
    }
  };

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (p) => (
        <div className="cell-primary">
          <span className="cell-title">{p.customerId?.name || "—"}</span>
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
    { key: "date", header: "Date", render: (p) => fmtDate(p.paidAt) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="ui-table-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => remove(p)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="FINANCE"
        title="Payments"
        subtitle="All payment records across the platform."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {!loading && (
        <div className="ui-grid ui-grid--stats">
          <StatCard
            icon={Wallet}
            label="Total Revenue"
            value={money(totalRevenue)}
            tone="green"
          />
          <StatCard
            icon={Receipt}
            label="Payments"
            value={Number(totalCount || 0).toLocaleString()}
            tone="blue"
          />
        </div>
      )}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by member, method or status..."
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
