import React from "react";
import { Link } from "react-router-dom";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

function MovieCard({ movie }) {
  return (
    <div className="flex-shrink-0 group animate-fade-up">
      <Link
        to={`/movie/${movie.id}`}
        className="block transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={IMAGE_BASE_URL + movie.poster_path || "/placeholder.svg"}
            alt={movie.title || "Movie poster"}
            className="min-w-[150px] md:min-w-[200px] lg:min-w-[240px] 
                     h-[225px] md:h-[300px] lg:h-[360px] 
                     object-cover transform group-hover:scale-110 transition-all 
                     duration-200 ease-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 p-4">
              <h3 className="text-lg font-bold text-white">{movie.title}</h3>
              {movie.release_date && (
                <p className="text-sm text-gray-300">
                  {new Date(movie.release_date).getFullYear()}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default MovieCard;
