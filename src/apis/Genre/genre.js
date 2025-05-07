import axios from "axios";
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.GENRE;

const genreService = {
  getGenres: () => 
    makePublicRequest(async () => {
      return axios.get(API_URL);
    }),

  getGenreById: (id) =>
    makePublicRequest(async () => {
      return axios.get(`${API_URL}/${id}`);
    }),

  createGenre: (genreData) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create genres");
      }

      const response = await axios.post(API_URL, genreData, { headers });
      return response.data;
    }),

  updateGenre: (id, genreData) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can update genres");
      }

      const response = await axios.put(`${API_URL}/${id}`, genreData, { headers });
      return response.data;
    }),

  deleteGenre: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can delete genres");
      }

      try {
        await axios.delete(`${API_URL}/${id}`, {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
        return { success: true };
      } catch (error) {
        if (error.response?.status === 400) {
          return { success: true };
        }
        throw error;
      }
    })
};

export default genreService; 