import { TrendingUp } from "lucide-react";

export default function KpiCard({ title, value, highlight, alert, icon, color }) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };

  const selectedColor = alert ? colorMap.red : (highlight ? colorMap.green : colorMap[color] || colorMap.blue);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${selectedColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium text-green-500">
        <TrendingUp size={14} className="mr-1" />
        <span>Live Update</span>
      </div>
    </div>
  );
}