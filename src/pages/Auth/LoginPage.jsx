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
const FormInput = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-medium text-gray-300 block">{label}</label>
    <input
      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg
      focus:border-[#FF009F] hover:border-[#FF009F] transition-colors"
      {...props}
    />
  </div>
);

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
