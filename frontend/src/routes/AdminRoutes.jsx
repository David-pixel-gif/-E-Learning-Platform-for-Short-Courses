// src/routes/AdminRoutes.jsx
import React from "react";
import { Route } from "react-router-dom";
import PrivateRoutes from "./PrivateRoutes";

// ✅ Admin Components
import AdminDashboard from "../components/Adminitems/AdminDashboard";
import Courses from "../components/Adminitems/Courses";
import EditPage from "../components/Adminitems/EditPage";
import AddCourse from "../components/Adminitems/AddCourse";
import Discount from "../components/Adminitems/Discount";
import Statistics from "../components/Adminitems/Statistics";
import Setting from "../components/Adminitems/Setting";
import GiftCard from "../components/Adminitems/GiftCard";
import Users from "../components/Adminitems/Users";
import AddUser from "../components/Adminitems/AddUser";
import EditUser from "../components/Adminitems/EditUsers";
import GetVideos from "../components/Adminitems/GetVideos";
import AddVideo from "../components/Adminitems/AddVideos";
import Add from "../components/Adminitems/Add";

// ✅ Export routes guarded by PrivateRoutes
const adminRoutes = (
  <Route element={<PrivateRoutes allowedRoles={["ADMIN"]} />}>
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/courses" element={<Courses />} />
    <Route path="/admin/edit/:id" element={<EditPage />} />
    <Route path="/admin/add-course" element={<AddCourse />} />
    <Route path="/admin/discount" element={<Discount />} />
    <Route path="/admin/statistics" element={<Statistics />} />
    <Route path="/admin/giftcard" element={<GiftCard />} />
    <Route path="/admin/setting" element={<Setting />} />
    <Route path="/admin/users" element={<Users />} />
    <Route path="/admin/users/add" element={<AddUser />} />
    <Route path="/admin/users/edit/:id" element={<EditUser />} />
    <Route path="/admin/videos" element={<GetVideos />} />
    <Route path="/admin/videos/add" element={<AddVideo />} />
    <Route path="/admin/add" element={<Add />} />
  </Route>
);

export default adminRoutes;
