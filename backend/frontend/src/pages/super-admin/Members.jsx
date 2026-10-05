import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";

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
import { getCustomers } from "../../services/customerService";

const membershipTone = (status) => {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "EXPIRING":
      return "amber";
    case "EXPIRED":
      return "red";
    default:
      return "gray";
  }
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setMembers(data.customers || []);
      setError("");
    } catch {
      setError("Unable to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const columns = [
    {
      key: "name",
      header: "Member",
      render: (m) => (
        <div className="cell-primary">
          <span className="cell-title">{m.name}</span>
          <span className="cell-sub">{m.memberId || "—"}</span>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (m) => m.phone || "—" },
    {
      key: "plan",
      header: "Plan",
      render: (m) => m.membershipPlan || "—",
    },
    {
      key: "membership",
      header: "Membership",
      render: (m) => (
        <Badge tone={membershipTone(m.membershipStatus)}>
          {m.membershipStatus || "NONE"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <Badge tone={m.status === "INACTIVE" ? "gray" : "green"}>
          {m.status || "ACTIVE"}
        </Badge>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="MEMBERS"
        title="Members"
        subtitle="All members registered across every gym."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by name, member ID or phone..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading members..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(m) => m._id}
            empty={
              <EmptyState
                icon={Users}
                title="No members found"
                message="Members added by gyms will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
