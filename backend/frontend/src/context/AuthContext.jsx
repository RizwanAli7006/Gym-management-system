import { createContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile
} from "../services/authService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("gym_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();

        if (data.success && data.user) {
          setUser(data.user);

          localStorage.setItem(
            "gym_user",
            JSON.stringify(data.user)
          );
        } else {
          localStorage.removeItem("gym_token");
          localStorage.removeItem("gym_user");
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem("gym_token");
        localStorage.removeItem("gym_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (data) => {
    const response = await loginUser(data);

    if (response.success && response.user) {
      setUser(response.user);
    }

    return response;
  };

  const register = async (data) => {
    const response = await registerUser(data);

    if (response.success && response.user) {
      setUser(response.user);
    }

    return response;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await updateUserProfile(data);

    if (response.success && response.user) {
      setUser(response.user);
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

