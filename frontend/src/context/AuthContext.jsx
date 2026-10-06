import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = "https://omnisight-api.onrender.com/api";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem("omnisight_token"));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the current user whenever we have a token (on load, or after login)
  const fetchMe = useCallback(async (authToken) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Session expired");
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      // Token invalid/expired — clear everything
      localStorage.removeItem("omnisight_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchMe]);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      // Unverified account — a fresh OTP was just sent server-side.
      // Throw a special error the Login page can detect and redirect on.
      if (data.needsVerification) {
        const err = new Error(data.error);
        err.needsVerification = true;
        err.email = data.email;
        throw err;
      }
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("omnisight_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Registration now sends an OTP instead of logging in immediately.
  // Returns { message, email } — the Signup page moves to a verify step.
  const register = async (name, email, password) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Registration failed");
    return data; // { message, email }
  };

  // Verifies the 6-digit code and logs the user in (sets token + user)
  const verifyOtp = async (email, otp) => {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Verification failed");

    localStorage.setItem("omnisight_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const resendOtp = async (email) => {
    const response = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not resend code");
    return data;
  };

  const logout = () => {
    localStorage.removeItem("omnisight_token");
    setToken(null);
    setUser(null);
  };

  // Call this after updating profile/preferences so context stays in sync
  const refreshUser = () => {
    if (token) fetchMe(token);
  };

  // Small helper: every authenticated fetch should include this header
  const authHeader = () => (token ? { Authorization: `Bearer ${token}` } : {});

  return (
    <AuthContext.Provider
      value={{
        user, token, isLoading, isAuthenticated: !!user,
        login, register, verifyOtp, resendOtp, logout, refreshUser, authHeader
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}