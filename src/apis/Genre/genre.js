import axios from "axios";
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";

/**
 * Service for handling genre operations
 */
const genreService = {
  /**
   * Get all genres - Public endpoint
   * @returns {Promise<{success: boolean, data: Array, message: string}>} List of genres
   */
  getGenres: () => 
    makePublicRequest(async () => {
      const response = await axios.get(API_URLS.GENRE);
      return response;
    }),

  /**
   * Get genre by ID - Public endpoint
   * @param {string} id Genre ID
   * @returns {Promise<{success: boolean, data: Object, message: string}>} Genre details
   */
  getGenreById: (id) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URLS.GENRE}/${id}`);
      return response;
    }),

  /**
   * Create new genre - Admin only
   * @param {Object} genreData Genre data to create
   * @returns {Promise<{success: boolean, data: Object, message: string}>} Created genre
   */
  createGenre: (genreData) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create genres");
      }

      const response = await axios.post(API_URLS.GENRE, genreData, {
        headers
      });
      return response.data;
    }),

  /**
   * Update genre - Admin only
   * @param {string} id Genre ID
   * @param {Object} genreData Updated genre data
   * @returns {Promise<{success: boolean, data: Object, message: string}>} Updated genre
   */
  updateGenre: (id, genreData) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can update genres");
      }

      const response = await axios.put(`${API_URLS.GENRE}/${id}`, genreData, {
        headers
      });
      return response.data;
    }),

  /**
   * Delete genre - Admin only
   * @param {string} id Genre ID
   * @returns {Promise<{success: boolean, message: string}>} Operation result
   */
  deleteGenre: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can delete genres");
      }

      try {
        await axios.delete(`${API_URLS.GENRE}/${id}`, {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
        return { success: true };
      } catch (error) {
        // Nếu status là 400 nhưng thực tế đã xóa thành công
        if (error.response?.status === 400) {
          return { success: true };
        }
        throw error;
      }
    })
};

export default genreService; 