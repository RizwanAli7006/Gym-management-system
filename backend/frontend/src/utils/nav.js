import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  Dumbbell,
  UserCog,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  CalendarCheck,
  BadgeCheck,
  UserCircle,
} from "lucide-react";

// Human-readable labels for every role (used in the topbar profile chip).
export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Administrator",
  OWNER: "Gym Owner",
  GYM_ADMIN: "Gym Administrator",
  MANAGER: "Manager",
  STAFF: "Staff",
  TRAINER: "Trainer",
  CUSTOMER: "Member",
};

// Per-portal brand/header copy shown in the sidebar brand + topbar title.
const PORTALS = {
  SUPER_ADMIN: {
    title: "GymPro",
    subtitle: "Multi Gym Platform",
    badge: "SaaS",
    eyebrow: "SUPER ADMIN",
    heading: "Platform Control",
  },
  OWNER: {
    title: "GymPro",
    subtitle: "Owner Console",
    badge: "Owner",
    eyebrow: "OWNER",
    heading: "Business Overview",
  },
  GYM_ADMIN: {
    title: "GymPro",
    subtitle: "Gym Operations",
    badge: "Admin",
    eyebrow: "GYM ADMIN",
    heading: "Gym Operations",
  },
  CUSTOMER: {
    title: "GymPro",
    subtitle: "Member Area",
    badge: "Member",
    eyebrow: "MEMBER",
    heading: "My Fitness",
  },
};

// Per-role navigation. Every entry maps to a real, wired route — no dead links.
const NAV = {
  SUPER_ADMIN: [
    { to: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/super-admin/gyms", label: "All Gyms", icon: Building2 },
    { to: "/super-admin/branches", label: "Branches", icon: GitBranch },
    { to: "/super-admin/members", label: "Members", icon: Users },
    { to: "/super-admin/trainers", label: "Trainers", icon: Dumbbell },
    { to: "/super-admin/gym-admins", label: "Gym Admins", icon: UserCog },
    { to: "/super-admin/plans", label: "Plans", icon: Package },
    { to: "/super-admin/payments", label: "Payments", icon: CreditCard },
    { to: "/super-admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/super-admin/settings", label: "Settings", icon: Settings },
  ],
  OWNER: [
    { to: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/owner/gyms", label: "Gyms", icon: Building2 },
    { to: "/owner/branches", label: "Branches", icon: GitBranch },
    { to: "/owner/gym-admins", label: "Gym Admins", icon: UserCog },
    { to: "/owner/customers", label: "Customers", icon: Users },
    { to: "/owner/memberships", label: "Memberships", icon: Package },
    { to: "/owner/payments", label: "Payments", icon: CreditCard },
    { to: "/owner/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/owner/reports", label: "Reports", icon: BarChart3 },
    { to: "/owner/settings", label: "Settings", icon: Settings },
  ],
  GYM_ADMIN: [
    { to: "/gym/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/gym/customers", label: "Customers", icon: Users },
    { to: "/gym/trainers", label: "Trainers", icon: Dumbbell },
    { to: "/gym/staff", label: "Staff", icon: UserCog },
    { to: "/gym/attendance", label: "Attendance", icon: CalendarCheck },
  ],
  CUSTOMER: [
    { to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customer/membership", label: "Membership", icon: BadgeCheck },
    { to: "/customer/payments", label: "Payments", icon: CreditCard },
    { to: "/customer/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/customer/profile", label: "Profile", icon: UserCircle },
  ],
};

// Gym-bound staff roles all share the gym-admin portal + nav.
const resolveKey = (role) => {
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (role === "OWNER") return "OWNER";
  if (role === "CUSTOMER") return "CUSTOMER";
  return "GYM_ADMIN";
};

export const navFor = (role) => NAV[resolveKey(role)];

export const portalFor = (role) => PORTALS[resolveKey(role)];
