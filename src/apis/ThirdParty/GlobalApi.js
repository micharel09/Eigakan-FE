import axios from 'axios';

// OMDB API configuration
const OMDB_API_KEY = 'e51100ff'; 
const OMDB_BASE_URL = 'https://www.omdbapi.com'; 

const movieDetailsCache = new Map();
const imdbRatingsCache = new Map();

const GlobalApi = {
  searchMovie: async (title, year) => {
    try {
      const cleanTitle = title.toLowerCase().trim();
      const cacheKey = `${cleanTitle}-${year}`;
      
      if (movieDetailsCache.has(cacheKey)) {
        return movieDetailsCache.get(cacheKey);
      }
      
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          apikey: OMDB_API_KEY,
          t: title,
          y: year,
          type: 'movie',
        }
      });

      if (response.data && response.data.Response === "True") {
        const movie = {
          id: response.data.imdbID,
          imdbID: response.data.imdbID,
          title: response.data.Title,
          overview: response.data.Plot,
          release_date: response.data.Released,
          vote_average: parseFloat(response.data.imdbRating) || 0,
          vote_count: parseInt(response.data.imdbVotes.replace(/,/g, '')) || 0,
          poster_path: response.data.Poster !== "N/A" ? response.data.Poster : null,
          runtime: response.data.Runtime,
          genre: response.data.Genre,
          director: response.data.Director,
          actors: response.data.Actors,
          language: response.data.Language,
          country: response.data.Country,
          awards: response.data.Awards,
          production: response.data.Production,
          boxOffice: response.data.BoxOffice,
          rated: response.data.Rated,
          year: response.data.Year,
          type: response.data.Type,
          ratings: response.data.Ratings || []
        };
        
        // Cache the result
        movieDetailsCache.set(cacheKey, movie);
        return movie;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching movie:', error);
      return null;
    }
  },
  
  /**
   * Get movie details from OMDB API by IMDB ID
   */
  getMovieDetails: async (imdbId) => {
    try {
      if (movieDetailsCache.has(`details-${imdbId}`)) {
        return movieDetailsCache.get(`details-${imdbId}`);
      }
      
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          apikey: OMDB_API_KEY,
          i: imdbId,
          plot: 'full'
        }
      });
      
      if (response.data && response.data.Response === "True") {
        // Extract budget and revenue from the box office or N/A
        let budget = 'N/A';
        let revenue = 'N/A';
        if (response.data.BoxOffice && response.data.BoxOffice !== 'N/A') {
          // As a fallback, we'll use the BoxOffice value for revenue
          revenue = response.data.BoxOffice.replace(/[^0-9]/g, '');
        }
        
        // Parse runtime into minutes
        let runtimeMinutes = 'N/A';
        if (response.data.Runtime && response.data.Runtime !== 'N/A') {
          const runtimeStr = response.data.Runtime.replace(/[^0-9]/g, '');
          runtimeMinutes = parseInt(runtimeStr);
        }
        
        // Format data in a way compatible with existing components
        const movie = {
          id: response.data.imdbID,
          imdbID: response.data.imdbID,
          title: response.data.Title,
          overview: response.data.Plot,
          release_date: response.data.Released,
          vote_average: parseFloat(response.data.imdbRating) || 0,
          vote_count: parseInt(response.data.imdbVotes.replace(/,/g, '')) || 0,
          poster_path: response.data.Poster !== "N/A" ? response.data.Poster : null,
          runtime: runtimeMinutes,
          genres: response.data.Genre.split(', ').map(name => ({ name })),
          director: response.data.Director,
          actors: response.data.Actors,
          language: response.data.Language,
          country: response.data.Country,
          awards: response.data.Awards,
          production: response.data.Production,
          boxOffice: response.data.BoxOffice,
          rated: response.data.Rated,
          year: response.data.Year,
          type: response.data.Type,
          ratings: response.data.Ratings || [],
          metascore: response.data.Metascore,
          
          // Fields needed by components
          budget: budget,
          revenue: revenue,
          production_companies: response.data.Production ? 
            [{ name: response.data.Production }] : [],
          production_countries: response.data.Country ? 
            response.data.Country.split(', ').map(name => ({ name })) : [],
          spoken_languages: response.data.Language ? 
            response.data.Language.split(', ').map(lang => ({ english_name: lang })) : []
        };
        
        // Cache the result
        movieDetailsCache.set(`details-${imdbId}`, movie);
        return movie;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting movie details:', error);
      return null;
    }
  },
  
  
  //Get IMDB rating for a movie
   
  getImdbRating: async (imdbId) => {
    try {
      if (imdbRatingsCache.has(imdbId)) {
        return imdbRatingsCache.get(imdbId);
      }
      
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          apikey: OMDB_API_KEY,
          i: imdbId
        }
      });
      
      if (response.data && response.data.Response === "True") {
        const rating = {
          imdbId: response.data.imdbID,
          rating: parseFloat(response.data.imdbRating) || 0,
          votes: parseInt(response.data.imdbVotes.replace(/,/g, '')) || 0,
          ratings: response.data.Ratings || []
        };
        
        // Cache the result
        imdbRatingsCache.set(imdbId, rating);
        return rating;
      }
      
      return { rating: 0, votes: 0 };
    } catch (error) {
      console.error('Error getting IMDB rating:', error);
      return { rating: 0, votes: 0 };
    }
  },
  
  //  Get IMDB rating by movie title and year
  
  getImdbRatingByTitleAndYear: async (title, year) => {
    try {
      // Clean title for better matching
      const cleanTitle = title.toLowerCase().trim();
      const cacheKey = `rating-${cleanTitle}-${year}`;
      
      // Check cache first
      if (imdbRatingsCache.has(cacheKey)) {
        return imdbRatingsCache.get(cacheKey);
      }
      
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          apikey: OMDB_API_KEY,
          t: title,
          y: year,
          type: 'movie'
        }
      });
      
      if (response.data && response.data.Response === "True") {
        const rating = {
          imdbId: response.data.imdbID,
          rating: parseFloat(response.data.imdbRating) || 0,
          votes: parseInt(response.data.imdbVotes.replace(/,/g, '')) || 0,
          ratings: response.data.Ratings || []
        };
        
        // Cache the result
        imdbRatingsCache.set(cacheKey, rating);
        return rating;
      }
      
      return { rating: 0, votes: 0 };
    } catch (error) {
      console.error('Error getting IMDB rating by title and year:', error);
      return { rating: 0, votes: 0 };
    }
  },
  
  //  Search movies by title
   
  searchMovies: async (title) => {
    try {
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          apikey: OMDB_API_KEY,
          s: title,
          type: 'movie'
        }
      });
      
      if (response.data && response.data.Response === "True" && response.data.Search) {
        return response.data.Search.map(movie => ({
          id: movie.imdbID,
          imdbID: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
          poster_path: movie.Poster !== "N/A" ? movie.Poster : null,
          type: movie.Type
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  }
};

export default GlobalApi; 