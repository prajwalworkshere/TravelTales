
import { Routes, Route } from "react-router-dom";

// Public Pages
import Home from "../pages/public/Home";
import Explore from "../pages/public/Explore";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import NotFound from "../pages/public/NotFound";
import BlogDetails from "../pages/public/BlogDetails";
import DestinationDetails from "../pages/public/DestinationDetails";

// Authentication Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// User Pages
import CreateBlog from "../pages/user/CreateBlog";
import MyBlogs from "../pages/user/MyBlogs";
import EditBlog from "../pages/user/EditBlog";
import Profile from "../pages/user/Profile";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageBlogs from "../pages/admin/ManageBlogs";
import ManageDestinations from "../pages/admin/ManageDestinations";
import ManageContactMessages from "../pages/admin/ManageContactMessages";

// Route Protection
import ProtectedRoute from "../components/common/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}

      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blogs/:id" element={<BlogDetails />} />
      <Route path="/destinations/:id" element={<DestinationDetails />} />

      {/* AUTHENTICATION ROUTES */}

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED USER ROUTES */}

      <Route element={<ProtectedRoute />}>
        <Route path="/create-blog" element={<CreateBlog />} />
        <Route path="/my-blogs" element={<MyBlogs />} />
        <Route path="/edit-blog/:id" element={<EditBlog />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* PROTECTED ADMIN ROUTES */}

      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/blogs" element={<ManageBlogs />} />
        <Route path="/admin/destinations" element={<ManageDestinations />} />
        <Route path="/admin/messages" element={<ManageContactMessages />} />
      </Route>

      {/* 404 - NOT FOUND */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
