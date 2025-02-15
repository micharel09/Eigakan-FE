import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Genre";

const genreService = {
  // Lấy tất cả thể loại
  async getGenres() {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy chi tiết thể loại
  async getGenreById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thêm thể loại mới - Chỉ ADMIN
  async createGenre(genreData) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete genres");
      }

      const response = await axios.post(API_URL, genreData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thể loại - Chỉ ADMIN
  async updateGenre(id, genreData) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete genres");
      }

      const response = await axios.put(`${API_URL}/${id}`, genreData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa thể loại - Chỉ ADMIN
  async deleteGenre(id) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete genres");
      }

      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Trả về success true nếu không có lỗi
      return { success: true };
    } catch (error) {
      // Nếu status là 400 nhưng thực tế đã xóa thành công
      if (error.response?.status === 400) {
        return { success: true };
      }
      // Các lỗi khác
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error.response?.data || error.message;
    }
  }
};

export default genreService; 