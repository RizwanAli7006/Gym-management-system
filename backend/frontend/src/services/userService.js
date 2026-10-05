import api from "./api";

// Staff users (MANAGER / STAFF / TRAINER) on /api/users.
export const getUsers = async (params = {}) => {
  const response = await api.get("/users", { params });
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const updateUserStatus = async (id, isActive) => {
  const response = await api.patch(`/users/${id}/status`, { isActive });
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
