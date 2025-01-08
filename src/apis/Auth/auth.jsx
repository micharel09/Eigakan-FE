import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'https://localhost:7192/api';

export const authService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/Auth/Login`, {
        email,
        password
      });
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
        toast.success('Login successful!');
        return response.data;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || 'Login failed');
        throw new Error(error.response.data.message || 'Login failed');
      }
      toast.error('Network error occurred');
      throw new Error('Network error occurred');
    }
  },


  logout() {
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;

