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
const FormInput = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-medium text-gray-300 block">{label}</label>
    <input
      className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring focus:border-[#FF009F]"
      {...props}
    />
  </div>
);

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
