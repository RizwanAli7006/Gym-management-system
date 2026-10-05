import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Plus,
  Eye,
  CalendarCheck,
  Pencil,
  Power,
  Trash2,
  Mail,
  Phone,
  CreditCard,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import MotionPage from "../../components/common/MotionPage.jsx";
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  Button,
  Modal,
  EmptyState,
  SearchBox,
  FormField,
  Loading,
  DataTable,
  Toolbar,
} from "../../components/ui";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  deleteCustomer,
  payFee,
} from "../../services/customerService";
import { getAttendance, checkIn } from "../../services/attendanceService";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "OTHER",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  membershipPlan: "",
  membershipStartDate: "",
  membershipExpiryDate: "",
  membershipStatus: "NONE",
  monthlyFee: "",
  notes: "",
};

const membershipTone = (status) =>
  status === "ACTIVE"
    ? "green"
    : status === "EXPIRING"
    ? "amber"
    : status === "EXPIRED"
    ? "red"
    : "gray";

const membershipLabel = (status) =>
  status === "ACTIVE"
    ? "Active"
    : status === "EXPIRING"
    ? "Expiring"
    : status === "EXPIRED"
    ? "Expired"
    : "No Membership";

const feeTone = (status) =>
  status === "PAID" ? "green" : status === "OVERDUE" ? "red" : "amber";

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const money = (x) => `Rs ${Number(x || 0).toLocaleString()}`;

export default function Customers() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [membershipFilter, setMembershipFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [profileCustomer, setProfileCustomer] = useState(null);
  const [profileAttendance, setProfileAttendance] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCustomers();
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        customer.name?.toLowerCase().includes(q) ||
        customer.memberId?.toLowerCase().includes(q) ||
        customer.email?.toLowerCase().includes(q) ||
        customer.phone?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || customer.status === statusFilter;
      const matchesMembership =
        membershipFilter === "ALL" ||
        customer.membershipStatus === membershipFilter;
      return matchesSearch && matchesStatus && matchesMembership;
    });
  }, [customers, search, statusFilter, membershipFilter]);

  const stats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((c) => c.status === "ACTIVE").length,
      inactive: customers.filter((c) => c.status === "INACTIVE").length,
      expiring: customers.filter((c) => c.membershipStatus === "EXPIRING")
        .length,
    }),
    [customers]
  );

  const change = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      dateOfBirth: customer.dateOfBirth
        ? customer.dateOfBirth.substring(0, 10)
        : "",
      gender: customer.gender || "OTHER",
      address: customer.address || "",
      emergencyContactName: customer.emergencyContactName || "",
      emergencyContactPhone: customer.emergencyContactPhone || "",
      membershipPlan: customer.membershipPlan || "",
      membershipStartDate: customer.membershipStartDate
        ? customer.membershipStartDate.substring(0, 10)
        : "",
      membershipExpiryDate: customer.membershipExpiryDate
        ? customer.membershipExpiryDate.substring(0, 10)
        : "",
      membershipStatus: customer.membershipStatus || "NONE",
      monthlyFee:
        customer.monthlyFee != null ? String(customer.monthlyFee) : "",
      notes: customer.notes || "",
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingCustomer(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        address: form.address.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        membershipPlan: form.membershipPlan.trim(),
        membershipStartDate: form.membershipStartDate || null,
        membershipExpiryDate: form.membershipExpiryDate || null,
        membershipStatus: form.membershipStatus,
        monthlyFee:
          form.monthlyFee === "" ? undefined : Number(form.monthlyFee),
        notes: form.notes.trim(),
      };
      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, body);
      } else {
        await createCustomer(body);
      }
      setSuccess(
        editingCustomer
          ? "Customer updated successfully"
          : "Customer added successfully"
      );
      await loadCustomers();
      setTimeout(() => {
        closeModal();
        setSuccess("");
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Customer ${editingCustomer ? "update" : "creation"} failed`
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (customer) => {
    try {
      setError("");
      setSuccess("");
      await toggleCustomerStatus(customer._id);
      setSuccess("Customer status updated successfully");
      await loadCustomers();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update customer status"
      );
    }
  };

  const removeCustomer = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}?`))
      return;
    try {
      setError("");
      setSuccess("");
      await deleteCustomer(customer._id);
      setSuccess("Customer deleted successfully");
      await loadCustomers();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete customer");
    }
  };

  const loadProfile = async (customer) => {
    try {
      setProfileLoading(true);
      const data = await getAttendance({ customerId: customer._id });
      setProfileAttendance(
        Array.isArray(data.attendance) ? data.attendance : []
      );
    } catch {
      setProfileAttendance([]);
    } finally {
      setProfileLoading(false);
    }
  };

  const openProfile = (customer) => {
    setProfileCustomer(customer);
    setProfileAttendance([]);
    loadProfile(customer);
  };

  const closeProfile = () => {
    if (feeSaving) return;
    setProfileCustomer(null);
    setProfileAttendance([]);
  };

  const markAttendance = async (customer) => {
    try {
      setError("");
      setSuccess("");
      await checkIn({ customerId: customer._id });
      setSuccess(`Attendance marked for ${customer.name}`);
      if (profileCustomer?._id === customer._id) {
        loadProfile(customer);
      }
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to mark attendance");
    }
  };

  const collectFee = async (customer) => {
    try {
      setFeeSaving(true);
      setError("");
      setSuccess("");
      const data = await payFee(customer._id, {});
      setSuccess(`Fee collected for ${customer.name}`);
      if (data.customer) {
        setProfileCustomer(data.customer);
      }
      await loadCustomers();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to collect fee");
    } finally {
      setFeeSaving(false);
    }
  };

  const canDelete =
    user?.role === "SUPER_ADMIN" || user?.role === "GYM_ADMIN";

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (c) => (
        <div className="cell-primary">
          <span className="cell-title">{c.name}</span>
          <span className="cell-sub">{c.memberId || "—"}</span>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div className="cell-contact">
          {c.phone && (
            <span>
              <Phone size={13} /> {c.phone}
            </span>
          )}
          {c.email && (
            <span>
              <Mail size={13} /> {c.email}
            </span>
          )}
          {!c.phone && !c.email && <span className="cell-sub">—</span>}
        </div>
      ),
    },
    {
      key: "membership",
      header: "Membership",
      render: (c) => (
        <div className="cell-primary">
          <span className="cell-title">{c.membershipPlan || "No Plan"}</span>
          <span className="cell-sub">
            <Badge tone={membershipTone(c.membershipStatus)}>
              {membershipLabel(c.membershipStatus)}
            </Badge>
          </span>
        </div>
      ),
    },
    {
      key: "expiry",
      header: "Expiry",
      render: (c) => formatDate(c.membershipExpiryDate),
    },
    {
      key: "fee",
      header: "Fee",
      render: (c) => (
        <Badge tone={feeTone(c.feeStatus)}>{c.feeStatus || "DUE"}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <Badge tone={c.status === "ACTIVE" ? "green" : "red"}>
          {c.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (c) => formatDate(c.createdAt),
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
            icon={Eye}
            onClick={() => openProfile(c)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={CalendarCheck}
            onClick={() => markAttendance(c)}
          >
            Attendance
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => openEditModal(c)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Power}
            onClick={() => toggleStatus(c)}
          >
            {c.status === "ACTIVE" ? "Disable" : "Enable"}
          </Button>
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => removeCustomer(c)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MotionPage>
      <PageHeader
        eyebrow="MEMBERS"
        title="Customers"
        subtitle="Manage your gym members and membership information."
        actions={
          <Button icon={Plus} onClick={openAddModal}>
            Add Member
          </Button>
        }
      />

      {error && !showModal && (
        <div className="ui-alert ui-alert--error">{error}</div>
      )}
      {success && <div className="ui-alert ui-alert--success">{success}</div>}

      <div className="ui-grid ui-grid--stats">
        <StatCard
          icon={Users}
          label="Total Members"
          value={stats.total}
          tone="purple"
        />
        <StatCard
          icon={UserCheck}
          label="Active Members"
          value={stats.active}
          tone="green"
        />
        <StatCard
          icon={UserX}
          label="Inactive Members"
          value={stats.inactive}
          tone="pink"
        />
        <StatCard
          icon={AlertTriangle}
          label="Expiring Memberships"
          value={stats.expiring}
          tone="amber"
        />
      </div>

      <Card>
        <Toolbar>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by name, member ID, email or phone..."
          />
          <select
            className="ui-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            className="ui-input"
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
          >
            <option value="ALL">All Memberships</option>
            <option value="ACTIVE">Active Membership</option>
            <option value="EXPIRING">Expiring</option>
            <option value="EXPIRED">Expired</option>
            <option value="NONE">No Membership</option>
          </select>
        </Toolbar>

        {loading ? (
          <Loading label="Loading customers..." />
        ) : (
          <DataTable
            columns={columns}
            rows={filteredCustomers}
            rowKey={(c) => c._id}
            empty={
              <EmptyState
                icon={Users}
                title={
                  customers.length === 0
                    ? "No customers yet"
                    : "No customers found"
                }
                message={
                  customers.length === 0
                    ? "Start by adding your first gym member."
                    : "Try changing your search or filters."
                }
                action={
                  customers.length === 0 ? (
                    <Button icon={Plus} onClick={openAddModal}>
                      Add First Member
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        )}
      </Card>

      <Modal
        open={showModal}
        size="lg"
        title={editingCustomer ? "Edit Customer" : "Add New Member"}
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving
                ? "Saving..."
                : editingCustomer
                ? "Update Member"
                : "Add Member"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="ui-form-grid">
          {error && (
            <div
              className="ui-alert ui-alert--error"
              style={{ gridColumn: "1 / -1" }}
            >
              {error}
            </div>
          )}

          <h4 style={{ gridColumn: "1 / -1", margin: 0 }}>Basic Information</h4>

          <FormField label="Full Name" required>
            <input
              className="ui-input"
              name="name"
              value={form.name}
              onChange={change("name")}
              placeholder="Enter full name"
            />
          </FormField>
          <FormField label="Phone" required>
            <input
              className="ui-input"
              name="phone"
              value={form.phone}
              onChange={change("phone")}
              placeholder="03001234567"
            />
          </FormField>
          <FormField label="Email">
            <input
              className="ui-input"
              type="email"
              name="email"
              value={form.email}
              onChange={change("email")}
              placeholder="member@email.com"
            />
          </FormField>
          <FormField label="Date of Birth">
            <input
              className="ui-input"
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={change("dateOfBirth")}
            />
          </FormField>
          <FormField label="Gender">
            <select
              className="ui-input"
              name="gender"
              value={form.gender}
              onChange={change("gender")}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
          <div style={{ gridColumn: "1 / -1" }}>
            <FormField label="Address">
              <input
                className="ui-input"
                name="address"
                value={form.address}
                onChange={change("address")}
                placeholder="Enter address"
              />
            </FormField>
          </div>

          <h4 style={{ gridColumn: "1 / -1", margin: 0 }}>Emergency Contact</h4>

          <FormField label="Contact Name">
            <input
              className="ui-input"
              name="emergencyContactName"
              value={form.emergencyContactName}
              onChange={change("emergencyContactName")}
              placeholder="Emergency contact name"
            />
          </FormField>
          <FormField label="Contact Phone">
            <input
              className="ui-input"
              name="emergencyContactPhone"
              value={form.emergencyContactPhone}
              onChange={change("emergencyContactPhone")}
              placeholder="Emergency contact phone"
            />
          </FormField>

          <h4 style={{ gridColumn: "1 / -1", margin: 0 }}>Membership</h4>

          <FormField label="Membership Plan">
            <input
              className="ui-input"
              name="membershipPlan"
              value={form.membershipPlan}
              onChange={change("membershipPlan")}
              placeholder="Monthly"
            />
          </FormField>
          <FormField label="Membership Status">
            <select
              className="ui-input"
              name="membershipStatus"
              value={form.membershipStatus}
              onChange={change("membershipStatus")}
            >
              <option value="NONE">No Membership</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING">Expiring</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </FormField>
          <FormField label="Start Date">
            <input
              className="ui-input"
              type="date"
              name="membershipStartDate"
              value={form.membershipStartDate}
              onChange={change("membershipStartDate")}
            />
          </FormField>
          <FormField label="Expiry Date">
            <input
              className="ui-input"
              type="date"
              name="membershipExpiryDate"
              value={form.membershipExpiryDate}
              onChange={change("membershipExpiryDate")}
            />
          </FormField>
          <FormField label="Monthly Fee">
            <input
              className="ui-input"
              type="number"
              min="0"
              name="monthlyFee"
              value={form.monthlyFee}
              onChange={change("monthlyFee")}
              placeholder="e.g. 2500"
            />
          </FormField>

          <h4 style={{ gridColumn: "1 / -1", margin: 0 }}>Notes</h4>
          <div style={{ gridColumn: "1 / -1" }}>
            <FormField label="Notes">
              <textarea
                className="ui-input"
                name="notes"
                value={form.notes}
                onChange={change("notes")}
                placeholder="Add any notes about this member..."
                rows="4"
              />
            </FormField>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!profileCustomer}
        size="lg"
        title={profileCustomer ? profileCustomer.name : ""}
        onClose={closeProfile}
      >
        {profileCustomer && (
          <>
            <p className="cell-sub" style={{ marginTop: 0 }}>
              {profileCustomer.memberId || "—"} · {profileCustomer.phone}
            </p>

            <Card
              title="Fee"
              actions={
                <Button
                  icon={CreditCard}
                  onClick={() => collectFee(profileCustomer)}
                  disabled={feeSaving}
                >
                  {feeSaving ? "Collecting..." : "Collect Fee"}
                </Button>
              }
            >
              <div className="ui-grid ui-grid--stats">
                <div>
                  <div className="cell-sub">Monthly Fee</div>
                  <div className="cell-primary">
                    {profileCustomer.monthlyFee > 0
                      ? money(profileCustomer.monthlyFee)
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="cell-sub">Fee Status</div>
                  <div>
                    <Badge tone={feeTone(profileCustomer.feeStatus)}>
                      {profileCustomer.feeStatus || "DUE"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="cell-sub">Last Paid</div>
                  <div className="cell-primary">
                    {formatDate(profileCustomer.lastFeePaidDate)}
                  </div>
                </div>
                <div>
                  <div className="cell-sub">Next Due</div>
                  <div className="cell-primary">
                    {formatDate(profileCustomer.nextFeeDate)}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Attendance History">
              {profileLoading ? (
                <Loading label="Loading attendance..." />
              ) : profileAttendance.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No attendance yet"
                  message="No attendance recorded yet."
                />
              ) : (
                <div>
                  {profileAttendance.map((rec) => (
                    <div
                      key={rec._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span className="cell-primary">
                        {formatDateTime(rec.checkIn)}
                      </span>
                      <span className="cell-sub">
                        {rec.checkOut
                          ? `Out: ${formatDateTime(rec.checkOut)}`
                          : "In gym"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </Modal>
    </MotionPage>
  );
}

