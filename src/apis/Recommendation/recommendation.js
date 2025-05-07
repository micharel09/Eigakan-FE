import movieHistoryService from "../MovieHistory/MovieHistory";
import movieService from "../Movie/movie";
import ratingService from "../Movie/rating";

/**
 * Service for handling movie recommendations
 */
const recommendationService = {
  /**
   * Get recommended movies for the user
   * Based on their watch history and ratings
   */
  getRecommendedMovies: async () => {
    try {
      // Get 50 most recent movies from user's watch history
      const { data: historyData } = await movieHistoryService.getAllListMoviesHistory(1, 50);
      if (!historyData?.movieHistories?.length) {
        return { success: true, recommendations: [], source: "none" };
      }

      // Extract watched movies and their IDs
      const watchedMovies = historyData.movieHistories.map(h => h.movies);
      const watchedIds = new Set(watchedMovies.map(m => m.id));

      // If movies don't have genre info, fetch additional details
      let moviesWithDetails = [...watchedMovies];
      if (!watchedMovies.some(m => m.genreNames)) {
        const details = await Promise.all(
          watchedMovies.map(m => movieService.getMovieById(m.id).catch(() => null))
        );
        moviesWithDetails = details.filter(Boolean).map(r => r.data || r);
      }

      // Get user ratings for watched movies
      const ratings = {};
      const ratingResults = await Promise.all(
        watchedMovies.map(m => ratingService.getUserRatingForMovie(m.id).catch(() => null))
      );
      ratingResults.forEach(r => {
        if (r?.success && r.data) ratings[r.data.movieId] = r.data.stars;
      });

      // Analyze user preferences based on watch history and ratings
      const prefs = getUserPreferences(moviesWithDetails, ratings);

      // Get list of all active movies
      const { movies: allMovies = [] } = await movieService.getMovies(1, 200);
      // Filter out already watched movies
      const unwatched = allMovies.filter(m => !watchedIds.has(m.id));
      if (!unwatched.length) {
        return { success: true, recommendations: [], source: "none" };
      }

      // Score and rank unwatched movies, get top 10
      const recommendations = rankMovies(unwatched, prefs, ratings).slice(0, 10);
      return { success: true, recommendations, source: "personalized" };

    } catch (error) {
      console.error("Recommendation error:", error);
      return { success: false, recommendations: [], error: error.message };
    }
  }
};

/**
 * Analyze user preferences based on watch history and ratings
 */
const getUserPreferences = (movies, ratings) => {
  const genres = {};       
  const years = {};       
  const titles = new Set(); 
  const recentGenres = new Set(); 

  // Sort movies by watch date, most recent first
  const sorted = [...movies].sort((a, b) => new Date(b.createDate || 0) - new Date(a.createDate || 0));
  
  // Get and store genres from most recent movie
  const latestGenres = sorted[0]?.genreNames?.split(',').map(g => g.trim()) || [];
  latestGenres.forEach(g => recentGenres.add(g));

  // Process each movie to calculate preferences
  sorted.forEach(movie => {
    // Calculate weight based on user rating
    const weight = (ratings[movie.id] || 3) / 3;
    const isRecent = movie === sorted[0]; 

    // Store movie title in watched list
    if (movie.title) titles.add(movie.title.toLowerCase().trim());

    // Process and score each genre
    movie.genreNames?.split(',').forEach(genre => {
      const g = genre.trim();
      const boost = recentGenres.has(g) ? 2 : 1;
      //score = rating weight * time factor
      genres[g] = (genres[g] || 0) + (weight * boost);
    });

    // Process and score release year
    if (movie.releaseYear) {
      // Recent movie year gets double points
      const yearBoost = isRecent ? 2 : 1;
      // Accumulate year score
      years[movie.releaseYear] = (years[movie.releaseYear] || 0) + (weight * yearBoost);
    }
  });

  // Return object containing all user preferences
  return { genres, years, titles, recentGenres };
};

/**
 * Score and rank unwatched movies based on user preferences
 */
const rankMovies = (movies, prefs, ratings) => {
  // Calculate user's average rating
  const avgRating = Object.values(ratings).reduce((sum, r) => sum + r, 0) / 
                   Math.max(Object.values(ratings).length, 1);

  return movies
    .map(movie => {
      let score = 0;
      // Object to store movie match information
      const matchData = {
        exactTitle: false,         // Whether title matches a watched movie
        genreMatches: 0,          // Number of matching genres
        recentGenreMatches: 0     // Number of matches with recent genres
      };

      // Score exact title matches (100 points)
      if (movie.title && prefs.titles.has(movie.title.toLowerCase().trim())) {
        score += 100;
        matchData.exactTitle = true;
      }

      // Score genres (up to 60 points)
      if (movie.genreNames) {
        const genres = movie.genreNames.split(',').map(g => g.trim());
        genres.forEach(genre => {
          if (prefs.genres[genre]) {
            matchData.genreMatches++;
            
            if (prefs.recentGenres.has(genre)) {
              matchData.recentGenreMatches++;
              score += prefs.genres[genre] * 8;
            } else {
              score += prefs.genres[genre] * 6;
            }
          }
        });

        if (matchData.genreMatches > 1) score += matchData.genreMatches * 2;
        if (matchData.recentGenreMatches > 0) score += matchData.recentGenreMatches * 5;
      }

      // Score release year (up to 20 points)
      if (movie.releaseYear) {
        Object.keys(prefs.years).forEach(year => {
          const diff = Math.abs(movie.releaseYear - year);
          if (diff <= 5) score += (5 - diff) * prefs.years[year] * 2;
        });
      }

      // Score movie rating (up to 20 points)
      // Bonus points for ratings above user's average
      if (movie.rating && movie.rating > avgRating) {
        score += (movie.rating - avgRating) * 2;
      }

      // Return movie info with recommendation data
      return {
        ...movie,
        recommendationScore: score,
        exactTitleMatch: matchData.exactTitle,
        recommendationReason: generateReason(movie, prefs, matchData)
      };
    })
    // Filter out movies with zero score
    .filter(m => m.recommendationScore > 0)
    // Sort by priority:
    // 1. Exact title matches
    // 2. Recent genre matches
    // 3. Overall score
    .sort((a, b) => {
      if (a.exactTitleMatch !== b.exactTitleMatch) {
        return b.exactTitleMatch ? 1 : -1;
      }
      if (a.recentGenreMatches !== b.recentGenreMatches) {
        return b.recentGenreMatches - a.recentGenreMatches;
      }
      return b.recommendationScore - a.recommendationScore;
    });
};

/**
 * Generate recommendation reason for a movie
 * @param {Object} movie - Movie to generate reason for
 * @param {Object} prefs - User preferences
 * @param {Object} matchData - Movie match information
 * @returns {string} Formatted reason string
 */
const generateReason = (movie, prefs, matchData) => {
  const reasons = [];

  // Add reason for title similarity
  if (matchData.exactTitle) {
    reasons.push('similar title to a movie you watched');
  }

  // Add reasons based on genres
  if (movie.genreNames) {
    const genres = movie.genreNames.split(',').map(g => g.trim());
    // Categorize genres into recent and other matches
    const matchedGenres = genres.reduce((acc, genre) => {
      if (prefs.recentGenres.has(genre)) {
        acc.recent.push(genre);
      } else if (prefs.genres[genre]) {
        acc.other.push(genre);
      }
      return acc;
    }, { recent: [], other: [] });

    // Prioritize showing recent genre matches
    if (matchedGenres.recent.length) {
      reasons.push(`matches your recent interests in ${matchedGenres.recent.join(', ')}`);
    } else if (matchedGenres.other.length) {
      reasons.push(`similar genres (${matchedGenres.other.join(', ')})`);
    }
  }

  // Add reason for release year similarity
  if (movie.releaseYear && Object.keys(prefs.years).some(y => Math.abs(movie.releaseYear - y) <= 5)) {
    reasons.push('from a similar time period');
  }

  // Combine all reasons into a complete sentence
  return reasons.length ? reasons.join(' and ') : 'based on your viewing preferences';
};

export default recommendationService; 