import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImdb } from "@fortawesome/free-brands-svg-icons";
import { PlayCircle, Clock, Star, Calendar, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import movieService from "../../apis/Movie/movie";
import Loading from "../Loading/Loading";

const Slider = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  const handleWatchNow = (e, movieId) => {
    e.preventDefault();
    navigate(`/watch/${movieId}`);
  };

  const handleMoreInfo = (e, movieId) => {
    e.preventDefault();
    navigate(`/movie/${movieId}`);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleKeyDown = (e, callback) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback(e);
    }
  };

  const preloadNextImage = useCallback(
    (nextIndex) => {
      if (!movies[nextIndex]) return;

      const img = new Image();
      img.src = movies[nextIndex].medias?.[0]?.url || "/placeholder.svg";
    },
    [movies]
  );

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await movieService.getMovies(1, 5, {
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (!response.success || !response.movies?.length) {
          throw new Error("No movies found");
        }

        setMovies(response.movies);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    if (movies.length <= 0) return;

    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % movies.length;
      preloadNextImage(nextIndex);
      setCurrentIndex(nextIndex);
    }, 8000);

    return () => clearInterval(timer);
  }, [currentIndex, movies.length, preloadNextImage]);

  if (!isInitialized && !isLoading && !error) {
    return (
      <div className="relative h-[85vh] bg-gray-900 flex items-center justify-center -mt-16">
        <div className="text-white text-center">
          <p>Initializing content...</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReload}
            onKeyDown={(e) => handleKeyDown(e, handleReload)}
            className="mt-4 px-6 py-2 bg-[#FF009F] rounded-full hover:bg-[#FF6B9F] transition-colors"
            aria-label="Reload page"
            tabIndex="0"
          >
            Reload Page
          </motion.button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[85vh] flex items-center justify-center -mt-16">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading content: {error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReload}
            onKeyDown={(e) => handleKeyDown(e, handleReload)}
            className="px-6 py-2 bg-[#FF009F] text-white rounded-full hover:bg-[#FF6B9F] transition-colors"
            aria-label="Try loading movies again"
            tabIndex="0"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading className="h-[85vh] -mt-16" />;
  }

  if (!movies.length) {
    return (
      <div className="relative h-[85vh] bg-gray-900 flex items-center justify-center -mt-16">
        <div className="text-white text-center">
          <p>No movies found. Please try again later.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReload}
            onKeyDown={(e) => handleKeyDown(e, handleReload)}
            className="mt-4 px-6 py-2 bg-[#FF009F] rounded-full hover:bg-[#FF6B9F] transition-colors"
            aria-label="Reload page to try again"
            tabIndex="0"
          >
            Reload Page
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[60vh] sm:h-[70vh] md:h-[85vh] bg-black overflow-hidden -mt-16">
      <div className="absolute inset-x-0 top-0 h-24 sm:h-40 bg-gradient-to-b from-black via-black/50 to-transparent z-10" />

      <AnimatePresence mode="wait">
        {movies.map(
          (movie, index) =>
            index === currentIndex && (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                  <motion.img
                    initial={{ scale: 1.02 }}
                    animate={{ scale: 1.05 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    src={movie.medias?.[0]?.url || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === currentIndex ? "high" : "low"}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="relative z-20 flex flex-col justify-center h-full ml-[5%] max-w-[90%] sm:max-w-[70%] md:max-w-[50%] text-white mt-2"
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 leading-tight">
                    {movie.title}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "40%" }}
                      transition={{ duration: 1, delay: 1 }}
                      className="h-0.5 sm:h-1 bg-gradient-to-r from-[#FF009F] to-transparent mt-1 sm:mt-2"
                    />
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
                    <MetadataBadge
                      icon={
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF009F]" />
                      }
                    >
                      {movie.releaseYear}
                    </MetadataBadge>

                    {movie.duration && (
                      <MetadataBadge
                        icon={
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF009F]" />
                        }
                      >
                        {Math.floor(movie.duration / 60)}h {movie.duration % 60}
                        m
                      </MetadataBadge>
                    )}

                    {movie.imdbScore && (
                      <MetadataBadge
                        icon={
                          <FontAwesomeIcon
                            icon={faImdb}
                            className="text-[#FFD43B] text-sm sm:text-lg"
                          />
                        }
                      >
                        <span className="font-semibold">{movie.imdbScore}</span>
                      </MetadataBadge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-6">
                    {movie.genreNames
                      ?.split(",")
                      .slice(0, 3)
                      .map((genre, idx) => (
                        <Link
                          key={idx}
                          to={`/genre/${genre.trim()}`}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#FF009F]/20 border border-[#FF009F]/30 rounded-md text-xs sm:text-sm
                               hover:bg-[#FF009F]/40 transition-all duration-300 transform hover:scale-105"
                          aria-label={`View ${genre.trim()} movies`}
                          tabIndex="0"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.currentTarget.click();
                            }
                          }}
                        >
                          {genre.trim()}
                        </Link>
                      ))}
                  </div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-gray-200 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-8"
                  >
                    {movie.description}
                  </motion.p>

                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleWatchNow(e, movie.id)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, (ev) => handleWatchNow(ev, movie.id))
                      }
                      className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white 
                             px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:shadow-[0_0_15px_rgba(255,0,159,0.5)] transition-all 
                             duration-300 font-semibold text-sm sm:text-base md:text-lg"
                      aria-label={`Watch ${movie.title} now`}
                      tabIndex="0"
                    >
                      <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      Watch Now
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleMoreInfo(e, movie.id)}
                      onKeyDown={(e) =>
                        handleKeyDown(e, (ev) => handleMoreInfo(ev, movie.id))
                      }
                      className="flex items-center gap-1 sm:gap-2 bg-white/10 border border-white/20 backdrop-blur-sm
                             px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-white/20 transition-all duration-300
                           text-white font-medium text-sm sm:text-base"
                      aria-label={`More info about ${movie.title}`}
                      tabIndex="0"
                    >
                      <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                      More Info
                    </motion.button>
                  </div>
                </motion.div>

                <ProgressBar currentIndex={currentIndex} />
              </motion.div>
            )
        )}
      </AnimatePresence>

      <SliderNavigation
        movies={movies}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
    </div>
  );
};

const MetadataBadge = ({ icon, children }) => (
  <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/30 backdrop-blur-sm rounded-full text-xs sm:text-sm">
    {icon}
    <span>{children}</span>
  </div>
);

const SliderNavigation = ({ movies, currentIndex, setCurrentIndex }) => {
  const handleNavClick = (index) => {
    setCurrentIndex(index);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setCurrentIndex(index);
    }
  };

  return (
    <>
      <div className="absolute bottom-8 right-8 z-20 hidden md:flex gap-3">
        {movies.map((movie, index) => (
          <motion.div
            key={movie.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <img
              src={movie.medias?.[0]?.url || "/placeholder.svg"}
              alt={movie.title}
              className={`w-24 h-14 object-cover rounded-md cursor-pointer transition-all duration-300
              ${
                currentIndex === index
                  ? "border-2 border-[#FF009F] shadow-[0_0_10px_rgba(255,0,159,0.5)]"
                  : "opacity-90 hover:opacity-100 border border-white/20"
              }`}
              onClick={() => handleNavClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex="0"
              role="button"
              aria-label={`Switch to ${movie.title}`}
              aria-current={currentIndex === index ? "true" : "false"}
              loading="lazy"
            />
            {currentIndex === index && (
              <motion.div
                layoutId="activeSlide"
                className="absolute -bottom-2 left-0 right-0 h-1 bg-[#FF009F] rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1 sm:gap-2 z-20 md:hidden">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => handleNavClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-[#FF009F] scale-110"
                : "bg-white/70 hover:bg-white/90"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={currentIndex === index ? "true" : "false"}
            tabIndex="0"
          />
        ))}
      </div>
    </>
  );
};

const ProgressBar = ({ currentIndex }) => (
  <div
    className="absolute bottom-0 left-0 right-0 h-1 bg-white/10"
    aria-hidden="true"
  >
    <motion.div
      key={currentIndex}
      initial={{ width: "0%" }}
      animate={{ width: "100%" }}
      transition={{ duration: 8, ease: "linear" }}
      className="h-full bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]"
    />
  </div>
);

export default Slider;
