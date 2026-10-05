import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  DataTable,
  Badge,
  Loading,
  EmptyState,
} from "../../components/ui";
import { getMyProfile } from "../../services/customerService";

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyProfile();
        if (!active) return;
        setAttendance(data.attendance || []);
      } catch (err) {
        if (!active) return;
        setError(
          err.response?.data?.message || "Unable to load your attendance."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (r) => fmtDate(r.date),
    },
    {
      key: "in",
      header: "Check In",
      render: (r) => fmtTime(r.checkIn),
    },
    {
      key: "out",
      header: "Check Out",
      render: (r) => fmtTime(r.checkOut),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.checkOut ? (
          <Badge tone="gray">Completed</Badge>
        ) : (
          <Badge tone="green">On site</Badge>
        ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="MEMBER"
        title="My Attendance"
        subtitle="Your gym check-in history."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        {loading ? (
          <Loading label="Loading attendance..." />
        ) : (
          <DataTable
            columns={columns}
            rows={attendance}
            rowKey={(r) => r._id}
            empty={
              <EmptyState
                icon={CalendarCheck}
                title="No attendance records"
                message="Your attendance history will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
