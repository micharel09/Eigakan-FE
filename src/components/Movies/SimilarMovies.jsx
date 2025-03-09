import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import movieService from "../../apis/Movie/movie";
import "swiper/css";
import "swiper/css/navigation";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Tách MovieCard thành component riêng và memo để tránh re-render không cần thiết
const MovieCard = memo(({ movie, onClick }) => (
  <div
    className="relative cursor-pointer group"
    onClick={() => onClick(movie.id)}
  >
    <div className="rounded-lg overflow-hidden bg-gray-900">
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
              <span>{movie.duration} minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

const SimilarMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchSimilarMovies = async () => {
      try {
        setLoading(true);
        const response = await movieService.getMovies(1, 10);
        if (response.success && response.movies) {
          const filteredMovies = response.movies.filter(
            (movie) => movie.id !== id
          );
          setMovies(filteredMovies);
        }
      } catch (error) {
        console.error("Error fetching similar movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarMovies();
  }, [id]);

  const handleMovieClick = useCallback(
    (movieId) => {
      navigate(`/movie/${movieId}`);
    },
    [navigate]
  );

  if (loading || !movies.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-white mb-4">Similar Movies</h2>
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={16}
        slidesPerView="auto"
        className="similar-movies-swiper"
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie.id} className="!w-[180px]">
            <MovieCard movie={movie} onClick={handleMovieClick} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SimilarMovies;
