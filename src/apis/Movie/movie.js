import axios from "axios";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/Movie";

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const movieService = {
  // Movies
  getMovies: async (pageNumber = 1, pageSize = 10, genreFilter = '', nameFilter = '', statusFilter = '') => {
    try {
      const response = await axios.get(`${API_URL}/GetListMovieActive`, {
        params: { 
          pageNumber,
          pageSize,
          genreFilter,
          nameFilter,
          statusFilter
        }
      });
      
      // API trả về trực tiếp {total, movies}
      return {
        success: true,
        movies: response.data.movies || [], // Trả về movies trực tiếp không qua data
        total: response.data.total || 0
      };

    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        movies: [], // Trả về movies trực tiếp không qua data
        total: 0,
        message: error.response?.data || error.message
      };
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

  async archivedMovie(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/ArchivedMovie/${id}`, // Đường dẫn chính xác từ cURL
        {}, // PATCH không có body nên để object rỗng
        {
          headers: {
            "Accept": "*/*", // Theo như cURL có accept */*
            "Authorization": `Bearer ${token}`, // Bearer token viết đúng định dạng
          },
        }
      );
      return response;
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

};

export default movieService;