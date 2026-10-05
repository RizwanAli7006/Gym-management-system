import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus, Trash2, Mail, Phone } from "lucide-react";

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
  getTrainers,
  createTrainer,
  deleteTrainer,
} from "../../services/trainerService";

const EMPTY = { name: "", email: "", phone: "", specialization: "" };

export default function GymTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTrainers();
      setTrainers(data.trainers || []);
    } catch {
      setError("Unable to load trainers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.specialization?.toLowerCase().includes(q)
    );
  }, [trainers, search]);

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
      setError("Trainer name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createTrainer(form);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create trainer");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (trainer) => {
    if (!window.confirm(`Delete trainer "${trainer.name}"?`)) return;
    try {
      await deleteTrainer(trainer._id);
      setTrainers((list) => list.filter((t) => t._id !== trainer._id));
    } catch {
      window.alert("Could not delete trainer");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Trainer",
      render: (t) => (
        <div className="cell-primary">
          <span className="cell-title">{t.name}</span>
          {t.specialization && (
            <span className="cell-sub">{t.specialization}</span>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (t) => (
        <div className="cell-contact">
          {t.email && (
            <span>
              <Mail size={13} /> {t.email}
            </span>
          )}
          {t.phone && (
            <span>
              <Phone size={13} /> {t.phone}
            </span>
          )}
          {!t.email && !t.phone && <span className="cell-sub">—</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Badge tone={t.status === "INACTIVE" ? "gray" : "green"}>
          {t.status || "ACTIVE"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) => (
        <div className="ui-table-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => remove(t)}
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
        title="Trainers"
        subtitle="Add and manage the trainers at your gym."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Trainer
          </Button>
        }
      />

      {error && !modalOpen && <div className="ui-alert ui-alert--error">{error}</div>}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search trainers..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading trainers..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(t) => t._id}
            empty={
              <EmptyState
                icon={Dumbbell}
                title="No trainers yet"
                message="Add your first trainer to get started."
                action={
                  <Button icon={Plus} onClick={openAdd}>
                    Add Trainer
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Add Trainer"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Save Trainer"}
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
              placeholder="e.g. Alex Carter"
            />
          </FormField>

          <FormField label="Specialization">
            <input
              className="ui-input"
              value={form.specialization}
              onChange={change("specialization")}
              placeholder="e.g. Strength & Conditioning"
            />
          </FormField>

          <FormField label="Email">
            <input
              className="ui-input"
              type="email"
              value={form.email}
              onChange={change("email")}
              placeholder="trainer@example.com"
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
        </form>
      </Modal>
    </MotionPage>
  );
}
