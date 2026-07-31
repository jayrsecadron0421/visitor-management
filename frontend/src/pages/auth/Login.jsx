import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import bgImage from "../../assets/login-bg.webp";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("access_token", res.data.access_token);

      const me = await api.get("/me");
      localStorage.setItem("role", me.data.role);

      const role = me.data.role;

      // 🔥 UPDATED: Only admin and staff roles
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "staff") {
        navigate("/receptionist/checkout");
      } else {
        // Fallback for any other role
        setError("Invalid role. Only admin and staff can access this system.");
        localStorage.clear();
      }
    } catch {
      setError("Invalid credentials");
    }
  };

  useEffect(() => {
    api.get("/health").catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-md bg-[#59595B] rounded-[1.25rem] p-8 shadow-lg">
        <h1 className="text-center text-2xl font-semibold text-[#F2EAE4] mb-6">
          LOGIN
        </h1>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="bg-red-200 text-red-900 px-4 py-2 rounded-md text-sm text-center">
              ❌ {error}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-24">Email</label>
            <input
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="Input Email"
              onChange={(e) => setEmail(e.target.value)}
              maxLength={40}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-24">Password</label>

            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 pr-16 outline-none"
                placeholder="Input Password"
                onChange={(e) => setPassword(e.target.value)}
                maxLength={40}
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

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-[#BFBFBD] underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-[#F2EAE4] text-[#40403E] font-medium py-2 rounded-full hover:opacity-90 transition"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4 text-xs text-[#BFBFBD]">
          Admin & Staff Access Only
        </div>
      </div>
    </div>
  );
}
