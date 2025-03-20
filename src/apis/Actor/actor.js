import axios from "axios";

const BASE_URL = "https://eigakan2222-001-site1.jtempurl.com/api/Person";

/**
 * Helper function to make API requests with common headers
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} - The API response
 */
const makeRequest = async (apiCall) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    return await apiCall(headers);
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

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
    makeRequest(async (headers) => {
      const response = await axios.get(
        BASE_URL,
        {
          ...getPaginationParams(pageNumber, pageSize),
          headers
        }
      );
      return response.data;
    }),

  /**
   * Get actor details by ID
   * @param {string} id - Actor ID
   * @returns {Promise<Object>} Actor details
   */
  getActorById: (id) =>
    makeRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/${id}`, { headers });
      return response.data;
    }),

  /**
   * Get actor's movies with pagination
   * @param {string} actorId - Actor ID
   * @param {number} pageNumber - Page number
   * @param {number} pageSize - Page size
   * @returns {Promise<Object>} Paginated list of actor's movies
   */
  getActorMovies: (actorId, pageNumber = 1, pageSize = 10) =>
    makeRequest(async (headers) => {
      const response = await axios.get(
        `${BASE_URL}/${actorId}/movies`,
        {
          ...getPaginationParams(pageNumber, pageSize),
          headers
        }
      );
      return response.data;
    })
};

export default actorService; 