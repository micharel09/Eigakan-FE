import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  Clock,
  Star,
  Calendar,
  ChevronRight,
  Info,
} from "lucide-react";
import movieService from "../../apis/Movie/movie";
import "swiper/css";
import "swiper/css/navigation";

const MovieList = ({ title, genreName, showAll = false }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const headingRef = useRef(null);
  const isHeadingInView = useInView(headingRef, { once: true, threshold: 0.1 });
  const navigate = useNavigate();

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const handlePlayClick = (e, movieId) => {
    e.stopPropagation();
    navigate(`/watch/${movieId}`);
  };

  const handleKeyDown = (event, movieId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMovieClick(movieId);
    }
  };

  const handlePlayKeyDown = (event, movieId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePlayClick(event, movieId);
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await movieService.getMovies(
          1,
          showAll ? 24 : 12,
          genreName
        );

        if (!response.success || !response.movies) {
          setLoading(false);
          return;
        }

        setMovies(response.movies);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [genreName, showAll]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const shimmerVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: [0, 1, 0],
      x: ["-100%", "100%", "100%"],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      },
    },
  };

  // Heading animation - Modified to ensure visibility
  const headingAnimation = {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  };

  // Placeholder loading skeleton
  if (loading) {
    return (
      <div className="py-4 sm:py-8">
        <motion.div
          className="flex items-center gap-2 mb-6 px-2 sm:px-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-8 bg-gray-800/70 rounded-lg w-48 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/30 to-transparent"
              variants={shimmerVariants}
              initial="hidden"
              animate="visible"
            />
          </div>
        </motion.div>
        <div className="flex space-x-4 overflow-hidden px-2">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-gray-800/50 rounded-lg h-[240px] sm:h-[300px] md:h-[320px] w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800/50 to-gray-900/50 animate-pulse" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/30 to-transparent"
                variants={shimmerVariants}
                initial="hidden"
                animate="visible"
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mb-4 sm:mb-6 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-2 sm:px-4 relative z-10">
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, x: -20 }}
          animate={headingAnimation}
          className="flex items-center relative z-20"
        >
          <h2
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 z-10 relative pb-1 
          after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-[70%] after:h-[3px] 
          after:bg-gradient-to-r after:from-[#FF009F] after:to-transparent
          after:shadow-[0_2px_8px_rgba(255,0,159,0.5)]"
          >
            {title}
          </h2>
        </motion.div>

        {!showAll && genreName && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to={`/genre/${genreName}`}
              className="flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-[#FF009F]/10 to-transparent text-[#FF009F] hover:bg-[#FF009F]/20 transition-all duration-300 group"
              aria-label={`View all ${title}`}
              tabIndex="0"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              }}
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </div>

      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        onSwiper={setSwiperInstance}
        autoplay={{
          delay: 5000,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        }}
        spaceBetween={12}
        slidesPerView="auto"
        className="movie-list-swiper px-2"
        slidesOffsetBefore={8}
        slidesOffsetAfter={8}
        breakpoints={{
          640: {
            spaceBetween: 16,
            slidesOffsetBefore: 16,
            slidesOffsetAfter: 16,
          },
          768: {
            spaceBetween: 20,
            slidesOffsetBefore: 20,
            slidesOffsetAfter: 20,
          },
        }}
      >
        {movies.map((movie, index) => (
          <SwiperSlide
            key={movie.id}
            className="!w-[140px] sm:!w-[180px] md:!w-[220px] lg:!w-[240px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  duration: 0.5,
                  delay: index * 0.05 > 0.5 ? 0.5 : index * 0.05,
                },
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              transition={{ duration: 0.3 }}
              onHoverStart={() => setHoveredId(movie.id)}
              onHoverEnd={() => setHoveredId(null)}
              className="h-full"
            >
              <div
                role="button"
                tabIndex="0"
                onClick={() => handleMovieClick(movie.id)}
                onKeyDown={(e) => handleKeyDown(e, movie.id)}
                className="relative group/item focus:outline-none focus:ring-2 focus:ring-[#FF009F] rounded-lg overflow-hidden h-full"
                aria-label={`Watch ${movie.title}`}
              >
                {/* Card wrapper with 3D effect */}
                <motion.div
                  className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 relative z-10 h-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{
                    rotateY: hoveredId === movie.id ? [0, -2, 0] : 0,
                    transition: { duration: 0.5, ease: "easeOut" },
                  }}
                >
                  {/* Movie poster */}
                  <img
                    src={movie.medias?.[0]?.url || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover/item:scale-110 transition-all duration-500"
                    loading="lazy"
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-60 group-hover/item:opacity-80 transition-all duration-300" />

                  {/* Content overlay that appears on hover */}
                  <motion.div
                    className="absolute inset-0 p-2 sm:p-4 flex flex-col justify-between"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: hoveredId === movie.id ? 1 : 0,
                      transition: { duration: 0.3 },
                    }}
                  >
                    {/* Top section - Quality badge and play button */}
                    <div className="flex justify-between items-start">
                      <motion.span
                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white text-[10px] sm:text-xs font-medium backdrop-blur-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: hoveredId === movie.id ? 1 : 0,
                          x: hoveredId === movie.id ? 0 : -10,
                          transition: { duration: 0.3, delay: 0.1 },
                        }}
                      >
                        {movie.quality || "HD"}
                      </motion.span>
                      <div className="flex gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{
                            opacity: hoveredId === movie.id ? 1 : 0,
                            y: hoveredId === movie.id ? 0 : -10,
                            transition: { duration: 0.3, delay: 0.15 },
                          }}
                          onClick={(e) => handlePlayClick(e, movie.id)}
                          onKeyDown={(e) => handlePlayKeyDown(e, movie.id)}
                          className="p-1.5 sm:p-2 rounded-full bg-[#FF009F]/80 hover:bg-[#FF009F] backdrop-blur-sm transition-colors"
                          aria-label={`Play ${movie.title}`}
                          tabIndex="0"
                        >
                          <PlayCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{
                            opacity: hoveredId === movie.id ? 1 : 0,
                            y: hoveredId === movie.id ? 0 : -10,
                            transition: { duration: 0.3, delay: 0.2 },
                          }}
                          onClick={() => handleMovieClick(movie.id)}
                          className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                          aria-label={`More info about ${movie.title}`}
                          tabIndex="0"
                        >
                          <Info className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Bottom section - Title and details */}
                    <div className="space-y-2 sm:space-y-3">
                      <motion.h3
                        className="text-xs sm:text-sm md:text-base text-white font-medium line-clamp-2 group-hover/item:text-[#FF009F] transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: hoveredId === movie.id ? 1 : 0,
                          y: hoveredId === movie.id ? 0 : 10,
                          transition: { duration: 0.3, delay: 0.2 },
                        }}
                      >
                        {movie.title}
                      </motion.h3>
                      <motion.div
                        className="space-y-1 sm:space-y-2 text-xs text-gray-300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: hoveredId === movie.id ? 1 : 0,
                          y: hoveredId === movie.id ? 0 : 10,
                          transition: { duration: 0.3, delay: 0.25 },
                        }}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{movie.releaseYear}</span>
                          {movie.imdbScore && (
                            <>
                              <span>•</span>
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF009F]" />
                              <span>{movie.imdbScore}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{movie.duration} min</span>
                        </div>
                        {movie.genreNames && (
                          <div className="hidden sm:flex flex-wrap gap-1">
                            {movie.genreNames
                              .split(",")
                              .slice(0, 2)
                              .map((genre, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-white/10 text-[10px] sm:text-xs backdrop-blur-sm"
                                >
                                  {genre.trim()}
                                </span>
                              ))}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Card reflection/shadow effect */}
                <motion.div
                  className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] h-[10%] rounded-[50%] bg-[#FF009F]/20 blur-md z-0"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{
                    opacity: hoveredId === movie.id ? 0.6 : 0,
                    scale: hoveredId === movie.id ? 1 : 0.7,
                    transition: { duration: 0.3 },
                  }}
                />
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Scrolling indicator */}
      {movies.length > 5 && (
        <motion.div
          className="flex justify-center mt-2 opacity-60 items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
        >
          <span className="text-[10px] text-gray-400">Scroll</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MovieList;
