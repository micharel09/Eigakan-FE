import axios from "axios";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/MovieHistory";


const movieHistoryService = {


  async getAllListMoviesHistory(page , pageSize ) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/GetMovieHistoryByLogin`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: {
            page,
            pageSize
        }
        });
        return response;
    } catch (error) {
        throw error.response?.data || error.message;
    }
  },



  async CreateMovieHistory(movieData) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/CreateMovieHistory`, movieData, {
        headers: {
            'Authorization': `Bearer ${token}`
        },   
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

};
export default movieHistoryService;