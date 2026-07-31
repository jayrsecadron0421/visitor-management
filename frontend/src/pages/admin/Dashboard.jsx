import { useEffect, useState } from "react";
import { Users, MapPin, ShieldAlert, Bell, Clock, LogOut, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import KpiCard from "../../components/admin/KpiCard";
import StatusBadge from "../../components/admin/StatusBadge";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ visitorsToday: 0, insideNow: 0, totalUsers: 0, unreadNotifications: 0 });
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [vToday, vInside, uCount, aUnread, vRecent] = await Promise.all([
        api.get("/admin/stats/visitors-today"),
        api.get("/admin/stats/inside-now"),
        api.get("/admin/users/count"),
        api.get("/admin/stats/unread-alerts"),
        api.get("/visits?limit=5"),
      ]);

      setStats({
        visitorsToday: vToday.data.total,
        insideNow: vInside.data.total,
        totalUsers: uCount.data.total,
        unreadNotifications: aUnread.data.total,
      });
      setRecentVisits(vRecent.data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const formatTime = (date) => date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 font-medium">Welcome back, Admin.</p>
        </div>
        <button onClick={fetchDashboardData} className="p-2 hover:rotate-180 transition-transform duration-500 text-indigo-600 bg-indigo-50 rounded-full">
          <RefreshCw size={24} />
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Today's Check-ins" value={stats.visitorsToday} icon={<Users />} color="blue" />
        <KpiCard title="Active Visitors" value={stats.insideNow} icon={<MapPin />} highlight />
        <KpiCard title="System Users" value={stats.totalUsers} icon={<ShieldAlert />} color="purple" />
        <KpiCard title="Security Alerts" value={stats.unreadNotifications} icon={<Bell />} alert />
      </div>

      {/* Recent Visits Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Live Traffic Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr className="text-left text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                <th className="px-8 py-4">Visitor Details</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-center">Clock In</th>
                <th className="px-8 py-4 text-center">Clock Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentVisits.map((v) => (
                <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-900">
                      {/* Using the preloaded visitor object or fallback */}
                      {v.visitor?.full_name || "Visitor #" + v.visitor_id}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">Log ID: {v.id}</div>
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-600">
                      <Clock size={14} className="text-indigo-400" />
                      {formatTime(v.time_in)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-600">
                      <LogOut size={14} className={v.time_out ? "text-amber-400" : "text-gray-200"} />
                      <span className={v.time_out ? "text-gray-900" : "text-gray-300 font-normal italic"}>
                        {v.time_out ? formatTime(v.time_out) : "Active"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}