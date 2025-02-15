import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Person";

const actorService = {
  // Lấy danh sách diễn viên
  async getActors(pageNumber = 1, pageSize = 10) {
    try {
      const response = await axios.get(API_URL, {
        params: {
          pageNumber,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy chi tiết diễn viên theo ID
  async getActorById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách phim của diễn viên
  async getActorMovies(actorId, pageNumber = 1, pageSize = 10) {
    try {
      const response = await axios.get(`${API_URL}/${actorId}/movies`, {
        params: {
          pageNumber,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default actorService; 