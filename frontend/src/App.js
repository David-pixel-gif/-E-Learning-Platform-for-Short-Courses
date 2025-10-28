// src/App.js
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import AllRoute from "./routes/AllRoute";
import Navbar from "./components/UserComponents/UserNavbar";

function App() {
  const storeUser = useSelector((s) => s?.UserReducer || {});
  const role = useMemo(() => {
    const fromStore = storeUser?.role || storeUser?.user?.role;
    let fromLS = null;
    try {
      fromLS = JSON.parse(localStorage.getItem("user") || "null")?.role;
    } catch (_) {}
    return String(fromStore || fromLS || "").toUpperCase();
  }, [storeUser?.role, storeUser?.user?.role]);

  const isStaff = role === "ADMIN" || role === "TEACHER";

  return (
    <div className="App">
      {/* Show the User navbar only for non-staff roles */}
      {!isStaff && <Navbar />}
      <AllRoute />
    </div>
  );
}

export default App;
