import { useEffect, useMemo, useState } from "react";
import { Building2, Plus } from "lucide-react";

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
import { getGyms, createGym } from "../../services/gymService";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  address: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
};

export default function Gyms() {
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
      const data = await getGyms();
      setGyms(data.gyms || data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your gyms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gyms;
    return gyms.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.address?.toLowerCase().includes(q)
    );
  }, [gyms, search]);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Gym name is required");
      return;
    }
    if (!form.ownerName.trim() || !form.ownerEmail.trim() || !form.ownerPassword) {
      setError("Owner name, email and password are required");
      return;
    }
    if (form.ownerPassword.length < 6) {
      setError("Owner password must be at least 6 characters");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createGym(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create gym");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (g) => (
        <div className="cell-primary">
          <span className="cell-title">{g.name}</span>
          {g.email && <span className="cell-sub">{g.email}</span>}
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (g) => g.phone || "—" },
    { key: "address", header: "Address", render: (g) => g.address || "—" },
    {
      key: "status",
      header: "Status",
      render: (g) => (
        <Badge tone={g.status === "INACTIVE" ? "gray" : "green"}>
          {g.status || "ACTIVE"}
        </Badge>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="PLATFORM"
        title="My Gyms"
        subtitle="Gyms you own on the platform."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Gym
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
            placeholder="Search gyms..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading gyms..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(g) => g._id}
            empty={
              <EmptyState
                icon={Building2}
                title="No gyms yet"
                message="Add your first gym to get started."
                action={
                  <Button icon={Plus} onClick={openAdd}>
                    Add Gym
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Add Gym"
        size="lg"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Create Gym"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="ui-form-grid">
          {error && <div className="ui-alert ui-alert--error">{error}</div>}

          <FormField label="Gym Name" required>
            <input
              className="ui-input"
              value={form.name}
              onChange={change("name")}
              placeholder="e.g. Iron Works Fitness"
            />
          </FormField>

          <FormField label="Email">
            <input
              className="ui-input"
              type="email"
              value={form.email}
              onChange={change("email")}
              placeholder="gym@example.com"
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

          <FormField label="Address">
            <input
              className="ui-input"
              value={form.address}
              onChange={change("address")}
              placeholder="Street, city"
            />
          </FormField>

          <FormField label="Owner Name" required>
            <input
              className="ui-input"
              value={form.ownerName}
              onChange={change("ownerName")}
              placeholder="e.g. Jordan Lee"
            />
          </FormField>

          <FormField label="Owner Email" required>
            <input
              className="ui-input"
              type="email"
              value={form.ownerEmail}
              onChange={change("ownerEmail")}
              placeholder="owner@example.com"
            />
          </FormField>

          <FormField label="Owner Phone">
            <input
              className="ui-input"
              value={form.ownerPhone}
              onChange={change("ownerPhone")}
              placeholder="Phone number"
            />
          </FormField>

          <FormField label="Owner Password" required hint="Minimum 6 characters">
            <input
              className="ui-input"
              type="password"
              value={form.ownerPassword}
              onChange={change("ownerPassword")}
              placeholder="Set a password"
            />
          </FormField>
        </form>
      </Modal>
    </MotionPage>
  );
}
