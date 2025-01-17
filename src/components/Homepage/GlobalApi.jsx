import axios from "axios";

const movieBaseUrl = "https://api.themoviedb.org/3";
const api_key = "c6139f0bab8230733e79b230a484860b";

const movieByGenreBaseURL =
  "https://api.themoviedb.org/3/discover/movie?api_key=c6139f0bab8230733e79b230a484860b";

const getTrendingVideos = axios.get(
  `${movieBaseUrl}/trending/all/day?api_key=${api_key}&append_to_response=runtime`
);

const getMovieByGenreId = (id) =>
  axios.get(movieByGenreBaseURL + "&with_genres=" + id);

const getMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(
      `${movieBaseUrl}/movie/${movieId}?api_key=${api_key}&append_to_response=videos,credits`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};

const searchMovies = (query) =>
  axios.get(`${movieBaseUrl}/search/movie?api_key=${api_key}&query=${query}`);
const getSimilarMovies = (movieId) =>
  axios.get(`${movieBaseUrl}/movie/${movieId}/similar?api_key=${api_key}`);

const getMovieImages = async (movieId) => {
  try {
    const response = await axios.get(
      `${movieBaseUrl}/movie/${movieId}/images?api_key=${api_key}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching movie images:", error);
    throw error;
  }
};

export default {
  getTrendingVideos,
  getMovieByGenreId,
  getMovieDetails,
  getMovieImages,
  searchMovies,
  getSimilarMovies,
};
