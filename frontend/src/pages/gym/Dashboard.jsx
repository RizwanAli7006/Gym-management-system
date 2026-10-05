import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Dumbbell,
  GitBranch,
  CreditCard,
  CalendarCheck,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
  Loading,
} from "../../components/ui";
import { getDashboard } from "../../services/dashboardService";

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

export default function GymDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboard();
        setStats(data.stats || null);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <MotionPage>
      <PageHeader
        eyebrow="GYM ADMIN"
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || "Gym Administrator"}. Here's what's happening in your gym.`}
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {loading ? (
        <Loading label="Loading dashboard..." />
      ) : (
        <div className="ui-grid ui-grid--stats">
          <StatCard
            icon={Users}
            label="Members"
            value={stats?.totalMembers ?? 0}
            tone="purple"
          />
          <StatCard
            icon={UserCheck}
            label="Active"
            value={stats?.activeMembers ?? 0}
            tone="green"
          />
          <StatCard
            icon={Dumbbell}
            label="Trainers"
            value={stats?.totalTrainers ?? 0}
            tone="pink"
          />
          <StatCard
            icon={GitBranch}
            label="Branches"
            value={stats?.totalBranches ?? 0}
            tone="blue"
          />
          <StatCard
            icon={CreditCard}
            label="Revenue"
            value={money(stats?.revenue)}
            tone="amber"
          />
          <StatCard
            icon={CalendarCheck}
            label="Check-ins Today"
            value={stats?.checkInsToday ?? 0}
            tone="green"
          />
        </div>
      )}
    </MotionPage>
  );
}
