import React, { useEffect, useState, Suspense, memo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  Clock,
  Calendar,
  Star,
  Users,
  Award,
  Globe,
  ChevronRight,
  Heart,
  Share2,
} from "lucide-react";
import {
  Modal,
  Input,
  notification,
  Button,
  Tooltip,
  Rate,
  Progress,
  Tag,
  Skeleton,
  Tabs,
  Spin,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import roomService from "../../apis/Room/room";
import { useSelector } from "react-redux";
import { useScrollEffect } from "../../hooks";
import {
  PlayCircleOutlined,
  YoutubeOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  HeartOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

// Lazy load components for better performance
const SimilarMovies = React.lazy(() =>
  import("../../components/Movies/SimilarMovies")
);
const CastAndCrew = React.lazy(() =>
  import("../../components/Movies/CastAndCrew")
);

// Helper utility functions
const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  // Handle youtu.be URLs
  if (url.includes("youtu.be")) {
    const videoId = url.split("/").pop();
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Handle youtube.com URLs
  if (url.includes("youtube.com/watch")) {
    const videoId = new URLSearchParams(url.split("?")[1]).get("v");
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Return original URL if not a YouTube URL
  return url;
};

// Helper function to determine Metacritic text color based on score
const getMetacriticColor = (score) => {
  if (!score || isNaN(score)) return "text-gray-400";
  if (score >= 75) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
};

// Helper function to determine Metacritic progress bar color based on score
const getMetacriticProgressColor = (score) => {
  if (!score || isNaN(score)) return { "0%": "#777777", "100%": "#555555" };
  if (score >= 75) return { "0%": "#66cc33", "100%": "#44aa11" };
  if (score >= 50) return { "0%": "#ffcc33", "100%": "#ffaa00" };
  return { "0%": "#ff0000", "100%": "#cc0000" };
};

const getBunnyStreamEmbedUrl = (url) => {
  if (!url) return null;

  // If URL is already in iframe format, use it directly
  if (url.includes("iframe.mediadelivery.net")) {
    return url;
  }

  // Convert video play URL to embed URL if needed
  if (
    url.includes("dash.bunny.net/stream") ||
    url.includes("bunny.net/stream")
  ) {
    const regex = /\/stream\/(\d+)\//;
    const match = url.match(regex);
    if (match && match[1]) {
      return `https://iframe.mediadelivery.net/play/${match[1]}`;
    }
  }

  return url;
};

// Motion variants for animations
const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const slideUp = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

// Movie stats badge component for cleaner UI
const StatBadge = memo(({ icon, value, label, color = "white" }) => (
  <motion.div
    variants={itemVariant}
    className="flex flex-col items-center px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 bg-white/5 backdrop-blur-sm rounded-lg"
  >
    <div className="flex items-center gap-1 sm:gap-1.5">
      {icon}
      <span
        className={`text-${color} font-bold text-[11px] sm:text-sm md:text-base`}
      >
        {value}
      </span>
    </div>
    <span className="text-gray-400 text-[8px] sm:text-[10px] md:text-xs">
      {label}
    </span>
  </motion.div>
));

// Genre badge with hover effect
const GenreBadge = memo(({ name }) => (
  <motion.span
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="px-2 py-1 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700/30 rounded-full text-xs text-white cursor-pointer transition-all"
  >
    {name}
  </motion.span>
));

// Action button component for consistent styling
const ActionButton = memo(({ icon, children, primary = false, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    whileHover={{ scale: 1.02, y: -2 }}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
    ${
      primary
        ? "bg-[#FF009F] hover:bg-[#e0008e] text-white"
        : "bg-gray-800/70 hover:bg-gray-700/80 text-white border border-gray-700/30"
    }`}
  >
    {icon}
    <span>{children}</span>
  </motion.button>
));

// Trailer component with enhanced UI
const TrailerSection = memo(({ trailerUrl, title }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeIn}
    id="trailer"
    className="w-full rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/30 shadow-lg"
  >
    <div className="p-4 border-b border-gray-800/50">
      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-[#FF009F]" />
        Official Trailer
      </h2>
    </div>
    <motion.div variants={scaleIn} className="aspect-video relative w-full">
      <iframe
        src={getBunnyStreamEmbedUrl(trailerUrl)}
        title={`${title} - Official Trailer`}
        className="absolute top-0 left-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </motion.div>
  </motion.div>
));

// Movie facts panel with enhanced design
const MovieFacts = memo(({ movie }) => {
  // Convert genreNames string to array if genres array is not available
  const genresArray =
    movie.genres ||
    (movie.genreNames
      ? movie.genreNames.split(",").map((name) => ({
          id: name.trim(),
          name: name.trim(),
        }))
      : []);

  // Define movieStats for this component
  const movieStats = [
    {
      label: "Director",
      value: movie.director,
      icon: <Award className="w-4 h-4 text-[#FF009F] opacity-80" />,
    },
    {
      label: "Release Year",
      value: movie.releaseYear,
      icon: <Calendar className="w-4 h-4 text-[#FF009F] opacity-80" />,
    },
    {
      label: "Duration",
      value: `${movie.duration} minutes`,
      icon: <Clock className="w-4 h-4 text-[#FF009F] opacity-80" />,
    },
    {
      label: "Nation",
      value: movie.nation,
      icon: <Globe className="w-4 h-4 text-[#FF009F] opacity-80" />,
    },
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer}
      className="w-full space-y-4 sm:space-y-6"
    >
      {/* Movie Details Card */}
      <motion.div
        variants={slideUp}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/30 rounded-xl overflow-hidden shadow-lg"
      >
        <div className="p-4 sm:p-5 border-b border-gray-800/50">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <InfoCircleOutlined className="text-[#FF009F]" />
            Movie Details
          </h2>
        </div>

        <div className="p-4 sm:p-5">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {movieStats.map(({ label, value, icon }) => (
              <motion.div
                key={label}
                variants={itemVariant}
                className="flex items-center gap-3 py-2"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 text-[#FF009F]">
                  {icon}
                </div>
                <div>
                  <div className="text-gray-400 text-xs">{label}</div>
                  <div className="text-white font-medium text-sm sm:text-base">
                    {value || "N/A"}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Genres section */}
          <motion.div
            variants={slideUp}
            className="mt-4 pt-4 border-t border-gray-800/30"
          >
            <h3 className="text-base font-medium text-white mb-3">Genres</h3>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-2"
            >
              {genresArray && genresArray.length > 0 ? (
                genresArray.map((genre) => (
                  <motion.div
                    key={genre.id || genre.name}
                    variants={itemVariant}
                  >
                    <GenreBadge name={genre.name} />
                  </motion.div>
                ))
              ) : (
                <span className="text-gray-400 text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 bg-white/5 rounded-full">
                  No genres
                </span>
              )}
            </motion.div>
          </motion.div>

          {/* Description section */}
          <motion.div
            variants={slideUp}
            className="mt-4 pt-4 border-t border-gray-800/30"
          >
            <h3 className="text-base font-medium text-white mb-2">Synopsis</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {movie.description || "No description available."}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Rating Section */}
      <motion.div
        variants={slideUp}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/30 rounded-xl overflow-hidden shadow-lg"
      >
        <div className="p-4 sm:p-5 border-b border-gray-800/50">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Ratings
          </h2>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* IMDB Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center min-w-14 h-14 bg-gray-800 rounded-lg">
              <img
                src="https://m.media-amazon.com/images/G/01/imdb/images/favicon-2165806970._CB485916947_.ico"
                alt="IMDB"
                className="w-8 h-8"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 text-sm font-medium">
                  IMDB Rating
                </span>
                <div className="flex items-center">
                  <span className="text-yellow-500 font-bold text-lg mr-1">
                    {movie.imdbRating?.toFixed(1) ||
                      movie.rating?.toFixed(1) ||
                      "N/A"}
                  </span>
                  <span className="text-gray-400 text-xs">/10</span>
                </div>
              </div>
              <Progress
                percent={(movie.imdbRating || movie.rating || 0) * 10}
                showInfo={false}
                strokeColor={{
                  "0%": "#FFD700",
                  "100%": "#FF9900",
                }}
                trailColor="#1c1c1c"
                size="small"
              />
              {movie.imdbVotes > 0 && (
                <div className="text-right text-xs text-gray-400 mt-1">
                  {new Intl.NumberFormat().format(movie.imdbVotes)} votes
                </div>
              )}
            </div>
          </div>

          {/* Rotten Tomatoes Rating */}
          {(movie.rottenTomatoes ||
            (movie.allRatings &&
              movie.allRatings.find(
                (r) => r.Source === "Rotten Tomatoes"
              ))) && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center min-w-14 h-14 bg-gray-800 rounded-lg">
                <img
                  src="https://www.rottentomatoes.com/assets/pizza-pie/images/favicon.ico"
                  alt="Rotten Tomatoes"
                  className="w-8 h-8"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-300 text-sm font-medium">
                    Rotten Tomatoes
                  </span>
                  <div className="flex items-center">
                    <span
                      className={`font-bold text-lg ${
                        parseInt(
                          movie.rottenTomatoes ||
                            movie.allRatings?.find(
                              (r) => r.Source === "Rotten Tomatoes"
                            )?.Value
                        ) >= 60
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {movie.rottenTomatoes ||
                        movie.allRatings?.find(
                          (r) => r.Source === "Rotten Tomatoes"
                        )?.Value ||
                        "N/A"}
                    </span>
                  </div>
                </div>
                <Progress
                  percent={
                    parseInt(
                      movie.rottenTomatoes ||
                        movie.allRatings?.find(
                          (r) => r.Source === "Rotten Tomatoes"
                        )?.Value
                    ) || 0
                  }
                  showInfo={false}
                  strokeColor={
                    parseInt(
                      movie.rottenTomatoes ||
                        movie.allRatings?.find(
                          (r) => r.Source === "Rotten Tomatoes"
                        )?.Value
                    ) >= 60
                      ? {
                          "0%": "#5cb85c",
                          "100%": "#3e8e3e",
                        }
                      : {
                          "0%": "#d9534f",
                          "100%": "#c9302c",
                        }
                  }
                  trailColor="#1c1c1c"
                  size="small"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {parseInt(
                    movie.rottenTomatoes ||
                      movie.allRatings?.find(
                        (r) => r.Source === "Rotten Tomatoes"
                      )?.Value
                  ) >= 60
                    ? "Fresh"
                    : "Rotten"}
                </div>
              </div>
            </div>
          )}

          {/* Metacritic Rating */}
          {(movie.metascore ||
            (movie.allRatings &&
              movie.allRatings.find((r) => r.Source === "Metacritic"))) && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center min-w-14 h-14 bg-gray-800 rounded-lg">
                <img
                  src="https://www.metacritic.com/favicon.ico"
                  alt="Metacritic"
                  className="w-8 h-8"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-300 text-sm font-medium">
                    Metacritic
                  </span>
                  <div className="flex items-center">
                    <span
                      className={`font-bold text-lg ${getMetacriticColor(
                        parseInt(
                          movie.metascore ||
                            movie.allRatings?.find(
                              (r) => r.Source === "Metacritic"
                            )?.Value
                        )
                      )}`}
                    >
                      {movie.metascore ||
                        movie.allRatings?.find((r) => r.Source === "Metacritic")
                          ?.Value ||
                        "N/A"}
                    </span>
                    <span className="text-gray-400 text-xs ml-1">/100</span>
                  </div>
                </div>
                <Progress
                  percent={
                    parseInt(
                      movie.metascore ||
                        movie.allRatings?.find((r) => r.Source === "Metacritic")
                          ?.Value
                    ) || 0
                  }
                  showInfo={false}
                  strokeColor={getMetacriticProgressColor(
                    parseInt(
                      movie.metascore ||
                        movie.allRatings?.find((r) => r.Source === "Metacritic")
                          ?.Value
                    )
                  )}
                  trailColor="#1c1c1c"
                  size="small"
                />
              </div>
            </div>
          )}

          {/* User Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center min-w-14 h-14 bg-gray-800 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#FF009F"
                className="w-8 h-8"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 text-sm font-medium">
                  User Rating
                </span>
                <div className="flex items-center">
                  <span className="text-[#FF009F] font-bold text-lg mr-1">
                    {movie.userRating || "N/A"}
                  </span>
                  <span className="text-gray-400 text-xs">/5</span>
                </div>
              </div>
              <Rate
                disabled
                value={movie.userRating}
                allowHalf
                className="text-[#FF009F] text-sm"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

// MovieHero component with modern design
const MovieHero = memo(
  ({ movie, onTrailerClick, onCreateRoom, onWatchNow }) => {
    const banner = movie.medias?.find((m) => m.type === "BANNER");
    const poster = movie.medias?.find((m) => m.type === "POSTER");
    const trailer = movie.medias?.find((m) => m.type === "TRAILER");

    // Create genres array from either the genres object or genreNames string
    const genresArray =
      movie.genres ||
      (movie.genreNames
        ? movie.genreNames.split(",").map((name) => ({
            id: name.trim(),
            name: name.trim(),
          }))
        : []);

    // Calculate compact badges for key movie stats
    const compactStats = [
      {
        icon: <Calendar className="w-4 h-4 text-gray-400" />,
        value: movie.releaseYear,
      },
      {
        icon: <Clock className="w-4 h-4 text-gray-400" />,
        value: `${movie.duration}m`,
      },
      {
        icon: <Globe className="w-4 h-4 text-gray-400" />,
        value: movie.nation,
      },
    ];

    return (
      <div className="relative w-full">
        {/* Background Banner with gradient overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 h-[500px] sm:h-[550px] md:h-[600px] lg:h-[650px]"
        >
          <div className="w-full h-full overflow-hidden">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
              src={banner?.url || poster?.url || "/placeholder.jpg"}
              alt={movie.title}
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
        </motion.div>

        {/* Movie Info Container */}
        <div className="relative container mx-auto px-4 py-32 sm:py-40 md:py-48 lg:py-56 z-10">
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster with subtle shadow */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                type: "spring",
                stiffness: 50,
              }}
              className="w-48 md:w-64 lg:w-80 flex-shrink-0 mx-auto md:mx-0"
            >
              <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-800/40">
                <img
                  src={poster?.url || "/placeholder.jpg"}
                  alt={movie.title}
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </div>
            </motion.div>

            {/* Movie Info */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 text-center md:text-left"
            >
              {/* Rating badges row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                {movie.imdbRating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/80 rounded-md">
                    <img
                      src="https://m.media-amazon.com/images/G/01/imdb/images/favicon-2165806970._CB485916947_.ico"
                      alt="IMDB"
                      className="w-4 h-4"
                    />
                    <span className="text-yellow-500 font-bold text-sm">
                      {movie.imdbRating.toFixed(1)}
                    </span>
                  </div>
                )}

                {(movie.rottenTomatoes ||
                  movie.allRatings?.find(
                    (r) => r.Source === "Rotten Tomatoes"
                  )) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/80 rounded-md">
                    <img
                      src="https://www.rottentomatoes.com/assets/pizza-pie/images/favicon.ico"
                      alt="RT"
                      className="w-4 h-4"
                    />
                    <span
                      className={
                        parseInt(
                          movie.rottenTomatoes ||
                            movie.allRatings?.find(
                              (r) => r.Source === "Rotten Tomatoes"
                            )?.Value
                        ) >= 60
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {movie.rottenTomatoes ||
                        movie.allRatings?.find(
                          (r) => r.Source === "Rotten Tomatoes"
                        )?.Value}
                    </span>
                  </div>
                )}

                {(movie.metascore ||
                  movie.allRatings?.find((r) => r.Source === "Metacritic")) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/80 rounded-md">
                    <img
                      src="https://www.metacritic.com/favicon.ico"
                      alt="Metacritic"
                      className="w-4 h-4"
                    />
                    <span
                      className={getMetacriticColor(
                        parseInt(
                          movie.metascore ||
                            movie.allRatings?.find(
                              (r) => r.Source === "Metacritic"
                            )?.Value
                        )
                      )}
                    >
                      {movie.metascore ||
                        movie.allRatings?.find((r) => r.Source === "Metacritic")
                          ?.Value}
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <motion.h1
                variants={itemVariant}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
              >
                {movie.title}
              </motion.h1>

              {/* Compact Stats Row */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-6 text-sm text-gray-300">
                {compactStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    {stat.icon}
                    <span>{stat.value}</span>
                    {index < compactStats.length - 1 && (
                      <span className="w-1 h-1 rounded-full bg-gray-600 ml-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* Genres Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {genresArray && genresArray.length > 0 ? (
                  genresArray.map((genre) => (
                    <GenreBadge
                      key={genre.id || genre.name}
                      name={genre.name}
                    />
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">No genres</span>
                )}
              </div>

              {/* Description */}
              <motion.p
                variants={itemVariant}
                className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 max-w-2xl"
              >
                {movie.description}
              </motion.p>

              {/* Action buttons */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <ActionButton
                  icon={<PlayCircleOutlined className="text-lg" />}
                  primary={true}
                  onClick={onWatchNow}
                >
                  Watch Now
                </ActionButton>

                {trailer && (
                  <ActionButton
                    icon={<YoutubeOutlined className="text-lg" />}
                    onClick={onTrailerClick}
                  >
                    Watch Trailer
                  </ActionButton>
                )}

                <ActionButton
                  icon={<TeamOutlined className="text-lg" />}
                  onClick={onCreateRoom}
                >
                  Watch Together
                </ActionButton>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    );
  }
);

/**
 * MoviePage Component
 *
 * Displays a detailed view of a movie with:
 * - Hero section with movie poster, title, and key actions
 * - Tabbed interface for Overview and Similar movies
 * - Interactive elements for watching, creating or joining watch rooms
 * - Responsive design with animations for improved user experience
 */
const MoviePage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCreateRoomModalVisible, setIsCreateRoomModalVisible] =
    useState(false);
  const [roomId, setRoomId] = useState("");
  const [hostedRooms, setHostedRooms] = useState([]);
  const navigate = useNavigate();
  // Lấy thông tin người dùng từ Redux store
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  // Use scroll effect hook for enhanced scroll animations
  const { isScrolled, scrollY } = useScrollEffect(150);

  // Fade in effect for section elements
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          // Ensure all ratings data is properly passed to child components
          const movieData = response.data;

          // Extract ratings information from allRatings if available
          if (movieData.allRatings) {
            const rtRating = movieData.allRatings.find(
              (r) => r.Source === "Rotten Tomatoes"
            );
            const mcRating = movieData.allRatings.find(
              (r) => r.Source === "Metacritic"
            );

            if (rtRating && !movieData.rottenTomatoes) {
              movieData.rottenTomatoes = rtRating.Value;
            }

            if (mcRating && !movieData.metascore) {
              movieData.metascore = mcRating.Value;
            }
          }

          // If we still don't have all ratings data, try to create a default structure
          if (!movieData.allRatings) {
            movieData.allRatings = [];

            // Add IMDB rating to allRatings if available
            if (movieData.imdbRating) {
              movieData.allRatings.push({
                Source: "Internet Movie Database",
                Value: `${movieData.imdbRating}/10`,
              });
            }

            // Add Metacritic to allRatings if available
            if (movieData.metascore) {
              movieData.allRatings.push({
                Source: "Metacritic",
                Value: `${movieData.metascore}/100`,
              });
            }

            // Add Rotten Tomatoes to allRatings if available
            if (movieData.rottenTomatoes) {
              movieData.allRatings.push({
                Source: "Rotten Tomatoes",
                Value: movieData.rottenTomatoes,
              });
            }
          }

          // Debug: Log all ratings data
          console.log("Movie ratings data:", {
            imdbRating: movieData.imdbRating,
            imdbVotes: movieData.imdbVotes,
            metascore: movieData.metascore,
            rottenTomatoes: movieData.rottenTomatoes,
            allRatings: movieData.allRatings,
          });

          setMovie(movieData);
        } else {
          notification.error({
            message: "Failed to load movie",
            description: response.message || "Could not load movie details",
            placement: "bottomRight",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        notification.error({
          message: "Failed to load movie",
          description: error.message || "Could not load movie details",
          placement: "bottomRight",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  useEffect(() => {
    const fetchHostedRooms = async () => {
      if (!user || !movieId) return;

      try {
        const response = await roomService.getHostRoom();

        if (response.success) {
          // Ensure response.data is an array
          const rooms = Array.isArray(response.data)
            ? response.data
            : [response.data];
          setHostedRooms(rooms);

          // Find active room for current movie
          const activeRoom = rooms.find(
            (room) =>
              room &&
              room.movieID === movieId &&
              room.status === "Active" &&
              room.hostId === user?.userId?.replace(/^userid:\s*/i, "")
          );

          if (activeRoom) {
            setRoomId(activeRoom.id);
          }
        }
      } catch (error) {
        console.error("Error fetching hosted rooms:", error);
        setHostedRooms([]); // Reset to empty array on error
      }
    };

    fetchHostedRooms();
  }, [user, movieId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up any event listeners or timers if needed
    };
  }, []);

  const handleCreateRoom = useCallback(async () => {
    // Kiểm tra trạng thái xác thực trực tiếp từ localStorage
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const isUserAuthenticated = isAuthenticated || (!!token && !!storedUser);

    if (isCreatingRoom || !isUserAuthenticated) {
      if (!isUserAuthenticated) {
        notification.error({
          message: "Authentication required",
          description: "Please login to create a watch room",
          placement: "bottomRight",
        });
      }
      return;
    }

    try {
      setIsCreatingRoom(true);

      // Lấy thông tin người dùng từ Redux hoặc từ localStorage
      const storedUserStr = localStorage.getItem("user");
      const currentUser =
        user || (storedUserStr ? JSON.parse(storedUserStr) : null);

      if (!currentUser || !currentUser.userId) {
        notification.error({
          message: "User data missing",
          description: "Cannot create room without user ID",
          placement: "bottomRight",
        });
        return;
      }

      const filmMedia = movie.medias.find((m) => {
        return (
          m.type?.toUpperCase() === "FILMVIP" ||
          m.type?.toUpperCase() === "FILM" ||
          m.type?.toUpperCase() === "VIDEO" ||
          m.type?.toUpperCase() === "MOVIE"
        );
      });

      const roomData = {
        hostId: currentUser.userId.replace(/^userid:\s*/i, ""),
        movieID: movieId,
        fileUrl: filmMedia?.url,
      };

      const response = await roomService.createRoom(roomData);
      if (response.success) {
        notification.success({
          message: "Room created successfully",
          description: "Redirecting to watch room...",
          placement: "bottomRight",
        });
        setIsCreateRoomModalVisible(false);
        navigate(`/watch-together/${movieId}?roomId=${response.data.id}`);
      }
    } catch (error) {
      console.error("Create room error:", error);
      notification.error({
        message: "Failed to create room",
        description:
          error.response?.data?.message ||
          error.message ||
          "Could not create room",
        placement: "bottomRight",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  }, [isCreatingRoom, isAuthenticated, user, movie, movieId, navigate]);

  // Render header with enhanced scroll behavior
  const renderHeader = () => (
    <div
      className={`movie-header transition-all duration-300 ${
        isScrolled ? "header-scrolled shadow-lg" : ""
      }`}
    >
      {/* Header content here */}
    </div>
  );

  // Render hero section with parallax effect based on scroll position
  const renderHeroSection = () => {
    if (!movie) return null;

    const parallaxOffset = Math.max(0, scrollY * 0.4); // Parallax effect for background

    return (
      <div className="hero-section relative">
        {/* Apply parallax effect to backdrop image */}
        <div
          className="backdrop-image absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${movie.backdropUrl || movie.thumbnailUrl})`,
            transform: `translateY(${parallaxOffset}px)`,
            opacity: isScrolled ? 0.6 : 0.8,
            transition: "opacity 300ms ease-out",
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* Hero content remains the same */}
        <MovieHero
          movie={movie}
          onTrailerClick={() =>
            document
              .getElementById("trailer")
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          onCreateRoom={() => setIsCreateRoomModalVisible(true)}
          onWatchNow={() => navigate(`/watch/${movieId}`)}
        />
      </div>
    );
  };

  // Loading states
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-black"
      >
        <Loading className="scale-75 sm:scale-100" />
      </motion.div>
    );
  }

  if (!movie)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4"
      >
        <motion.h2
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center"
        >
          Movie Not Found
        </motion.h2>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 mb-5 sm:mb-6 text-center text-sm sm:text-base"
        >
          The movie you're looking for doesn't exist or has been removed.
        </motion.p>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            type="primary"
            onClick={() => navigate("/")}
            className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
          >
            Back to Home
          </Button>
        </motion.div>
      </motion.div>
    );

  // Find media elements
  const trailer = movie.medias?.find((m) => m.type === "TRAILER");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black text-white"
    >
      <Helmet>
        <title>{movie ? `${movie.title} | Eigakan` : "Loading Movie..."}</title>
        <meta
          name="description"
          content={movie ? movie.description : "Movie details"}
        />
      </Helmet>

      {/* Hero Section */}
      <MovieHero
        movie={movie}
        onTrailerClick={() =>
          document
            .getElementById("trailer")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        onCreateRoom={() => setIsCreateRoomModalVisible(true)}
        onWatchNow={() => navigate(`/watch/${movieId}`)}
      />

      {/* Main Content with modern layout */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="container mx-auto px-4 py-8"
      >
        <motion.div
          variants={fadeIn}
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* Left Column - Content */}
          <motion.div variants={slideUp} className="flex-1 space-y-8">
            {/* Trailer section */}
            {trailer && (
              <TrailerSection trailerUrl={trailer.url} title={movie.title} />
            )}

            {/* Cast and Crew */}
            <Suspense
              fallback={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/30 shadow-lg p-4"
                >
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                    Cast & Crew
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 w-24 h-36 bg-gray-800 rounded-lg animate-pulse"
                      ></div>
                    ))}
                  </div>
                </motion.div>
              }
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
                className="w-full rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/30 shadow-lg"
              >
                <div className="p-4 border-b border-gray-800/50">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Cast & Crew
                  </h2>
                </div>
                <motion.div variants={slideUp} className="p-4">
                  <CastAndCrew persons={movie.person} />
                </motion.div>
              </motion.div>
            </Suspense>
          </motion.div>

          {/* Right Column - Details & Ratings */}
          <motion.div variants={slideUp} className="lg:w-1/3">
            <MovieFacts movie={movie} />
          </motion.div>
        </motion.div>

        {/* Similar Movies Section */}
        <Suspense
          fallback={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/30 shadow-lg p-4 mt-8"
            >
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                Similar Movies
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            </motion.div>
          }
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
            className="w-full rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/30 shadow-lg mt-8"
          >
            <div className="p-4 border-b border-gray-800/50">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Similar Movies
              </h2>
            </div>
            <motion.div variants={slideUp} className="p-4">
              <SimilarMovies />
            </motion.div>
          </motion.div>
        </Suspense>
      </motion.div>

      {/* Additional components like modals */}
      <AnimatePresence>
        {isCreateRoomModalVisible && (
          <Modal
            title={
              <div className="flex items-center gap-2">
                <TeamOutlined className="text-[#FF009F]" /> Create Watch Room
              </div>
            }
            open={isCreateRoomModalVisible}
            onOk={handleCreateRoom}
            onCancel={() => setIsCreateRoomModalVisible(false)}
            okText="Create Room"
            cancelText="Cancel"
            okButtonProps={{
              loading: isCreatingRoom,
              className:
                "bg-[#FF009F] hover:bg-[#e0008e] border-none text-white hover:text-white",
            }}
            cancelButtonProps={{
              disabled: isCreatingRoom,
              className: "hover:text-[#FF009F] hover:border-[#FF009F]",
            }}
            className="text-white [&_.ant-modal-content]:bg-gray-900 [&_.ant-modal-content]:text-white [&_.ant-modal-content]:shadow-2xl [&_.ant-modal-content]:border [&_.ant-modal-content]:border-gray-800 [&_.ant-modal-content]:rounded-xl [&_.ant-modal-header]:bg-gray-900 [&_.ant-modal-header]:rounded-t-xl [&_.ant-modal-header]:border-b-gray-800 [&_.ant-modal-title]:text-white [&_.ant-modal-close-x]:text-white"
            width={320}
            centered
            modalRender={(modal) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {modal}
              </motion.div>
            )}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="py-3 sm:py-4"
            >
              <div className="bg-gray-800/50 p-2 sm:p-3 md:p-4 rounded-lg mb-3 sm:mb-4 flex gap-2 sm:gap-3 md:gap-4 items-center">
                <img
                  src={
                    movie.medias?.find((m) => m.type === "POSTER")?.url ||
                    "/placeholder.jpg"
                  }
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-medium text-white text-sm">
                    {movie.title}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {movie.releaseYear} • {movie.duration}m
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-4 text-sm">
                Create a new room to watch "{movie.title}" with friends in
                real-time.
              </p>

              <div className="bg-[#FF009F]/10 border border-[#FF009F]/20 p-3 rounded-lg">
                <p className="text-sm text-white">
                  <InfoCircleOutlined className="mr-2 text-[#FF009F]" />
                  You'll be the host of this room and can control the playback
                  for all viewers.
                </p>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MoviePage;
