import axios from "axios";
import { makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AUTH;

/**
 * Service for handling authentication operations
 */
const authService = {
  listeners: [],

  login: (email, password) =>
    makePublicRequest(async () => {
      const response = await axios.post(
        `${API_URL}/Login`,
        { email, password },
        { maxRedirects: 0 }
      );
      authService.notifyListeners();
      return response;
    }),

  signup: (email, password, confirmPassword, fullName) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URL}/SignUp`, {
        email,
        password,
        confirmPassword,
        fullName,
      });
      return response;
    }),

  verify: (token) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URL}/Verify?token=${token}`);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    }),

  forgotPassword: (email) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URL}/Forgot-password`, {
        email,
      });
      return response;
    }),

  resetPassword: (token, newPassword, confirmPassword) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URL}/Reset-password`, {
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
