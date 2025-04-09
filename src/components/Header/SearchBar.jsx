import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, Film, User, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import movieService from "../../apis/Movie/movie.js";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Animation variants for the overlay
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 },
  },
};

// Animation variants for the search container
const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.3,
      when: "beforeChildren",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// Animation variants for the input field
const inputVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1,
      duration: 0.3,
    },
  },
};

// Animation variants for the search results
const resultsVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Animation variants for each search result item
const resultItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

const SearchBar = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await movieService.getMovies(1, 100, "", query, "");

      if (response.success && response.movies) {
        setSearchResults(response.movies);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleNavigateToMovie = (movieId) => {
    navigate(`/movie/${movieId}`);
    onClose();
  };

  const handleViewAllResults = () => {
    navigate(`/search?q=${searchTerm}`);
    onClose();
  };

  const handleKeyDown = (e, callback) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  // Helper function to get poster URL from movie media
  const getPosterUrl = (movie) => {
    if (!movie || !movie.medias) return "/placeholder.svg";

    if (movie.medias.length > 0) {
      const poster = movie.medias.find((media) => media.type === "POSTER");
      if (poster) return poster.url;
      return movie.medias[0].url;
    }
    return "/placeholder.svg";
  };

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get the first 5 results to display in dropdown
  const displayResults = searchResults.slice(0, 5);

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={overlayVariants}
    >
      <motion.div
        ref={searchRef}
        className="w-full max-w-3xl bg-gray-900/90 rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
        variants={containerVariants}
      >
        <div className="flex items-center p-4 border-b border-gray-700">
          <Search className="w-5 h-5 text-[#FF009F] mr-3" />
          <motion.input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search for movies..."
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 text-base py-2"
            aria-label="Search for movies"
            variants={inputVariants}
          />
          {searchTerm && (
            <motion.button
              onClick={handleClearSearch}
              onKeyDown={(e) => handleKeyDown(e, handleClearSearch)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors mr-2"
              aria-label="Clear search"
              tabIndex="0"
              whileTap={{ scale: 0.9 }}
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
          <motion.button
            onClick={onClose}
            onKeyDown={(e) => handleKeyDown(e, onClose)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close search"
            tabIndex="0"
            whileTap={{ scale: 0.9 }}
            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        <motion.div
          className="max-h-[70vh] overflow-y-auto"
          variants={resultsVariants}
        >
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="flex justify-center">
                <div className="w-10 h-10 border-2 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin" />
              </div>
              <p className="mt-3 text-sm">Searching...</p>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <motion.div
              className="p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800/50 mb-4">
                <Search className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg">No results found</p>
              <p className="text-gray-500 mt-2">
                Try searching with different keywords
              </p>
            </motion.div>
          ) : searchTerm ? (
            <div>
              <div className="p-3 text-xs text-gray-400 uppercase tracking-wider font-medium bg-gray-800/50">
                Search Results
              </div>

              {displayResults.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  onClick={() => handleNavigateToMovie(movie.id)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, () => handleNavigateToMovie(movie.id))
                  }
                  className="flex gap-4 p-4 hover:bg-gray-800/50 cursor-pointer transition-colors border-b border-gray-800/80"
                  tabIndex="0"
                  role="button"
                  aria-label={`View details for ${movie.title}`}
                  variants={resultItemVariants}
                  custom={index}
                  whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.5)" }}
                >
                  <div className="w-24 h-36 rounded-md overflow-hidden bg-gray-800 flex-shrink-0 shadow-lg">
                    <img
                      src={getPosterUrl(movie)}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-white">
                      {movie.title}
                      {movie.originName && movie.originName !== movie.title && (
                        <span className="text-gray-400 text-sm ml-2">
                          ({movie.originName})
                        </span>
                      )}
                    </h4>

                    <div className="flex items-center mt-2 text-sm text-gray-400">
                      <span className="mr-3">{movie.releaseYear || "N/A"}</span>
                      {movie.nation && (
                        <span className="mr-3">{movie.nation}</span>
                      )}
                      {movie.duration && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(movie.duration)}
                        </span>
                      )}
                    </div>

                    {movie.genreNames && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {movie.genreNames.split(", ").map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-[#FF009F]/10 rounded-md text-xs text-[#FF009F]"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    {movie.director && (
                      <div className="mt-2 flex items-center text-sm text-gray-400">
                        <User className="w-4 h-4 mr-1" />
                        <span>Director: {movie.director}</span>
                      </div>
                    )}

                    {(movie.imdbRating > 0 || movie.rating > 0) && (
                      <div className="mt-2">
                        <span
                          className={`text-sm px-2 py-0.5 rounded-md flex items-center w-fit gap-1 ${
                            movie.imdbRating
                              ? "bg-[#F5C518]/20 text-[#F5C518]"
                              : "bg-[#FF009F]/20 text-[#FF009F]"
                          }`}
                          title={
                            movie.imdbRating ? "IMDB Rating" : "Internal Rating"
                          }
                        >
                          <Star className="w-3 h-3" fill="currentColor" />
                          {(movie.imdbRating || movie.rating).toFixed(1)}
                        </span>
                      </div>
                    )}

                    {movie.description && (
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                        {movie.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {searchResults.length > 5 && (
                <div className="p-4 bg-gray-800/30">
                  <motion.button
                    onClick={handleViewAllResults}
                    onKeyDown={(e) => handleKeyDown(e, handleViewAllResults)}
                    className="w-full py-3 text-center text-sm bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white rounded-lg hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90 transition-all font-medium shadow-lg hover:shadow-[#FF009F]/20 hover:shadow-xl"
                    aria-label={`View all ${searchResults.length} search results`}
                    tabIndex="0"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px -5px rgba(255, 0, 159, 0.3)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View all {searchResults.length} results
                  </motion.button>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SearchBar;
