import api from "./api";

export const getGyms = async (params = {}) => {
  const response = await api.get("/gyms", { params });
  return response.data;
};

export const getGym = async (id) => {
  const response = await api.get(`/gyms/${id}`);
  return response.data;
};

// Super Admin creates a gym together with its OWNER account.
// Body: { name, email, phone, address, ownerName, ownerEmail, ownerPhone, ownerPassword }
export const createGym = async (data) => {
  const response = await api.post("/gyms", data);
  return response.data;
};

export const updateGym = async (id, data) => {
  const response = await api.put(`/gyms/${id}`, data);
  return response.data;
};

export const deleteGym = async (id) => {
  const response = await api.delete(`/gyms/${id}`);
  return response.data;
};
