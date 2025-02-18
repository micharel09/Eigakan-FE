import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import GlobalApi from "../Homepage/GlobalApi";
import "swiper/css";
import "swiper/css/navigation";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Tách MovieCard thành component riêng và memo để tránh re-render không cần thiết
const MovieCard = memo(({ movie, onClick }) => (
  <div
    className="relative cursor-pointer group"
    onClick={() => onClick(movie.id)}
  >
    <div className="rounded-lg overflow-hidden bg-gray-800">
      <div className="relative aspect-[2/3]">
        {/* Container cho ảnh và overlay */}
        <div className="absolute inset-0 transform transition duration-300 ease-out group-hover:scale-105">
          <img
            src={`${IMAGE_BASE_URL}${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = "/movie-placeholder.jpg";
            }}
          />
          {/* Overlay gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
            opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div className="absolute bottom-0 p-4 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-white font-semibold text-sm line-clamp-2">
                {movie.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                <span>{new Date(movie.release_date).getFullYear()}</span>
                <span>•</span>
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 text-yellow-500 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Border mỏng */}
    <div className="absolute inset-0 rounded-lg ring-1 ring-white/5 pointer-events-none" />
  </div>
));

const SimilarMovies = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [similarMovies, setSimilarMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize handleMovieClick để tránh tạo lại function mỗi lần render
  const handleMovieClick = useCallback(
    (id) => {
      navigate(`/movie/${id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate]
  );

  useEffect(() => {
    let isMounted = true;

    const getSimilarMovies = async () => {
      try {
        setIsLoading(true);
        const resp = await GlobalApi.getSimilarMovies(movieId);
        if (isMounted) {
          setSimilarMovies(resp.data.results.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching similar movies:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getSimilarMovies();

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="my-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-700 rounded mb-6"></div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Similar Movies</h2>
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={20}
        breakpoints={{
          320: { slidesPerView: 2, spaceBetween: 10 },
          640: { slidesPerView: 3, spaceBetween: 15 },
          768: { slidesPerView: 4, spaceBetween: 15 },
          1024: { slidesPerView: 5, spaceBetween: 20 },
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

export default memo(SimilarMovies);
