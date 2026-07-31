import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("reset_email");
    if (!savedEmail) {
      navigate("/forgot-password");
    } else {
      setEmail(savedEmail);
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        email,
        code,
        new_password: password,
        confirm_password: confirm,
      });

      setMessage("Password reset successful!");
      localStorage.removeItem("reset_email");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#40403E]">
      <div className="w-full max-w-md bg-[#59595B] rounded-[1.25rem] p-8 shadow-lg">
        <h1 className="text-center text-2xl font-semibold text-[#F2EAE4] mb-6">
          RESET PASSWORD
        </h1>

        {error && (
          <div className="bg-red-200 text-red-900 px-4 py-2 rounded-md text-sm text-center">
            ❌ {error}
          </div>
        )}

        {message && (
          <div className="bg-green-200 text-green-900 px-4 py-2 rounded-md text-sm text-center">
            ✅ {message}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-28">Email :</label>
            <input
              className="w-full bg-[#BFBFBD] rounded-full px-4 py-2 outline-none text-[#40403E]"
              value={email}
              disabled
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-28">Code :</label>
            <input
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="6-digit code"
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-28">New Password</label>
            <input
              type="password"
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="New password"
              onChange={(e) => setPassword(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-28">Confirm :</label>
            <input
              type="password"
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="Confirm password"
              onChange={(e) => setConfirm(e.target.value)}
              required
              maxLength={40}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#F2EAE4] text-[#40403E] font-medium py-2 rounded-full hover:opacity-90 transition mt-3"
          >
            Reset Password
          </button>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-sm text-[#BFBFBD] underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
