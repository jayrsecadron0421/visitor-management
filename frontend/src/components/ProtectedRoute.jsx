import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;

  if (role && role !== userRole) {
    if (userRole === "admin") return <Navigate to="/admin/dashboard" />;
    if (userRole === "staff") return <Navigate to="/receptionist/checkout" />;
    return <Navigate to="/user/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
