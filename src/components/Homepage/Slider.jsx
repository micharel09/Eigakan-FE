import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImdb } from "@fortawesome/free-brands-svg-icons";
import { PlayCircle, Clock, Star, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import movieService from "../../apis/Movie/movie";
import { Spin } from "antd";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const Slider = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Preload next image for smoother transitions
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
    const getMovies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await movieService.getMovies(1, 5);
        if (response.success && response.movies && response.movies.length > 0) {
          setMovies(response.movies);
          // Đảm bảo component được khởi tạo sau khi có dữ liệu
          setIsInitialized(true);
        } else {
          throw new Error("Invalid response format or empty movies array");
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        setError(error.message || "Failed to load movies");
      } finally {
        setIsLoading(false);
      }
    };

    getMovies();
  }, []);

  useEffect(() => {
    // Chỉ thiết lập interval khi đã có dữ liệu phim
    if (movies.length > 0) {
      const timer = setInterval(() => {
        const nextIndex = (currentIndex + 1) % movies.length;
        preloadNextImage(nextIndex);
        setCurrentIndex(nextIndex);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [currentIndex, movies.length, preloadNextImage]);

  // Thêm kiểm tra để đảm bảo component chỉ render khi đã khởi tạo
  if (!isInitialized && !isLoading && !error) {
    return (
      <div className="relative h-[80vh] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Đang chuẩn bị nội dung...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#FF009F] rounded-full hover:bg-[#FF6B9F] transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <p className="text-red-500">Error loading slider: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative h-[80vh] bg-gray-900 animate-pulse">
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading amazing movies...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="relative h-[80vh] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Không tìm thấy phim nào. Vui lòng thử lại sau.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#FF009F] rounded-full hover:bg-[#FF6B9F] transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[85vh] bg-black overflow-hidden">
      {/* Thêm key cho AnimatePresence để buộc nó re-render khi movies thay đổi */}
      <AnimatePresence key={`slider-${movies.length}`}>
        {movies.map((movie, index) => (
          <React.Fragment key={movie.id}>
            {index === currentIndex && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0">
                  {/* Gradient overlays for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                  {/* Background image with zoom effect */}
                  <motion.img
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1.15 }}
                    transition={{ duration: 8, ease: "easeOut" }}
                    src={movie.medias?.[0]?.url || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === currentIndex ? "high" : "low"}
                    decoding="async"
                  />
                </div>

                {/* Content container */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="relative z-20 flex flex-col justify-center h-full ml-[5%] max-w-[50%] text-white"
                >
                  {/* Movie title with animated underline */}
                  <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight relative">
                    {movie.title}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "40%" }}
                      transition={{ duration: 1, delay: 1 }}
                      className="h-1 bg-gradient-to-r from-[#FF009F] to-transparent mt-2"
                    />
                  </h1>

                  {/* Movie metadata */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm md:text-base">
                    <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Calendar className="w-4 h-4 text-[#FF009F]" />
                      {movie.releaseYear}
                    </span>

                    {movie.duration && (
                      <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4 text-[#FF009F]" />
                        {Math.floor(movie.duration / 60)}h {movie.duration % 60}
                        m
                      </span>
                    )}

                    {movie.imdbScore && (
                      <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <FontAwesomeIcon
                          icon={faImdb}
                          className="text-[#FFD43B] text-lg"
                        />
                        <span className="font-semibold">{movie.imdbScore}</span>
                      </span>
                    )}
                  </div>

                  {/* Clickable genres */}
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

                  {/* Movie description with subtle gradient fade */}
                  <div className="relative mb-8 overflow-hidden">
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="text-gray-200 text-lg leading-relaxed line-clamp-3 pr-8"
                    >
                      {movie.description}
                    </motion.p>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `
                          linear-gradient(
                            to bottom,
                            transparent 0%,
                            transparent 60%
                          )
                        `,
                      }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to={`/movie/${movie.id}`}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white 
                               px-6 py-3 rounded-full hover:shadow-[0_0_15px_rgba(255,0,159,0.5)] transition-all 
                               duration-300 font-semibold text-lg transform hover:translate-y-[-2px]"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Watch Now
                    </Link>

                    <Link
                      to={`/movie/${movie.id}`}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20
                               text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all 
                               duration-300 font-medium"
                    >
                      More Info
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* Slider navigation */}
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

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <motion.div
          key={currentIndex}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 8, ease: "linear" }}
          className="h-full bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]"
        />
      </div>
    </div>
  );
};

export default Slider;
