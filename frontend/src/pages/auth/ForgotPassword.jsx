import { useState } from "react";
import api from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");
  setSuccess(false);

  try {
    const res = await api.post("/auth/forgot-password", { email });

    // ✅ ONLY set success if backend returned OK
    if (res.status === 200) {
      setMessage("Reset code sent to your email.");
      setSuccess(true);
      localStorage.setItem("reset_email", email);

      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);
    }
  } catch (err) {
    setSuccess(false);

    if (err.response?.status === 404) {
      setError("Email not found. Please check and try again.");
    } else {
      setError("Failed to send reset code. Please try again.");
    }
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#40403E]">
      <div className="w-full max-w-md bg-[#59595B] rounded-[1.25rem] p-8 shadow-lg">
        <h1 className="text-center text-2xl font-semibold text-[#F2EAE4] mb-6">
          FORGOT PASSWORD
        </h1>

        {error && (
          <div className="bg-red-200 text-red-900 px-4 py-2 rounded-md text-sm text-center mb-3">
            ❌ {error}
          </div>
        )}

        {message && (
          <div className="bg-green-200 text-green-900 px-4 py-2 rounded-md text-sm text-center mb-3">
            ✅ {message}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[#BFBFBD] sm:w-24">Email</label>
            <input
              type="email"
              className="w-full bg-[#F2EAE4] rounded-full px-4 py-2 outline-none"
              placeholder="Input Email"
              onChange={(e) => setEmail(e.target.value)}
              maxLength={40}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#F2EAE4] text-[#40403E] font-medium py-2 rounded-full hover:opacity-90 transition"
          >
            Send Reset Code
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
