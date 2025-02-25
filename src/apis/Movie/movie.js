import axios from "axios";

const BASE_URL = "https://eigakan1111-001-site1.qtempurl.com/api";

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const movieService = {
  // Movies
  getMovies: async (pageNumber = 1, pageSize = 10) => {
    try {
      const response = await axios.get(`${BASE_URL}/Movie/GetListMovieActive`, {
        params: { pageNumber, pageSize }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getAllListMovies(pageNumber = 1, pageSize = 10) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/GetListAllMovie`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
      const response = await axios.get(`${BASE_URL}/Movie/GetMovieById/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async createMovie(movieData) {
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.post(API_URL, movieData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },


  async getUserById(userId) {
    try {
      const response = await axios.get(`${BASE_URL}/User/GetUserById/${userId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Comments
  createComment: async (content, movieId) => {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      const response = await axios.post(`${BASE_URL}/Comment`, {
        content,
        createBy: userId,
        movieId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default movieService; 