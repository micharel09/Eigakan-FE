import axios from "axios";
import { makePublicRequest, API_URLS } from "../../utils/api";

/**
 * Helper function to get pagination parameters
 * @param {number} pageNumber - Page number
 * @param {number} pageSize - Page size
 * @returns {Object} - Pagination parameters
 */
const getPaginationParams = (pageNumber = 1, pageSize = 10) => ({
  params: {
    pageNumber,
    pageSize
  }
});

const actorService = {
  /**
   * Get actors list with pagination
   * @param {number} pageNumber - Page number
   * @param {number} pageSize - Page size
   * @returns {Promise<Object>} Paginated list of actors
   */
  getActors: (pageNumber = 1, pageSize = 10) =>
    makePublicRequest(async () => {
      return axios.get(
        `${API_URLS.BASE}/Person`,
        {
          ...getPaginationParams(pageNumber, pageSize),
        }
      );
    }),

  /**
   * Get actor details by ID
   * @param {string} id - Actor ID
   * @returns {Promise<Object>} Actor details
   */
  getActorById: (id) =>
    makePublicRequest(async () => {
      return axios.get(`${API_URLS.BASE}/Person/${id}`);
    }),

  /**
   * Get actor's movies with pagination
   * @param {string} actorId - Actor ID
   * @param {number} pageNumber - Page number
   * @param {number} pageSize - Page size
   * @returns {Promise<Object>} Paginated list of actor's movies
   */
  getActorMovies: (actorId, pageNumber = 1, pageSize = 10) =>
    makePublicRequest(async () => {
      return axios.get(
        `${API_URLS.BASE}/Person/${actorId}/movies`,
        {
          ...getPaginationParams(pageNumber, pageSize),
        }
      );
    })
};

export default actorService; 