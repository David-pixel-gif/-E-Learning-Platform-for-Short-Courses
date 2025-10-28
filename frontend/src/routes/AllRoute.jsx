// src/routes/AllRoute.jsx
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

// Common Pages
import LandingPage from "../Pages/LandingPage";
import PageNotFound from "../Pages/PageNotFound";
import SinglePage from "../components/singlePageComps/SinglePage";
import Login from "../components/LogIn";
import SignUp from "../components/SignUp";
import Payment from "../Pages/Payment/Payment";
import ProfilePage from "../Pages/ProfilePage";

// Route Guards
import PrivateRoutes from "./PrivateRoutes";

// Role-based routes (exported as <Route> definitions)
import adminRoutes from "./AdminRoutes";
import teacherRoutes from "./TeacherRoutes";
import userRoutes from "./UserRoutes";

const AllRoute = () => {
  return (
    <Routes>
      {/* Public Routes */}
      {/* Redirect root to /home for consistency */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/singlepage/:id" element={<SinglePage />} />

      {/* Role-specific Routes */}
      {adminRoutes}
      {teacherRoutes}
      {userRoutes}

      {/* Shared Protected Routes */}
      <Route
        path="/payment"
        element={
          <PrivateRoutes allowedRoles={["USER", "TEACHER", "ADMIN"]}>
            <Payment />
          </PrivateRoutes>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoutes allowedRoles={["USER", "TEACHER", "ADMIN"]}>
            <ProfilePage />
          </PrivateRoutes>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default AllRoute;
