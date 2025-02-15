import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Movie";

const movieService = {
  async getMovies(pageNumber = 1, pageSize = 10) {
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

  async getMovieById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default movieService; 