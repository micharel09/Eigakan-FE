import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { motion } from "framer-motion";
import movieService from "../../apis/Movie/movie";
import "swiper/css";
import "swiper/css/navigation";
import { FileText } from "lucide-react";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Tách MovieCard thành component riêng và memo để tránh re-render không cần thiết
const MovieCard = memo(({ movie, onClick }) => (
  <motion.div
    whileHover={{ y: -10 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="relative cursor-pointer group"
    onClick={() => onClick(movie.id)}
  >
    <div className="rounded-lg overflow-hidden bg-gray-900 shadow-lg hover:shadow-[0_0_25px_rgba(255,0,159,0.3)] transition-all duration-300">
      <div className="relative aspect-[2/3]">
        <img
          src={movie.medias?.[0]?.url || "/placeholder.svg"}
          alt={movie.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 p-3">
            <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-[#FF009F]">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
              <span>{movie.releaseYear}</span>
              <span>•</span>
              <span>{movie.duration} min</span>
            </div>

            {movie.genreNames && (
              <div className="flex flex-wrap gap-1 mt-2">
                {movie.genreNames
                  .split(",")
                  .slice(0, 2)
                  .map((genre, idx) => (
                    <span
                      key={idx}
                      className="bg-[#FF009F]/20 border border-[#FF009F]/40 text-[9px] px-1.5 py-0 rounded-sm text-white"
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
  </motion.div>
));

const SimilarMovies = () => {
  const [similarMovies, setSimilarMovies] = useState([]);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchingGenre, setMatchingGenre] = useState("");
  const navigate = useNavigate();
  const { movieId } = useParams();

  // Fetch current movie to get its genres
  useEffect(() => {
    const fetchCurrentMovie = async () => {
      try {
        const response = await movieService.getMovieById(movieId);
        if (response.success && response.data) {
          setCurrentMovie(response.data);
          return response.data;
        }
      } catch (error) {
        console.error("Error fetching current movie details:", error);
      }
      return null;
    };

    const fetchSimilarMoviesByGenre = async () => {
      try {
        setLoading(true);

        // First fetch current movie details
        const movie = await fetchCurrentMovie();
        if (!movie) return;

        // Extract first genre name from the movie
        let genreName = "";
        if (movie.genreNames && movie.genreNames.includes(",")) {
          genreName = movie.genreNames.split(",")[0].trim();
        } else if (movie.genreNames) {
          genreName = movie.genreNames.trim();
        } else if (movie.genres && movie.genres.length > 0) {
          genreName = movie.genres[0].name;
        }

        if (!genreName) {
          setLoading(false);
          return;
        }

        setMatchingGenre(genreName);

        // Now fetch movies with this genre
        const response = await movieService.getMovies(1, 15, genreName);

        if (response.success && response.movies) {
          // Filter out the current movie and limit to 10 movies
          const filteredMovies = response.movies
            .filter((movie) => movie.id !== movieId)
            .slice(0, 10);

          setSimilarMovies(filteredMovies);
        }
      } catch (error) {
        console.error("Error fetching similar movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarMoviesByGenre();
  }, [movieId]);

  const handleMovieClick = useCallback((movieId) => {
    // Use window.location for a full refresh that will trigger scroll to top
    window.location.href = `/movie/${movieId}`;
  }, []);

  if (loading) {
    return (
      <div className="py-6 flex justify-center">
        <div className="animate-pulse flex gap-2 items-center">
          <div className="h-4 w-4 bg-[#FF009F]/50 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!similarMovies.length) {
    return (
      <div className="p-4 text-center">
        <div className="flex justify-center">
          <FileText className="text-gray-500 w-12 h-12 mb-2" />
        </div>
        <p className="text-gray-400">No similar movies found</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {matchingGenre && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="px-3 py-1 bg-[#FF009F] text-white rounded-full text-xs font-medium cursor-pointer hover:bg-[#e0008e] transition-colors mr-2">
              {matchingGenre}
            </span>
            {/* Thêm các tab khác nếu cần */}
            <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-medium cursor-pointer hover:bg-gray-700 transition-colors">
              Action
            </span>
            <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-medium cursor-pointer hover:bg-gray-700 transition-colors">
              Comedy
            </span>
            <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-medium cursor-pointer hover:bg-gray-700 transition-colors">
              Drama
            </span>
          </div>
          <span className="text-sm text-gray-400">
            More movies you might like based on this genre
          </span>
        </motion.div>
      )}

      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 5 },
        }}
        className="similar-movies-swiper"
      >
        {similarMovies.map((movie) => (
          <SwiperSlide key={movie.id}>
            <MovieCard movie={movie} onClick={handleMovieClick} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SimilarMovies;
