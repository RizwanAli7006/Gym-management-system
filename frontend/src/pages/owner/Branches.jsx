import { useEffect, useMemo, useState } from "react";
import { GitBranch, Plus, Pencil, Trash2 } from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  Card,
  DataTable,
  Button,
  Modal,
  Toolbar,
  SearchBox,
  FormField,
  Loading,
  EmptyState,
} from "../../components/ui";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../services/branchService";
import { getGyms } from "../../services/gymService";

const EMPTY = { gymId: "", name: "", email: "", phone: "", address: "" };

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [branchData, gymData] = await Promise.all([
        getBranches(),
        getGyms(),
      ]);
      setBranches(branchData.branches || branchData.data || []);
      setGyms(gymData.gyms || gymData.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load branches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const gymName = (branch) =>
    branch.gymId?.name ||
    gyms.find((g) => g._id === (branch.gymId?._id || branch.gymId))?.name ||
    "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        gymName(b).toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, search, gyms]);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (branch) => {
    setEditing(branch);
    setForm({
      gymId: branch.gymId?._id || branch.gymId || "",
      name: branch.name || "",
      email: branch.email || "",
      phone: branch.phone || "",
      address: branch.address || "",
    });
    setError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.gymId) {
      setError("Please select a gym");
      return;
    }
    if (!form.name.trim()) {
      setError("Branch name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateBranch(editing._id, form);
      } else {
        await createBranch(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save branch");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (branch) => {
    if (!window.confirm(`Delete branch "${branch.name}"?`)) return;
    try {
      await deleteBranch(branch._id);
      setBranches((list) => list.filter((b) => b._id !== branch._id));
    } catch {
      window.alert("Could not delete branch");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (b) => (
        <div className="cell-primary">
          <span className="cell-title">{b.name}</span>
          {gymName(b) && <span className="cell-sub">Gym: {gymName(b)}</span>}
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (b) => b.phone || "—" },
    { key: "email", header: "Email", render: (b) => b.email || "—" },
    { key: "address", header: "Address", render: (b) => b.address || "—" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (b) => (
        <div className="ui-table-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => openEdit(b)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => remove(b)}
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
        title="Branches"
        subtitle="Add and manage branches for your gyms."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Branch
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
            placeholder="Search branches..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading branches..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(b) => b._id}
            empty={
              <EmptyState
                icon={GitBranch}
                title="No branches yet"
                message="Add your first branch to get started."
                action={
                  <Button icon={Plus} onClick={openAdd}>
                    Add Branch
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Branch" : "Add Branch"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Branch"}
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

          <FormField label="Branch Name" required>
            <input
              className="ui-input"
              value={form.name}
              onChange={change("name")}
              placeholder="e.g. Downtown Branch"
            />
          </FormField>

          <FormField label="Email">
            <input
              className="ui-input"
              type="email"
              value={form.email}
              onChange={change("email")}
              placeholder="branch@example.com"
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
        </form>
      </Modal>
    </MotionPage>
  );
}
