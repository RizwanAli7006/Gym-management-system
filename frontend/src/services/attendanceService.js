import api from "./api";

export const getAttendance = async (params = {}) => {
  const response = await api.get("/attendance", { params });
  return response.data;
};

export const checkIn = async (data) => {
  const response = await api.post("/attendance/check-in", data);
  return response.data;
};

export const checkOut = async (id) => {
  const response = await api.patch(`/attendance/${id}/check-out`);
  return response.data;
};
