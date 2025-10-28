import axios from "axios";
import {
  ADD_PRODUCT_SUCCESS,
  ADD_User_SUCCESS,
  ADD_Video_SUCCESS,
  DELETE_PRODUCT_SUCCESS,
  DELETE_User_SUCCESS,
  DELETE_Video_SUCCESS,
  GET_PRODUCT_SUCCESS,
  GET_User_SUCCESS,
  GET_Video_SUCCESS,
  PATCH_PRODUCT_SUCCESS,
  PATCH_User_SUCCESS,
  PATCH_Video_SUCCESS,
  PRODUCT_FAILURE,
  PRODUCT_REQUEST,
} from "./actionType";

// Prefer env var, fall back to local dev
const API_BASE =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

// ---------- helpers
const authHeader = () => {
  try {
    const raw = localStorage.getItem("user");
    const token =
      raw && JSON.parse(raw)?.token
        ? JSON.parse(raw).token
        : localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const handleError = (dispatch, err) => {
  console.error(err);
  dispatch({ type: PRODUCT_FAILURE });
};

// =======================================
// COURSES (a.k.a. “products” in legacy UI)
// =======================================

/**
 * Fetch courses with optional pagination/search/sort
 * @param {number} page
 * @param {number} limit
 * @param {string} search
 * @param {"asc"|"desc"|""} order - price order
 */
export const getProduct =
  (page = 1, limit = 10, search = "", order = "") =>
  async (dispatch) => {
    dispatch({ type: PRODUCT_REQUEST });
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (order) params.sort = `price:${order}`; // backend expects "price:asc|desc"

      const { data } = await axios.get(`${API_BASE}/courses`, {
        params,
        headers: authHeader(),
      });

      // Accept array or {items,total,page,limit}
      dispatch({
        type: GET_PRODUCT_SUCCESS,
        payload: Array.isArray(data)
          ? data
          : {
              items: data.items || [],
              total: data.total ?? 0,
              page: data.page ?? page,
              limit: data.limit ?? limit,
            },
      });
    } catch (err) {
      handleError(dispatch, err);
    }
  };

export const addProduct = (payload) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    const { data } = await axios.post(`${API_BASE}/courses`, payload, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    dispatch({ type: ADD_PRODUCT_SUCCESS, payload: data });
  } catch (err) {
    handleError(dispatch, err);
  }
};

export const patchProduct = (id, updates) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    const { data } = await axios.patch(`${API_BASE}/courses/${id}`, updates, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    dispatch({ type: PATCH_PRODUCT_SUCCESS, payload: data });
  } catch (err) {
    handleError(dispatch, err);
  }
};

export const deleteProduct = (id) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    await axios.delete(`${API_BASE}/courses/${id}`, {
      headers: authHeader(),
    });
    dispatch({ type: DELETE_PRODUCT_SUCCESS, payload: id });
  } catch (err) {
    handleError(dispatch, err);
  }
};

// ======================
// USERS (admin listing)
// ======================

export const getUsers =
  (page = 1, limit = 10, search = "", role = "") =>
  async (dispatch) => {
    dispatch({ type: PRODUCT_REQUEST });
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (role) params.role = role;

      const { data } = await axios.get(`${API_BASE}/users`, {
        params,
        headers: authHeader(),
      });

      dispatch({
        type: GET_User_SUCCESS,
        payload: Array.isArray(data)
          ? data
          : { items: data.items || [], total: data.total ?? 0, page, limit },
      });
    } catch (err) {
      handleError(dispatch, err);
    }
  };

export const addUser = (payload) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    const { data } = await axios.post(`${API_BASE}/users/register`, payload, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    dispatch({ type: ADD_User_SUCCESS, payload: data });
  } catch (err) {
    handleError(dispatch, err);
  }
};

export const patchUser = (id, updates) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    const { data } = await axios.patch(`${API_BASE}/users/${id}`, updates, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    dispatch({ type: PATCH_User_SUCCESS, payload: data });
  } catch (err) {
    handleError(dispatch, err);
  }
};

export const deleteUser = (id) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    await axios.delete(`${API_BASE}/users/${id}`, { headers: authHeader() });
    dispatch({ type: DELETE_User_SUCCESS, payload: id });
  } catch (err) {
    handleError(dispatch, err);
  }
};

// ======================
// VIDEOS (per course)
// ======================

export const getVideos =
  (courseId, page = 1, limit = 10) =>
  async (dispatch) => {
    dispatch({ type: PRODUCT_REQUEST });
    try {
      const { data } = await axios.get(`${API_BASE}/videos`, {
        params: { courseId, page, limit },
        headers: authHeader(),
      });

      dispatch({
        type: GET_Video_SUCCESS,
        payload: Array.isArray(data)
          ? data
          : { items: data.items || [], total: data.total ?? 0, page, limit },
      });
    } catch (err) {
      handleError(dispatch, err);
    }
  };

export const addVideo = (payload, courseId) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    const { data } = await axios.post(
      `${API_BASE}/videos`,
      { ...payload, courseId },
      { headers: { "Content-Type": "application/json", ...authHeader() } }
    );
    dispatch({ type: ADD_Video_SUCCESS, payload: data });
  } catch (err) {
    handleError(dispatch, err);
  }
};

export const patchVideo = (id, updates) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    const { data } = await axios.patch(`${API_BASE}/videos/${id}`, updates, {
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    dispatch({ type: PATCH_Video_SUCCESS, payload: data });
  } catch (err) {
    handleError(dispatch, err);
  }
};

export const deleteVideo = (id) => async (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  try {
    await axios.delete(`${API_BASE}/videos/${id}`, {
      headers: authHeader(),
    });
    dispatch({ type: DELETE_Video_SUCCESS, payload: id });
  } catch (err) {
    handleError(dispatch, err);
  }
};
// --- BEGIN: compatibility shims & small utils ---

/**
 * Format an ISO date/time or Date into a short, readable label.
 * Examples:
 *  - "2025-08-22T11:21:33.797Z" -> "Aug 22, 2025"
 *  - new Date() -> "Aug 22, 2025"
 */
function convertDateFormat(input) {
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return String(input) || "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(input) || "";
  }
}

// Some components import these older/mismatched names.
// Map them to the currently exported thunks to avoid breaking changes.
export const getvideo = typeof getVideos === "function" ? getVideos : undefined;
export const getUser = typeof getUsers === "function" ? getUsers : undefined;
export const deleteUsers =
  typeof deleteUser === "function" ? deleteUser : undefined;

// Keep named export available too (in case you later switch imports)
export { convertDateFormat };

// Default export so existing `import convertDateFormat from .../action` keeps working
export default convertDateFormat;

// --- END: compatibility shims & small utils ---
