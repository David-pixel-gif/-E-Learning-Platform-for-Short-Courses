// ============================================================================
// File: src/Redux/UserReducer/actionType.js
// WHY: Centralized, explicit action names; minimal extras for hydration/logout
// ============================================================================
export const LOGIN_SUCCESS = "LOGIN_SUCCESS";
export const LOGIN_ERROR = "LOGIN_ERROR";
export const LOGIN_LOADING = "LOGIN_LOADING";

export const SIGNUP_LOADING = "SIGNUP_LOADING";
export const SINGUP_SUCCESS = "SINGUP_SUCCESS";
export const SINGUP_ERROR = "SINGUP_ERROR";

export const ISUSER_TRUE = "ISUSER_TRUE";
export const ISUSER_FALSE = "ISUSER_FALSE";

export const USER_LOGOUT = "USER_LOGOUT";
export const AUTH_HYDRATE = "AUTH_HYDRATE";
export const CLEAR_ERROR = "CLEAR_ERROR";

export function actionLoginLoading() {
  return { type: LOGIN_LOADING };
}
export function actionLoginSuccess(payload) {
  return { type: LOGIN_SUCCESS, payload };
}
export function actionLoginError(payload) {
  return { type: LOGIN_ERROR, payload };
}

export function actionsignUpLoading() {
  return { type: SIGNUP_LOADING };
}
export function actionsingUpSuccess() {
  return { type: SINGUP_SUCCESS };
}
export function actionsingUpError(payload) {
  return { type: SINGUP_ERROR, payload };
}

export function actionisUserTrue() {
  return { type: ISUSER_TRUE };
}
export function actionisUserFalse() {
  return { type: ISUSER_FALSE };
}

export function actionUserLogout() {
  return { type: USER_LOGOUT };
}
export function actionHydrate(payload) {
  return { type: AUTH_HYDRATE, payload };
}
export function actionClearError() {
  return { type: CLEAR_ERROR };
}
