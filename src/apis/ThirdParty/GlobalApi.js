import axios from 'axios';

const TMDB_API_KEY = 'c45a857c193f6302f2b5061c3b85e743'; // TMDb API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Cache for movie details to avoid redundant API calls
const movieDetailsCache = new Map();
const imdbRatingsCache = new Map();

const GlobalApi = {
  /**
   * Search for a movie in TMDb API by title and year
   * @param {string} title - Movie title
   * @param {string|number} year - Release year
   * @returns {Promise<Object>} - The closest matching movie
   */
  searchMovie: async (title, year) => {
    try {
      // Clean title for better matching
      const cleanTitle = title.toLowerCase().trim();
      const cacheKey = `${cleanTitle}-${year}`;
      
      // Check cache first
      if (movieDetailsCache.has(cacheKey)) {
        return movieDetailsCache.get(cacheKey);
      }
      
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: title,
          year: year,
          include_adult: false,
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        // Find best match by comparing titles and years
        const results = response.data.results;
        
        // First try exact title and year match
        let bestMatch = results.find(movie => {
          const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
          return (
            movie.title.toLowerCase() === cleanTitle && 
            movieYear === parseInt(year)
          );
        });
        
        // If no exact match, try title match with closest year
        if (!bestMatch) {
          bestMatch = results.find(movie => 
            movie.title.toLowerCase() === cleanTitle
          );
        }
        
        // If still no match, just use the first result
        if (!bestMatch) {
          bestMatch = results[0];
        }
        
        // Cache the result
        movieDetailsCache.set(cacheKey, bestMatch);
        return bestMatch;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching movie:', error);
      return null;
    }
  },
  
  /**
   * Get movie details from TMDb API by TMDb ID
   * @param {string|number} tmdbId - TMDb movie ID
   * @returns {Promise<Object>} - Movie details including IMDB ID
   */
  getMovieDetails: async (tmdbId) => {
    try {
      // Check cache first
      if (movieDetailsCache.has(`details-${tmdbId}`)) {
        return movieDetailsCache.get(`details-${tmdbId}`);
      }
      
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'external_ids,credits',
        }
      });
      
      // Cache the result
      movieDetailsCache.set(`details-${tmdbId}`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting movie details:', error);
      return null;
    }
  },
  
  /**
   * Get IMDB rating for a movie
   * @param {string} imdbId - IMDB ID
   * @returns {Promise<Object>} - Rating information
   */
  getImdbRating: async (imdbId) => {
    try {
      // Check cache first
      if (imdbRatingsCache.has(imdbId)) {
        return imdbRatingsCache.get(imdbId);
      }
      
      // Using OMDb API which requires its own API key
      // For now we'll rely on TMDb vote_average as a substitute for IMDB rating
      // In production, you would integrate with OMDb API or another service that provides IMDB ratings
      
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${imdbId}/external_ids`, {
        params: {
          api_key: TMDB_API_KEY,
        }
      });
      
      const movieDetails = await GlobalApi.getMovieDetails(imdbId);
      
      const rating = {
        imdbId: response.data.imdb_id,
        rating: movieDetails ? movieDetails.vote_average : 0,
        votes: movieDetails ? movieDetails.vote_count : 0
      };
      
      // Cache the result
      imdbRatingsCache.set(imdbId, rating);
      return rating;
    } catch (error) {
      console.error('Error getting IMDB rating:', error);
      return { rating: 0, votes: 0 };
    }
  },
  
  /**
   * Get IMDB rating by movie title and year
   * @param {string} title - Movie title
   * @param {string|number} year - Release year
   * @returns {Promise<Object>} - Rating information
   */
  getImdbRatingByTitleAndYear: async (title, year) => {
    try {
      // Clean title for better matching
      const cleanTitle = title.toLowerCase().trim();
      const cacheKey = `rating-${cleanTitle}-${year}`;
      
      // Check cache first
      if (imdbRatingsCache.has(cacheKey)) {
        return imdbRatingsCache.get(cacheKey);
      }
      
      // Search for the movie in TMDb
      const movie = await GlobalApi.searchMovie(title, year);
      
      if (!movie) {
        return { rating: 0, votes: 0 };
      }
      
      // Get movie details to get IMDB ID
      const movieDetails = await GlobalApi.getMovieDetails(movie.id);
      
      if (!movieDetails || !movieDetails.external_ids || !movieDetails.external_ids.imdb_id) {
        return { 
          rating: movie.vote_average || 0, 
          votes: movie.vote_count || 0 
        };
      }
      
      const rating = {
        imdbId: movieDetails.external_ids.imdb_id,
        rating: movieDetails.vote_average || 0,
        votes: movieDetails.vote_count || 0
      };
      
      // Cache the result
      imdbRatingsCache.set(cacheKey, rating);
      return rating;
    } catch (error) {
      console.error('Error getting IMDB rating by title and year:', error);
      return { rating: 0, votes: 0 };
    }
  }
};

export default GlobalApi; 