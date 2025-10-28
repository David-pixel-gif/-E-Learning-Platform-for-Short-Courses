// ============================================================================
// File: src/Redux/UserReducer/reducer.js
// Clean transitions, role normalization, dual action support (LOGIN_* & USER_LOGIN_*)
// ============================================================================

import { normalizeRole, writeLocalStorage, readLocalStorage } from "./action";
import {
  ISUSER_FALSE,
  ISUSER_TRUE,
  LOGIN_ERROR,
  LOGIN_LOADING,
  LOGIN_SUCCESS,
  SIGNUP_LOADING,
  SINGUP_ERROR,
  SINGUP_SUCCESS,
  USER_LOGOUT,
  AUTH_HYDRATE,
  CLEAR_ERROR,
} from "./actionType";

const saved = readLocalStorage("user");

const initial = saved || {
  email: "",
  name: "",
  role: "",
  token: "",
  isAuth: false,
  isError: "",
  loading: false,
  success: false,
  isUser: false,
  userId: "",
  place: "",
  age: "",
  job: "",
  message: "",
};

export const reducer = (state = initial, action) => {
  const { type, payload } = action;

  switch (type) {
    // -------------------------
    // HYDRATE
    // -------------------------
    case AUTH_HYDRATE: {
      const next = { ...state, ...(payload || {}) };
      if (next.role) next.role = normalizeRole(next.role);
      return next;
    }

    // -------------------------
    // LOGIN (support both namespaces)
    // -------------------------
    case LOGIN_LOADING:
    case "USER_LOGIN_LOADING":
      return {
        ...state,
        isAuth: false,
        token: "",
        isError: "",
        loading: true,
        success: false,
      };

    case LOGIN_SUCCESS:
    case "USER_LOGIN_SUCCESS": {
      const src = payload || {};
      const next = {
        ...state,
        loading: false,
        isAuth: true,
        token: src.token || state.token || "",
        name: src.name ?? state.name,
        role: normalizeRole(src.role ?? state.role),
        email: src.email ?? state.email,
        userId: src.userId ?? state.userId,
        place: src.place ?? state.place,
        age: src.age ?? state.age,
        job: src.job ?? state.job,
        message: src.message ?? "",
        isError: "",
        success: false,
        isUser: typeof src.isUser === "boolean" ? src.isUser : state.isUser,
      };
      writeLocalStorage("user", next);
      return next;
    }

    case LOGIN_ERROR:
    case "USER_LOGIN_ERROR": {
      // do NOT persist error-only state; keep last good session in storage
      return {
        ...state,
        loading: false,
        isAuth: false,
        isError: payload || "Login failed",
        token: "",
      };
    }

    // -------------------------
    // CLEAR ERROR
    // -------------------------
    case CLEAR_ERROR:
      return { ...state, isError: "" };

    // -------------------------
    // SIGN UP
    // -------------------------
    case SIGNUP_LOADING:
      return { ...state, isAuth: false, token: "", isError: "", loading: true };

    case SINGUP_SUCCESS:
      return { ...state, loading: false, success: true };

    case SINGUP_ERROR:
      return { ...state, loading: false, isError: payload };

    // -------------------------
    // IS USER FLAG
    // -------------------------
    case ISUSER_TRUE:
      return { ...state, isUser: true };

    case ISUSER_FALSE:
      return { ...state, isUser: false };

    // -------------------------
    // LOGOUT (supports literal fallback)
    // -------------------------
    case USER_LOGOUT:
    case "USER_LOGOUT":
      return {
        email: "",
        name: "",
        role: "",
        token: "",
        isAuth: false,
        isError: "",
        loading: false,
        success: false,
        isUser: false,
        userId: "",
        place: "",
        age: "",
        job: "",
        message: "",
      };

    // -------------------------
    // DEFAULT
    // -------------------------
    default:
      return state;
  }
};
