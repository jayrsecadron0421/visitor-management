import { useState } from "react";
import { 
  FileText, Download, BarChart3, Calendar, 
  Loader2, Users, Clock, UserPlus, PieChart as PieIcon 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import api from "../../api/axios";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [type, setType] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Mapping to your Go routes: /reports/daily?date=...
      const res = await api.get(`/reports/${type}`, {
        params: { date, start: date } 
      });
      setReport(res.data);
    } catch (err) {
      console.error("Report Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    // Points to your auth-protected CSV route
    window.open(`http://127.0.0.1:8080/api/v1/reports/daily.csv?date=${date}`, "_blank");
  };

  // Transform "Meeting (5)" into { name: "Meeting", value: 5 } for the chart
  const chartData = report?.TopReasons?.map(item => {
    const match = item.match(/(.*) \((\d+)\)/);
    return {
      name: match ? match[1] : item,
      count: match ? parseInt(match[2]) : 0
    };
  }) || [];

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Reports</h1>
          <p className="text-gray-500 font-medium">Data-driven insights for visitor management</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
           {['daily', 'weekly', 'monthly'].map((t) => (
             <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all uppercase tracking-widest ${
                  type === t ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                }`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-50 relative">
          <Calendar className="absolute left-4 top-3.5 text-indigo-500" size={18} />
          <input
            type="date"
            className="w-full bg-gray-50 border border-gray-100 py-3 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        
        <button 
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-100"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <BarChart3 size={20} />}
          Generate Report
        </button>

        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-6 py-3 rounded-2xl font-bold transition-all"
        >
          <Download size={20} />
          CSV
        </button>
      </div>

      {report ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Visitors" value={report.TotalVisitors} icon={<Users />} color="bg-blue-500" />
            <StatCard label="Currently Inside" value={report.CurrentlyInside} icon={<UserPlus />} color="bg-indigo-500" />
            <StatCard label="Repeat Visitors" value={report.RepeatVisitors} icon={<Clock />} color="bg-purple-500" />
            <StatCard label="Avg. Stay (Mins)" value={report.AverageDurationMinutes?.toFixed(0)} icon={<PieIcon />} color="bg-amber-500" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-4xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" />
                Top Reasons for Visit
              </h3>
              <div className="h-87.5 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={30}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-4xl border border-gray-100 shadow-sm flex flex-col">
               <h3 className="text-lg font-bold text-gray-800 mb-6">Summary Metrics</h3>
               <div className="space-y-6 flex-1">
                  {chartData.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-sm font-bold text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-gray-900">{item.count} visits</span>
                    </div>
                  ))}
               </div>
               <div className="mt-8 pt-6 border-t border-gray-50 italic text-xs text-gray-400">
                  * Data based on the selected {type} period.
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-4xl py-32 flex flex-col items-center justify-center border border-dashed border-gray-200">
           <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-indigo-200" size={40} />
           </div>
           <p className="text-gray-400 font-bold">No report data generated yet.</p>
           <p className="text-gray-300 text-sm">Click "Generate Report" to analyze the system.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute right-2.5 top-2.5 w-20 h-20 rounded-full opacity-5 group-hover:scale-150 transition-transform ${color}`} />
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl text-white ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}