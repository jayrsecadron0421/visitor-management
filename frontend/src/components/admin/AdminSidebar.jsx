import { NavLink, useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive
        ? "bg-gray-800 text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="w-60 bg-white border-r min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

      <nav className="space-y-2">
        <NavLink to="/admin/dashboard" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/admin/users" className={linkClass}>
          Users
        </NavLink>

        <NavLink to="/admin/visitors" className={linkClass}>
          Visitors
        </NavLink>

        {/* 🔥 NEW: Passes link */}
        <NavLink to="/admin/passes" className={linkClass}>
          Visitor Passes
        </NavLink>

        <NavLink to="/admin/reports" className={linkClass}>
          Reports
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 rounded text-red-600 hover:bg-red-50 mt-6"
        >
          Logout
        </button>
      </nav>
    </div>
  );
}
