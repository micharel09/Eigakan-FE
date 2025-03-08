import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import movieService from "../../apis/Movie/movie";
import "swiper/css";
import "swiper/css/navigation";

function MovieList({ genreName, title, showAll }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getMovies = async () => {
      setLoading(true);
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
    getMovies();
  }, [genreName, showAll]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {!showAll && (
          <Link
            to={`/genre/${genreName}`}
            className="text-gray-400 hover:text-[#FF009F] transition-colors"
          >
            View All
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={20}
          slidesPerView="auto"
          className="movie-list-swiper"
          slidesOffsetBefore={20}
          slidesOffsetAfter={20}
        >
          {movies.map((movie) => (
            <SwiperSlide key={movie.id} className="!w-[240px]">
              <Link
                to={`/movie/${movie.id}`}
                className="block group/item relative"
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                  <img
                    src={movie.medias?.[0]?.url || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover/item:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 flex flex-col justify-between p-3">
                      <div className="flex justify-between items-start">
                        <span className="bg-[#FF009F] text-white text-xs px-2 py-1 rounded">
                          {movie.quality || "HD"}
                        </span>
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {movie.duration} min
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 group-hover/item:text-[#FF009F]">
                          {movie.title}
                        </h3>
                        <div className="space-y-1 text-xs text-gray-300">
                          <div className="flex items-center gap-2">
                            <span>{movie.releaseYear}</span>
                            {movie.imdbScore && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3 text-[#FF009F]"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {movie.imdbScore}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="line-clamp-1">{movie.genreNames}</div>
                          <div className="flex items-center gap-2">
                            {movie.country && (
                              <>
                                <span>{movie.country}</span>
                                <span>•</span>
                              </>
                            )}
                            {/* <span className="text-[#FF009F]">
                              {movie.duration} min
                            </span> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-white text-sm font-medium mt-2 line-clamp-2 group-hover/item:text-[#FF009F] transition-colors duration-300">
                  {movie.title}
                </h3>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}

export default MovieList;
