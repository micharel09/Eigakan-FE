import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";
import GlobalApi from "../ThirdParty/GlobalApi";

/**
 * Service for handling movie ratings and comments
 */
const ratingService = {
  createMovieRating: (stars, movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.RATING, {
        stars,
        movieId
      }, { headers });
      return response.data;
    }),

  getUserRatingForMovie: (movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.RATING}/GetRatingByLogin`, {
        params: { movieId },
        headers
      });
      return response.data;
    }),

  createComment: (content, movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.COMMENT, {
        content,
        movieId
      }, { headers });
      return response.data;
    }),

  getMovieComments: (movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.COMMENT}/movie/${movieId}`, {
        headers
      });
      return response.data;
    }),

  /**
   * Get IMDB rating for a movie by title and year
   * @param {string} title - Movie title
   * @param {number|string} year - Release year
   * @returns {Promise<Object>} - Movie rating information
   */
  getImdbRating: async (title, year) => {
    try {
      return await GlobalApi.getImdbRatingByTitleAndYear(title, year);
    } catch (error) {
      console.error("Error getting IMDB rating:", error);
      return { rating: 0, votes: 0 };
    }
  },
  
  /**
   * Enrich movie data with IMDB ratings
   * @param {Array|Object} movies - Single movie object or array of movie objects
   * @returns {Promise<Array|Object>} - Enriched movie data with IMDB ratings
   */
  enrichMoviesWithImdbRatings: async (movies) => {
    try {
      // If it's a single movie
      if (!Array.isArray(movies)) {
        if (!movies.title || !movies.releaseYear) {
          return movies;
        }
        
        const imdbData = await ratingService.getImdbRating(movies.title, movies.releaseYear);
        return {
          ...movies,
          imdbRating: imdbData.rating,
          imdbVotes: imdbData.votes,
          imdbId: imdbData.imdbId
        };
      }

      // If it's an array of movies
      const moviesWithImdb = await Promise.all(
        movies.map(async (movie) => {
          if (!movie.title || !movie.releaseYear) {
            return movie;
          }
          
          const imdbData = await ratingService.getImdbRating(movie.title, movie.releaseYear);
          return {
            ...movie,
            imdbRating: imdbData.rating,
            imdbVotes: imdbData.votes,
            imdbId: imdbData.imdbId
          };
        })
      );
      
      return moviesWithImdb;
    } catch (error) {
      console.error("Error enriching movies with IMDB ratings:", error);
      return movies;
    }
  },
};

export default ratingService; 