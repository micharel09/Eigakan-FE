import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.MOVIE_HISTORY;

const movieHistoryService = {
  getAllListMoviesHistory: (page, pageSize) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetMovieHistoryByLogin`, {
        headers,
        params: {
          page,
          pageSize
        }
      });
      return response;
    }),

  CreateMovieHistory: (movieData) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${API_URL}/CreateMovieHistory`, movieData, {
        headers
      });
      return response.data;
    }),
};

export default movieHistoryService;