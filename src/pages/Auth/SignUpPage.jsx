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
  fullName: "",
  password: "",
  confirmPassword: "",
};

/**
 * SignUp Page Component
 * Handles user registration functionality
 */
const SignUpPage = () => {
  // Get email from URL if exists
  const { searchParams } = new URL(document.location);
  const emailFromUrl = searchParams.get("email");

  // Form state
  const [formData, setFormData] = useState({
    ...initialFormState,
    email: emailFromUrl || "",
  });

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
   * Validate form data
   * @returns {boolean} Is form valid
   */
  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   * @param {Object} e - Event object
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { email, password, confirmPassword, fullName } = formData;
      const response = await authService.signup(
        email,
        password,
        confirmPassword,
        fullName
      );

      if (response.success) {
        toast.success("Sign up successful! Please verify your email.");
        navigate("/signup-success");
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (error) {
      handleSignupError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle signup errors
   * @param {Object} error - Error object
   */
  const handleSignupError = (error) => {
    if (error.errors) {
      const firstError = Object.values(error.errors)[0];
      setError(Array.isArray(firstError) ? firstError[0] : firstError);
    } else if (error.message) {
      setError(error.message);
    } else {
      setError("An error occurred during registration");
    }
    console.error("Signup error:", error);
  };

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>SignUp</title>
      </Helmet>
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md">
          <h1 className="text-center text-white text-2xl font-bold mb-4">
            Sign Up
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
              {error}
            </div>
          )}

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
              label="Full Name"
              type="text"
              name="fullName"
              value={formData.fullName}
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

            <FormInput
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={loading}
              required
            />

            <SubmitButton loading={loading} />
          </form>

          <LoginLink />
        </div>
      </div>
    </div>
  );
};

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
          className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white 
          focus:outline-none focus:ring focus:border-[#FF009F]"
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
 * Submit Button Component
 */
const SubmitButton = ({ loading }) => (
  <button
    type="submit"
    className="w-full py-3 bg-[#FF009F] hover:bg-[#D1007F] text-white rounded-lg
      transition-colors duration-300 flex items-center justify-center gap-2"
    disabled={loading}
  >
    {loading ? <Spin size="small" /> : "Sign Up"}
  </button>
);

/**
 * Login Link Component
 */
const LoginLink = () => (
  <div className="text-center text-gray-400">
    Already have an account?{" "}
    <Link
      to="/login"
      className="text-[#FF009F] hover:text-[#D1007F] transition-colors"
    >
      Login
    </Link>
  </div>
);

export default SignUpPage;
