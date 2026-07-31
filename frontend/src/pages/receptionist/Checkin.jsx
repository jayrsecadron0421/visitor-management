import { useState, useEffect } from "react";
import { UserPlus, CheckCircle, Loader2 } from "lucide-react";
import api from "../../api/axios";

export default function ReceptionistCheckIn() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    company: "",
    reason: "",
    is_active: true,
    visiting_name: "",
    });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  useEffect(() => {
    fetchUsers();
    }, []);

    const fetchUsers = async () => {
    try {
        const res = await api.get("/users");;
        setUsers(res.data || []);
    } catch (err) {
        console.error("Failed to fetch users");
    }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/visitors", {
        ...form,
        host_user_id: Number(form.host_user_id),
        });

      setSuccessData(res.data); // contains visitor, visit, pass_number

      setForm({
        full_name: "",
        email: "",
        phone_number: "",
        company: "",
        reason: "",
        is_active: true,
        visiting_name: "",
        });

    } catch (err) {
      alert(err.response?.data?.error || "Failed to register visitor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Visitor Check-In
          </h1>
          <p className="text-gray-500 mt-1">
            Register and check-in visitor
          </p>
        </div>

        {/* Success Box */}
        {successData && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-600" />
              <h2 className="font-semibold text-green-700">
                Visitor Checked In Successfully
              </h2>
            </div>

            <p className="text-sm text-green-700">
              <strong>Name:</strong> {successData.visitor.full_name}
            </p>

            <p className="text-sm text-green-700">
              <strong>Pass Number:</strong> #{successData.pass_number}
            </p>

            <p className="text-sm text-green-700">
              <strong>Time In:</strong>{" "}
              {new Date(successData.visit.time_in).toLocaleString()}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Enter full name"
              maxLength={35}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                type="text"
                value={form.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value.replace(/\D/g, ''))}
                placeholder="Enter phone number"
                maxLength={11}
                required
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                maxLength={35}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Company
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              maxLength={35}
              placeholder="Enter company or organization"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Reason for Visit
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              required
              rows={3}
              placeholder="Enter the reason for visit"
              maxLength={125}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
                Who is being visited
            </label>
            <input
                type="text"
                value={form.visiting_name}
                onChange={(e) => handleChange("visiting_name", e.target.value)}
                placeholder="Enter name of host or department"
                maxLength={35}
                required
                className="w-full px-4 py-2 border rounded-lg"
            />
            </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <UserPlus size={18} />
                Register & Check-In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}