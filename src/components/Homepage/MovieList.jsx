import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { motion } from "framer-motion";
import { PlayCircle, Clock, Star, Calendar } from "lucide-react";
import movieService from "../../apis/Movie/movie";
import "swiper/css";
import "swiper/css/navigation";

const MovieList = ({ title, genreName, showAll = false }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
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

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await movieService.getMovies(
          1,
          showAll ? 24 : 12,
          genreName
        );
        if (response.success && response.movies) {
          setMovies(response.movies);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [genreName, showAll]);

  if (loading) {
    return (
      <div className="py-4 sm:py-8">
        <div className="flex space-x-2 sm:space-x-4 overflow-hidden px-2">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-gray-800/50 rounded-lg h-[240px] sm:h-[300px] md:h-[360px] w-[160px] sm:w-[200px] md:w-[240px] flex-shrink-0 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50 animate-shimmer"></div>
              <div className="h-full w-full bg-gradient-to-b from-transparent to-gray-900/30 relative z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 sm:px-4">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3"
        >
          {title}
          <span className="text-xs sm:text-sm font-normal text-gray-400">
            ({movies.length})
          </span>
        </motion.h2>
        {!showAll && genreName && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              to={`/genre/${genreName}`}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#FF009F]/10 text-[#FF009F] hover:bg-[#FF009F]/20 transition-all duration-300"
            >
              View All
            </Link>
          </motion.div>
        )}
      </div>

      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
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
        {movies.map((movie) => (
          <SwiperSlide
            key={movie.id}
            className="!w-[140px] sm:!w-[180px] md:!w-[220px] lg:!w-[240px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              onHoverStart={() => setHoveredId(movie.id)}
              onHoverEnd={() => setHoveredId(null)}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleMovieClick(movie.id)}
                onKeyDown={(e) => handleKeyDown(e, movie.id)}
                className="relative group/item focus:outline-none focus:ring-2 focus:ring-[#FF009F] rounded-lg overflow-hidden"
                aria-label={`Watch ${movie.title}`}
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                  <img
                    src={movie.medias?.[0]?.url || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover/item:scale-110 transition-all duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-all duration-300">
                    <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-4">
                      <div className="flex justify-between items-start">
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-[#FF009F] text-white text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                          {movie.quality || "HD"}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handlePlayClick(e, movie.id)}
                          className="p-1.5 sm:p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-[#FF009F]/80 transition-colors"
                          aria-label={`Play ${movie.title}`}
                        >
                          <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </motion.button>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <h3 className="text-xs sm:text-sm md:text-base text-white font-medium line-clamp-2 group-hover/item:text-[#FF009F] transition-colors">
                          {movie.title}
                        </h3>
                        <div className="space-y-1 sm:space-y-2 text-xs text-gray-300">
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MovieList;
