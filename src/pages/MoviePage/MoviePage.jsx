import React, { useEffect, useState, Suspense, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import GlobalApi from "../../components/Homepage/GlobalApi";
import { PlayCircle, Clock, Calendar, Star, Info } from "lucide-react";
import Loading from "../../components/Loading/Loading";

// Lazy load các components không cần thiết ngay lập tức
const ReactPlayer = React.lazy(() => import("react-player/lazy"));
const SimilarMovies = React.lazy(() =>
  import("../../components/Movies/SimilarMovies")
);
const CastAndCrew = React.lazy(() =>
  import("../../components/Movies/CastAndCrew")
);

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"; // Sử dụng ảnh nhỏ hơn cho poster

// Tách MovieHero thành component riêng để tránh re-render không cần thiết
const MovieHero = memo(({ movie, trailer, runtime, onTrailerClick }) => (
  <div className="relative w-full h-[70vh] overflow-hidden">
    <div className="absolute inset-0">
      <img
        src={`${IMAGE_BASE_URL}${movie.backdrop_path}`}
        alt="backdrop"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80" />
    </div>

    <div className="container mx-auto px-4 relative h-full">
      <div className="flex flex-col md:flex-row items-end h-full pb-16 gap-8">
        {/* Poster */}
        <div className="md:w-1/4 flex-shrink-0">
          <div className="group relative bg-gray-800 rounded-lg overflow-hidden shadow-2xl transform transition hover:-translate-y-2">
            <div className="aspect-[2/3]">
              <div className="absolute inset-0 transform transition duration-300 ease-out group-hover:scale-105">
                <img
                  src={
                    movie.poster_path
                      ? `${IMAGE_BASE_URL}${movie.poster_path}`
                      : "/placeholder.svg"
                  }
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <div className="absolute bottom-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{movie.vote_average.toFixed(1)} Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Movie Info */}
        <div className="flex-1 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{movie.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(movie.release_date).getFullYear()}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {runtime}
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              {movie.vote_average.toFixed(1)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-white/20 transition"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <p className="text-gray-300 text-lg leading-relaxed mb-8 line-clamp-3">
            {movie.overview}
          </p>

          <div className="flex gap-4">
            <Link
              to={`/watch/${movie.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 
                transition-colors font-semibold text-center group"
            >
              <PlayCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
              Watch Now
            </Link>
            {trailer && (
              <button
                onClick={onTrailerClick}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 
                  transition-colors font-semibold"
              >
                Watch Trailer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
));

// Tách MovieFacts thành component riêng
const MovieFacts = memo(({ movie, runtime }) => (
  <div className="lg:w-1/3">
    <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
      <Info className="w-6 h-6" />
      Movie Facts
    </h2>
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 space-y-6">
      {/* Production & Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Production</h3>
          <p className="text-white font-medium">
            {movie.production_companies?.[0]?.name || "N/A"}
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Budget</h3>
          <p className="text-white font-medium">
            ${(movie.budget / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Revenue & Rating */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Revenue</h3>
          <p className="text-white font-medium">
            ${(movie.revenue / 1000000).toFixed(1)}M
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Rating</h3>
          <p className="text-white font-medium flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            {movie.vote_average?.toFixed(1)} ({movie.vote_count} votes)
          </p>
        </div>
      </div>

      {/* Release Date & Runtime */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Release Date</h3>
          <p className="text-white font-medium">
            {new Date(movie.release_date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Runtime</h3>
          <p className="text-white font-medium">{runtime}</p>
        </div>
      </div>

      {/* Countries & Languages */}
      <div className="space-y-4">
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Countries</h3>
          <p className="text-white font-medium">
            {movie.production_countries
              ?.map((country) => country.name)
              .join(", ") || "N/A"}
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm mb-1">Languages</h3>
          <p className="text-white font-medium">
            {movie.spoken_languages
              ?.map((lang) => lang.english_name)
              .join(", ") || "N/A"}
          </p>
        </div>
      </div>
    </div>
  </div>
));

const MoviePage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const movieData = await GlobalApi.getMovieDetails(movieId);
        setMovie(movieData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  if (loading) return <Loading />;
  if (!movie) return <Loading />;

  const trailer =
    movie.videos?.results?.find((v) => v.type === "Trailer") ||
    movie.videos?.results[0];
  const runtime = `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`;

  return (
    <>
      <Helmet>
        <title>{movie.title} - Eigakan</title>
        <meta name="description" content={movie.overview} />
      </Helmet>

      <MovieHero
        movie={movie}
        trailer={trailer}
        runtime={runtime}
        onTrailerClick={() =>
          document
            .getElementById("trailer")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="lg:w-2/3">
            {trailer && (
              <Suspense
                fallback={
                  <div className="aspect-video bg-gray-800 rounded-lg animate-pulse" />
                }
              >
                <div id="trailer">
                  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                    <PlayCircle className="w-6 h-6" />
                    Official Trailer
                  </h2>
                  <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                    <ReactPlayer
                      url={`https://www.youtube.com/watch?v=${trailer.key}`}
                      width="100%"
                      height="100%"
                      controls
                      loading="lazy"
                    />
                  </div>
                </div>
              </Suspense>
            )}
          </div>

          <MovieFacts movie={movie} runtime={runtime} />
        </div>

        <Suspense
          fallback={
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          }
        >
          <CastAndCrew />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-64 bg-gray-800 rounded-lg animate-pulse mt-16" />
          }
        >
          <div className="mt-16">
            <SimilarMovies />
          </div>
        </Suspense>
      </div>
    </>
  );
};

export default MoviePage;
