import { useEffect, useState } from "react";
import { LogOut, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function ReceptionistCheckout() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveVisits();
  }, []);

  const fetchActiveVisits = async () => {
    try {
      const res = await api.get("/visits?status=inside");
      setVisits(res.data || []);
    } catch (err) {
      console.error("Failed to fetch visits:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (visitId) => {
    if (!window.confirm("Confirm checkout for this visitor?")) return;

    setProcessingId(visitId);

    try {
      await api.post(`/visits/log/${visitId}/timeout`);

      // Remove from UI immediately
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    } catch (err) {
      alert("Failed to checkout visitor");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (timeIn) => {
    const now = new Date();
    const start = new Date(timeIn);
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Active Visitors
            </h1>
            <p className="text-gray-500 mt-1">
              Click checkout when visitor leaves
            </p>
          </div>

        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle className="mx-auto mb-4" size={40} />
            No visitors currently inside.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Visitor</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Time In</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {visit.visitor?.full_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {visit.visitor?.company || "Personal"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(visit.time_in)}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {calculateDuration(visit.time_in)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCheckout(visit.id)}
                        disabled={processingId === visit.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-60"
                      >
                        {processingId === visit.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          "Checkout"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}