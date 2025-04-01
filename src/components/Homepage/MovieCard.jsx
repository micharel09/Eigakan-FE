import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

const MovieCard = ({ movie }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Early return for null movie
  if (!movie) return null;

  // Get the IMDB rating or fallback to internal rating
  const imdbRating =
    movie.imdbRating !== undefined ? movie.imdbRating : movie.rating;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  const handleHoverStart = () => setIsHovered(true);
  const handleHoverEnd = () => setIsHovered(false);

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="transform perspective-1000"
    >
      <Link
        to={`/movie/${movie.id}`}
        className="block group relative"
        aria-label={`View details for ${movie.title}`}
        tabIndex="0"
        onKeyDown={handleKeyDown}
      >
        <motion.div
          className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          animate={{
            rotateY: isHovered ? [0, -3, 0] : 0,
            transition: { duration: 0.5, ease: "easeOut" },
          }}
        >
          {/* Card Lighting Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent opacity-0 z-[5]"
            animate={{
              opacity: isHovered ? 0.3 : 0,
              backgroundPosition: isHovered ? "200% 200%" : "0% 0%",
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Poster Image Container */}
          <div className="aspect-[2/3] w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px]">
            <img
              src={movie.medias?.[0]?.url || "/skibidi.jpg"}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
              animate={{
                opacity: isHovered ? 0.8 : 0.6,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Movie Info */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4"
            animate={{
              y: isHovered ? 0 : 8,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Title */}
            <motion.h3
              className="text-white font-semibold text-lg leading-tight mb-2 line-clamp-2"
              animate={{
                color: isHovered ? "rgb(255, 0, 159)" : "rgb(255, 255, 255)",
              }}
              transition={{ duration: 0.3 }}
            >
              {movie.title}
            </motion.h3>

            {/* Movie Details */}
            <motion.div
              className="flex items-center flex-wrap gap-2 text-sm text-gray-300"
              animate={{
                opacity: isHovered ? 1 : 0.2,
                y: isHovered ? 0 : 5,
              }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#FF009F]" />
                <span>{movie.releaseYear}</span>
              </div>
              {movie.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#FF009F]" />
                  <span>{movie.duration}m</span>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Rating Badge */}
          {imdbRating > 0 && (
            <motion.div
              className="absolute top-2 right-2 bg-[#F5C518] text-black px-2 py-1 rounded text-sm font-medium flex items-center gap-1"
              title={movie.imdbRating ? "IMDB Rating" : "Internal Rating"}
              animate={{
                scale: isHovered ? 1.1 : 1,
                y: isHovered ? -2 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Star className="w-3 h-3" fill="currentColor" />
              <span>{imdbRating.toFixed(1)}</span>
            </motion.div>
          )}

          {/* Card Glow Effect */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-[#FF009F]/30 to-[#FF6B9F]/30 rounded-lg blur-lg z-[-1]"
            animate={{
              opacity: isHovered ? 0.7 : 0,
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default MovieCard;
