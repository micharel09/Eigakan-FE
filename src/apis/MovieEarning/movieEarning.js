import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.MOVIE_EARNING;

const movieEarningService = {
  getAllMovieEarning: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/movieEarning`, {
        headers,
        params: {
          page,
          pageSize
        }
      });
      return response.data;
    }),

  getMovieEarningByLogin: (page = 1, pageSize = 10, startDate = null, endDate = null) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const res = await axios.get(`${API_URL}/GetMovieEarningByLogin`, {
          headers,
          params: {
            page,
            pageSize,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
          }
        });
        return res.data;
      } catch (err) {
        return err.response?.data || { message: "Something went wrong!" };
      }
    }),

  getMovieEarningByMovieId: (movieId, page = 1, pageSize = 10, startDate = null, endDate = null) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const res = await axios.get(`${API_URL}/GetMovieEarningByMovieId/${movieId}`, {
          headers,
          params: {
            page,
            pageSize,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
          }
        });
        // ✅ Trả trực tiếp res.data, không bọc .result nữa
        return res.data.data;
      } catch (err) {
        console.error("Fetch movie earning error:", err);
        throw err; // giữ nguyên throw để catch ở ngoài xử lý
      }
    })
};

export default movieEarningService;
