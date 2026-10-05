import { useEffect, useMemo, useState } from "react";
import { GitBranch } from "lucide-react";

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
import { getBranches } from "../../services/branchService";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBranches();
      setBranches(data.branches || []);
      setError("");
    } catch {
      setError("Unable to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
    );
  }, [branches, search]);

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (b) => (
        <div className="cell-primary">
          <span className="cell-title">{b.name}</span>
          <span className="cell-sub">{b.gymId?.name || "—"}</span>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (b) => b.phone || "—" },
    { key: "email", header: "Email", render: (b) => b.email || "—" },
    { key: "address", header: "Address", render: (b) => b.address || "—" },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <Badge tone={b.status === "INACTIVE" ? "gray" : "green"}>
          {b.status || "Active"}
        </Badge>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="NETWORK"
        title="Branches"
        subtitle="All branches across gyms on the platform."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search branches..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading branches..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(b) => b._id}
            empty={
              <EmptyState
                icon={GitBranch}
                title="No branches found"
                message="Branches created by gyms will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
