import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  EffectCoverflow,
  Navigation,
  Keyboard,
} from "swiper/modules";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
  Info,
} from "lucide-react";
import recommendationService from "../../apis/Recommendation/recommendation";
import { useModal } from "../../hooks";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/keyboard";

// Animation variants
const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  },
  heading: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
  shimmer: {
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
  },
};

// Utility components
const MovieCard = ({
  movie,
  hoveredId,
  setHoveredId,
  handleMovieClick,
  handlePlayClick,
  handleKeyDown,
  index = 0,
}) => {
  return (
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

          {/* Recommendation badge */}
          <div className="absolute top-0 left-0 m-2 z-20">
            <div className="flex items-center gap-1 bg-[#FF009F]/80 px-2 py-1 rounded-md backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">
                Pick for you
              </span>
            </div>
          </div>

          {/* Hover info overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover/item:opacity-100 transition-all duration-300 p-3 flex flex-col justify-between">
            {/* Top section */}
            <div className="flex justify-between items-start">
              {/* Quality badge */}
              <span className="px-2 py-1 mt-16 rounded-md bg-[#FF009F] text-white text-xs font-medium backdrop-blur-sm">
                {movie.quality || "HD"}
              </span>
              {/* Play button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-[#FF009F]/80 transition-colors z-40"
                onClick={(e) => handlePlayClick(e, movie.id)}
                onKeyDown={(e) => handleKeyDown(e, movie.id, "play")}
                aria-label={`Play ${movie.title}`}
                tabIndex="0"
              >
                <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.button>
            </div>

            {/* Bottom info */}
            <MovieInfo movie={movie} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const MovieInfo = ({ movie }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="text-white space-y-1"
  >
    <h3 className="font-medium text-sm line-clamp-2 sm:text-base">
      {movie.title}
    </h3>
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

    {/* Display recommendation reason if available */}
    {movie.recommendationReason && (
      <div className="hidden sm:block pt-1 mt-1 border-t border-white/10">
        <div className="flex items-start gap-1 text-[10px] text-[#FF009F]">
          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{movie.recommendationReason}</span>
        </div>
      </div>
    )}
  </motion.div>
);

const LoadingView = () => (
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
        Finding the perfect movies for you
      </h3>
      <p className="text-gray-400 text-sm">
        Our algorithm is looking at your viewing history to find the perfect
        movies for you. This won't take long.
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
              Finding movies with similar genres to what you enjoy
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
              Identifying movies that match your viewing patterns
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
            <p className="text-white font-medium">Finalizing recommendations</p>
            <p className="text-gray-400 text-sm">
              Preparing your personalized movie selection
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

const EmptyView = () => (
  <div className="flex flex-col items-center justify-center py-6 px-4">
    <Sparkles className="w-8 h-8 text-[#FF009F] mb-2" />
    <h3 className="text-lg font-semibold text-white mb-1 text-center">
      No recommendations yet
    </h3>
    <p className="text-gray-400 text-center text-sm max-w-md">
      Watch a few movies to get personalized recommendations
    </p>
  </div>
);

const ModalHeader = ({
  recommendationSource,
  handleRefreshRecommendations,
  loading,
  closeModal,
}) => (
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
            ? "Recommendations For You"
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
          className={`w-5 h-5 text-white ${loading ? "animate-spin" : ""}`}
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
);

const SimpleLoading = () => (
  <div className="flex justify-center items-center py-8">
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#FF009F] animate-pulse" />
        </div>
      </div>
      <p className="text-gray-400 text-xs animate-pulse">
        Finding recommendations for you...
      </p>
    </div>
  </div>
);

// Modal component
const RecommendationModal = ({
  isVisible,
  closeModal,
  movies,
  loading,
  recommendationSource,
  animationComplete,
  setAnimationComplete,
  handleRefreshRecommendations,
  handleMovieClick,
  handlePlayClick,
  handleKeyDown,
  hoveredId,
  setHoveredId,
  swiperRef,
  goPrev,
  goNext,
  isDragging,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
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
              <ModalHeader
                recommendationSource={recommendationSource}
                handleRefreshRecommendations={handleRefreshRecommendations}
                loading={loading}
                closeModal={closeModal}
              />

              {/* Modal Content States */}
              {loading ? (
                <LoadingView />
              ) : movies.length === 0 || recommendationSource === "none" ? (
                <EmptyView />
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
                            <MovieCard
                              movie={movie}
                              hoveredId={hoveredId}
                              setHoveredId={setHoveredId}
                              handleMovieClick={handleMovieClick}
                              handlePlayClick={handlePlayClick}
                              handleKeyDown={handleKeyDown}
                              index={index}
                            />
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
};

// Main movies display component
const RegularMovieList = ({
  movies,
  hoveredId,
  setHoveredId,
  handleMovieClick,
  handlePlayClick,
  handleKeyDown,
  setSwiperInstance,
}) => (
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
        <MovieCard
          movie={movie}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          handleMovieClick={handleMovieClick}
          handlePlayClick={handlePlayClick}
          handleKeyDown={handleKeyDown}
          index={index}
        />
      </SwiperSlide>
    ))}
  </Swiper>
);

// Regular header component
const RegularHeader = ({ headingRef, handleRefreshRecommendations }) => (
  <motion.div
    ref={headingRef}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="flex items-center justify-between relative z-20"
  >
    <div className="flex items-center gap-2">
      <BrainCircuit className="w-5 h-5 text-[#FF009F]" />
      <h2
        className="text-xl sm:text-2xl font-bold text-white relative pb-1 
      after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-[70%] after:h-[3px] 
      after:bg-gradient-to-r after:from-[#FF009F] after:to-transparent
      after:shadow-[0_2px_8px_rgba(255,0,159,0.5)]"
      >
        Recommended For You
      </h2>
      <div className="flex items-center">
        <div className="ml-2 px-2 py-1 bg-[#FF009F]/10 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(255,0,159,0.2)]">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF009F]" />
            <span className="text-xs text-white">Based on your taste</span>
          </div>
        </div>
      </div>
    </div>

    <button
      onClick={handleRefreshRecommendations}
      className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
      aria-label="Refresh recommendations"
    >
      <RefreshCw className="w-4 h-4" />
      <span className="text-xs hidden sm:inline">Refresh</span>
    </button>
  </motion.div>
);

const RecommendedMovies = ({
  showModal: propShowModal,
  setShowModal: propSetShowModal,
  isModal = false,
}) => {
  // Use our custom modal hook if this component is used as a modal
  const { isVisible, close: closeModalHook } = useModal(
    propShowModal || false,
    () => propSetShowModal && propSetShowModal(false)
  );

  // Internal state
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [recommendationSource, setRecommendationSource] =
    useState("personalized");
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const swiperRef = useRef(null);
  const headingRef = useRef(null);
  const isHeadingInView = useInView(headingRef, { once: true, threshold: 0.1 });
  const navigate = useNavigate();

  // Event handlers
  const handleMovieClick = (movieId) => {
    if (!isDragging) {
      navigate(`/movie/${movieId}`);
    }
  };

  const handlePlayClick = (e, movieId) => {
    e.stopPropagation();
    navigate(`/watch/${movieId}`);
  };

  // Keyboard navigation handlers
  const handleKeyDown = (event, movieId, actionType = "view") => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (actionType === "play") {
        handlePlayClick(event, movieId);
      } else {
        handleMovieClick(movieId);
      }
    }
  };

  // Swiper navigation handlers
  const goPrev = () => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const goNext = () => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  // Keyboard event listener for arrow key navigation when not focusing on swiper
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (isVisible) {
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
  }, [isVisible]);

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

  // For compatibility with existing code
  const closeModal = () => {
    if (isModal) {
      closeModalHook();
      if (propSetShowModal) {
        propSetShowModal(false);
      }
    }
  };

  const handleRefreshRecommendations = () => {
    fetchRecommendations();
  };

  // Initial fetch of recommendations when component mounts or modal opens
  useEffect(() => {
    if ((propShowModal && isModal) || !isModal) {
      fetchRecommendations();
    }
  }, [propShowModal, isModal]);

  // Render only the modal content
  if (isModal) {
    return (
      <RecommendationModal
        isVisible={isVisible}
        closeModal={closeModal}
        movies={movies}
        loading={loading}
        recommendationSource={recommendationSource}
        animationComplete={animationComplete}
        setAnimationComplete={setAnimationComplete}
        handleRefreshRecommendations={handleRefreshRecommendations}
        handleMovieClick={handleMovieClick}
        handlePlayClick={handlePlayClick}
        handleKeyDown={handleKeyDown}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        swiperRef={swiperRef}
        goPrev={goPrev}
        goNext={goNext}
        isDragging={isDragging}
      />
    );
  }

  // Render for non-modal usage (similar to MovieList component)
  return (
    <div className="mb-4 sm:mb-6 relative z-10">
      <div className="px-4 mb-2">
        <RegularHeader
          headingRef={headingRef}
          handleRefreshRecommendations={handleRefreshRecommendations}
        />
      </div>

      {loading ? (
        <SimpleLoading />
      ) : (
        <motion.div
          variants={ANIMATION_VARIANTS.container}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          {movies.length === 0 || recommendationSource === "none" ? (
            <EmptyView />
          ) : (
            <RegularMovieList
              movies={movies}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              handleMovieClick={handleMovieClick}
              handlePlayClick={handlePlayClick}
              handleKeyDown={handleKeyDown}
              setSwiperInstance={setSwiperInstance}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default RecommendedMovies;
