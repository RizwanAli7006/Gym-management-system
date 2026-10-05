import api from "./api";

export const getGymAdmins = async (params = {}) => {
  const response = await api.get("/gym-admins", { params });
  return response.data;
};

export const createGymAdmin = async (data) => {
  const response = await api.post("/gym-admins", data);
  return response.data;
};

export const setGymAdminActive = async (id, isActive) => {
  const response = await api.patch(`/gym-admins/${id}/status`, { isActive });
  return response.data;
};
