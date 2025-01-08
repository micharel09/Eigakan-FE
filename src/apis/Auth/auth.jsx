import axios from "axios";

const API_URL = "https://localhost:7192/api/Auth";

const authService = {
  listeners: [],

  async login(email, password) {
    try {
      const res = await axios.post(`${API_URL}/Login`, { email, password });
      localStorage.setItem("user", JSON.stringify(res.data));
      localStorage.setItem("token", res.data.token);
      this.notifyListeners();
      return res.data;
    } catch (err) {
      throw err.response?.data || {};
    }
  },

  async signup(email, password, confirmPassword, fullName) {
    try {
      const res = await axios.post(`${API_URL}/Register`, {
        email,
        password,
        confirmPassword,
        fullName,
      });
      return res.data;
    } catch (err) {
      throw err.response?.data || {};
    }
  },

  getCurrentUser() {
    const userString = localStorage.getItem("user");
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  },

  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    this.notifyListeners();
  },

  addListener(listener) {
    this.listeners.push(listener);
  },

  removeListener(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  },

  notifyListeners() {
    this.listeners.forEach((listener) => listener());
  },
};

export default authService;
