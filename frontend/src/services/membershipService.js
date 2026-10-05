import api from "./api";

export const getPlans = async (params = {}) => {
  const response = await api.get("/plans", { params });
  return response.data;
};

export const createPlan = async (data) => {
  const response = await api.post("/plans", data);
  return response.data;
};

export const updatePlan = async (id, data) => {
  const response = await api.put(`/plans/${id}`, data);
  return response.data;
};

export const deletePlan = async (id) => {
  const response = await api.delete(`/plans/${id}`);
  return response.data;
};
