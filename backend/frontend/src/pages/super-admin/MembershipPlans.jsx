import { useEffect, useState } from "react";
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

export default function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPlans();
      setPlans(data.plans || []);
      setError("");
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
    setEditId(null);
    setForm(EMPTY);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditId(plan._id);
    setForm({
      name: plan.name || "",
      price: plan.price ?? "",
      durationDays: plan.durationDays ?? 30,
      description: plan.description || "",
      status: plan.status || "ACTIVE",
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
    });
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
    if (form.durationDays === "" || Number.isNaN(Number(form.durationDays))) {
      setFormError("A valid duration is required");
      return;
    }
    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      description: form.description,
      status: form.status,
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };

    try {
      if (editId) {
        await updatePlan(editId, payload);
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

  return (
    <MotionPage>
      <PageHeader
        eyebrow="CATALOG"
        title="Membership Plans"
        subtitle="Create and manage the plans available across the platform."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Plan
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert--error">{error}</div>}

      {loading ? (
        <Card>
          <Loading label="Loading plans..." />
        </Card>
      ) : plans.length === 0 ? (
        <Card>
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
        </Card>
      ) : (
        <div className="ui-grid ui-grid--cards">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              title={plan.name}
              subtitle={`${money(plan.price)} · ${plan.durationDays || 0} days`}
              actions={
                <Badge tone={plan.status === "INACTIVE" ? "gray" : "green"}>
                  {plan.status || "ACTIVE"}
                </Badge>
              }
            >
              {plan.description && <p className="cell-sub">{plan.description}</p>}

              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <ul className="cell-contact">
                  {plan.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}

              <div className="ui-table-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Pencil}
                  onClick={() => openEdit(plan)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
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
      )}

      <Modal
        open={modalOpen}
        title={editId ? "Edit Plan" : "Add Plan"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Save Plan"}
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
              placeholder="e.g. Premium Monthly"
            />
          </FormField>

          <FormField label="Price (Rs)" required>
            <input
              className="ui-input"
              type="number"
              value={form.price}
              onChange={change("price")}
              placeholder="e.g. 3000"
            />
          </FormField>

          <FormField label="Duration (days)" required>
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
              value={form.description}
              onChange={change("description")}
              placeholder="Short description of the plan"
            />
          </FormField>

          <FormField label="Features" hint="One feature per line">
            <textarea
              className="ui-input"
              value={form.features}
              onChange={change("features")}
              placeholder={"Unlimited access\nFree trainer session\nLocker included"}
            />
          </FormField>
        </form>
      </Modal>
    </MotionPage>
  );
}
