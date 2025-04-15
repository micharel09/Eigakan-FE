import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";
import GlobalApi from "../ThirdParty/GlobalApi";

const RATING_URL = API_URLS.RATING;
const COMMENT_URL = API_URLS.COMMENT;

const ratingService = {
  createMovieRating: (stars, movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(RATING_URL, {
        stars,
        movieId
      }, { headers });
      return response.data;
    }),

  getUserRatingForMovie: (movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${RATING_URL}/GetRatingByLogin`, {
        params: { movieId },
        headers
      });
      return response.data;
    }),

  createComment: (content, movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(COMMENT_URL, {
        content,
        movieId
      }, { headers });
      return response.data;
    }),

  getMovieComments: (movieId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${COMMENT_URL}/movie/${movieId}`, {
        headers
      });
      return response.data;
    }),

  getImdbRating: async (title, year) => {
    try {
      const result = await GlobalApi.getImdbRatingByTitleAndYear(title, year);
      
      // Format to include all rating sources from OMDB
      return {
        rating: result.rating || 0,
        votes: result.votes || 0,
        imdbId: result.imdbId || null,
        imdbRating: result.rating || 0,
        metascore: result.ratings?.find(r => r.Source === "Metacritic")?.Value.replace(/[^0-9]/g, '') || 0,
        rottenTomatoes: result.ratings?.find(r => r.Source === "Rotten Tomatoes")?.Value.replace(/[^0-9%]/g, '') || "0%",
        allRatings: result.ratings || []
      };
    } catch (error) {
      console.error("Error getting IMDB rating:", error);
      return { rating: 0, votes: 0, imdbId: null, allRatings: [] };
    }
  },
  
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
          imdbId: imdbData.imdbId,
          metascore: imdbData.metascore,
          rottenTomatoes: imdbData.rottenTomatoes,
          allRatings: imdbData.allRatings
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
            imdbId: imdbData.imdbId,
            metascore: imdbData.metascore,
            rottenTomatoes: imdbData.rottenTomatoes,
            allRatings: imdbData.allRatings
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