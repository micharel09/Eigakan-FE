import { Link } from "react-router-dom";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const SimilarMovie = ({ movie }) => (
  <Link
    to={`/movie/${movie.id}`}
    className="group relative block overflow-hidden rounded-lg bg-gray-900 transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl"
  >
    <div className="aspect-[2/3] relative">
      <img
        src={
          movie.poster_path
            ? `${IMAGE_BASE_URL}${movie.poster_path}`
            : "/placeholder.svg"
        }
        alt={movie.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="absolute bottom-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-lg font-bold text-white mb-1">{movie.title}</h3>
          {movie.release_date && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>{new Date(movie.release_date).getFullYear()}</span>
              <span>•</span>
              <span>{movie.vote_average.toFixed(1)} ⭐</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </Link>
);

export default SimilarMovie;
