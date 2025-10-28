// ✅ Elearning Platform Unified API Client
// Works with backend routes: /users, /courses, /videos, /admin

import axios from "axios";

/* -------------------------------------------------------
   🌐 API Base URL — detects environment automatically
-------------------------------------------------------- */
const PROD_FALLBACK = "https://elearning-platform-using-mern-j5py.vercel.app";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:8080"
    : PROD_FALLBACK);

if (typeof window !== "undefined") {
  console.log("📡 API Base URL:", API_BASE_URL);
}

/* -------------------------------------------------------
   🧠 Session Helpers
-------------------------------------------------------- */
const SESSION_KEY = "user";
const LEGACY_TOKEN_KEY = "token";
const LEGACY_REFRESH_KEY = "refreshToken";

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function writeSession(next) {
  try {
    if (!next) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_REFRESH_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    if (next.token) localStorage.setItem(LEGACY_TOKEN_KEY, next.token);
    if (next.refreshToken)
      localStorage.setItem(LEGACY_REFRESH_KEY, next.refreshToken);
  } catch {
    /* ignore serialization errors */
  }
}

export const clearSession = () => writeSession(null);
export const isAuthed = () => !!readSession()?.token;

/* -------------------------------------------------------
   ⚙️ Axios Configuration
-------------------------------------------------------- */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach Authorization token automatically
api.interceptors.request.use((config) => {
  const token = readSession()?.token || localStorage.getItem(LEGACY_TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* -------------------------------------------------------
   🔁 Token Refresh Logic
-------------------------------------------------------- */
let refreshingPromise = null;
let sessionToastShown = false;

async function refreshAccessToken() {
  if (refreshingPromise) return refreshingPromise;

  const session = readSession();
  const rTok =
    session?.refreshToken || localStorage.getItem(LEGACY_REFRESH_KEY);
  if (!rTok) return null;

  refreshingPromise = axios
    .get(`${API_BASE_URL}/regenerateToken`, {
      headers: { Authorization: `Bearer ${rTok}` },
      withCredentials: true,
    })
    .then(({ data }) => {
      const newToken = data?.token;
      if (!newToken) return null;
      const next = { ...(session || {}), token: newToken, isAuth: true };
      writeSession(next);
      return newToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshingPromise = null;
    });

  return refreshingPromise;
}

/* -------------------------------------------------------
   🚨 Global Response Interceptor for 401
-------------------------------------------------------- */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config || {};

    if (status === 401 && !original._retry) {
      original._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Prevent multiple toasts
      if (!sessionToastShown) {
        sessionToastShown = true;
        if (typeof window !== "undefined" && window.ChakraToast) {
          window.ChakraToast({
            title: "Session expired",
            description: "Please log in again.",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
        setTimeout(() => (sessionToastShown = false), 5000);
      }

      // Clear session & redirect
      clearSession();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(err);
  }
);

/* -------------------------------------------------------
   👤 USERS API (Admin + Teacher + Student)
-------------------------------------------------------- */
export const UserAPI = {
  // --- Authentication ---
  register: (payload) => api.post("/users/register", payload),

  login: async (payload) => {
    const { data } = await api.post("/users/login", payload);
    const next = {
      id: data?.user?.id,
      name: data?.user?.name,
      email: data?.user?.email,
      role: data?.user?.role,
      token: data?.token,
      refreshToken: data?.refreshToken,
      user: data?.user,
      isAuth: true,
    };
    writeSession(next);
    return data;
  },

  logout: async () => {
    try {
      await api.post("/users/logout");
    } catch {}
    clearSession();
    return true;
  },

  // --- Profile & Personal Data ---
  profile: () => api.get("/users/profile"),
  enrolled: () => api.get("/users/enrolled"),
  progress: () => api.get("/users/progress"),
  certificates: () => api.get("/users/certificates"),

  // --- Admin & Teacher Management ---
  list: (params = {}) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
};

/* -------------------------------------------------------
   🎓 COURSES API
-------------------------------------------------------- */
export const CourseAPI = {
  list: (params = {}) => api.get("/courses", { params }),
  create: (payload) => api.post("/courses", payload),
  getById: (id) => api.get(`/courses/${id}`),
  update: (id, payload) => api.put(`/courses/${id}`, payload),
  remove: (id) => api.delete(`/courses/${id}`),

  // Enrollment + Progress
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  progress: (id) => api.get(`/courses/${id}/progress`),
};

/* -------------------------------------------------------
   🎥 VIDEOS API
-------------------------------------------------------- */
export const VideoAPI = {
  list: (params = {}) => api.get("/videos", { params }),
  create: (payload) => api.post("/videos", payload),
  getById: (id) => api.get(`/videos/${id}`),
  update: (id, payload) => api.put(`/videos/${id}`, payload),
  remove: (id) => api.delete(`/videos/${id}`),

  // Watch tracking
  markWatched: (id) => api.post(`/videos/${id}/watched`),
  progress: (id) => api.get(`/videos/${id}/progress`),
};

/* -------------------------------------------------------
   🧮 ADMIN API
-------------------------------------------------------- */
export const AdminAPI = {
  stats: (params = {}) => api.get("/admin/stats", { params }),
};

export default api;
