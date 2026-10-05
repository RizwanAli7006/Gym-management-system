// Central role → landing route map. Keep this in sync with the
// four protected route trees defined in AppRoutes.jsx.
export const roleHome = (role) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "OWNER":
      return "/owner/dashboard";
    case "GYM_ADMIN":
    case "MANAGER":
    case "STAFF":
    case "TRAINER":
      return "/gym/dashboard";
    case "CUSTOMER":
      return "/customer/dashboard";
    default:
      return "/login";
  }
};

// Roles that share the gym-staff route tree (whole-gym scope).
export const GYM_STAFF_ROLES = [
  "GYM_ADMIN",
  "MANAGER",
  "STAFF",
  "TRAINER"
];
