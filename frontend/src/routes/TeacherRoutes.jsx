// src/routes/TeacherRoutes.jsx
// Export a JSX fragment of <Route> elements, to be embedded inside <Routes>.
// Works with: import teacherRoutes from "./TeacherRoutes";  … {teacherRoutes}

import React from "react";
import { Route, Navigate } from "react-router-dom";
import PrivateRoutes from "./PrivateRoutes";

// Teacher Components
import TeachVerify from "../components/TeacherComponents/TeachVerify";
import TeacherDashboard from "../components/TeacherComponents/TeacherDashboard";
import TeacherCourses from "../components/TeacherComponents/TeacherCourses";
import AddTeacherCourse from "../components/TeacherComponents/AddCourse";
import AddTeacherVideos from "../components/TeacherComponents/AddTeacherVideos";
import AddTeacher from "../components/TeacherComponents/AddTeacher";
import GetTeacherVideos from "../components/TeacherComponents/GetTeacherVideos";

const teacherRoutes = (
  <Route element={<PrivateRoutes allowedRoles={["TEACHER", "ADMIN"]} />}>
    <Route path="/teacher/verify" element={<TeachVerify />} />
    <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
    <Route path="/teacher/courses" element={<TeacherCourses />} />
    <Route path="/teacher/videos" element={<GetTeacherVideos />} />
    <Route path="/teacher/videos/add/:courseId" element={<AddTeacherVideos />} />
    <Route path="/teacher/add" element={<AddTeacher />} />
    <Route path="/teacher/addCourse" element={<AddTeacherCourse />} />
    {/* default shortcut */}
    <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
  </Route>
);

export default teacherRoutes;
