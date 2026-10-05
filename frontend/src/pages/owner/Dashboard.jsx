import { useEffect, useMemo, useState } from "react";
import { Building2, GitBranch, Users, Dumbbell, CreditCard } from "lucide-react";

import useAuth from "../../hooks/useAuth";
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
import { getDashboard } from "../../services/dashboardService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

const branchesOf = (g) => g.branchCount ?? g.branches ?? g.totalBranches;
const membersOf = (g) => g.memberCount ?? g.members ?? g.totalMembers;

export default function OwnerDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getDashboard();
        setStats(data.stats || null);
        setGyms(data.gyms || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasCounts = useMemo(
    () =>
      gyms.some(
        (g) => branchesOf(g) !== undefined || membersOf(g) !== undefined
      ),
    [gyms]
  );

  const columns = useMemo(() => {
    const cols = [
      {
        key: "name",
        header: "Name",
        render: (g) => (
          <div className="cell-primary">
            <span className="cell-title">{g.name}</span>
            {g.address && <span className="cell-sub">{g.address}</span>}
          </div>
        ),
      },
    ];

    if (hasCounts) {
      cols.push({
        key: "branches",
        header: "Branches",
        render: (g) => branchesOf(g) ?? 0,
      });
      cols.push({
        key: "members",
        header: "Members",
        render: (g) => membersOf(g) ?? 0,
      });
    } else {
      cols.push({
        key: "address",
        header: "Address",
        render: (g) => g.address || "—",
      });
    }

    cols.push({
      key: "status",
      header: "Status",
      render: (g) => (
        <Badge tone={g.status === "INACTIVE" ? "gray" : "green"}>
          {g.status || "ACTIVE"}
        </Badge>
      ),
    });

    return cols;
  }, [hasCounts]);

  return (
    <MotionPage>
      <PageHeader
        eyebrow="OVERVIEW"
        title="Owner Dashboard"
        subtitle={`Welcome back, ${user?.name || "Owner"}. Here's how your gyms are doing.`}
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {loading ? (
        <Loading label="Loading dashboard..." />
      ) : (
        <>
          <div className="ui-grid ui-grid--stats">
            <StatCard
              icon={Building2}
              label="Gyms"
              value={stats?.totalGyms || 0}
              tone="purple"
            />
            <StatCard
              icon={GitBranch}
              label="Branches"
              value={stats?.totalBranches || 0}
              tone="blue"
            />
            <StatCard
              icon={Users}
              label="Members"
              value={stats?.totalMembers || 0}
              tone="green"
            />
            <StatCard
              icon={Dumbbell}
              label="Trainers"
              value={stats?.totalTrainers || 0}
              tone="pink"
            />
            <StatCard
              icon={CreditCard}
              label="Revenue"
              value={money(stats?.revenue)}
              tone="amber"
            />
          </div>

          <Card
            title="Your Gyms"
            subtitle="All gyms you own, with their current status."
          >
            <DataTable
              columns={columns}
              rows={gyms}
              rowKey={(g) => g._id}
              empty={
                <EmptyState
                  icon={Building2}
                  title="No gyms assigned"
                  message="Your gyms are created by the platform administrator. Once assigned, they will appear here."
                />
              }
            />
          </Card>
        </>
      )}
    </MotionPage>
  );
}
