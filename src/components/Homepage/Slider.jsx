import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImdb } from "@fortawesome/free-brands-svg-icons";
import GlobalApi from "./GlobalApi";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

function Slider() {
  const [movieList, setMovieList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const resp = await GlobalApi.getTopRatedMovies;
        const topMovies = resp.data.results.slice(0, 5);

        const moviesWithDetails = await Promise.all(
          topMovies.map(async (movie) => {
            const details = await GlobalApi.getMovieDetails(movie.id);
            const images = await GlobalApi.getMovieImages(movie.id);
            return {
              ...movie,
              runtime: details.runtime,
              logos: images.logos,
              genres: details.genres,
            };
          })
        );

        setMovieList(moviesWithDetails);
      } catch (error) {
        console.error("Error fetching slider movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % movieList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [movieList.length]);

  if (isLoading) {
    return (
      <div className="relative h-[80vh] bg-gray-900 animate-pulse">
        <div className="absolute inset-0">
          {/* Gradient background skeleton */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />

          {/* Content skeleton */}
          <div className="relative z-10 flex flex-col justify-center h-full ml-[5%] max-w-[45%]">
            {/* Title skeleton */}
            <div className="h-12 w-3/4 bg-gray-700 rounded-lg mb-6"></div>

            {/* Info badges skeleton */}
            <div className="flex items-center gap-6 mb-6">
              <div className="h-8 w-20 bg-gray-700 rounded-md"></div>
              <div className="h-8 w-20 bg-gray-700 rounded-md"></div>
              <div className="h-8 w-20 bg-gray-700 rounded-md"></div>
            </div>

            {/* Genres skeleton */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-24 bg-gray-700 rounded-md"></div>
              ))}
            </div>

            {/* Overview skeleton */}
            <div className="space-y-2 mb-8">
              <div className="h-4 w-full bg-gray-700 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-700 rounded"></div>
              <div className="h-4 w-4/6 bg-gray-700 rounded"></div>
            </div>

            {/* Button skeleton */}
            <div className="h-12 w-36 bg-gray-700 rounded-md"></div>
          </div>
        </div>

        {/* Thumbnail skeletons */}
        <div className="absolute bottom-6 right-16 flex gap-3 z-20">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-24 h-14 bg-gray-700 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!movieList.length) return null;

  return (
    <div className="relative h-[80vh] bg-black">
      {movieList.map((movie, index) => (
        <div
          key={movie.id}
          className={`absolute inset-0 transition-opacity duration-1000
            ${
              index === currentIndex
                ? "opacity-100 visible"
                : "opacity-0 invisible"
            }`}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/50 to-black/90 z-10" />
            <img
              src={IMAGE_BASE_URL + movie.backdrop_path}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>

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

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1.5 bg-white/20 rounded-md text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-gray-200 text-lg leading-relaxed mb-8 line-clamp-3">
              {movie.overview}
            </p>

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
            onMouseEnter={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default Slider;
