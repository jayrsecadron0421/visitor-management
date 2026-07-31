import { useState } from "react";
import api from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // show / hide states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/auth/register", form);
      setMessage("Account created successfully!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError("Registration failed. Please check your inputs.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#40403E] px-4">
      <div className="w-full max-w-md bg-[#59595B] rounded-[1.25rem] p-6 sm:p-8 shadow-lg">
        <h1 className="text-center text-2xl font-semibold text-[#F2EAE4] mb-6">
          REGISTER
        </h1>

        {/* Error */}
        {error && (
          <div className="bg-red-200 text-red-900 px-4 py-2 rounded-md text-sm text-center mb-4">
            ❌ {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="bg-green-200 text-green-900 px-4 py-2 rounded-md text-sm text-center mb-4">
            ✅ {message}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/* Full Name */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-32">Full Name</label>
            <input
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="Input Full Name"
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
              required
            />
          </div>

          {/* Email */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-32">Email</label>
            <input
              type="email"
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="Input Email"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-32">Phone</label>
            <input
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="Input Phone Number"
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
              required
            />
          </div>

          {/* Birthday */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-32">Birthday</label>
            <input
              type="date"
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              onChange={(e) =>
                setForm({ ...form, birthday: e.target.value })
              }
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-32">Password</label>

            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 pr-16 outline-none"
                placeholder="Input Password"
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#40403E]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-32">Confirm</label>

            <div className="relative w-full">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 pr-16 outline-none"
                placeholder="Confirm Password"
                onChange={(e) =>
                  setForm({ ...form, confirm_password: e.target.value })
                }
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#40403E]"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#F2EAE4] text-[#40403E] font-medium py-2 rounded-full hover:opacity-90 transition mt-4"
          >
            Register
          </button>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-sm text-[#BFBFBD] underline"
          >
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}