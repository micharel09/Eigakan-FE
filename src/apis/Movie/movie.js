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
  },

  async getUserById(userId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://eigakan1111-001-site1.qtempurl.com/api/User/GetUserById/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async createComment(content, movieId) {
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user')).id; // Lấy userId từ session

      const response = await axios.post(
        'https://eigakan1111-001-site1.qtempurl.com/api/Comment',
        {
          content: content,
          createBy: userId,
          movieId: movieId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getAllMovieRatings() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'https://eigakan1111-001-site1.qtempurl.com/api/MovieRating',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async createMovieRating(stars, movieId) {
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user')).id;

      const response = await axios.post(
        'https://eigakan1111-001-site1.qtempurl.com/api/MovieRating',
        {
          stars: stars,
          userId: userId,
          movieId: movieId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getMovieRatingById(ratingId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://eigakan1111-001-site1.qtempurl.com/api/MovieRating/${ratingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default movieService; 