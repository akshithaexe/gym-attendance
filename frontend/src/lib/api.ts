/**
 * Axios HTTP client with Auth bearer token interceptor.
 *
 * Reads the JWT from localStorage and attaches it to every request.
 * On 401 responses, clears the token and redirects to login.
 */

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach bearer token ─────────────────

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth helpers ─────────────────────────────────────────────

export async function login(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const { access_token } = response.data;
  localStorage.setItem("access_token", access_token);
  if (typeof document !== "undefined") {
    document.cookie = `access_token=${access_token}; path=/; max-age=86400; SameSite=Lax`;
  }

  // Fetch and store user profile
  const userResponse = await api.get("/auth/me");
  localStorage.setItem("user", JSON.stringify(userResponse.data));

  return userResponse.data;
}

export async function register(
  email: string,
  fullName: string,
  password: string,
  role: string = "CUSTOMER"
) {
  const response = await api.post("/auth/register", {
    email,
    full_name: fullName,
    password,
    role,
  });
  return response.data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  if (typeof document !== "undefined") {
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
  window.location.href = "/login";
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}
