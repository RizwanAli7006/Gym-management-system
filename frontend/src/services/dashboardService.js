import api from "./api";

// Role-aware dashboard payload. The backend inspects the auth token
// and returns the right shape for SUPER_ADMIN / OWNER / GYM_ADMIN / CUSTOMER.
export const getDashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};
