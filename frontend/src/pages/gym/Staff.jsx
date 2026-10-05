import { useEffect, useMemo, useState } from "react";
import { UserCog, Plus, Trash2, Power } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  DataTable,
  Badge,
  Button,
  Modal,
  Toolbar,
  SearchBox,
  FormField,
  Loading,
  EmptyState,
} from "../../components/ui";
import {
  getUsers,
  createUser,
  updateUserStatus,
  deleteUser,
} from "../../services/userService";

const ROLES = ["MANAGER", "STAFF", "TRAINER"];
const EMPTY = { name: "", email: "", phone: "", password: "", role: "STAFF" };

const roleTone = (role) =>
  role === "MANAGER" ? "purple" : role === "TRAINER" ? "blue" : "gray";

export default function GymStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setStaff(data.users || []);
    } catch {
      setError("Unable to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [staff, search]);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Name, email and password are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createUser(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create staff member");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (user) => {
    try {
      await updateUserStatus(user._id, !user.isActive);
      setStaff((list) =>
        list.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch {
      window.alert("Could not update status");
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete staff member "${user.name}"?`)) return;
    try {
      await deleteUser(user._id);
      setStaff((list) => list.filter((u) => u._id !== user._id));
    } catch {
      window.alert("Could not delete staff member");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div className="cell-primary">
          <span className="cell-title">{u.name}</span>
          <span className="cell-sub">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => <Badge tone={roleTone(u.role)}>{u.role}</Badge>,
    },
    { key: "phone", header: "Phone", render: (u) => u.phone || "—" },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <Badge tone={u.isActive ? "green" : "red"}>
          {u.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <div className="ui-table-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={Power}
            onClick={() => toggle(u)}
          >
            {u.isActive ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => remove(u)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="TEAM"
        title="Staff"
        subtitle="Create and manage managers, staff and trainer accounts."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Staff
          </Button>
        }
      />

      {error && !modalOpen && (
        <div className="ui-alert ui-alert--error">{error}</div>
      )}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search staff..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading staff..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(u) => u._id}
            empty={
              <EmptyState
                icon={UserCog}
                title="No staff yet"
                message="Add managers, staff or trainers for your gym."
                action={
                  <Button icon={Plus} onClick={openAdd}>
                    Add Staff
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Add Staff Member"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Create Account"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="ui-form-grid">
          {error && <div className="ui-alert ui-alert--error">{error}</div>}

          <FormField label="Full Name" required>
            <input
              className="ui-input"
              value={form.name}
              onChange={change("name")}
              placeholder="e.g. Jordan Lee"
            />
          </FormField>

          <FormField label="Role" required>
            <select className="ui-input" value={form.role} onChange={change("role")}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Email" required>
            <input
              className="ui-input"
              type="email"
              value={form.email}
              onChange={change("email")}
              placeholder="staff@example.com"
            />
          </FormField>

          <FormField label="Phone">
            <input
              className="ui-input"
              value={form.phone}
              onChange={change("phone")}
              placeholder="Phone number"
            />
          </FormField>

          <FormField label="Password" required hint="Minimum 6 characters">
            <input
              className="ui-input"
              type="password"
              value={form.password}
              onChange={change("password")}
              placeholder="Set a password"
            />
          </FormField>
        </form>
      </Modal>
    </MotionPage>
  );
}
