import axios from "axios";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/MovieCount";


const movieCountService = {


  async getMovieCountByMovieId(movieId) {
    try {
      const response = await axios.get(`${API_URL}/GetMovieCountByMovieId/${movieId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getStatisticMovieCount(movieId) {
    try {
      const response = await axios.get(`${API_URL}/StatisticMovieCount/${movieId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async increaseMovieCount(movieData) {
    try {
      const response = await axios.post(`${API_URL}/IncreaseMovieCount`, movieData, {       
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

};
export default movieCountService;