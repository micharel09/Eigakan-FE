import movieHistoryService from "../MovieHistory/MovieHistory";
import movieService from "../Movie/movie";
import ratingService from "../Movie/rating";

const recommendationService = {
  /**
   * Gets recommended movies based on user's watch history and ratings
   * Uses an intelligent algorithm to recommend similar movies based on genres, years, and user ratings
   * @returns {Promise<{success: boolean, recommendations: Array}>}
   */
  getRecommendedMovies: async () => {
    try {
      // Fetch the user's watch history
      const historyResponse = await movieHistoryService.getAllListMoviesHistory(1, 1000);
      
      if (!historyResponse?.data || !historyResponse.data.movieHistories || historyResponse.data.movieHistories.length === 0) {
        // If no watch history, return empty recommendations
        console.log("No watch history found");
        return {
          success: true,
          recommendations: [],
          source: "none" // Indicates no recommendations available
        };
      }

      console.log("Watch history:", historyResponse.data.movieHistories);
      
      // Extract watched movies from history
      const watchedMovies = historyResponse.data.movieHistories.map(history => history.movies);
      
      // Get watched movie IDs for filtering out later
      const watchedMovieIds = new Set(watchedMovies.map(movie => movie.id));
      
      // Check if any watchedMovies have genreNames, if not we need to fetch more movie details
      const needGenreDetails = !watchedMovies.some(movie => movie.genreNames);
      
      // If we need more details, get them for each watched movie
      let watchedMoviesWithDetails = [...watchedMovies];
      if (needGenreDetails) {
        try {
          // Get details for each watched movie in parallel
          const detailPromises = watchedMovies.map(movie => 
            movieService.getMovieById(movie.id).catch(() => null)
          );
          const detailsResults = await Promise.all(detailPromises);
          
          // Replace movies with their detailed versions if available
          watchedMoviesWithDetails = detailsResults
            .filter(result => result !== null)
            .map(movie => movie);
          
          console.log("Watched movies with details:", watchedMoviesWithDetails);
        } catch (error) {
          console.error("Error fetching movie details:", error);
          // If we can't get details, continue with basic recommendations
        }
      }
      
      // Fetch user ratings for watched movies to improve recommendation quality
      const ratingPromises = watchedMovies.map(movie => 
        ratingService.getUserRatingForMovie(movie.id).catch(() => null)
      );
      
      const ratingsResults = await Promise.all(ratingPromises);
      const movieRatings = {};
      
      // Process ratings into a usable format
      ratingsResults.forEach(result => {
        if (result?.success && result.data) {
          movieRatings[result.data.movieId] = result.data.stars;
        }
      });
      
      console.log("Movie ratings:", movieRatings);
      
      // Check if we have enough watch history for meaningful recommendations
      if (watchedMoviesWithDetails.length < 1) {
        console.log("Not enough watch history for personalized recommendations");
        return {
          success: true,
          recommendations: [],
          source: "none"
        };
      }
      
      // Extract patterns from watch history (genres, years, etc.) and incorporate ratings
      const patterns = extractPatterns(watchedMoviesWithDetails, movieRatings);
      
      console.log("Extracted patterns:", patterns);
      
      // For very limited watch history (1-2 movies), we'll be more lenient
      const isLimitedHistory = watchedMoviesWithDetails.length <= 2;
      
      // Get all movies to filter from
      const allMoviesResponse = await movieService.getMovies(1, 200);
      const allMovies = allMoviesResponse.movies || [];

      console.log(`Found ${allMovies.length} total movies to filter from`);

      // Filter out already watched movies
      const unwatchedMovies = allMovies.filter(movie => 
        !watchedMovieIds.has(movie.id)
      );
      
      console.log(`${unwatchedMovies.length} unwatched movies`);
      
      // If no unwatched movies, return empty recommendations
      if (unwatchedMovies.length === 0) {
        return {
          success: true,
          recommendations: [],
          source: "none"
        };
      }
      
      // Score and rank the unwatched movies based on patterns
      const scoredMovies = scoreMovies(unwatchedMovies, patterns, watchedMoviesWithDetails, movieRatings, isLimitedHistory);
      
      console.log("Scored movies:", scoredMovies.map(m => ({
        title: m.title,
        score: m.recommendationScore,
        components: m.scoreComponents
      })));
      
      // Use a lower threshold for limited watch history
      const MINIMUM_SCORE_THRESHOLD = isLimitedHistory ? 1 : 3;
      
      // Filter movies with a minimum similarity threshold to ensure relevance
      let relevantMovies = scoredMovies.filter(movie => movie.recommendationScore >= MINIMUM_SCORE_THRESHOLD);
      
      console.log(`${relevantMovies.length} movies above threshold ${MINIMUM_SCORE_THRESHOLD}`);
      
      // If too few movies meet the threshold, gradually lower it
      if (relevantMovies.length < 3 && scoredMovies.length > 0) {
        console.log("Too few relevant movies, lowering threshold");
        // Take top 5 regardless of score
        relevantMovies = scoredMovies.slice(0, 5);
      }
      
      // If still no movies, return empty
      if (relevantMovies.length === 0) {
        console.log("No relevant movies found after all attempts");
        return {
          success: true,
          recommendations: [],
          source: "none"
        };
      }
      
      // Add an explanation of why each movie was recommended
      const moviesWithExplanation = relevantMovies.map(movie => {
        const explanation = generateRecommendationExplanation(movie, patterns, watchedMoviesWithDetails);
        return {
          ...movie,
          recommendationReason: explanation
        };
      });
      
      console.log("Final recommendations:", moviesWithExplanation.map(m => ({ 
        title: m.title, 
        score: m.recommendationScore, 
        reason: m.recommendationReason 
      })));
      
      // Return top recommendations (limited to 10)
      return {
        success: true,
        recommendations: moviesWithExplanation.slice(0, 10),
        source: "personalized" // Indicates these are personalized recommendations
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return {
        success: false,
        recommendations: [],
        error: error.message
      };
    }
  }
};

/**
 * Generates a human-readable explanation for why a movie was recommended
 * @param {Object} movie - The recommended movie
 * @param {Object} patterns - The extracted patterns from watch history
 * @param {Array} watchedMovies - Movies the user has watched
 * @returns {String} An explanation string
 */
const generateRecommendationExplanation = (movie, patterns, watchedMovies) => {
  const reasons = [];
  
  // Check for genre matches
  if (movie.genreNames) {
    const movieGenres = movie.genreNames.split(',').map(g => g.trim());
    const matchedGenres = movieGenres.filter(genre => patterns.genres[genre]);
    
    if (matchedGenres.length > 0) {
      reasons.push(`similar genres (${matchedGenres.join(', ')})`);
    }
  }
  
  // Check for director matches
  if (movie.director && patterns.directors[movie.director]) {
    reasons.push(`same director (${movie.director})`);
  }
  
  // Check for actor matches
  if (movie.actors) {
    const movieActors = movie.actors.split(',').map(a => a.trim());
    const matchedActors = movieActors.filter(actor => patterns.actors[actor]);
    
    if (matchedActors.length > 0) {
      reasons.push(`featuring ${matchedActors.join(', ')}`);
    }
  }
  
  // Check for year proximity
  if (movie.releaseYear) {
    const watchedYears = Object.keys(patterns.years);
    if (watchedYears.some(year => Math.abs(parseInt(movie.releaseYear) - parseInt(year)) <= 3)) {
      reasons.push(`from a similar time period`);
    }
  }
  
  // Generate the final reason string
  if (reasons.length === 0) {
    return "based on your viewing preferences";
  } else if (reasons.length === 1) {
    return reasons[0];
  } else {
    const lastReason = reasons.pop();
    return `${reasons.join(', ')} and ${lastReason}`;
  }
};

/**
 * Extracts patterns from watched movies to use for recommendations
 * @param {Array} watchedMovies - List of movies the user has watched
 * @param {Object} ratings - User ratings for movies
 * @returns {Object} Patterns object containing preferred genres, years, etc.
 */
const extractPatterns = (watchedMovies, ratings = {}) => {
  const genres = {};
  const years = {};
  const directors = {};
  const actors = {};
  
  // For limited watch history, extract genres from movie titles if needed
  if (watchedMovies.length <= 2) {
    watchedMovies.forEach(movie => {
      if (!movie.genreNames && movie.title) {
        // Try to infer genres from title for common keywords
        const title = movie.title.toLowerCase();
        if (title.includes('action') || title.includes('fight') || title.includes('wick')) {
          genres['Action'] = (genres['Action'] || 0) + 1;
        }
        if (title.includes('horror') || title.includes('scary') || title.includes('dead')) {
          genres['Horror'] = (genres['Horror'] || 0) + 1;
        }
        if (title.includes('comedy') || title.includes('funny')) {
          genres['Comedy'] = (genres['Comedy'] || 0) + 1;
        }
        if (title.includes('sci-fi') || title.includes('space') || title.includes('future')) {
          genres['Sci-Fi'] = (genres['Sci-Fi'] || 0) + 1;
        }
        if (title.includes('drama')) {
          genres['Drama'] = (genres['Drama'] || 0) + 1;
        }
        if (title.includes('adventure') || title.includes('quest') || title.includes('journey')) {
          genres['Adventure'] = (genres['Adventure'] || 0) + 1;
        }
      }
    });
  }
  
  // Count occurrences first to identify primary preferences
  const genreCounts = {};
  const allGenres = new Set();
  
  // First pass: collect all genre information
  watchedMovies.forEach(movie => {
    if (movie.genreNames) {
      const movieGenres = movie.genreNames.split(',').map(g => g.trim());
      movieGenres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        allGenres.add(genre);
      });
    }
  });
  
  // Calculate genre frequency to identify primary genres
  const totalMovies = Math.max(watchedMovies.length, 1); // Avoid division by zero
  const primaryGenres = new Set();
  allGenres.forEach(genre => {
    // For very limited history, treat all genres as primary
    if (watchedMovies.length <= 2) {
      primaryGenres.add(genre);
    } else {
      const frequency = genreCounts[genre] / totalMovies;
      if (frequency >= 0.25) { // Consider genres present in at least 25% of watched movies as primary
        primaryGenres.add(genre);
      }
    }
  });
  
  // Second pass: apply weights with emphasis on primary genres
  watchedMovies.forEach(movie => {
    // Get rating weight - higher rated movies have more influence
    const ratingWeight = ratings[movie.id] ? (ratings[movie.id] / 2.5) : 1;
    const recencyWeight = getRecencyWeight(movie.createDate);
    const totalWeight = ratingWeight * recencyWeight;
    
    // Extract genres with rating weight and primary genre boost
    if (movie.genreNames) {
      const movieGenres = movie.genreNames.split(',').map(g => g.trim());
      movieGenres.forEach(genre => {
        // Apply higher weight to primary genres
        const genreWeight = primaryGenres.has(genre) ? 2.5 : 1;
        genres[genre] = (genres[genre] || 0) + (genreWeight * totalWeight);
      });
    }
    
    // Extract years with weights
    if (movie.releaseYear) {
      years[movie.releaseYear] = (years[movie.releaseYear] || 0) + totalWeight;
    }
    
    // Extract directors with weights
    if (movie.director) {
      directors[movie.director] = (directors[movie.director] || 0) + totalWeight;
    }
    
    // Extract actors with weights
    if (movie.actors) {
      const movieActors = movie.actors.split(',').map(a => a.trim());
      movieActors.forEach(actor => {
        actors[actor] = (actors[actor] || 0) + totalWeight;
      });
    }
  });
  
  // If we still have no genres (could happen with limited data), add default genres
  if (Object.keys(genres).length === 0) {
    // Popular genres as fallback
    genres["Action"] = 1;
    genres["Adventure"] = 1;
    if (watchedMovies.some(m => m.title && m.title.includes("John Wick"))) {
      genres["Action"] = 3; // Boost action for John Wick
      genres["Thriller"] = 2;
    } else if (watchedMovies.some(m => m.title && m.title.includes("Sonic"))) {
      genres["Family"] = 3;
      genres["Adventure"] = 3;
      genres["Comedy"] = 2;
    }
  }
  
  return {
    genres,
    years,
    directors,
    actors,
    primaryGenres: Array.from(primaryGenres)
  };
};

/**
 * Calculate weight based on recency of watch
 * @param {String} createDate - Date when movie was watched
 * @returns {Number} Weight between 1-1.5 with more recent watches weighted higher
 */
const getRecencyWeight = (createDate) => {
  if (!createDate) return 1;
  
  try {
    const watchDate = new Date(createDate);
    const now = new Date();
    const daysDifference = Math.floor((now - watchDate) / (1000 * 60 * 60 * 24));
    
    // Recent watches (within 30 days) get higher weight
    if (daysDifference <= 30) {
      return 1.5 - (daysDifference / 30) * 0.5; // Scale from 1.5 down to 1.0
    }
    return 1.0;
  } catch (e) {
    return 1.0;
  }
};

/**
 * Scores unwatched movies based on similarity to patterns
 * @param {Array} unwatchedMovies - Movies the user hasn't watched
 * @param {Object} patterns - Patterns extracted from watch history
 * @param {Array} watchedMovies - Movies the user has watched (for additional context)
 * @param {Object} ratings - User ratings for movies
 * @param {Boolean} isLimitedHistory - Whether user has limited watch history
 * @returns {Array} Sorted array of movies with scores
 */
const scoreMovies = (unwatchedMovies, patterns, watchedMovies, ratings = {}, isLimitedHistory = false) => {
  // Calculate average rating to use as baseline
  const ratingValues = Object.values(ratings);
  const avgRating = ratingValues.length > 0 
    ? ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length 
    : 3;
  
  // Get top 3 genres
  const topGenres = Object.entries(patterns.genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  console.log("Top genres detected:", topGenres);
  
  return unwatchedMovies
    .map(movie => {
      let score = 0;
      const scoreComponents = {
        genreScore: 0,
        yearScore: 0,
        directorScore: 0,
        actorScore: 0,
        similarityScore: 0
      };
      
      // More lenient scoring for limited history
      const minOverlapThreshold = isLimitedHistory ? 0.1 : 0.2;
      
      // Score based on genre matches - this is the most important factor
      if (movie.genreNames) {
        const movieGenres = movie.genreNames.split(',').map(g => g.trim());
        let genreMatchCount = 0;
        
        movieGenres.forEach(genre => {
          if (patterns.genres[genre]) {
            // Extra weight for top genres
            const genreImportance = topGenres.includes(genre) ? 4 : 2.5;
            const genreScore = patterns.genres[genre] * genreImportance;
            score += genreScore;
            scoreComponents.genreScore += genreScore;
            genreMatchCount++;
          }
        });
        
        // For limited history, don't require exact genre match
        if (!isLimitedHistory && genreMatchCount === 0 && Object.keys(patterns.genres).length > 0) {
          // Apply a small base score even without genre matches for limited history
          score += isLimitedHistory ? 1 : 0;
        }
        
        // Boost score based on genre match percentage (how many of the movie's genres match preferences)
        if (genreMatchCount > 0) {
          const genreMatchPercentage = genreMatchCount / movieGenres.length;
          score += genreMatchPercentage * 5; // Up to 5 additional points
          scoreComponents.genreScore += genreMatchPercentage * 5;
        }
      }
      
      // Score based on release year proximity
      if (movie.releaseYear) {
        Object.keys(patterns.years).forEach(year => {
          const yearDiff = Math.abs(parseInt(movie.releaseYear) - parseInt(year));
          if (yearDiff <= 5) { // Within 5 years
            const yearScore = (5 - yearDiff) * patterns.years[year] * 0.5;
            score += yearScore;
            scoreComponents.yearScore += yearScore;
          }
        });
      }
      
      // Score based on director matches - strong signal
      if (movie.director && patterns.directors[movie.director]) {
        const directorScore = patterns.directors[movie.director] * 10;
        score += directorScore;
        scoreComponents.directorScore += directorScore;
      }
      
      // Score based on actor matches
      if (movie.actors) {
        const movieActors = movie.actors.split(',').map(a => a.trim());
        movieActors.forEach(actor => {
          if (patterns.actors[actor]) {
            const actorScore = patterns.actors[actor] * 3;
            score += actorScore;
            scoreComponents.actorScore += actorScore;
          }
        });
      }
      
      // Find similar watched movies to boost relevance - this is critical
      const similarityBoost = watchedMovies.reduce((boost, watched) => {
        // Skip if we don't have genre info but not for limited history
        if (!isLimitedHistory && (!movie.genreNames || !watched.genreNames)) {
          return boost;
        }
        
        let genreOverlap = 0;
        
        // Handle case when genre information is incomplete
        if (movie.genreNames && watched.genreNames) {
          // Check for genre overlap - this is the most important similarity factor
          const movieGenres = movie.genreNames.split(',').map(g => g.trim());
          const watchedGenres = watched.genreNames.split(',').map(g => g.trim());
          
          // Count genre matches
          const matchingGenres = movieGenres.filter(g => watchedGenres.includes(g));
          
          // If no genre matches at all, we can still proceed with limited history
          if (matchingGenres.length === 0 && !isLimitedHistory) {
            return boost;
          }
          
          // Calculate genre overlap percentage
          genreOverlap = movieGenres.length > 0 ? 
            matchingGenres.length / Math.max(movieGenres.length, watchedGenres.length) : 0;
          
          // Only consider substantial genre overlap unless limited history
          if (genreOverlap < minOverlapThreshold && !isLimitedHistory) {
            return boost;
          }
        } else {
          // When genre info is missing, use title-based heuristics for similarity
          const movieTitle = (movie.title || "").toLowerCase();
          const watchedTitle = (watched.title || "").toLowerCase();
          
          // Check for similar keywords
          const keywords = ['action', 'adventure', 'comedy', 'drama', 'thriller', 'horror', 'fantasy', 'sci-fi'];
          const commonKeywords = keywords.filter(kw => 
            movieTitle.includes(kw) && watchedTitle.includes(kw)
          );
          
          genreOverlap = commonKeywords.length > 0 ? 0.2 * commonKeywords.length : 0;
        }
        
        // Year proximity (0-1 scale, 1 being same year)
        const yearProximity = movie.releaseYear && watched.releaseYear
          ? Math.max(0, 1 - Math.abs(parseInt(movie.releaseYear) - parseInt(watched.releaseYear)) / 10)
          : 0;
        
        // Calculate similarity score with genre having much more weight
        const similarity = (genreOverlap * 0.8) + (yearProximity * 0.2);
        
        // Apply rating weight if available
        const ratingWeight = ratings[watched.id] 
          ? ((ratings[watched.id] - avgRating) / 2) + 1 // Scale to ~0.5-1.5 range
          : 1;
        
        return boost + (similarity * ratingWeight);
      }, 0);
      
      // Add the similarity boost to the score with high weight
      const similarityScore = similarityBoost * 8;
      score += similarityScore;
      scoreComponents.similarityScore += similarityScore;
      
      // For limited history, add a minimal base score
      if (isLimitedHistory && score < 1) {
        score = Math.max(score, 0.5);
      }
      
      return { 
        ...movie, 
        recommendationScore: score,
        scoreComponents 
      };
    })
    .filter(movie => isLimitedHistory || movie.recommendationScore > 0) // Remove zero-scored movies unless limited history
    .sort((a, b) => b.recommendationScore - a.recommendationScore); // Sort by score descending
};

export default recommendationService; 