export const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  USER: "USER",
});

// WHY: prevent route guard mismatches due to casing
export function normalizeRole(v) {
  if (!v) return null;
  const s = String(v).trim().toUpperCase();
  return Object.values(ROLES).includes(s) ? s : null;
}
