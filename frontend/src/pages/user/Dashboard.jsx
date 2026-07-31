import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import UserHistory from "./History"; // Make sure the path is correct

export default function UserDashboard() {
  const navigate = useNavigate();
  const [visitCode, setVisitCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    company: "",
    reason: "",
  });

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const visitorRes = await api.post("/visitors", formData);
      const visitorId = visitorRes.data.id;
      const code = generateCode();

      await api.post("/visits/create-with-code", {
        visitor_id: visitorId,
        code: code,
      });

      setVisitCode(code);
      setActiveTab("home"); // Return to home to see the success card
      setFormData({ full_name: "", email: "", phone_number: "", company: "", reason: "" });
    } catch (error) {
      console.error("Error creating visit:", error);
      alert("Failed to create visit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 cursor-pointer" onClick={() => setActiveTab("home")}>
                Visitor Management
            </h1>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => {setActiveTab("new-visit"); setVisitCode(null);}}
                className={`font-medium ${activeTab === "new-visit" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
              >
                New Visit
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`font-medium ${activeTab === "history" ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
              >
                My Visits
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB: HISTORY */}
        {activeTab === "history" && <UserHistory />}

        {/* SUCCESS CARD (Visible on Home after registration) */}
        {activeTab === "home" && visitCode && (
          <div className="mb-8 bg-linear-to-r from-green-500 to-emerald-600 rounded-xl shadow-xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">Visit Registered!</h2>
            <div className="bg-white text-gray-900 rounded-lg p-6 my-6 inline-block">
              <p className="text-sm text-gray-600 mb-2">Your Visit Code</p>
              <div className="text-5xl font-bold tracking-widest font-mono">{visitCode}</div>
              <p className="text-sm text-gray-600 mt-3">Present this to the receptionist</p>
            </div>
            <br />
            <button
              onClick={() => setVisitCode(null)}
              className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB: HOME (Welcome Screen) */}
        {activeTab === "home" && !visitCode && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-6">Need to register a visitor? Get started below.</p>
            <button
              onClick={() => setActiveTab("new-visit")}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold"
            >
              Register New Visit
            </button>
          </div>
        )}

        {/* TAB: NEW VISIT FORM */}
        {activeTab === "new-visit" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Visitor Registration</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => handleInputChange("reason", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab("home")}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Generate Visit Code"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}