import axios from "axios";
import { makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.MOVIE_COUNT;

const movieCountService = {
  getMovieCountByMovieId: (movieId) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URL}/GetMovieCountByMovieId/${movieId}`);
      return response;
    }, true),

  getStatisticMovieCount: (movieId) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URL}/StatisticMovieCount/${movieId}`);
      return response;
    }, true),

  increaseMovieCount: (movieData) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URL}/IncreaseMovieCount`, movieData);
      return response;
    }, true),
};

export default movieCountService;