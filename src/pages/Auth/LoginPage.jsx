import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import authService from "../../apis/Auth/auth";
import { Helmet } from "react-helmet";
import Navbar from "../../components/Header/Navbar";
import { AiOutlineMail, AiOutlineLock } from "react-icons/ai";
import { Spin } from "antd";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login(email, password);

      if (res && res.success === true && res.data) {
        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem("user", JSON.stringify(res.data));
        localStorage.setItem("token", res.message);
        localStorage.setItem("fullName", res.data.fullName);
        localStorage.setItem("avatar", res.data.picture);
        localStorage.setItem("role", res.data.roleName);
        localStorage.setItem("userId", res.data.userId);

        toast.success("Login successful!");

        if (res.data.roleName === "ADMIN") {
          navigate("/dashboard");
        } else if (res.data.roleName === "MANAGER") {
          navigate("/manager/dashboard");
        }else if (res.data.roleName === "PUBLISHER") {
          navigate("/publisher/dashboard");
        }
         else {
          navigate("/homescreen");
        }
      } else {
        setError(res.message || "Login failed");
      }
    } catch (error) {
      // Hiển thị lỗi từ API
      setError(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>Login</title>
      </Helmet>
      {/* Navbar */}
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md">
          <h1 className="text-center text-white text-2xl font-bold mb-4">
            Sign In
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-300 block"
              >
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg
                focus:border-[#FF009F] hover:border-[#FF009F] transition-colors"
                placeholder="you@example.com"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 block"
              >
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg
                focus:border-[#FF009F] hover:border-[#FF009F] transition-colors"
                placeholder="••••••••"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="mt-2">
              <Link
                to="/forgot-password"
                className="text-[#FF009F] hover:text-[#D1007F] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className={`w-full py-3 text-white rounded-lg transition-colors duration-300 
              flex items-center justify-center gap-2
              ${loading ? "bg-[#D1007F]" : "bg-[#FF009F] hover:bg-[#D1007F]"}`}
              disabled={loading}
            >
              {loading ? (
                <Spin
                  size="default"
                  style={{
                    color: "white",
                    fontSize: "20px",
                  }}
                />
              ) : (
                "Login"
              )}
            </button>
          </form>
          <div className="text-center text-gray-400">
            Don't have an account?{" "}
            <Link
              to={"/signup"}
              className="text-[#FF009F] hover:text-[#D1007F]"
            >
              Sign up
            </Link>
          </div>
          <div className="text-center text-gray-400">
            Want your moive here ?{" "}
            <Link to={"/registerPage"} className="text-[#FF009F] hover:text-[#D1007F]">
              Join now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
