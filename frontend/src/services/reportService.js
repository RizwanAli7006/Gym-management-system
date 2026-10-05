import api from "./api";

// Role-scoped analytics for the Reports pages. Optional { gymId } for SUPER_ADMIN.
export const getReports = async (params = {}) => {
  const response = await api.get("/dashboard/reports", { params });
  return response.data;
};
