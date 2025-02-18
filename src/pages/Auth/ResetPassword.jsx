import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import { AiOutlineLock } from "react-icons/ai";
import { Helmet } from "react-helmet";
import Navbar from "../../components/Header/Navbar";
import { Spin } from "antd";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid reset token");
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword(
        token,
        formData.password,
        formData.confirmPassword
      );
      setSuccess(true);
      setError("Password has been reset successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setSuccess(false);
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>Reset Password</title>
      </Helmet>
      {/* Navbar */}
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md">
          <h1 className="text-center text-white text-2xl font-bold mb-4">
            Reset Password
          </h1>

          {error && (
            <div
              className={`bg-${
                success ? "green" : "red"
              }-500/10 border border-${success ? "green" : "red"}-500 text-${
                success ? "green" : "red"
              }-500 px-4 py-2 rounded`}
            >
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 block"
              >
                New Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white 
                focus:outline-none focus:ring focus:border-[#FF009F]"
                placeholder="••••••••"
                id="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-300 block"
              >
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white 
                focus:outline-none focus:ring focus:border-[#FF009F]"
                placeholder="••••••••"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#FF009F] hover:bg-[#D1007F] text-white rounded-lg
              transition-colors duration-300 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Spin size="small" /> : "Reset Password"}
            </button>
          </form>

          <div className="text-center text-gray-400">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-[#FF009F] hover:text-[#D1007F] transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
