import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

/**
 * Service for handling movie ratings and comments
 */
const ratingService = {
  /**
   * Create a new movie rating
   * @param {number} stars Rating value (1-5 stars)
   * @param {string} movieId Movie ID
   * @returns {Promise<Object>} Created rating details
   */
  createMovieRating: (stars, movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.RATING, {
        stars,
        movieId
      }, { headers });
      return response.data;
    }),

  /**
   * Get user's rating for a specific movie
   * @param {string} movieId Movie ID
   * @returns {Promise<Object>} User's rating details
   */
  getUserRatingForMovie: (movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.RATING}/GetRatingByLogin`, {
        params: { movieId },
        headers
      });
      return response.data;
    }),

  /**
   * Create a new comment for a movie
   * @param {string} content Comment content
   * @param {string} movieId Movie ID
   * @returns {Promise<Object>} Created comment details
   */
  createComment: (content, movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.COMMENT, {
        content,
        movieId
      }, { headers });
      return response.data;
    }),

  /**
   * Get comments for a movie
   * @param {string} movieId Movie ID
   * @returns {Promise<Array>} List of comments
   */
  getMovieComments: (movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.COMMENT}/movie/${movieId}`, {
        headers
      });
      return response.data;
    }),
};

export default ratingService; 