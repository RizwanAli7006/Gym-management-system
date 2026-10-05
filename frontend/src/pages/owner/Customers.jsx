import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  UserX,
  Plus,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";

import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
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
  getCustomers,
  getCustomerStats,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  deleteCustomer,
} from "../../services/customerService";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  gender: "MALE",
  membershipPlan: "",
  address: "",
};

const membershipTone = (status) =>
  status === "ACTIVE"
    ? "green"
    : status === "EXPIRING"
    ? "amber"
    : status === "EXPIRED"
    ? "red"
    : "gray";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
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
      const [data, statsData] = await Promise.all([
        getCustomers(),
        getCustomerStats().catch(() => null),
      ]);
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setStats(statsData?.stats || null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.memberId?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      gender: customer.gender || "MALE",
      membershipPlan: customer.membershipPlan || "",
      address: customer.address || "",
    });
    setError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Member name is required");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateCustomer(editing._id, form);
      } else {
        await createCustomer(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save member");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (customer) => {
    try {
      await toggleCustomerStatus(customer._id);
      await load();
    } catch {
      window.alert("Could not update member status");
    }
  };

  const remove = async (customer) => {
    if (!window.confirm(`Delete member "${customer.name}"?`)) return;
    try {
      await deleteCustomer(customer._id);
      setCustomers((list) => list.filter((c) => c._id !== customer._id));
    } catch {
      window.alert("Could not delete member");
    }
  };

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (c) => (
        <div className="cell-primary">
          <span className="cell-title">{c.name}</span>
          {c.memberId && <span className="cell-sub">{c.memberId}</span>}
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => c.phone || "—" },
    {
      key: "plan",
      header: "Plan",
      render: (c) => c.membershipPlan || "—",
    },
    {
      key: "membership",
      header: "Membership",
      render: (c) => (
        <Badge tone={membershipTone(c.membershipStatus)}>
          {c.membershipStatus || "NONE"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <Badge tone={c.status === "ACTIVE" ? "green" : "gray"}>
          {c.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="ui-table-actions">
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => openEdit(c)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Power}
            onClick={() => toggle(c)}
          >
            {c.status === "ACTIVE" ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => remove(c)}
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
        eyebrow="MEMBERS"
        title="Customers"
        subtitle="Members across your gyms."
        actions={
          <Button icon={Plus} onClick={openAdd}>
            Add Member
          </Button>
        }
      />

      {error && !modalOpen && (
        <div className="ui-alert ui-alert--error">{error}</div>
      )}

      {stats && (
        <div className="ui-grid ui-grid--stats">
          <StatCard
            icon={Users}
            tone="purple"
            label="Total Members"
            value={Number(stats.total || 0).toLocaleString()}
          />
          <StatCard
            icon={UserCheck}
            tone="green"
            label="Active"
            value={Number(stats.active || 0).toLocaleString()}
          />
          <StatCard
            icon={Clock}
            tone="amber"
            label="Expiring Soon"
            value={Number(stats.expiring || 0).toLocaleString()}
          />
          <StatCard
            icon={UserX}
            tone="pink"
            label="Expired"
            value={Number(stats.expired || 0).toLocaleString()}
          />
        </div>
      )}

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by name, member ID, email or phone..."
          />
        </Toolbar>

        {loading ? (
          <Loading label="Loading customers..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(c) => c._id}
            empty={
              <EmptyState
                icon={Users}
                title="No customers found"
                message="Add your first member to get started."
                action={
                  <Button icon={Plus} onClick={openAdd}>
                    Add Member
                  </Button>
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Member" : "Add Member"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Member"}
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

          <FormField label="Email">
            <input
              className="ui-input"
              type="email"
              value={form.email}
              onChange={change("email")}
              placeholder="member@example.com"
            />
          </FormField>

          <FormField label="Phone" required>
            <input
              className="ui-input"
              value={form.phone}
              onChange={change("phone")}
              placeholder="Phone number"
            />
          </FormField>

          <FormField label="Gender">
            <select
              className="ui-input"
              value={form.gender}
              onChange={change("gender")}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>

          <FormField label="Membership Plan">
            <input
              className="ui-input"
              value={form.membershipPlan}
              onChange={change("membershipPlan")}
              placeholder="e.g. Monthly, Annual"
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
