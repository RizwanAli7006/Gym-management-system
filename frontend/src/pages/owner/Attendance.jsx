import { useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  Badge,
  DataTable,
  Toolbar,
  SearchBox,
  Loading,
  EmptyState,
} from "../../components/ui";
import { getAttendance } from "../../services/attendanceService";

const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAttendance();
        setRecords(data.attendance || []);
      } catch {
        setError("Unable to load attendance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      r.customerId?.name?.toLowerCase().includes(q)
    );
  }, [records, search]);

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (r) => (
        <div className="cell-primary">
          <span className="cell-title">{r.customerId?.name || "—"}</span>
          {r.customerId?.memberId && (
            <span className="cell-sub">{r.customerId.memberId}</span>
          )}
        </div>
      ),
    },
    { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
    { key: "checkIn", header: "Check In", render: (r) => fmtTime(r.checkIn) },
    { key: "checkOut", header: "Check Out", render: (r) => fmtTime(r.checkOut) },
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
        eyebrow="ACTIVITY"
        title="Attendance"
        subtitle="Member check-ins and check-outs across your gyms."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by member name..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading attendance..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r._id}
            empty={
              <EmptyState
                icon={CalendarCheck}
                title="No attendance records"
                message="Member check-ins will appear here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
