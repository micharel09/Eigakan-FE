import React from "react";
import { Link } from "react-router-dom";

function MovieCard({ movie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="block group transform transition-all duration-300 hover:scale-105"
    >
      <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        {/* Poster Image */}
        <div className="aspect-[2/3] w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px]">
          <img
            src={movie.medias?.[0]?.url || "/skibidi.jpg"}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent 
                        opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          />
        </div>

        {/* Movie Info */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 
                      group-hover:translate-y-0 transition-transform duration-300"
        >
          {/* Title */}
          <h3
            className="text-white font-semibold text-lg leading-tight mb-2 
                       line-clamp-2 group-hover:text-red-500 transition-colors"
          >
            {movie.title}
          </h3>

          {/* Movie Details */}
          <div
            className="flex items-center gap-2 text-sm text-gray-300
                        opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <span>{movie.releaseYear}</span>
            {movie.duration && (
              <>
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{movie.duration}m</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
