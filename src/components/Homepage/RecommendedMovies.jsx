import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  EffectCoverflow,
  Navigation,
  Keyboard,
} from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  Clock,
  Star,
  Calendar,
  Sparkles,
  BrainCircuit,
  X,
  RefreshCw,
  GripHorizontal,
  Loader,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import recommendationService from "../../apis/Recommendation/recommendation";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/keyboard";

const RecommendedMovies = ({ showModal, setShowModal, isModal = false }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [recommendationSource, setRecommendationSource] =
    useState("personalized");
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  const handleMovieClick = (movieId) => {
    // Only navigate if not dragging
    if (!isDragging) {
      navigate(`/movie/${movieId}`);
    }
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

  // Handler for navigating to previous slide
  const goPrev = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  // Handler for navigating to next slide
  const goNext = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  // Keyboard event listener for arrow key navigation when not focusing on swiper
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (showModal) {
        if (e.key === "ArrowLeft") {
          goPrev();
        } else if (e.key === "ArrowRight") {
          goNext();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [showModal]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setAnimationComplete(false);
    try {
      const response = await recommendationService.getRecommendedMovies();
      if (response.success && response.recommendations) {
        setMovies(response.recommendations);
        setRecommendationSource(response.source || "personalized");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (setShowModal) {
      setShowModal(false);
    }
  };

  const handleRefreshRecommendations = () => {
    fetchRecommendations();
  };

  // Initial fetch of recommendations when component mounts or modal opens
  useEffect(() => {
    if (showModal || !isModal) {
      fetchRecommendations();
    }
  }, [showModal, isModal]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  // If it's not a modal and there are no recommendations, don't render anything
  if (
    !isModal &&
    !loading &&
    (movies.length === 0 || recommendationSource === "none")
  ) {
    return null;
  }

  // Render only the modal content
  if (isModal) {
    return (
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            {/* Modal Content */}
            <motion.div
              className="relative max-w-6xl w-[95%] max-h-[90vh] rounded-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Content Container */}
              <div
                className="relative p-6 bg-black/80 backdrop-blur-md rounded-xl border border-[#FF009F]/20 overflow-y-auto max-h-[90vh]"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.95))",
                  boxShadow: "0 10px 30px -5px rgba(255, 0, 159, 0.2)",
                }}
              >
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xl -z-10">
                  <div className="bg-gradient-to-br from-[#FF009F]/5 via-transparent to-purple-900/5 w-full h-full absolute"></div>
                  <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                </div>

                {/* Header with Title and Controls */}
                <div className="flex items-center justify-between mb-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="relative">
                      <BrainCircuit className="w-7 h-7 text-[#FF009F]" />
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          boxShadow: [
                            "0 0 0px #FF009F",
                            "0 0 10px #FF009F",
                            "0 0 0px #FF009F",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {recommendationSource === "personalized"
                          ? "AI Recommendations"
                          : "Suggested Movies"}
                      </h2>
                      <p className="text-gray-400 text-sm">
                        Based on your watch history & preferences
                      </p>
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-full bg-white/10 hover:bg-[#FF009F]/80 transition-colors"
                      onClick={handleRefreshRecommendations}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`w-5 h-5 text-white ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-full bg-white/10 hover:bg-[#FF009F]/80 transition-colors"
                      onClick={closeModal}
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>

                {/* Modal Content States */}
                {loading ? (
                  <div className="py-16 px-4">
                    <div className="flex justify-center items-center mb-8">
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-24 h-24 rounded-full border-2 border-transparent border-t-[#FF009F] border-b-[#FF009F]"
                        />
                        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#FF009F] w-10 h-10" />
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center text-white max-w-xl mx-auto"
                    >
                      <h3 className="text-xl font-semibold mb-2">
                        Analyzing your preferences...
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Our AI is looking at your viewing history to find the
                        perfect movies for you. This won't take long.
                      </p>

                      <div className="mt-8 bg-black/30 rounded-lg p-4 backdrop-blur">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-[#FF009F] rounded-full p-2 flex-shrink-0">
                            <Loader className="w-4 h-4 text-white animate-spin" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-medium">
                              Matching genres with your preferences
                            </p>
                            <p className="text-gray-400 text-sm">
                              Finding movies with similar genres to what you
                              enjoy
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 bg-black/30 rounded-lg p-4 backdrop-blur">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-[#FF009F]/70 rounded-full p-2 flex-shrink-0">
                            <Loader className="w-4 h-4 text-white animate-spin" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-medium">
                              Calculating similarity scores
                            </p>
                            <p className="text-gray-400 text-sm">
                              Identifying movies that match your viewing
                              patterns
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 bg-black/30 rounded-lg p-4 backdrop-blur opacity-60">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-[#FF009F]/40 rounded-full p-2 flex-shrink-0">
                            <Loader className="w-4 h-4 text-white animate-spin" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-medium">
                              Finalizing recommendations
                            </p>
                            <p className="text-gray-400 text-sm">
                              Preparing your personalized movie selection
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : movies.length === 0 || recommendationSource === "none" ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center mb-6"
                    >
                      <Sparkles className="w-12 h-12 text-[#FF009F] mx-auto mb-4" />
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        No recommendations available yet
                      </h3>
                      <p className="text-gray-400 mt-2 max-w-md mx-auto">
                        Watch a few movies to get personalized recommendations
                        based on your preferences. Our AI needs data to
                        understand what you like.
                      </p>

                      <div className="mt-8 max-w-lg mx-auto p-5 border border-[#FF009F]/20 bg-black/30 rounded-xl">
                        <h4 className="text-white font-medium mb-2">
                          How to get started:
                        </h4>
                        <ol className="text-left text-gray-300 space-y-3">
                          <li className="flex items-start gap-2">
                            <span className="bg-[#FF009F] text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              Explore our movie collection and watch a few that
                              interest you
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-[#FF009F] text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              Rate the movies you've watched to improve
                              recommendations
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-[#FF009F] text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                              3
                            </span>
                            <span>
                              Come back here to see your personalized
                              suggestions
                            </span>
                          </li>
                        </ol>
                      </div>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-[#FF009F] rounded-full text-white font-medium mt-4"
                      onClick={closeModal}
                    >
                      Explore Movies Instead
                    </motion.button>
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          when: "beforeChildren",
                          staggerChildren: 0.1,
                        },
                      }}
                      onAnimationComplete={() => setAnimationComplete(true)}
                    >
                      {!animationComplete && (
                        <motion.div
                          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{ delay: 1.5, duration: 0.5 }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 0.8 }}
                            className="mb-4"
                          >
                            <Sparkles className="w-16 h-16 text-[#FF009F]" />
                          </motion.div>
                          <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-2xl font-bold text-white"
                          >
                            Your recommendations are ready!
                          </motion.h3>
                        </motion.div>
                      )}

                      <div className="relative pt-8">
                        {/* Drag indicator */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 }}
                          className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-center text-gray-400 text-xs flex items-center gap-1"
                        >
                          <GripHorizontal className="w-4 h-4" />
                          <span>Drag or use arrow keys to navigate</span>
                        </motion.div>

                        {/* Navigation Arrows */}
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                          <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 }}
                            className="bg-black/70 hover:bg-[#FF009F]/80 text-white p-3 rounded-full backdrop-blur-sm transition-colors duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#FF009F] shadow-lg hover:shadow-[0_0_15px_rgba(255,0,159,0.3)]"
                            onClick={goPrev}
                            aria-label="Previous movie"
                            tabIndex={0}
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </motion.button>
                        </div>

                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
                          <motion.button
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 }}
                            className="bg-black/70 hover:bg-[#FF009F]/80 text-white p-3 rounded-full backdrop-blur-sm transition-colors duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#FF009F] shadow-lg hover:shadow-[0_0_15px_rgba(255,0,159,0.3)]"
                            onClick={goNext}
                            aria-label="Next movie"
                            tabIndex={0}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </motion.button>
                        </div>

                        {/* Add keyboard navigation instructions */}
                        <div className="absolute inset-x-0 -bottom-10 flex justify-center">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            transition={{ delay: 1.5 }}
                            className="px-3 py-1 rounded-full bg-black/30 text-white/70 text-xs flex items-center gap-2 backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-1">
                              <ChevronLeft className="w-3 h-3" />
                              <ChevronRight className="w-3 h-3" />
                            </div>
                            <span>Use arrow keys or buttons to navigate</span>
                          </motion.div>
                        </div>

                        <Swiper
                          ref={swiperRef}
                          modules={[
                            Autoplay,
                            EffectCoverflow,
                            Navigation,
                            Keyboard,
                          ]}
                          effect="coverflow"
                          coverflowEffect={{
                            rotate: 30,
                            stretch: 0,
                            depth: 100,
                            modifier: 1,
                            slideShadows: true,
                          }}
                          grabCursor={true}
                          autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                          }}
                          keyboard={{
                            enabled: true,
                            onlyInViewport: false,
                          }}
                          navigation={false} // We're using custom navigation
                          spaceBetween={10}
                          slidesPerView="auto"
                          centeredSlides={true}
                          loop={movies.length > 3}
                          className="movie-recommendations-swiper"
                          onSliderMove={() => setIsDragging(true)}
                          onTouchEnd={() =>
                            setTimeout(() => setIsDragging(false), 100)
                          }
                          onTouchStart={() => setIsDragging(false)}
                        >
                          {movies.map((movie, index) => (
                            <SwiperSlide key={movie.id} className="!w-[240px]">
                              <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.1,
                                  duration: 0.5,
                                  ease: "easeOut",
                                }}
                                whileHover={{ y: -8 }}
                                className="relative"
                              >
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleMovieClick(movie.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleMovieClick(movie.id);
                                    }
                                  }}
                                  className="relative group/item focus:outline-none focus:ring-2 focus:ring-[#FF009F] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                                  aria-label={`View details for ${movie.title}`}
                                >
                                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 shadow-xl shadow-[#FF009F]/10">
                                    <img
                                      src={
                                        movie.medias?.[0]?.url ||
                                        "/placeholder.svg"
                                      }
                                      alt={movie.title}
                                      className="w-full h-full object-cover transform group-hover/item:scale-110 transition-all duration-500"
                                      loading="lazy"
                                      draggable="false"
                                    />
                                    <div className="absolute top-0 right-0 m-2">
                                      <div className="flex items-center gap-1 bg-[#FF009F]/80 px-2 py-1 rounded-md backdrop-blur-sm">
                                        <Sparkles className="w-3 h-3 text-white" />
                                        <span className="text-xs font-semibold text-white">
                                          AI Pick{" "}
                                          {movie.recommendationScore &&
                                            `#${index + 1}`}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-all duration-300">
                                      <div className="absolute inset-0 flex flex-col justify-between p-4">
                                        <div className="flex justify-between items-start">
                                          <span className="px-2 py-1 rounded-md bg-[#FF009F] text-white text-xs font-medium backdrop-blur-sm">
                                            {movie.quality || "HD"}
                                          </span>
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) =>
                                              handlePlayClick(e, movie.id)
                                            }
                                            onKeyDown={(e) => {
                                              if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                              ) {
                                                e.preventDefault();
                                                handlePlayClick(e, movie.id);
                                              }
                                            }}
                                            tabIndex={0}
                                            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-[#FF009F]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF009F]"
                                            aria-label={`Play ${movie.title}`}
                                          >
                                            <PlayCircle className="w-5 h-5 text-white" />
                                          </motion.button>
                                        </div>

                                        <div className="space-y-3">
                                          <h3 className="text-white font-medium line-clamp-2 group-hover/item:text-[#FF009F] transition-colors">
                                            {movie.title}
                                          </h3>
                                          <div className="space-y-2 text-sm text-gray-300">
                                            <div className="flex items-center gap-2 text-xs">
                                              <Calendar className="w-4 h-4" />
                                              <span>{movie.releaseYear}</span>
                                              {movie.imdbScore && (
                                                <>
                                                  <span>•</span>
                                                  <Star className="w-4 h-4 text-[#FF009F]" />
                                                  <span>{movie.imdbScore}</span>
                                                </>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                              <Clock className="w-4 h-4" />
                                              <span>{movie.duration} min</span>
                                            </div>
                                            {movie.genreNames && (
                                              <div className="flex flex-wrap gap-1">
                                                {movie.genreNames
                                                  .split(",")
                                                  .slice(0, 3)
                                                  .map((genre, idx) => (
                                                    <span
                                                      key={idx}
                                                      className="px-2 py-1 rounded-full bg-white/10 text-xs backdrop-blur-sm"
                                                    >
                                                      {genre.trim()}
                                                    </span>
                                                  ))}
                                              </div>
                                            )}

                                            {/* Display recommendation reason */}
                                            {movie.recommendationReason && (
                                              <div className="pt-1 border-t border-white/10 mt-2">
                                                <div className="flex items-center gap-1 text-xs text-[#FF009F]">
                                                  <Sparkles className="w-3 h-3" />
                                                  <span>
                                                    Recommended for you:{" "}
                                                    {movie.recommendationReason}
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Reflection effect */}
                                <div className="absolute w-full h-[20px] bottom-[-20px] left-0 overflow-hidden rounded-b-lg opacity-30">
                                  <div
                                    className="w-full h-[300px] transform scale-y-[-1] blur-sm"
                                    style={{
                                      backgroundImage: `url(${
                                        movie.medias?.[0]?.url ||
                                        "/placeholder.svg"
                                      })`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center top",
                                      maskImage:
                                        "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                                    }}
                                  />
                                </div>
                              </motion.div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-center mt-8 text-sm text-gray-400"
                      >
                        <p>
                          These recommendations are based on your watch history
                          and ratings.
                          <br />
                          <span className="text-[#FF009F]">
                            Discover new favorites in our collection!
                          </span>
                        </p>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // For non-modal usage in the future, if needed
  return null;
};

export default RecommendedMovies;
