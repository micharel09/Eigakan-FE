import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Spin } from "antd";
import { Helmet } from "react-helmet";
import authService from "../../apis/Auth/auth";
import Navbar from "../../components/Header/Navbar";

/**
 * Initial form state
 */
const initialFormState = {
  email: "",
  password: "",
};

/**
 * Quick login credentials for different roles
 */
const QUICK_LOGIN_CREDENTIALS = {
  ADMIN: { email: "admin@gmail.com", password: "2" },
  VIPMEMBER: { email: "user5@gmail.com", password: "123" },
  MEMBER: { email: "user6@gmail.com", password: "123" },
  MANAGER: { email: "minhquan.sguy@gmail.com", password: "123" },
  PUBLISHER: { email: "minhtuankf@gmail.com", password: "1" },
  ADVERTISER: { email: "minhquan.riotgs@gmail.com", password: "123" },
};

/**
 * Login Page Component
 * Handles user authentication functionality
 */
const LoginPage = () => {
  // Form state
  const [formData, setFormData] = useState(initialFormState);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  /**
   * Handle input change
   * @param {Object} e - Event object
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle successful login
   * @param {Object} response - Login response from API
   */
  const handleLoginSuccess = (response) => {
    const { data, message } = response;

    // Save user data to localStorage
    localStorage.setItem("user", JSON.stringify(data));
    localStorage.setItem("token", message);
    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("avatar", data.picture);
    localStorage.setItem("role", data.roleName);
    localStorage.setItem("userId", data.userId);

    toast.success("Login successful!");

    // Navigate based on role
    switch (data.roleName) {
      case "ADMIN":
        navigate("/dashboard");
        break;
      case "MANAGER":
        navigate("/manager/dashboard");
        break;
      case "PUBLISHER":
        navigate("/publisher/dashboard");
        break;
      case "ADVERTISER":
        navigate("/advertiser/dashboard");
        break;
      default:
        navigate("/homescreen");
    }
  };

  /**
   * Handle login errors
   * @param {Object} error - Error object
   */
  const handleLoginError = (error) => {
    setError(error.message || "An error occurred during login");
    console.error("Login error:", error);
  };

  /**
   * Handle form submission
   * @param {Object} e - Event object
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(
        formData.email,
        formData.password
      );

      if (response?.success && response.data) {
        handleLoginSuccess(response);
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle quick login for demo purposes
   * @param {string} role - User role
   */
  const handleQuickLogin = async (role) => {
    const credentials = QUICK_LOGIN_CREDENTIALS[role];
    setFormData(credentials);

    try {
      setError("");
      setLoading(true);

      const response = await authService.login(
        credentials.email,
        credentials.password
      );

      if (response?.success && response.data) {
        handleLoginSuccess(response);
      }
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>Login</title>
      </Helmet>
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md">
          <h1 className="text-center text-white text-2xl font-bold mb-4">
            Sign In
          </h1>

          {error && <ErrorMessage message={error} />}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              required
            />

            <FormInput
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              required
            />

            <ForgotPasswordLink />
            <SubmitButton loading={loading} />
          </form>

          <QuickLoginSection
            onQuickLogin={handleQuickLogin}
            disabled={loading}
          />

          <SignUpLinks />
        </div>
      </div>
    </div>
  );
};

/**
 * Error Message Component
 */
const ErrorMessage = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
    {message}
  </div>
);

/**
 * Form Input Component
 */
const FormInput = ({ label, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === "password";

  return (
    <div>
      <label className="text-sm font-medium text-gray-300 block">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={isPassword ? (showPassword ? "text" : "password") : props.type}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white
          focus:border-[#FF009F] hover:border-[#FF009F] transition-colors"
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Forgot Password Link Component
 */
const ForgotPasswordLink = () => (
  <div className="mt-2">
    <Link
      to="/forgot-password"
      className="text-[#FF009F] hover:text-[#D1007F] transition-colors"
    >
      Forgot Password?
    </Link>
  </div>
);

/**
 * Submit Button Component
 */
const SubmitButton = ({ loading }) => (
  <button
    type="submit"
    className={`w-full py-3 text-white rounded-lg transition-colors duration-300 
    flex items-center justify-center gap-2
    ${loading ? "bg-[#D1007F]" : "bg-[#FF009F] hover:bg-[#D1007F]"}`}
    disabled={loading}
  >
    {loading ? (
      <Spin size="default" style={{ color: "white", fontSize: "20px" }} />
    ) : (
      "Login"
    )}
  </button>
);

/**
 * Quick Login Section Component
 */
const QuickLoginSection = ({ onQuickLogin, disabled }) => (
  <div className="mt-6">
    <div className="text-center mb-4 text-gray-300">Quick Login Demo</div>
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(QUICK_LOGIN_CREDENTIALS).map(([role]) => (
        <button
          key={role}
          onClick={() => onQuickLogin(role)}
          className={`py-2 px-4 text-white rounded-lg ${getButtonColor(role)}`}
          disabled={disabled}
        >
          {role.charAt(0) + role.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  </div>
);

/**
 * Sign Up Links Component
 */
const SignUpLinks = () => (
  <>
    <div className="text-center text-gray-400">
      Don't have an account?{" "}
      <Link to="/signup" className="text-[#FF009F] hover:text-[#D1007F]">
        Sign up
      </Link>
    </div>
    <div className="text-center text-gray-400">
      Want your movie here?{" "}
      <Link to="/registerPage" className="text-[#FF009F] hover:text-[#D1007F]">
        Join now
      </Link>
    </div>
  </>
);

/**
 * Get button color based on role
 * @param {string} role - User role
 * @returns {string} Tailwind CSS classes for button color
 */
const getButtonColor = (role) => {
  const colors = {
    ADMIN: "bg-orange-500 hover:bg-orange-600",
    VIPMEMBER: "bg-pink-500 hover:bg-pink-600",
    MEMBER: "bg-green-500 hover:bg-green-600",
    MANAGER: "bg-blue-500 hover:bg-blue-600",
    PUBLISHER: "bg-purple-500 hover:bg-purple-600",
    ADVERTISER: "bg-red-500 hover:bg-red-600",
  };
  return colors[role] || "bg-gray-500 hover:bg-gray-600";
};

export default LoginPage;
