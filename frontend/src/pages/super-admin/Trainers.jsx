import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Mail, Phone } from "lucide-react";

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
import { getTrainers } from "../../services/trainerService";

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTrainers();
      setTrainers(data.trainers || []);
      setError("");
    } catch {
      setError("Unable to load trainers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.specialization?.toLowerCase().includes(q)
    );
  }, [trainers, search]);

  const columns = [
    {
      key: "name",
      header: "Trainer",
      render: (t) => (
        <div className="cell-primary">
          <span className="cell-title">{t.name}</span>
          {t.specialization && (
            <span className="cell-sub">{t.specialization}</span>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (t) => (
        <div className="cell-contact">
          {t.email && (
            <span>
              <Mail size={13} /> {t.email}
            </span>
          )}
          {t.phone && (
            <span>
              <Phone size={13} /> {t.phone}
            </span>
          )}
          {!t.email && !t.phone && <span className="cell-sub">—</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Badge tone={t.status === "INACTIVE" ? "gray" : "green"}>
          {t.status || "ACTIVE"}
        </Badge>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="TEAM"
        title="Trainers"
        subtitle="All trainers across every gym on the platform."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search trainers..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading trainers..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(t) => t._id}
            empty={
              <EmptyState
                icon={Dumbbell}
                title="No trainers found"
                message="Trainers added by gyms will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
