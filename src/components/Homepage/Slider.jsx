import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImdb } from "@fortawesome/free-brands-svg-icons";
import GlobalApi from "./GlobalApi";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const Slider = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Preload next image for smoother transitions
  const preloadNextImage = useCallback(
    (nextIndex) => {
      if (movies[nextIndex]) {
        const img = new Image();
        img.src = `${IMAGE_BASE_URL}${movies[nextIndex].backdrop_path}`;
      }
    },
    [movies]
  );

  useEffect(() => {
    const getMovies = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error state
        const resp = await GlobalApi.getTrendingMovies();
        if (resp.data && resp.data.results) {
          setMovies(resp.data.results.slice(0, 5));
        } else {
          throw new Error("Invalid response format");
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
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % movies.length;
      preloadNextImage(nextIndex);
      setCurrentIndex(nextIndex);
    }, 6000); // Increased slightly for better viewing experience
    return () => clearInterval(timer);
  }, [currentIndex, movies.length, preloadNextImage]);

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

  if (!movies.length) return null;

  return (
    <div className="relative h-[80vh] bg-black overflow-hidden">
      {movies.map((movie, index) => (
        <div
          key={movie.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          }`}
        >
          {/* Background image with gradient overlay */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
            <img
              src={`${IMAGE_BASE_URL}${movie.backdrop_path}`}
              alt={movie.title}
              className="w-full h-full object-cover transition-all duration-[8000ms] ease-out"
              style={{
                transform: `scale(${index === currentIndex ? 1.15 : 1.05})`,
                transitionProperty: "transform, opacity",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === currentIndex ? "high" : "low"}
              decoding="async"
            />
          </div>

          {/* Content overlay with fade-in effect */}
          <div
            className="relative z-10 flex flex-col justify-center h-full ml-[5%] max-w-[45%] text-white"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              transform: `translateY(${index === currentIndex ? 0 : "20px"})`,
              transition: "opacity 800ms ease-out, transform 800ms ease-out",
              transitionDelay: "200ms",
            }}
          >
            {movie.logos && movie.logos[0] ? (
              <div className="mb-6 max-w-[400px]">
                <img
                  src={`${IMAGE_BASE_URL}${movie.logos[0].file_path}`}
                  alt={movie.title}
                  className="w-full h-auto"
                  loading="lazy"
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

      {/* Thumbnails with hover effect */}
      <div className="absolute bottom-6 right-16 flex gap-3 z-20">
        {movies.map((movie, index) => (
          <img
            key={movie.id}
            src={`${IMAGE_BASE_URL}${movie.backdrop_path}`}
            alt={movie.title}
            className={`w-24 h-14 object-cover rounded-md cursor-pointer transition-all duration-300
              ${
                currentIndex === index
                  ? "border-2 border-white scale-110"
                  : "opacity-40 hover:opacity-75 hover:scale-105"
              }`}
            onMouseEnter={() => setCurrentIndex(index)}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
