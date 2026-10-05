import { Routes, Route, Navigate } from "react-router-dom";

import RoleRoute from "../components/common/RoleRoute.jsx";
import RoleRedirect from "../components/common/RoleRedirect.jsx";
import { GYM_STAFF_ROLES } from "../utils/roles";

// Layouts
import SuperAdminLayout from "../layouts/SuperAdminLayout.jsx";
import OwnerLayout from "../layouts/OwnerLayout.jsx";
import GymLayout from "../layouts/GymLayout.jsx";
import CustomerLayout from "../layouts/CustomerLayout.jsx";

// Auth
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";

// Super Admin
import SuperAdminDashboard from "../pages/super-admin/SuperAdminDashboard.jsx";
import AllGyms from "../pages/super-admin/AllGyms.jsx";
import Branches from "../pages/super-admin/Branches.jsx";
import Members from "../pages/super-admin/Members.jsx";
import Trainers from "../pages/super-admin/Trainers.jsx";
import GymAdmins from "../pages/super-admin/GymAdmins.jsx";
import MembershipPlans from "../pages/super-admin/MembershipPlans.jsx";
import Payments from "../pages/super-admin/Payments.jsx";
import Reports from "../pages/super-admin/Reports.jsx";
import Settings from "../pages/super-admin/Settings.jsx";

// Owner
import OwnerDashboard from "../pages/owner/Dashboard.jsx";
import OwnerGyms from "../pages/owner/Gyms.jsx";
import OwnerBranches from "../pages/owner/Branches.jsx";
import OwnerGymAdmins from "../pages/owner/GymAdmins.jsx";
import OwnerCustomers from "../pages/owner/Customers.jsx";
import OwnerMemberships from "../pages/owner/Memberships.jsx";
import OwnerPayments from "../pages/owner/Payments.jsx";
import OwnerAttendance from "../pages/owner/Attendance.jsx";
import OwnerReports from "../pages/owner/Reports.jsx";
import OwnerSettings from "../pages/owner/Settings.jsx";

// Gym Admin
import GymDashboard from "../pages/gym/Dashboard.jsx";
import GymCustomers from "../pages/gym/Customers.jsx";
import GymTrainers from "../pages/gym/Trainers.jsx";
import GymStaff from "../pages/gym/Staff.jsx";
import GymAttendance from "../pages/gym/Attendance.jsx";

// Customer
import CustomerDashboard from "../pages/customer/Dashboard.jsx";
import CustomerProfile from "../pages/customer/Profile.jsx";
import CustomerMembership from "../pages/customer/Membership.jsx";
import CustomerPayments from "../pages/customer/Payments.jsx";
import CustomerAttendance from "../pages/customer/Attendance.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root → role-aware landing */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Super Admin */}
      <Route
        path="/super-admin"
        element={
          <RoleRoute allow={["SUPER_ADMIN"]}>
            <SuperAdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="gyms" element={<AllGyms />} />
        <Route path="branches" element={<Branches />} />
        <Route path="members" element={<Members />} />
        <Route path="trainers" element={<Trainers />} />
        <Route path="gym-admins" element={<GymAdmins />} />
        <Route path="plans" element={<MembershipPlans />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="*"
          element={<Navigate to="/super-admin/dashboard" replace />}
        />
      </Route>

      {/* Owner */}
      <Route
        path="/owner"
        element={
          <RoleRoute allow={["OWNER"]}>
            <OwnerLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="gyms" element={<OwnerGyms />} />
        <Route path="branches" element={<OwnerBranches />} />
        <Route path="gym-admins" element={<OwnerGymAdmins />} />
        <Route path="customers" element={<OwnerCustomers />} />
        <Route path="memberships" element={<OwnerMemberships />} />
        <Route path="payments" element={<OwnerPayments />} />
        <Route path="attendance" element={<OwnerAttendance />} />
        <Route path="reports" element={<OwnerReports />} />
        <Route path="settings" element={<OwnerSettings />} />
        <Route
          path="*"
          element={<Navigate to="/owner/dashboard" replace />}
        />
      </Route>

      {/* Gym Admin / staff (whole-gym scope) */}
      <Route
        path="/gym"
        element={
          <RoleRoute allow={GYM_STAFF_ROLES}>
            <GymLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<GymDashboard />} />
        <Route path="customers" element={<GymCustomers />} />
        <Route path="trainers" element={<GymTrainers />} />
        <Route path="staff" element={<GymStaff />} />
        <Route path="attendance" element={<GymAttendance />} />
        <Route
          path="*"
          element={<Navigate to="/gym/dashboard" replace />}
        />
      </Route>

      {/* Customer */}
      <Route
        path="/customer"
        element={
          <RoleRoute allow={["CUSTOMER"]}>
            <CustomerLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="membership" element={<CustomerMembership />} />
        <Route path="payments" element={<CustomerPayments />} />
        <Route path="attendance" element={<CustomerAttendance />} />
        <Route
          path="*"
          element={<Navigate to="/customer/dashboard" replace />}
        />
      </Route>

      {/* Anything else → role-aware landing (or /login) */}
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
