import api from "./api";

export const getCustomers = async (params = {}) => {
  const response = await api.get("/customers", { params });
  return response.data;
};

export const getCustomerStats = async (params = {}) => {
  const response = await api.get("/customers/stats", { params });
  return response.data;
};

export const getCustomer = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await api.post("/customers", data);
  return response.data;
};

export const updateCustomer = async (id, data) => {
  const response = await api.put(`/customers/${id}`, data);
  return response.data;
};

export const toggleCustomerStatus = async (id) => {
  const response = await api.patch(`/customers/${id}/status`);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

export const payFee = async (id, data = {}) => {
  const response = await api.post(`/customers/${id}/pay-fee`, data);
  return response.data;
};

// Self-service: logged-in customer's own profile + attendance + payments.
export const getMyProfile = async () => {
  const response = await api.get("/customers/me");
  return response.data;
};
