import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImdb } from "@fortawesome/free-brands-svg-icons";
import { PlayCircle, Clock, Star, Calendar, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import movieService from "../../apis/Movie/movie";

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

  const preloadNextImage = useCallback(
    (nextIndex) => {
      if (movies[nextIndex]) {
        const img = new Image();
        img.src = movies[nextIndex].medias?.[0]?.url || "/placeholder.svg";
      }
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
        if (response.success && response.movies?.length > 0) {
          setMovies(response.movies);
          setIsInitialized(true);
        } else {
          throw new Error("No movies found");
        }
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
    if (movies.length > 0) {
      const timer = setInterval(() => {
        const nextIndex = (currentIndex + 1) % movies.length;
        preloadNextImage(nextIndex);
        setCurrentIndex(nextIndex);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [currentIndex, movies.length, preloadNextImage]);

  if (!isInitialized && !isLoading && !error) {
    return (
      <div className="relative h-[65vh] bg-gray-900 flex items-center justify-center -mt-16">
        <div className="text-white text-center">
          <p>Initializing content...</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#FF009F] rounded-full hover:bg-[#FF6B9F] transition-colors"
          >
            Reload Page
          </motion.button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[65vh] flex items-center justify-center -mt-16">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading content: {error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#FF009F] text-white rounded-full hover:bg-[#FF6B9F] transition-colors"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative h-[65vh] bg-gray-900 -mt-16">
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading amazing movies...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="relative h-[65vh] bg-gray-900 flex items-center justify-center -mt-16">
        <div className="text-white text-center">
          <p>No movies found. Please try again later.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#FF009F] rounded-full hover:bg-[#FF6B9F] transition-colors"
          >
            Reload Page
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[55vh] bg-black overflow-hidden -mt-16">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/50 to-transparent z-10" />

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
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1.15 }}
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
                  className="relative z-20 flex flex-col justify-center h-full ml-[5%] max-w-[50%] text-white mt-2"
                >
                  <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
                    {movie.title}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "40%" }}
                      transition={{ duration: 1, delay: 1 }}
                      className="h-1 bg-gradient-to-r from-[#FF009F] to-transparent mt-2"
                    />
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <MetadataBadge
                      icon={<Calendar className="w-4 h-4 text-[#FF009F]" />}
                    >
                      {movie.releaseYear}
                    </MetadataBadge>

                    {movie.duration && (
                      <MetadataBadge
                        icon={<Clock className="w-4 h-4 text-[#FF009F]" />}
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
                            className="text-[#FFD43B] text-lg"
                          />
                        }
                      >
                        <span className="font-semibold">{movie.imdbScore}</span>
                      </MetadataBadge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genreNames?.split(",").map((genre, idx) => (
                      <Link
                        key={idx}
                        to={`/genre/${genre.trim()}`}
                        className="px-3 py-1.5 bg-[#FF009F]/20 border border-[#FF009F]/30 rounded-md text-sm
                               hover:bg-[#FF009F]/40 transition-all duration-300 transform hover:scale-105"
                      >
                        {genre.trim()}
                      </Link>
                    ))}
                  </div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-gray-200 text-lg leading-relaxed line-clamp-3 mb-8"
                  >
                    {movie.description}
                  </motion.p>

                  <div className="flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleWatchNow(e, movie.id)}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white 
                             px-6 py-3 rounded-full hover:shadow-[0_0_15px_rgba(255,0,159,0.5)] transition-all 
                             duration-300 font-semibold text-lg"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Watch Now
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleMoreInfo(e, movie.id)}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20
                             text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all 
                             duration-300 font-medium"
                    >
                      <Info className="w-5 h-5" />
                      More Info
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )
        )}
      </AnimatePresence>

      <SliderNavigation
        movies={movies}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />

      <ProgressBar currentIndex={currentIndex} />
    </div>
  );
};

const MetadataBadge = ({ icon, children }) => (
  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
    {icon}
    {children}
  </span>
);

const SliderNavigation = ({ movies, currentIndex, setCurrentIndex }) => (
  <div className="absolute bottom-8 right-8 z-20 flex gap-3">
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
                : "opacity-50 hover:opacity-80 filter grayscale hover:grayscale-0"
            }`}
          onClick={() => setCurrentIndex(index)}
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
);

const ProgressBar = ({ currentIndex }) => (
  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
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
