import { useEffect, useState } from "react";
import { Clock, CheckCircle2, MapPin, Calendar, Hash, ArrowUpRight } from "lucide-react";
import api from "../../api/axios";

export default function UserHistory() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyVisits = async () => {
      try {
        // This endpoint needs to be filtered by the logged-in user on the backend
        const res = await api.get("/visits"); 
        setVisits(res.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyVisits();
  }, []);

  const formatDurationText = (mins) => {
    if (mins === null || mins === undefined) return "—";
    if (mins < 0) return "0 mins"; // Cleanup legacy negative data
    if (mins < 60) return `${mins} mins`;
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
  
  const formatTime = (date) => new Date(date).toLocaleTimeString([], { 
    hour: '2-digit', minute: '2-digit' 
  });

  if (loading) return <div className="p-10 text-center text-gray-400">Loading your history...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Visit History</h1>
          <p className="text-gray-500 font-medium">View and manage your recent activity</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
          <Clock size={16} />
          {visits.filter(v => v.status === 'inside').length} Active Visits
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
          <Calendar className="mx-auto text-gray-200 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-800">No visits yet</h3>
          <p className="text-gray-400">Your visit history will appear here once you register.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visits.map((visit) => {
            const isInside = visit.status === "inside";
            return (
              <div 
                key={visit.id} 
                className={`group bg-white p-6 rounded-2xl border transition-all hover:shadow-lg ${
                  isInside ? "border-blue-200 ring-4 ring-blue-50" : "border-gray-100"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Basic Info */}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${isInside ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                      {isInside ? <MapPin size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                          {formatDate(visit.time_in)}
                        </span>
                        {isInside && (
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">
                        {visit.notes?.replace("CODE:", "") || "General Visit"}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <Clock size={14} /> 
                        In: {formatTime(visit.time_in)} 
                        {visit.time_out && ` • Out: ${formatTime(visit.time_out)}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Visit Code / Duration */}
                  <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                    {isInside ? (
                      <div className="bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Access Code</p>
                        <p className="text-2xl font-black text-indigo-600 font-mono tracking-tighter">
                          {visit.notes?.split(":")[1] || "N/A"}
                        </p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Duration</p>
                        <p className="text-lg font-bold text-gray-700">
                          {formatDurationText(visit.duration_minutes)}
                        </p>
                      </div>
                    )}
                    <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}