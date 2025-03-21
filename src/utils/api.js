import axios from "axios";

/**
 * Helper function to make authenticated API requests
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} - The API response
 */
export const makeAuthenticatedRequest = async (apiCall) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await apiCall(headers);
    return response;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Helper function to make public API requests (no authentication required)
 * @param {Function} apiCall - The API call function to execute 
 * @returns {Promise} - The API response
 */
export const makePublicRequest = async (apiCall) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Base URLs for different API endpoints
 */
export const API_URLS = {
  BASE: "https://eigakan2222-001-site1.jtempurl.com/api",
  NEWS: "https://eigakan2222-001-site1.jtempurl.com/api/News",
  UPLOAD: "https://eigakan2222-001-site1.jtempurl.com/api/Upload/Upload_Pictures",
  AUTH: "https://eigakan2222-001-site1.jtempurl.com/api/Auth",
  MOVIE: "https://eigakan2222-001-site1.jtempurl.com/api/Movie",
  RATING: "https://eigakan2222-001-site1.jtempurl.com/api/MovieRating",
  COMMENT: "https://eigakan2222-001-site1.jtempurl.com/api/Comment",
  GENRE: "https://eigakan2222-001-site1.jtempurl.com/api/Genre",
  // ... thêm các endpoint khác
}; 