import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api";

const authService = {
  listeners: [],

  async login(email, password) {
    try {
      const res = await axios.post(
        `${API_URL}/Auth/Login`,
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
      const res = await axios.post(`${API_URL}/Auth/SignUp`, {
        email,
        password,
        confirmPassword,
        fullName,
      });
      return res.data;
    } catch (err) {
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

  async verifyEmail(token) {
    try {
      console.log("Calling verify API with token:", token);
      const res = await axios.get(`${API_URL}/Auth/Verify/${token}`);
      console.log("API Response:", res);
      return res;
    } catch (err) {
      console.error("API Error:", err);
      return err.response;
    }
  },

  async sendVerificationEmail(email) {
    try {
      const encodedEmail = encodeURIComponent(email);
      const res = await axios.get(
        `${API_URL}/User/users/email/${encodedEmail}`
      );
      return res;
    } catch (err) {
      return err.response;
    }
  },
};

export default authService;
