import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Media";

const mediaApi = {

  async getMedia() {
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

  async getMediaById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async createMedia(mediaData) {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(API_URL, mediaData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updateMedia(id, mediaData) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete media");
      }

      const response = await axios.put(`${API_URL}/${id}`, mediaData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async deleteMedia(id) {
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

export default mediaApi; 