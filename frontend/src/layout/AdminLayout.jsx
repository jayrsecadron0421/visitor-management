import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
