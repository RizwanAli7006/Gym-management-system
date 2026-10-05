import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";

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
  getGyms,
  createGym,
  updateGym,
  deleteGym,
} from "../../services/gymService";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  address: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
  status: "ACTIVE",
};

export default function AllGyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const isEdit = editId !== null;

  const load = async () => {
    setLoading(true);
    try {
      const data = await getGyms();
      setGyms(data.gyms || data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load gyms.");
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
        g.phone?.toLowerCase().includes(q) ||
        g.address?.toLowerCase().includes(q)
    );
  }, [gyms, search]);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (gym) => {
    setEditId(gym._id);
    setForm({
      ...EMPTY,
      name: gym.name || "",
      email: gym.email || "",
      phone: gym.phone || "",
      address: gym.address || "",
      status: gym.status || "ACTIVE",
    });
    setFormError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Gym name is required");
      return;
    }
    if (!isEdit) {
      if (!form.ownerName.trim() || !form.ownerEmail.trim() || !form.ownerPassword) {
        setFormError("Owner name, email and password are required");
        return;
      }
    }
    setSaving(true);
    setFormError("");
    try {
      if (isEdit) {
        await updateGym(editId, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          status: form.status,
        });
      } else {
        await createGym({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPhone: form.ownerPhone,
          ownerPassword: form.ownerPassword,
        });
      }
      setModalOpen(false);
      setEditId(null);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (isEdit ? "Unable to update gym." : "Unable to create gym.")
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (gym) => {
    if (!window.confirm("Delete this gym and its owner account?")) return;
    try {
      await deleteGym(gym._id);
      setGyms((list) => list.filter((g) => g._id !== gym._id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete gym.");
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
    {
      key: "actions",
      header: "",
      align: "right",
      render: (g) => (
        <div className="ui-table-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => openEdit(g)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => remove(g)}
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
        eyebrow="PLATFORM"
        title="All Gyms"
        subtitle="View and manage all gyms registered on the platform."
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
                message="Create your first gym to get started."
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
        title={isEdit ? "Edit Gym" : "Create Gym & Owner"}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Gym"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="ui-form-grid">
          {formError && (
            <div className="ui-alert ui-alert--error">{formError}</div>
          )}

          <FormField label="Gym Name" required>
            <input
              className="ui-input"
              value={form.name}
              onChange={change("name")}
              placeholder="e.g. Iron Works Fitness"
            />
          </FormField>

          <FormField label="Gym Email">
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

          {isEdit ? (
            <FormField label="Status">
              <select
                className="ui-input"
                value={form.status}
                onChange={change("status")}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </FormField>
          ) : (
            <>
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

              <FormField label="Owner Password" required>
                <input
                  className="ui-input"
                  type="password"
                  value={form.ownerPassword}
                  onChange={change("ownerPassword")}
                  placeholder="Set a password"
                />
              </FormField>
            </>
          )}
        </form>
      </Modal>
    </MotionPage>
  );
}
