import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Movie";

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const movieService = {
  // Movies
  getMovies: async (pageNumber = 1, pageSize = 10) => {
    try {
      const response = await axios.get(`${API_URL}/GetListMovieActive`, {
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
      const response = await axios.get(`${API_URL}/GetMovieById/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getListMovieByLogin(pageNumber = 1, pageSize = 10) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/GetListMovieByLogin`, {
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

  async acceptedMovie(data) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/AcceptedMovie`, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
      } catch (error) {
        console.error("API error:", error.message);
        return error.response;
      }
},

async rejectedMovie(newMovie) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/RejectedMovie`, newMovie, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
      } catch (error) {
        console.error("API error:", error.message);
        return error.response;
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

  async updateMovie(id, movieData) {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(`${API_URL}/UpdateMovie/${id}`, movieData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating person:", error);
      throw error.response?.data || {
        success: false,
        message: "Failed to update person"
      };
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
  },


};

export default movieService; 