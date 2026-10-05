import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  DataTable,
  Badge,
  Toolbar,
  SearchBox,
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

const statusTone = (s) =>
  s === "PAID"
    ? "green"
    : s === "PENDING"
    ? "amber"
    : s === "FAILED"
    ? "red"
    : "gray";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyProfile();
        if (!active) return;
        setPayments(data.payments || []);
      } catch (err) {
        if (!active) return;
        setError(
          err.response?.data?.message || "Unable to load your payments."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.method?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const columns = [
    {
      key: "amount",
      header: "Amount",
      render: (p) => money(p.amount),
    },
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
      render: (p) => fmtDate(p.paidAt),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="MEMBER"
        title="My Payments"
        subtitle="Your payment history."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search payments..."
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
                title="No payment records"
                message="Your payment history will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
