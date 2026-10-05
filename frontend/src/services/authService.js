import api from "./api";

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);

  if (response.data.token) {
    localStorage.setItem("gym_token", response.data.token);
  }

  if (response.data.user) {
    localStorage.setItem(
      "gym_user",
      JSON.stringify(response.data.user)
    );
  }

  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);

  if (response.data.token) {
    localStorage.setItem("gym_token", response.data.token);
  }

  if (response.data.user) {
    localStorage.setItem(
      "gym_user",
      JSON.stringify(response.data.user)
    );
  }

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  }

  localStorage.removeItem("gym_token");
  localStorage.removeItem("gym_user");
};

export const updateUserProfile = async (data) => {
  const response = await api.put("/auth/profile", data);

  if (response.data.user) {
    localStorage.setItem(
      "gym_user",
      JSON.stringify(response.data.user)
    );
  }

  return response.data;
};

