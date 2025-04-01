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

// Movie stats badge component for cleaner UI
const StatBadge = memo(({ icon, value, label, color = "white" }) => (
  <div className="flex flex-col items-center px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 bg-white/5 backdrop-blur-sm rounded-lg">
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
  </div>
));

// Genre badge with hover effect
const GenreBadge = memo(({ name }) => (
  <motion.span
    whileHover={{ scale: 1.05 }}
    className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1 bg-gradient-to-r from-[#FF009F]/20 to-[#FF009F]/10 backdrop-blur-sm border border-[#FF009F]/20 rounded-full text-[9px] sm:text-xs md:text-sm text-white cursor-pointer transition-all"
  >
    {name}
  </motion.span>
));

// Action button component for consistent styling
const ActionButton = memo(({ icon, children, primary = false, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`w-full rounded-lg font-medium transition-all duration-200 
    ${
      primary
        ? "bg-gradient-to-r from-[#FF009F] to-[#FF0055] text-white hover:shadow-lg hover:shadow-[#FF009F]/20"
        : "bg-white/10 hover:bg-white/15 text-white border border-white/5 hover:border-white/10"
    }
    text-[10px] h-9 sm:text-xs md:text-sm md:h-10 
    flex items-center justify-center gap-1.5`}
  >
    {icon}
    <span>{children}</span>
  </motion.button>
));

// Trailer component with enhanced UI
const TrailerSection = memo(({ trailerUrl, title }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    id="trailer"
    className="w-full mt-4 sm:mt-6"
  >
    <div className="flex items-center justify-between mb-2 sm:mb-4">
      <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF009F]" />
        Official Trailer
      </h2>
      <div className="flex gap-2">
        <Tooltip title="Share trailer">
          <Button
            type="text"
            shape="circle"
            icon={<ShareAltOutlined />}
            className="text-gray-400 hover:text-white"
          />
        </Tooltip>
      </div>
    </div>
    <div className="rounded-lg sm:rounded-2xl overflow-hidden shadow-xl shadow-black/30 border border-gray-800/80">
      <div className="aspect-video relative w-full">
        <iframe
          src={getBunnyStreamEmbedUrl(trailerUrl)}
          title={`${title} - Official Trailer`}
          className="absolute top-0 left-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
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
    <div className="w-full lg:w-1/3 space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gray-900/80 backdrop-blur-sm border border-gray-800/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl"
      >
        <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 md:mb-5 text-white flex items-center gap-2">
          <InfoCircleOutlined className="text-[#FF009F]" />
          Movie Details
        </h2>
        <div className="space-y-4 sm:space-y-5">
          {/* Movie details section */}
          <div className="space-y-2 sm:space-y-3">
            {movieStats.map(({ label, value, icon }) => (
              <div
                key={label}
                className="flex items-center pb-2 sm:pb-3 border-b border-gray-800/70"
              >
                <div className="flex items-center gap-2 text-gray-300 w-20 sm:w-24 md:w-32 text-xs sm:text-sm md:text-base">
                  {icon}
                  <span>{label}</span>
                </div>
                <span className="text-white font-medium ml-2 text-xs sm:text-sm md:text-base">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Genres section */}
          <div className="pt-2">
            <h3 className="text-base font-medium text-white mb-2 sm:mb-3 flex items-center gap-2">
              <Tag className="rounded-full border-none bg-[#FF009F]/20 text-[#FF009F] text-xs">
                Genres
              </Tag>
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
              {genresArray && genresArray.length > 0 ? (
                genresArray.map((genre) => (
                  <GenreBadge key={genre.id || genre.name} name={genre.name} />
                ))
              ) : (
                <span className="text-gray-400 text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 bg-white/5 rounded-full">
                  No genres
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rating Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl"
      >
        <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 md:mb-5 text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Ratings
        </h2>

        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* IMDB Rating */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs sm:text-sm md:text-base">
                IMDB Rating
              </span>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-yellow-500 font-bold text-sm sm:text-base md:text-lg">
                  {movie.imdbRating?.toFixed(1) ||
                    movie.rating?.toFixed(1) ||
                    "N/A"}
                </span>
                <span className="text-gray-400 text-xs sm:text-sm">/10</span>
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
              <div className="text-right text-xs text-gray-400">
                Based on {new Intl.NumberFormat().format(movie.imdbVotes)} votes
              </div>
            )}
          </div>

          {/* User Rating */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs sm:text-sm md:text-base">
                User Rating
              </span>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[#FF009F] font-bold text-sm sm:text-base md:text-lg">
                  {movie.userRating}
                </span>
                <span className="text-gray-400 text-xs sm:text-sm">/5</span>
              </div>
            </div>
            <Rate
              disabled
              value={movie.userRating}
              allowHalf
              className="text-[#FF009F] text-xs sm:text-sm md:text-base"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

// Tách MovieHero thành component riêng để tránh re-render không cần thiết
const MovieHero = memo(
  ({ movie, onTrailerClick, onCreateRoom, onJoinRoom, onWatchNow }) => {
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

    // Calculate badges for key movie stats
    const movieStats = [
      {
        icon: (
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#FF009F]" />
        ),
        value: movie.releaseYear,
        label: "Year",
      },
      {
        icon: (
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#FF009F]" />
        ),
        value: `${movie.duration}m`,
        label: "Duration",
      },
      {
        icon: (
          <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-500" />
        ),
        value:
          movie.imdbRating?.toFixed(1) || movie.rating?.toFixed(1) || "N/A",
        label: movie.imdbRating ? "IMDB" : "Rating",
        color: "yellow-500",
      },
      {
        icon: (
          <Globe className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#FF009F]" />
        ),
        value: movie.nation,
        label: "Country",
      },
    ];

    return (
      <div className="relative w-full overflow-hidden pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 md:pb-12 flex flex-col">
        {/* Background Banner with parallax effect */}
        <div className="absolute inset-0 top-0 h-full">
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full h-full"
          >
            <img
              src={banner?.url || poster?.url || "/placeholder.jpg"}
              alt={movie.title}
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent" />
        </div>

        {/* Movie Info Container with staggered animations */}
        <div className="relative flex-1 flex items-start justify-center mt-10 sm:mt-12 md:mt-14 lg:mt-16">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full pt-4 sm:pt-6 md:pt-8">
            <div className="w-full flex flex-col md:flex-row items-center md:items-start lg:items-center gap-5 sm:gap-6 md:gap-8 lg:gap-10">
              {/* Poster with subtle hover effect */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-40 sm:w-48 md:w-56 lg:w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 z-10"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={poster?.url || "/placeholder.jpg"}
                    alt={movie.title}
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                </motion.div>
              </motion.div>

              {/* Movie Info with staggered animations */}
              <div className="flex-1 mt-5 sm:mt-6 md:mt-0 text-center sm:text-center md:text-left max-w-full md:max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="md:pr-4"
                >
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                    {movie.title}
                  </h1>
                </motion.div>

                <div className="md:flex md:flex-wrap md:items-start md:justify-between md:gap-4">
                  <div className="md:flex-1 md:pr-8 mb-6 md:mb-0">
                    {/* Movie stats badges */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                      className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4"
                    >
                      {movieStats.map((stat, index) => (
                        <StatBadge
                          key={index}
                          icon={stat.icon}
                          value={stat.value}
                          label={stat.label}
                          color={stat.color}
                        />
                      ))}
                    </motion.div>

                    {/* Genres */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.4 }}
                      className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-5"
                    >
                      {genresArray && genresArray.length > 0 ? (
                        genresArray.map((genre) => (
                          <GenreBadge
                            key={genre.id || genre.name}
                            name={genre.name}
                          />
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 bg-white/5 rounded-full">
                          No genres
                        </span>
                      )}
                    </motion.div>

                    {/* Short description preview on desktop only */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.5 }}
                      className="hidden md:block text-gray-300 text-sm lg:text-base leading-relaxed max-h-24 md:max-h-none overflow-y-auto md:overflow-visible line-clamp-3 max-w-2xl mb-4 md:mb-6"
                    >
                      {movie.description}
                    </motion.p>

                    {/* Mobile description - above buttons on small screens */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.7, delay: 0.5 }}
                      className="block md:hidden text-gray-300 text-xs sm:text-sm leading-relaxed max-h-28 overflow-y-auto mb-4 px-3 sm:px-4"
                    >
                      {movie.description}
                    </motion.p>
                  </div>

                  {/* Action buttons with animations - moved to right side on desktop */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="flex flex-wrap justify-center md:justify-end gap-3 sm:gap-4 md:gap-0 w-full md:w-auto md:min-w-[180px] lg:min-w-[200px] mx-auto md:mx-0 md:self-start md:mt-2 lg:mt-0 lg:self-center mt-2 sm:mt-3 mb-2 sm:mb-3 md:mb-0"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-2.5 sm:gap-3 w-full max-w-3xl sm:max-w-none mx-auto">
                      <ActionButton
                        icon={
                          <PlayCircleOutlined className="text-sm sm:text-base md:text-lg" />
                        }
                        primary={true}
                        onClick={onWatchNow}
                      >
                        <span className="block sm:hidden">Watch</span>
                        <span className="hidden sm:block">Watch Now</span>
                      </ActionButton>

                      {trailer && (
                        <ActionButton
                          icon={
                            <YoutubeOutlined className="text-sm sm:text-base md:text-lg" />
                          }
                          onClick={onTrailerClick}
                        >
                          <span className="block sm:hidden">Trailer</span>
                          <span className="hidden sm:block">Watch Trailer</span>
                        </ActionButton>
                      )}

                      <ActionButton
                        icon={
                          <TeamOutlined className="text-sm sm:text-base md:text-lg" />
                        }
                        onClick={onCreateRoom}
                      >
                        <span className="block sm:hidden">Create</span>
                        <span className="hidden sm:block">Create Room</span>
                      </ActionButton>

                      <ActionButton
                        icon={
                          <UsergroupAddOutlined className="text-sm sm:text-base md:text-lg" />
                        }
                        onClick={onJoinRoom}
                      >
                        <span className="block sm:hidden">Join</span>
                        <span className="hidden sm:block">Join Room</span>
                      </ActionButton>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
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
  const [isJoinRoomModalVisible, setIsJoinRoomModalVisible] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [hostedRooms, setHostedRooms] = useState([]);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  // Use scroll effect hook for enhanced scroll animations
  const { isScrolled, scrollY } = useScrollEffect(
    150,
    (hasScrolled, position) => {
      // Optional callback that can be used for scroll-triggered animations
      // For example, you could update UI elements based on scroll position
      if (hasScrolled && !loading && movie) {
        // You can implement special effects that trigger on scroll
      }
    }
  );

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

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          setMovie(response.data);
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

  useEffect(() => {
    return () => {
      // Clean up any event listeners or timers if needed
    };
  }, []);

  const handleCreateRoom = useCallback(async () => {
    if (isCreatingRoom || !isAuthenticated) {
      if (!isAuthenticated) {
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

      if (!user || !user.userId) {
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
        hostId: user.userId.replace(/^userid:\s*/i, ""),
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

  const handleJoinRoom = useCallback(async () => {
    if (isJoining || !isAuthenticated) {
      if (!isAuthenticated) {
        notification.error({
          message: "Authentication required",
          description: "Please login to join a watch room",
          placement: "bottomRight",
        });
      }
      return;
    }

    try {
      setIsJoining(true);

      if (!roomId.trim()) {
        notification.error({
          message: "Room ID required",
          description: "Please enter a room ID",
          placement: "bottomRight",
        });
        return;
      }

      // Get user data from localStorage if not available in Redux
      let userData = user;
      if (!userData || !userData.userId) {
        const userDataStr = localStorage.getItem("user");
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }

      if (!userData || !userData.userId) {
        notification.error({
          message: "User data missing",
          description:
            "Cannot join room without user data. Please try logging in again.",
          placement: "bottomRight",
        });
        return;
      }

      const userId = userData.userId.replace(/^userid:\s*/i, "");

      // Verify room matches current movie
      try {
        const roomDetails = await roomService.getRoomDetails(roomId.trim());

        if (roomDetails.success && roomDetails.data) {
          const roomMovieId = roomDetails.data.movieID;

          if (roomMovieId && roomMovieId !== movieId) {
            notification.error({
              message: "Movie ID mismatch",
              description:
                "You cannot join this room from this movie page. Please go to the correct movie page to join this room.",
              placement: "bottomRight",
            });
            setIsJoining(false);
            return;
          }
        }
      } catch (detailsError) {
        console.error("Error fetching room details:", detailsError);
        notification.warning({
          message: "Failed to check room details",
          description:
            "Could not verify if this room matches the current movie. Proceeding anyway.",
          placement: "bottomRight",
        });
      }

      // Join the room
      const response = await roomService.joinRoom({
        roomId: roomId.trim(),
        userId: userId,
        movieId: movieId,
      });

      if (response.success) {
        notification.success({
          message: "Joined room successfully!",
          placement: "bottomRight",
        });
        setIsJoinRoomModalVisible(false);
        navigate(
          `/watch-together/${movieId}?roomId=${roomId}&movieId=${movieId}`
        );
      }
    } catch (error) {
      console.error("Join room error:", error);
      notification.error({
        message: "Failed to join room",
        description:
          error.response?.data?.message ||
          error.message ||
          "Could not join room",
        placement: "bottomRight",
      });
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, isAuthenticated, roomId, user, movieId, navigate]);

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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
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
          onJoinRoom={() => setIsJoinRoomModalVisible(true)}
          onWatchNow={() => navigate(`/watch/${movieId}`)}
        />
      </div>
    );
  };

  // Loading states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loading className="scale-75 sm:scale-100" />
      </div>
    );
  }

  if (!movie)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
          Movie Not Found
        </h2>
        <p className="text-gray-400 mb-5 sm:mb-6 text-center text-sm sm:text-base">
          The movie you're looking for doesn't exist or has been removed.
        </p>
        <Button
          type="primary"
          onClick={() => navigate("/")}
          className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
        >
          Back to Home
        </Button>
      </div>
    );

  // Find media elements
  const trailer = movie.medias?.find((m) => m.type === "TRAILER");

  return (
    <div className="movie-page">
      <Helmet>
        <title>{movie ? `${movie.title} | Eigakan` : "Loading Movie..."}</title>
        <meta
          name="description"
          content={movie ? movie.description : "Movie details"}
        />
      </Helmet>

      {loading ? (
        <Loading />
      ) : movie ? (
        <div className="flex flex-col min-h-screen bg-black">
          {/* Use enhanced header with scroll effects */}
          {renderHeader()}

          {/* Hero section with parallax */}
          {renderHeroSection()}

          {/* Main content with animation */}
          <motion.div
            className="movie-content container mx-auto px-4 py-2 sm:py-3 md:py-4"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            {/* Content Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="middle"
              className="mb-2 sm:mb-3 lg:mb-4 text-white [&_.ant-tabs-tab]:text-gray-400 [&_.ant-tabs-tab.ant-tabs-tab-active]:text-[#FF009F] [&_.ant-tabs-ink-bar]:bg-[#FF009F]"
              items={[
                {
                  label: "Overview",
                  key: "overview",
                  children: (
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <div className="w-full lg:w-2/3">
                        {/* Trailer section */}
                        {trailer && (
                          <TrailerSection
                            trailerUrl={trailer.url}
                            title={movie.title}
                          />
                        )}

                        {/* Cast and Crew */}
                        <Suspense
                          fallback={
                            <div className="mt-4 sm:mt-6 space-y-4">
                              <Skeleton.Input
                                active
                                style={{ width: 200, height: 32 }}
                              />
                              <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                                {[1, 2, 3, 4].map((i) => (
                                  <Skeleton.Avatar
                                    key={i}
                                    active
                                    size={80}
                                    shape="square"
                                  />
                                ))}
                              </div>
                            </div>
                          }
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mt-4 sm:mt-6"
                          >
                            <CastAndCrew persons={movie.person} />
                          </motion.div>
                        </Suspense>
                      </div>

                      <MovieFacts movie={movie} />
                    </div>
                  ),
                },
                {
                  label: "Similar Movies",
                  key: "similar",
                  children: (
                    <Suspense
                      fallback={
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-6">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <div
                              key={i}
                              className="aspect-[2/3] bg-gray-800 rounded-lg relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
                            </div>
                          ))}
                        </div>
                      }
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <SimilarMovies />
                      </motion.div>
                    </Suspense>
                  ),
                },
              ]}
            />
          </motion.div>

          {/* Additional components like modals */}
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
                "bg-gradient-to-r from-[#FF009F] to-[#FF0055] hover:from-[#FF00AA] hover:to-[#FF0066] border-none text-white hover:text-white shadow-lg",
            }}
            cancelButtonProps={{
              disabled: isCreatingRoom,
              className: "hover:text-[#FF009F] hover:border-[#FF009F]",
            }}
            className="text-white [&_.ant-modal-content]:bg-gray-900 [&_.ant-modal-content]:text-white [&_.ant-modal-content]:shadow-2xl [&_.ant-modal-content]:border [&_.ant-modal-content]:border-gray-800 [&_.ant-modal-content]:rounded-xl [&_.ant-modal-header]:bg-gray-900 [&_.ant-modal-header]:rounded-t-xl [&_.ant-modal-header]:border-b-gray-800 [&_.ant-modal-title]:text-white [&_.ant-modal-close-x]:text-white"
            width={320}
            centered
          >
            <div className="py-3 sm:py-4">
              <div className="bg-gray-800/50 p-2 sm:p-3 md:p-4 rounded-lg mb-3 sm:mb-4 flex gap-2 sm:gap-3 md:gap-4 items-center">
                <img
                  src={
                    movie.medias?.find((m) => m.type === "POSTER")?.url ||
                    "/placeholder.jpg"
                  }
                  alt={movie.title}
                  className="w-8 sm:w-10 md:w-12 h-12 sm:h-14 md:h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-medium text-white text-xs sm:text-sm md:text-base">
                    {movie.title}
                  </h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs">
                    {movie.releaseYear} • {movie.duration}m
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-3 sm:mb-4 text-[10px] sm:text-xs md:text-sm">
                Create a new room to watch "{movie.title}" with friends in
                real-time.
              </p>

              <div className="bg-[#FF009F]/10 border border-[#FF009F]/20 p-2 sm:p-3 rounded-lg">
                <p className="text-[10px] sm:text-xs md:text-sm text-white">
                  <InfoCircleOutlined className="mr-1 sm:mr-2 text-[#FF009F]" />
                  You'll be the host of this room and can control the playback
                  for all viewers.
                </p>
              </div>
            </div>
          </Modal>

          <Modal
            title={
              <div className="flex items-center gap-2">
                <UsergroupAddOutlined className="text-[#FF009F]" /> Join Watch
                Room
              </div>
            }
            open={isJoinRoomModalVisible}
            onOk={handleJoinRoom}
            onCancel={() => {
              setRoomId("");
              setIsJoinRoomModalVisible(false);
            }}
            okText="Join Room"
            cancelText="Cancel"
            okButtonProps={{
              loading: isJoining,
              disabled: isJoining || !roomId.trim(),
              className:
                "bg-gradient-to-r from-[#FF009F] to-[#FF0055] hover:from-[#FF00AA] hover:to-[#FF0066] border-none text-white hover:text-white shadow-lg",
            }}
            cancelButtonProps={{
              disabled: isJoining,
              className: "hover:text-[#FF009F] hover:border-[#FF009F]",
            }}
            className="text-white [&_.ant-modal-content]:bg-gray-900 [&_.ant-modal-content]:text-white [&_.ant-modal-content]:shadow-2xl [&_.ant-modal-content]:border [&_.ant-modal-content]:border-gray-800 [&_.ant-modal-content]:rounded-xl [&_.ant-modal-header]:bg-gray-900 [&_.ant-modal-header]:rounded-t-xl [&_.ant-modal-header]:border-b-gray-800 [&_.ant-modal-title]:text-white [&_.ant-modal-close-x]:text-white"
            width={320}
            centered
          >
            <div className="py-3 sm:py-4">
              <div className="bg-gray-800/50 p-2 sm:p-3 md:p-4 rounded-lg mb-3 sm:mb-4 flex gap-2 sm:gap-3 md:gap-4 items-center">
                <img
                  src={
                    movie.medias?.find((m) => m.type === "POSTER")?.url ||
                    "/placeholder.jpg"
                  }
                  alt={movie.title}
                  className="w-8 sm:w-10 md:w-12 h-12 sm:h-14 md:h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-medium text-white text-xs sm:text-sm md:text-base">
                    {movie.title}
                  </h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs">
                    {movie.releaseYear} • {movie.duration}m
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-3 sm:mb-4 text-[10px] sm:text-xs md:text-sm">
                Enter a room ID to join a watch party for "{movie.title}".
              </p>

              {hostedRooms.length > 0 &&
                hostedRooms.some(
                  (room) =>
                    room?.movieID === movieId && room?.status === "Active"
                ) && (
                  <div className="mb-3 sm:mb-4 bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg">
                    <p className="text-[10px] sm:text-xs md:text-sm text-white mb-2 flex items-center">
                      <TeamOutlined className="mr-1 sm:mr-2 text-[#FF009F]" />
                      Your active rooms:
                    </p>
                    {hostedRooms.map(
                      (room) =>
                        room &&
                        room.movieID === movieId &&
                        room.status === "Active" && (
                          <div
                            key={room.id}
                            className="flex items-center justify-between bg-gray-700/50 p-2 sm:p-3 rounded mt-2 border border-gray-700"
                          >
                            <div className="max-w-[60%]">
                              <span className="font-medium text-white text-[10px] sm:text-xs truncate block">
                                {room.id}
                              </span>
                              <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 mt-1">
                                Host: You
                              </p>
                            </div>
                            <Button
                              size="small"
                              onClick={() => setRoomId(room.id)}
                              className="bg-[#FF009F]/20 hover:bg-[#FF009F]/40 text-[#FF009F] border border-[#FF009F]/30 hover:border-[#FF009F] text-[10px] sm:text-xs md:text-sm"
                            >
                              Use this room
                            </Button>
                          </div>
                        )
                    )}
                  </div>
                )}

              <Input
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={isJoining}
                className="hover:border-[#FF009F] focus:border-[#FF009F] active:border-[#FF009F] bg-gray-800 text-white text-xs sm:text-sm"
                prefix={<TeamOutlined className="text-gray-500" />}
              />

              <div className="bg-gray-800/50 p-2 sm:p-3 rounded-lg mt-3 sm:mt-4">
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-300">
                  <InfoCircleOutlined className="mr-1 sm:mr-2 text-gray-400" />
                  The host will control playback for everyone in the room.
                </p>
              </div>
            </div>
          </Modal>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl text-white mb-4">Movie not found</h2>
          <Link
            to="/homescreen"
            className="px-4 py-2 bg-[#FF009F] text-white rounded-lg"
          >
            Return to Home
          </Link>
        </div>
      )}
    </div>
  );
};

export default MoviePage;
