import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Auth";

const authService = {
  listeners: [],

  async login(email, password) {
    try {
      const res = await axios.post(
        `${API_URL}/Login`,
        { email, password },
        { maxRedirects: 0 }
      ); // thêm maxRedirects: 0 để tránh redirect
      this.notifyListeners();
      return res.data;
    } catch (err) {
      throw err.response?.data || err.message;
    }
  },

  async signup(email, password, confirmPassword, fullName) {
    try {
      const res = await axios.post(`${API_URL}/SignUp`, {
        email,
        password,
        confirmPassword,
        fullName,
      });
      return res.data;
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        throw {
          message: Array.isArray(firstError) ? firstError[0] : firstError,
        };
      }
      throw err.response?.data || { message: "Network error" };
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
    localStorage.clear();
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
