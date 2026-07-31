import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";

import UserDashboard from "./pages/user/Dashboard";
import UserHistory from "./pages/user/History";
import UserTimeInOut from "./pages/user/TimeInOut";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
/* import AdminAppointments from "./pages/admin/Appoinment"; */
import AdminVisitors from "./pages/admin/Visitors";
import AdminReports from "./pages/admin/Reports";
import AdminLayout from "./layout/AdminLayout";
import AdminPasses from "./pages/admin/Passes";

import ReceptionistLayout from "./pages/receptionist/ReceptionistLayout";
import ReceptionistCheckout from "./pages/receptionist/Checkout";
import ReceptionistCheckIn from "./pages/receptionist/Checkin";
import ReceptionistPasses from "./pages/receptionist/Passes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* User */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/history"
          element={
            <ProtectedRoute role="user">
              <UserHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/timeinout"
          element={
            <ProtectedRoute role="user">
              <UserTimeInOut />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist"
          element={
            <ProtectedRoute role="staff">
              <ReceptionistLayout />
            </ProtectedRoute>
          }
        >
          <Route path="checkin" element={<ReceptionistCheckIn />} />
          <Route path="checkout" element={<ReceptionistCheckout />} />
          <Route path="passes" element={<ReceptionistPasses />} />
        </Route>

        {/* Admin (WITH SIDEBAR LAYOUT) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="visitors" element={<AdminVisitors />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="passes" element={<AdminPasses />} />
          <Route path="checkout" element={<ReceptionistCheckout />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
