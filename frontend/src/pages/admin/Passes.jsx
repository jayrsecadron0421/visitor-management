import { useEffect, useState } from "react";
import { Key, CheckCircle, XCircle, RefreshCw, Plus } from "lucide-react";
import api from "../../api/axios";

export default function AdminPasses() {
  const [passes, setPasses] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, borrowed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, available, borrowed

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [passesRes, statsRes] = await Promise.all([
        api.get(`/admin/passes${filter !== "all" ? `?status=${filter}` : ""}`),
        api.get("/admin/passes/stats"),
      ]);
      setPasses(passesRes.data || []);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching passes:", error);
      setLoading(false);
    }
  };

  const initializePasses = async () => {
    if (!confirm("This will create passes 1-1000. Continue?")) return;
    try {
      await api.post("/admin/passes/initialize");
      alert("Passes initialized successfully!");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to initialize passes");
    }
  };

  const resetPass = async (id, passNumber) => {
    if (!confirm(`Reset pass #${passNumber} to available?`)) return;
    try {
      await api.post(`/admin/passes/${id}/reset`);
      fetchData();
    } catch (error) {
      alert("Failed to reset pass");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading passes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visitor Pass Management</h1>
            <p className="text-gray-500 mt-1">Manage physical visitor passes (1-1000)</p>
          </div>
          <button
            onClick={initializePasses}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Initialize Passes
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Passes"
            value={stats.total}
            icon={<Key size={20} />}
            color="blue"
          />
          <StatCard
            title="Available"
            value={stats.available}
            icon={<CheckCircle size={20} />}
            color="green"
          />
          <StatCard
            title="Borrowed"
            value={stats.borrowed}
            icon={<XCircle size={20} />}
            color="orange"
          />
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter("available")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "available"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Available ({stats.available})
          </button>
          <button
            onClick={() => setFilter("borrowed")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "borrowed"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Borrowed ({stats.borrowed})
          </button>
        </div>

        {/* Passes Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {passes.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No passes found. Click "Initialize Passes" to create 1000 passes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {passes.map((pass) => (
                <PassCard
                  key={pass.id}
                  pass={pass}
                  onReset={resetPass}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PassCard({ pass, onReset }) {
  const isAvailable = pass.status === "available";

  return (
    <div
      className={`relative group p-4 rounded-lg border-2 transition-all ${
        isAvailable
          ? "bg-green-50 border-green-200 hover:border-green-400"
          : "bg-orange-50 border-orange-200 hover:border-orange-400"
      }`}
    >
      <div className="text-center">
        <div className={`text-2xl font-bold ${isAvailable ? "text-green-700" : "text-orange-700"}`}>
          {pass.pass_number}
        </div>
        <div className={`text-xs font-medium mt-1 ${isAvailable ? "text-green-600" : "text-orange-600"}`}>
          {isAvailable ? "Available" : "Borrowed"}
        </div>
      </div>

      {!isAvailable && (
        <button
          onClick={() => onReset(pass.id, pass.pass_number)}
          className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1"
        >
          <RefreshCw size={14} />
          Reset
        </button>
      )}
    </div>
  );
}
