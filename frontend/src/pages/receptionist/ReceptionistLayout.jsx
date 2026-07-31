import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function ReceptionistLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-indigo-600">
              Reception Panel
            </h1>

            <div className="flex gap-6 text-sm font-medium">
              <NavLink
                to="/receptionist/checkin"
                className={({ isActive }) =>
                  isActive
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-600 hover:text-indigo-600"
                }
              >
                Check In
              </NavLink>

              <NavLink
                to="/receptionist/checkout"
                className={({ isActive }) =>
                  isActive
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-600 hover:text-indigo-600"
                }
              >
                Check Out
              </NavLink>

              <NavLink
                to="/receptionist/passes"
                className={({ isActive }) =>
                    isActive
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-600 hover:text-indigo-600"
                }
                >
                Passes
                </NavLink>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div className="p-8">
        <Outlet />
      </div>
    </div>
  );
}