import api from "./api";

export const getTrainers = async (params = {}) => {
  const response = await api.get("/trainers", { params });
  return response.data;
};

export const createTrainer = async (data) => {
  const response = await api.post("/trainers", data);
  return response.data;
};

export const updateTrainer = async (id, data) => {
  const response = await api.put(`/trainers/${id}`, data);
  return response.data;
};

export const deleteTrainer = async (id) => {
  const response = await api.delete(`/trainers/${id}`);
  return response.data;
};
