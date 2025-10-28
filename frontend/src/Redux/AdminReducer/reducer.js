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

const initialState = {
  // course list (a.k.a. “products” in legacy naming)
  data: [],
  // users list
  users: [],
  // videos list
  videos: [],

  // pagination/meta (shared shape for all list fetches)
  total: 0,
  page: 1,
  limit: 10,

  isLoading: false,
  isError: false,
};

export const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case PRODUCT_REQUEST:
      return { ...state, isLoading: true, isError: false };

    case PRODUCT_FAILURE:
      return { ...state, isLoading: false, isError: true };

    // ---------- GET (lists)
    case GET_PRODUCT_SUCCESS: {
      // payload can be either an array OR { items, total, page, limit }
      const items = Array.isArray(payload) ? payload : payload.items || [];
      const meta = !Array.isArray(payload) ? payload : {};
      return {
        ...state,
        isLoading: false,
        data: items,
        total: meta.total ?? state.total,
        page: meta.page ?? state.page,
        limit: meta.limit ?? state.limit,
      };
    }

    case GET_User_SUCCESS: {
      const items = Array.isArray(payload) ? payload : payload.items || [];
      const meta = !Array.isArray(payload) ? payload : {};
      return {
        ...state,
        isLoading: false,
        users: items,
        total: meta.total ?? state.total,
        page: meta.page ?? state.page,
        limit: meta.limit ?? state.limit,
      };
    }

    case GET_Video_SUCCESS: {
      const items = Array.isArray(payload) ? payload : payload.items || [];
      const meta = !Array.isArray(payload) ? payload : {};
      return {
        ...state,
        isLoading: false,
        videos: items,
        total: meta.total ?? state.total,
        page: meta.page ?? state.page,
        limit: meta.limit ?? state.limit,
      };
    }

    // ---------- ADD
    case ADD_PRODUCT_SUCCESS:
      return { ...state, isLoading: false, data: [payload, ...state.data] };

    case ADD_User_SUCCESS:
      return { ...state, isLoading: false, users: [payload, ...state.users] };

    case ADD_Video_SUCCESS:
      return { ...state, isLoading: false, videos: [payload, ...state.videos] };

    // ---------- PATCH (update)
    case PATCH_PRODUCT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        data: state.data.map((x) => (x.id === payload.id ? payload : x)),
      };

    case PATCH_User_SUCCESS:
      return {
        ...state,
        isLoading: false,
        users: state.users.map((x) => (x.id === payload.id ? payload : x)),
      };

    case PATCH_Video_SUCCESS:
      return {
        ...state,
        isLoading: false,
        videos: state.videos.map((x) => (x.id === payload.id ? payload : x)),
      };

    // ---------- DELETE
    case DELETE_PRODUCT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        data: state.data.filter((x) => x.id !== payload),
      };

    case DELETE_User_SUCCESS:
      return {
        ...state,
        isLoading: false,
        users: state.users.filter((x) => x.id !== payload),
      };

    case DELETE_Video_SUCCESS:
      return {
        ...state,
        isLoading: false,
        videos: state.videos.filter((x) => x.id !== payload),
      };

    default:
      return state;
  }
};
