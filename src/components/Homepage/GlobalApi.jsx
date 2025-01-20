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

const getPopularPeople = (page = 1) =>
  axios.get(`${movieBaseUrl}/person/popular?api_key=${api_key}&page=${page}`);

const getPersonDetails = (personId) =>
  axios.get(`${movieBaseUrl}/person/${personId}?api_key=${api_key}`);

const getPersonCredits = (personId) =>
  axios.get(
    `${movieBaseUrl}/person/${personId}/combined_credits?api_key=${api_key}`
  );

const getTopRatedMovies = axios.get(
  `${movieBaseUrl}/movie/top_rated?api_key=${api_key}&sort_by=vote_average.desc&vote_count.gte=1000`
);

const getTopRatedTVShows = (page = 1) =>
  axios.get(`${movieBaseUrl}/tv/top_rated?api_key=${api_key}&page=${page}`);

export default {
  getTrendingVideos,
  getMovieByGenreId,
  getMovieDetails,
  getMovieImages,
  searchMovies,
  getSimilarMovies,
  getPopularPeople,
  getPersonDetails,
  getPersonCredits,
  getTopRatedMovies,
  getTopRatedTVShows,
};
