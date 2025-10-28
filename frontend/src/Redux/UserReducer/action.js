// ============================================================================
// File: src/Redux/UserReducer/action.js
// WHY: Robust API base, role normalization, safe localStorage writes
// NOTE: Keeps your existing function names to avoid breaking imports
// SOURCE COMPAT: old code posts to `${baseURL}users/login` & `users/register`
// ============================================================================

import axios from "axios";
import {
  actionLoginError,
  actionLoginLoading,
  actionLoginSuccess,
  actionsignUpLoading,
  actionsingUpError,
  actionsingUpSuccess,
  actionHydrate,
} from "./actionType";

/* ============================================================================
   ✅ Base API Configuration
   ---------------------------------------------------------------------------
   • Uses `REACT_APP_API_URL` from .env
   • Falls back to production URL or localhost for dev
============================================================================ */
const baseURL =
  process.env.REACT_APP_API_URL ||
  "https://elearning-platform-using-mern-j5py.vercel.app/";

// Create a preconfigured axios instance to reuse everywhere
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000, // prevent long hanging requests
});

/* ============================================================================
   ✅ Role normalization — ensures consistent uppercase roles
============================================================================ */
export function normalizeRole(value) {
  if (!value) return "";
  const up = String(value).trim().toUpperCase();
  return ["ADMIN", "TEACHER", "USER"].includes(up) ? up : up;
}

/* ============================================================================
   ✅ String utility — Capitalize each word in a name
============================================================================ */
export function capitalizeFirstLetter(string) {
  const words = string?.split(" ") || [];
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/* ============================================================================
   ✅ Safe LocalStorage helpers
============================================================================ */
export function writeLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to write to localStorage:", err);
  }
}

export function readLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/* ============================================================================
   ✅ Hydrate store from saved auth snapshot
   Called on app boot or refresh to restore session
============================================================================ */
export const hydrateUserFromStorage = () => (dispatch) => {
  const saved = readLocalStorage("user");
  if (!saved) return;

  const next = { ...saved };
  if (next.role) next.role = normalizeRole(next.role);

  dispatch(actionHydrate(next));
};

/* ============================================================================
   ✅ LOGIN
   Posts to /users/login
   Accepts multiple response shapes (token + user)
============================================================================ */
export const loginFetch = (value) => async (dispatch) => {
  dispatch(actionLoginLoading());

  try {
    const { data } = await api.post("/users/login", value);

    // Flexible API response shape support
    const apiUser = data?.user || data?.user_data || data?.userInfo || {};
    const accessToken = data?.accessToken || data?.token || "";

    const mapped = {
      loading: false,
      isAuth: true,
      token: accessToken,
      name: capitalizeFirstLetter(apiUser.name || ""),
      role: normalizeRole(apiUser.role || ""),
      email: apiUser.email || "",
      userId: apiUser.id || apiUser._id || "",
      place: apiUser.city || apiUser.place || "",
      age: apiUser.age || "",
      job: apiUser.job || "",
      message: data?.msg || data?.message || "Login successful",
      isError: "",
      success: false,
      isUser: normalizeRole(apiUser.role) === "USER",
    };

    writeLocalStorage("user", mapped);
    dispatch(actionLoginSuccess(mapped));
  } catch (err) {
    console.error("Login error:", err);

    let message =
      err?.response?.data?.message ||
      err?.response?.data?.msg ||
      err?.message ||
      "Login failed";

    // Helpful hints for debugging
    if (err?.code === "ERR_NETWORK") {
      message =
        "Network error: Backend unreachable. Check your API URL or CORS setup.";
    } else if (err?.response?.status === 404) {
      message = "404: API endpoint not found. Check /users/login path.";
    }

    dispatch(actionLoginError(message));
  }
};

/* ============================================================================
   ✅ SIGN UP
   Registers a new user via /users/register
============================================================================ */
export const signUpFetch = (value) => async (dispatch) => {
  dispatch(actionsignUpLoading());

  try {
    await api.post("/users/register", value);
    dispatch(actionsingUpSuccess());
  } catch (err) {
    console.error("Sign-up error:", err);

    let message =
      err?.response?.data?.message ||
      err?.response?.data?.msg ||
      err?.message ||
      "Sign up failed";

    if (err?.code === "ERR_NETWORK") {
      message =
        "Network error: Could not connect to server. Check your baseURL or proxy.";
    }

    dispatch(actionsingUpError(message));
  }
};

/* ============================================================================
   ✅ LOGOUT
   Clears local storage and resets Redux state
============================================================================ */
export const logoutUser = () => (dispatch) => {
  removeLocalStorage("user");
  dispatch({ type: "USER_LOGOUT" }); // maintain backward compat
};
