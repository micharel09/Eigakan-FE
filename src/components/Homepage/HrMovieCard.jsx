import React from "react";
import { Link } from "react-router-dom";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const FALLBACK_IMAGE = "/api/placeholder/260/146";

const HrMovieCard = ({ movie }) => {
  if (!movie) {
    return null;
  }

  const imageUrl = movie.backdrop_path
    ? `${IMAGE_BASE_URL}${movie.backdrop_path}`
    : FALLBACK_IMAGE;

  return (
    <div className="group relative">
      <Link to={`/movie/${movie.id}`}>
        <div className="transform transition-all duration-150 ease-in hover:scale-110">
          <img
            src={imageUrl}
            alt={movie.title || "Movie poster"}
            className="w-[110px] md:w-[260px] rounded-lg border-2 border-transparent hover:border-gray-400 cursor-pointer object-cover"
          />
          <h2 className="w-[110px] md:w-[260px] text-white mt-2 truncate">
            {movie.title}
          </h2>
        </div>
      </Link>
    </div>
  );
};

export default HrMovieCard;
