import { useEffect, useMemo, useState } from "react";
import { UserCog, Plus, Power } from "lucide-react";

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
  getGymAdmins,
  createGymAdmin,
  setGymAdminActive,
} from "../../services/gymAdminService";
import { getGyms } from "../../services/gymService";

const EMPTY = { name: "", email: "", phone: "", password: "", gymId: "" };

export default function GymAdmins() {
  const [admins, setAdmins] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [adminData, gymData] = await Promise.all([
        getGymAdmins(),
        getGyms(),
      ]);
      setAdmins(adminData.admins || []);
      setGyms(gymData.gyms || gymData.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load gym admins.");
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
        a.gymId?.name?.toLowerCase().includes(q)
    );
  }, [admins, search]);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.gymId) {
      setError("Please select a gym");
      return;
    }
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
      await createGymAdmin(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create gym admin");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (admin) => {
    try {
      await setGymAdminActive(admin._id, !admin.isActive);
      setAdmins((list) =>
        list.map((a) =>
          a._id === admin._id ? { ...a, isActive: !a.isActive } : a
        )
      );
    } catch {
      window.alert("Could not update gym admin");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (a) => (
        <div className="cell-primary">
          <span className="cell-title">{a.name}</span>
          <span className="cell-sub">{a.email}</span>
        </div>
      ),
    },
    { key: "gym", header: "Gym", render: (a) => a.gymId?.name || "—" },
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
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <div className="ui-table-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={Power}
            onClick={() => toggle(a)}
          >
            {a.isActive ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="PLATFORM"
        title="Gym Admins"
        subtitle="Create and manage admin accounts for your gyms."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Gym Admin
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
                title="No gym admins yet"
                message="Create a gym admin to delegate gym management."
                action={
                  <Button icon={Plus} onClick={openAdd}>
                    Add Gym Admin
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Add Gym Admin"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Create Gym Admin"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="ui-form-grid">
          {error && <div className="ui-alert ui-alert--error">{error}</div>}

          <FormField label="Gym" required>
            <select
              className="ui-input"
              value={form.gymId}
              onChange={change("gymId")}
            >
              <option value="">Select a gym</option>
              {gyms.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Admin Name" required>
            <input
              className="ui-input"
              value={form.name}
              onChange={change("name")}
              placeholder="e.g. Jordan Lee"
            />
          </FormField>

          <FormField label="Email" required>
            <input
              className="ui-input"
              type="email"
              value={form.email}
              onChange={change("email")}
              placeholder="admin@example.com"
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
