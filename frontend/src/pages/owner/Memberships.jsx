import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  FormField,
  Loading,
  EmptyState,
} from "../../components/ui";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "../../services/membershipService";

const EMPTY = {
  name: "",
  price: "",
  durationDays: 30,
  description: "",
  status: "ACTIVE",
  features: "",
};

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

const toForm = (plan) => ({
  name: plan.name || "",
  price: plan.price ?? "",
  durationDays: plan.durationDays ?? 30,
  description: plan.description || "",
  status: plan.status || "ACTIVE",
  features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
});

export default function Memberships() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(data.plans || []);
    } catch {
      setError("Unable to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm(toForm(plan));
    setFormError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Plan name is required");
      return;
    }
    if (form.price === "" || Number.isNaN(Number(form.price))) {
      setFormError("A valid price is required");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      durationDays: Number(form.durationDays) || 0,
      description: form.description.trim(),
      status: form.status,
      features: form.features
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editing) {
        await updatePlan(editing._id, payload);
      } else {
        await createPlan(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save plan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (plan) => {
    if (!window.confirm(`Delete plan "${plan.name}"?`)) return;
    try {
      await deletePlan(plan._id);
      setPlans((list) => list.filter((p) => p._id !== plan._id));
    } catch {
      window.alert("Could not delete plan");
    }
  };

  const content = useMemo(() => {
    if (loading) return <Loading label="Loading plans..." />;
    if (plans.length === 0) {
      return (
        <EmptyState
          icon={Package}
          title="No plans yet"
          message="Create your first membership plan to get started."
          action={
            <Button icon={Plus} onClick={openAdd}>
              Add Plan
            </Button>
          }
        />
      );
    }
    return (
      <div className="ui-grid ui-grid--cards">
        {plans.map((plan) => (
          <Card
            key={plan._id}
            title={plan.name}
            subtitle={`${money(plan.price)} · ${plan.durationDays ?? 0} days`}
            actions={
              <Badge tone={plan.status === "INACTIVE" ? "gray" : "green"}>
                {plan.status || "ACTIVE"}
              </Badge>
            }
          >
            {plan.description && (
              <p className="cell-sub" style={{ marginTop: 0 }}>
                {plan.description}
              </p>
            )}

            {Array.isArray(plan.features) && plan.features.length > 0 && (
              <ul style={{ margin: "0.75rem 0", paddingLeft: "1.1rem" }}>
                {plan.features.map((f, i) => (
                  <li key={i} className="cell-sub">
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <div className="ui-table-actions" style={{ marginTop: "0.75rem" }}>
              <Button
                variant="ghost"
                size="sm"
                icon={Pencil}
                onClick={() => openEdit(plan)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => remove(plan)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  }, [loading, plans]);

  return (
    <MotionPage>
      <PageHeader
        eyebrow="PLANS"
        title="Membership Plans"
        subtitle="Create and manage the membership plans offered at your gyms."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Plan
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {content}

      <Modal
        open={modalOpen}
        title={editing ? "Edit Plan" : "Add Plan"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Plan"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="ui-form-grid">
          {formError && (
            <div className="ui-alert ui-alert--error">{formError}</div>
          )}

          <FormField label="Plan Name" required>
            <input
              className="ui-input"
              value={form.name}
              onChange={change("name")}
              placeholder="e.g. Premium"
            />
          </FormField>

          <FormField label="Price" required hint="In Rs">
            <input
              className="ui-input"
              type="number"
              value={form.price}
              onChange={change("price")}
              placeholder="e.g. 20000"
            />
          </FormField>

          <FormField label="Duration (days)">
            <input
              className="ui-input"
              type="number"
              value={form.durationDays}
              onChange={change("durationDays")}
              placeholder="30"
            />
          </FormField>

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

          <FormField label="Description">
            <textarea
              className="ui-input"
              rows={3}
              value={form.description}
              onChange={change("description")}
              placeholder="Short description of the plan"
            />
          </FormField>

          <FormField label="Features" hint="One feature per line">
            <textarea
              className="ui-input"
              rows={4}
              value={form.features}
              onChange={change("features")}
              placeholder={"Access to all equipment\nFree locker\nGroup classes"}
            />
          </FormField>
        </form>
      </Modal>
    </MotionPage>
  );
}
