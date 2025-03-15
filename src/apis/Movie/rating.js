import axios from "axios";

const BASE_URL = "https://eigakan2222-001-site1.jtempurl.com/api";

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ratingService = {
  getAllMovieRatings: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/MovieRating`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // createMovieRating: async (stars, movieId) => {
  //   try {
  //     const userId = JSON.parse(localStorage.getItem('user'))?.id;
  //     const response = await axios.post(`${BASE_URL}/MovieRating`, {
  //       stars,
  //       userId,
  //       movieId
  //     }, {
  //       headers: getAuthHeader()
  //     });
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // },

  getMovieRatingById: async (ratingId) => {
    try {
      const response = await axios.get(`${BASE_URL}/MovieRating/${ratingId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async createMovieRating(rating, movieId) {
    try {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      const response = await axios.post(`${BASE_URL}/MovieRating`, {
        stars: rating,
        userId: userId,
        movieId: movieId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async createComment(content, movieId) {
    try {
      const response = await axios.post(`${BASE_URL}/Comment`, {
        content: content,
        movieId: movieId
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getUserRatingForMovie(movieId) {
    try {
      const response = await axios.get(`${BASE_URL}/MovieRating/GetRatingByLogin`, {
        params: { movieId },
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ratingService; 