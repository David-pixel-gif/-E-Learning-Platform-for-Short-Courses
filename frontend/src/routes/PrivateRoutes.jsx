// src/routes/PrivateRoutes.jsx
import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PrivateRoutes({ allowedRoles = [] }) {
  // Read from Redux OR from localStorage as a fallback
  const storeUser = useSelector((s) => s?.UserReducer || {});
  const location = useLocation();

  const role = useMemo(() => {
    const fromStore = storeUser?.role || storeUser?.user?.role;
    let fromLS = null;
    try {
      fromLS = JSON.parse(localStorage.getItem("user") || "null")?.role;
    } catch {}
    return String(fromStore || fromLS || "").toUpperCase();
  }, [storeUser?.role, storeUser?.user?.role]);

  // if no role / not logged in -> send to login
  if (!role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // if route requires specific roles and role not allowed -> send home (or 403 page)
  if (allowedRoles.length > 0 && !allowedRoles.map(String).includes(role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ VERY IMPORTANT: render nested routes here
  return <Outlet />;
}
