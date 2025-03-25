import axios from "axios";
import { makePublicRequest, API_URLS } from "../../utils/api";

/**
 * Service for handling authentication operations
 */
const authService = {
  listeners: [],

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

  forgotPassword: (email) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URLS.AUTH}/Forgot-password`, {
        email,
      });
      return response;
    }),

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
