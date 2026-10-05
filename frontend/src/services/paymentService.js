import api from "./api";

export const getPayments = async (params = {}) => {
  const response = await api.get("/payments", { params });
  return response.data;
};

export const getPaymentStats = async (params = {}) => {
  const response = await api.get("/payments/stats", { params });
  return response.data;
};

export const createPayment = async (data) => {
  const response = await api.post("/payments", data);
  return response.data;
};

export const deletePayment = async (id) => {
  const response = await api.delete(`/payments/${id}`);
  return response.data;
};
