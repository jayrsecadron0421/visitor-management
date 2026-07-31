import { useEffect, useState } from "react";
import { Key, CheckCircle, XCircle } from "lucide-react";
import api from "../../api/axios";

export default function ReceptionistPasses() {
  const [passes, setPasses] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, borrowed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [passesRes, statsRes] = await Promise.all([
        api.get("/passes?status=available"),
        api.get("/passes/stats"),
      ]);

      setPasses(passesRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching passes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading passes...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Available Visitor Passes
        </h1>
        <p className="text-gray-500 mt-1">
          View available physical passes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Passes" value={stats.total} icon={<Key />} color="blue" />
        <StatCard title="Available" value={stats.available} icon={<CheckCircle />} color="green" />
        <StatCard title="Borrowed" value={stats.borrowed} icon={<XCircle />} color="orange" />
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {passes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No available passes.
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {passes.map((pass) => (
              <div
                key={pass.id}
                className="p-4 rounded-lg border-2 bg-green-50 border-green-200 text-center"
              >
                <div className="text-xl font-bold text-green-700">
                  {pass.pass_number}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Available
                </div>
              </div>
            ))}
          </div>
        )}
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg border ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
}