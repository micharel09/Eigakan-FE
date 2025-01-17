import React, { useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImdb } from "@fortawesome/free-brands-svg-icons";
import GlobalApi from "./GlobalApi";
import GenresList from "./GenresList";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

function Slider() {
  const [movieList, setMovieList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    getTrendingMovies();
  }, []);

  const getTrendingMovies = () => {
    GlobalApi.getTrendingVideos.then(async (resp) => {
      // Lọc phim có genre_id là 28 (Top Trending) và lấy 5 phim đầu
      const trendingMovies = resp.data.results
        .filter((movie) => movie.genre_ids?.includes(28))
        .slice(0, 5);

      // Lấy thêm thông tin chi tiết và images cho mỗi phim
      const moviesWithDetails = await Promise.all(
        trendingMovies.map(async (movie) => {
          const details = await GlobalApi.getMovieDetails(movie.id);
          const images = await GlobalApi.getMovieImages(movie.id);
          return {
            ...movie,
            runtime: details.runtime,
            logos: images.logos,
          };
        })
      );

      setMovieList(moviesWithDetails);
    });
  };

  const handleSlideChange = (index) => {
    setCurrentIndex(index);
  };

  // Hàm để lấy tên thể loại từ genre_id
  const getGenreName = (genreId) => {
    const genre = GenresList.genere.find((g) => g.id === genreId);
    return genre ? genre.name : "";
  };

  // Nếu không có phim, hiển thị loading hoặc return null
  if (movieList.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[80vh] bg-black">
      {/* Navigation Arrows */}
      {movieList.length > 1 && (
        <>
          <HiChevronLeft
            className="absolute left-0 top-1/2 -translate-y-1/2 text-white text-[40px] 
            mx-8 cursor-pointer z-20 hover:scale-125 transition-all"
            onClick={() =>
              handleSlideChange(
                currentIndex === 0 ? movieList.length - 1 : currentIndex - 1
              )
            }
          />
          <HiChevronRight
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white text-[40px] 
            mx-8 cursor-pointer z-20 hover:scale-125 transition-all"
            onClick={() =>
              handleSlideChange((currentIndex + 1) % movieList.length)
            }
          />
        </>
      )}

      {/* Current Slide */}
      <div className="relative h-full">
        {movieList.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-500
              ${
                index === currentIndex
                  ? "opacity-100 visible"
                  : "opacity-0 invisible"
              }`}
          >
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/50 to-black/90 z-10" />
              <img
                src={IMAGE_BASE_URL + movie.backdrop_path}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center h-full ml-[5%] max-w-[45%] text-white">
              {movie.logos && movie.logos[0] ? (
                <div className="mb-6 max-w-[400px]">
                  <img
                    src={IMAGE_BASE_URL + movie.logos[0].file_path}
                    alt={movie.title}
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <h1 className="text-5xl font-bold mb-6">{movie.title}</h1>
              )}

              {/* Movie Info */}
              <div className="flex items-center gap-6 mb-6">
                <span className="px-3 py-1.5 bg-white/20 rounded-md text-sm">
                  {movie.release_date?.split("-")[0]}
                </span>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faImdb}
                    className="text-[#FFD43B] text-3xl"
                  />
                  <span className="text-lg font-semibold">
                    {movie.vote_average?.toFixed(1)}
                  </span>
                </span>
                {movie.runtime && (
                  <span className="px-3 py-1.5 bg-white/20 rounded-md text-sm">
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}
              </div>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genre_ids?.slice(0, 3).map((genreId) => (
                  <span
                    key={genreId}
                    className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium"
                  >
                    {getGenreName(genreId)}
                  </span>
                ))}
              </div>

              {/* Overview */}
              <p className="text-gray-200 text-lg leading-relaxed mb-8 line-clamp-3">
                {movie.overview}
              </p>

              {/* Watch Now Button */}
              <Link
                to={`/movie/${movie.id}`}
                className="bg-red-600 text-white px-8 py-3 rounded-md 
                hover:bg-red-700 transition-colors w-fit font-semibold text-lg"
              >
                Watch Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Thumbnail Navigation - Adjusted position */}
      <div className="absolute bottom-6 right-16 flex gap-3 z-20">
        {movieList.map((movie, index) => (
          <img
            key={movie.id}
            src={IMAGE_BASE_URL + movie.backdrop_path}
            alt={movie.title}
            className={`w-24 h-14 object-cover rounded-md cursor-pointer transition-all
              ${
                currentIndex === index
                  ? "border-2 border-white"
                  : "opacity-40 hover:opacity-75"
              }`}
            onClick={() => handleSlideChange(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default Slider;
