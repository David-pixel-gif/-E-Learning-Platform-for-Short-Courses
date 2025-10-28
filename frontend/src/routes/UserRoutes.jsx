// src/routes/UserRoutes.jsx
import React from "react";
import { Route } from "react-router-dom";
import PrivateRoutes from "./PrivateRoutes";

// User Components
import UserDashboard from "../components/UserComponents/UserDashboard";
import ExamsPage from "../components/UserComponents/ExamsPage";
import ResultsPage from "../components/UserComponents/ResultsPage";
import CertificatesPage from "../components/UserComponents/CertificatesPage";
import StatusPage from "../components/UserComponents/StatusPage";
import ProgressPage from "../components/UserComponents/ProgressPage";
import CourseworkPage from "../components/UserComponents/CourseworkPage";
import MockTestPage from "../components/UserComponents/MockTestPage";

/**
 * Define all student-specific routes.
 * These are nested under /dashboard and protected by PrivateRoutes
 */
const UserRoutes = (
  <Route element={<PrivateRoutes allowedRoles={["USER"]} />}>
    <Route path="/dashboard" element={<UserDashboard />}>
      <Route index element={<StatusPage />} />
      <Route path="coursework" element={<CourseworkPage />} />
      <Route path="exams" element={<ExamsPage />} />
      <Route path="mock-tests" element={<MockTestPage />} />
      <Route path="progress" element={<ProgressPage />} />
      <Route path="results" element={<ResultsPage />} />
      <Route path="certificates" element={<CertificatesPage />} />
    </Route>
  </Route>
);

export default UserRoutes;
