import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, LogIn, LogOut } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  DataTable,
  Badge,
  Button,
  Toolbar,
  SearchBox,
  Loading,
  EmptyState,
} from "../../components/ui";
import {
  getAttendance,
  checkIn,
  checkOut,
} from "../../services/attendanceService";
import { getCustomers } from "../../services/customerService";

const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function GymAttendance() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [att, cust] = await Promise.all([
        getAttendance(),
        getCustomers(),
      ]);
      setRecords(att.attendance || []);
      setCustomers(cust.customers || []);
    } catch {
      setError("Unable to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      r.customerId?.name?.toLowerCase().includes(q)
    );
  }, [records, search]);

  const mark = async () => {
    if (!selected) {
      setError("Select a member to check in");
      return;
    }
    setMarking(true);
    setError("");
    try {
      await checkIn({ customerId: selected });
      setSelected("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Check-in failed");
    } finally {
      setMarking(false);
    }
  };

  const close = async (record) => {
    try {
      await checkOut(record._id);
      await load();
    } catch {
      window.alert("Check-out failed");
    }
  };

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (r) => (
        <div className="cell-primary">
          <span className="cell-title">{r.customerId?.name || "Unknown"}</span>
          {r.customerId?.memberId && (
            <span className="cell-sub">{r.customerId.memberId}</span>
          )}
        </div>
      ),
    },
    { key: "date", header: "Date", render: (r) => r.date },
    { key: "in", header: "Check In", render: (r) => fmtTime(r.checkIn) },
    { key: "out", header: "Check Out", render: (r) => fmtTime(r.checkOut) },
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
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        r.checkOut ? null : (
          <div className="ui-table-actions">
            <Button
              variant="ghost"
              size="sm"
              icon={LogOut}
              onClick={() => close(r)}
            >
              Check Out
            </Button>
          </div>
        ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="ACTIVITY"
        title="Attendance"
        subtitle="Record member check-ins and check-outs."
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card title="Check In a Member" className="attendance-checkin">
        <div className="checkin-row">
          <select
            className="ui-input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Select member...</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {c.memberId ? ` (${c.memberId})` : ""}
              </option>
            ))}
          </select>

          <Button icon={LogIn} onClick={mark} disabled={marking}>
            {marking ? "Recording..." : "Check In"}
          </Button>
        </div>
      </Card>

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search members..."
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
                message="Check in a member to see activity here."
              />
            }
          />
        )}
      </Card>
    </MotionPage>
  );
}
