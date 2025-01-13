import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import authService from "../../apis/Auth/auth";

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
        localStorage.setItem('token', res.message);
        localStorage.setItem('fullName', res.data.fullName);
        localStorage.setItem('avatar', res.data.picture);
        localStorage.setItem('role', res.data.roleName);
        localStorage.setItem('userId', res.data.userId);
    
        if(res.data.roleName === "ADMIN") {
          navigate('/Dashboard')
        }else{
          navigate('/'); 
        }
        
      } else {
        // Hiển thị thông báo lỗi từ phản hồi API
        setError(res.message || "Login failed.");
      }
    } catch (error) {
      // Hiển thị lỗi hệ thống
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      // Tắt trạng thái loading
      setLoading(false);
    }
    
  };

  return (
    <div className="h-screen w-full hero-bg">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link to={"/"}>
          <img src="/Eigakan-logo.png" alt="logo" className="w-52" />
        </Link>
      </header>

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
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
                placeholder="you@example.com"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
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
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
                placeholder="••••••••"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              className="w-full py-2 bg-red-600 text-white font-semibold rounded-md
              hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
            "
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="text-center text-gray-400">
            Don't have an account?{" "}
            <Link to={"/signup"} className="text-red-500 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
