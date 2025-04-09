import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const movieEarningService = {
  getMovieEarning: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.BASE}/MovieEarning/movieEarning?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),
};

export default movieEarningService; 