import axios from "axios";
import { makePublicRequest, API_URLS } from "../../utils/api";

/**
 * Service for handling authentication operations
 */
const authService = {
  listeners: [],

  /**
   * Login user
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} Login response with token and user data
   */
  login: (email, password) =>
    makePublicRequest(async () => {
      const response = await axios.post(
        `${API_URLS.AUTH}/Login`,
        { email, password },
        { maxRedirects: 0 }
      );
      authService.notifyListeners();
      return response;
    }),

  /**
   * Register new user
   * @param {Object} userData User registration data
   * @returns {Promise<Object>} Registration response
   */
  signup: (email, password, confirmPassword, fullName) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URLS.AUTH}/SignUp`, {
        email,
        password,
        confirmPassword,
        fullName,
      });
      return response;
    }),

  /**
   * Verify email
   * @param {string} token Verification token
   * @returns {Promise<Object>} Verification response
   */
  verify: (token) =>
    makePublicRequest(async () => {
      const response = await axios.get(
        `${API_URLS.AUTH}/Verify?token=${token}`
      );
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    }),

  /**
   * Request password reset
   * @param {string} email User email
   * @returns {Promise<Object>} Password reset request response
   */
  forgotPassword: (email) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URLS.AUTH}/Forgot-password`, {
        email,
      });
      return response;
    }),

  /**
   * Reset password
   * @param {Object} resetData Password reset data
   * @returns {Promise<Object>} Password reset response
   */
  resetPassword: (token, newPassword, confirmPassword) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URLS.AUTH}/Reset-password`, {
        token,
        newPassword,
        confirmPassword,
      });
      return response;
    }),

  // Local storage management
  getCurrentUser: () => {
    const userString = localStorage.getItem("user");
    return userString ? JSON.parse(userString) : null;
  },

  logout: () => {
    localStorage.clear();
    authService.notifyListeners();
  },

  // Listener management for auth state changes
  addListener: (listener) => {
    authService.listeners.push(listener);
  },

  removeListener: (listener) => {
    authService.listeners = authService.listeners.filter((l) => l !== listener);
  },

  notifyListeners: () => {
    authService.listeners.forEach((listener) => listener());
  },
};

export default authService;
