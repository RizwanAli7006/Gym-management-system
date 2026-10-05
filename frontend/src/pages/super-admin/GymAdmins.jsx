import { useEffect, useMemo, useState } from "react";
import { UserCog } from "lucide-react";

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
import { getGymAdmins } from "../../services/gymAdminService";

export default function GymAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getGymAdmins();
      setAdmins(data.admins || []);
      setError("");
    } catch {
      setError("Unable to load gym admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) ||
        a.gymName?.toLowerCase().includes(q)
    );
  }, [admins, search]);

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (a) => (
        <div className="cell-primary">
          <span className="cell-title">{a.name}</span>
          <span className="cell-sub">{a.email || "—"}</span>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (a) => a.phone || "—" },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <Badge tone={a.isActive ? "green" : "red"}>
          {a.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Gym Admins"
        subtitle="Owner and admin accounts across every gym."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search gym admins..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading gym admins..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(a) => a._id}
            empty={
              <EmptyState
                icon={UserCog}
                title="No gym admins found"
                message="Gym admin accounts will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
