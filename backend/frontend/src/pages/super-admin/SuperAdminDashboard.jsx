import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  GitBranch,
  Users,
  Wallet,
  Plus,
  MapPin,
  UserPlus,
  Dumbbell,
  ArrowUpRight,
  Activity,
} from "lucide-react";

import StatCard from "../../components/super-admin/StatCard.jsx";
import GymCard from "../../components/super-admin/GymCard.jsx";
import QuickAction from "../../components/super-admin/QuickAction.jsx";

import { getDashboard } from "../../services/dashboardService";
import { getGyms } from "../../services/gymService";
import useAuth from "../../hooks/useAuth";
import MotionPage from "../../components/common/MotionPage";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80";

const formatMoney = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return `Rs. ${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `Rs. ${(v / 1000).toFixed(1)}K`;
  return `Rs. ${v}`;
};

const formatCount = (n) => {
  const v = Number(n || 0);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return `${v}`;
};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// PLACEHOLDER_COMPONENT
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [recentGyms, setRecentGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, gymList] = await Promise.all([
          getDashboard(),
          getGyms(),
        ]);

        setStats(dash.stats || null);
        setRecentGyms(dash.recentGyms || []);
        setGyms(gymList.gyms || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="sa-dashboard">
        <div className="app-loading">
          <div className="app-loading-spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <MotionPage className="sa-dashboard">
      {error && <div className="dashboard-message">{error}</div>}

      <section className="sa-welcome">
        <div>
          <span className="sa-eyebrow">SUPER ADMIN CONTROL CENTER</span>

          <h1>Good to see you, {user?.name || "Super Admin"}!</h1>

          <p>
            Here's what's happening across all gyms and branches today.
          </p>
        </div>

        <div className="sa-date">
          <span>{todayLabel()}</span>
          <strong>System Overview</strong>
        </div>
      </section>

      <section className="sa-stats-grid">
        <StatCard
          icon={<Building2 size={23} />}
          title="Total Gyms"
          value={formatCount(stats?.totalGyms)}
          change="Across the platform"
          color="purple"
        />

        <StatCard
          icon={<GitBranch size={23} />}
          title="Total Branches"
          value={formatCount(stats?.totalBranches)}
          change="All gym branches"
          color="green"
        />

        <StatCard
          icon={<Users size={23} />}
          title="Total Members"
          value={formatCount(stats?.totalMembers)}
          change="Registered members"
          color="blue"
        />

        <StatCard
          icon={<Wallet size={23} />}
          title="Total Revenue"
          value={formatMoney(stats?.revenue)}
          change="Collected payments"
          color="pink"
        />
      </section>

      <section className="sa-main-grid">
        <div className="sa-large-column">
          <div className="sa-panel">
            <div className="sa-panel-heading">
              <div>
                <h2>All Gyms</h2>
                <p>Manage every gym on your platform</p>
              </div>

              <button
                className="sa-text-btn"
                onClick={() => navigate("/super-admin/gyms")}
              >
                View All
                <ArrowUpRight size={16} />
              </button>
            </div>

            {gyms.length === 0 ? (
              <div className="empty-state">
                <h3>No gyms yet</h3>
                <p>Create your first gym and its owner to get started.</p>
              </div>
            ) : (
              <div className="sa-gym-grid">
                {gyms.slice(0, 6).map((gym) => (
                  <GymCard
                    key={gym._id}
                    name={gym.name}
                    location={gym.address || "No address"}
                    image={gym.logo || FALLBACK_IMG}
                    status={gym.status}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="sa-right-column">
          <div className="sa-panel quick-panel">
            <div className="sa-panel-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Common management tasks</p>
              </div>
            </div>

            <div className="sa-actions">
              <QuickAction
                icon={<Plus size={19} />}
                title="Add New Gym"
                color="purple"
                onClick={() => navigate("/super-admin/gyms")}
              />

              <QuickAction
                icon={<MapPin size={19} />}
                title="View Branches"
                color="blue"
                onClick={() => navigate("/super-admin/branches")}
              />

              <QuickAction
                icon={<UserPlus size={19} />}
                title="View Members"
                color="green"
                onClick={() => navigate("/super-admin/members")}
              />

              <QuickAction
                icon={<Dumbbell size={19} />}
                title="View Trainers"
                color="orange"
                onClick={() => navigate("/super-admin/trainers")}
              />
            </div>
          </div>

          <div className="sa-panel">
            <div className="sa-panel-heading">
              <div>
                <h2>Recently Added Gyms</h2>
                <p>Latest gyms on the platform</p>
              </div>
            </div>

            <div className="sa-activity-list">
              {recentGyms.length === 0 ? (
                <div className="empty-state">
                  <p>No recent gyms.</p>
                </div>
              ) : (
                recentGyms.map((gym) => (
                  <div className="sa-activity" key={gym._id}>
                    <div className="sa-activity-icon gym">
                      <Activity size={17} />
                    </div>

                    <div className="sa-activity-content">
                      <strong>{gym.name}</strong>
                      <span>
                        Owner: {gym.owner?.name || "Unassigned"}
                      </span>
                    </div>

                    <small>{gym.status}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </MotionPage>
  );
}

