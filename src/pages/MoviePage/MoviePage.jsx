import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactPlayer from "react-player/lazy";
import GlobalApi from "../../components/Homepage/GlobalApi";
import { Helmet } from "react-helmet";
import MovieCardSkeleton from "../../components/Movie/MovieCardSkeleton";
import SimilarMovie from "../../components/Movie/SimilarMovie";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const MoviePage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);
      try {
        const [movieData, similarData] = await Promise.all([
          GlobalApi.getMovieDetails(movieId),
          GlobalApi.getSimilarMovies(movieId),
        ]);
        setMovie(movieData);
        setSimilarMovies(similarData.data.results.slice(0, 4));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
    // Add smooth scroll
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, [movieId]);

  if (loading) {
    return <MovieCardSkeleton />;
  }

  if (!movie) {
    return <div className="text-center p-4">Movie not found</div>;
  }

  const trailer =
    movie.videos?.results?.find((video) => video.type === "Trailer") ||
    movie.videos?.results[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{movie.title} - Eigakan</title>
        <meta name="description" content={movie.overview?.slice(0, 155)} />
      </Helmet>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="group relative overflow-hidden rounded-lg transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl">
            <img
              src={
                movie.poster_path
                  ? `${IMAGE_BASE_URL}${movie.poster_path}`
                  : "/placeholder.svg"
              }
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-lg font-bold text-white mb-2">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                  <span>•</span>
                  <span>{movie.vote_average.toFixed(1)} ⭐</span>
                </div>
              </div>
            </div>
          </div>
          <Link
            to={`/watch/${movie.id}`}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors font-semibold text-center hover:scale-105 transform duration-200"
          >
            Watch Now
          </Link>
        </div>

        <div className="md:w-2/3">
          <div className="flex flex-col h-full">
            <h1 className="text-4xl font-bold mb-4 text-white">
              {movie.title}
            </h1>

            <div className="flex items-center gap-6 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Release Date</p>
                <p className="font-semibold text-white">
                  {new Date(movie.release_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Rating</p>
                <p className="font-semibold text-white">
                  {movie.vote_average.toFixed(1)} / 10
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-gray-800 rounded-full text-sm text-white hover:bg-gray-700 transition-colors duration-200"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm leading-relaxed text-gray-300">
                {movie.overview}
              </p>
            </div>

            {trailer && (
              <div className="mt-auto">
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                  <ReactPlayer
                    url={`https://www.youtube.com/watch?v=${trailer.key}`}
                    width="100%"
                    height="100%"
                    controls
                    playing
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {similarMovies.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Similar Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarMovies.map((similarMovie) => (
              <SimilarMovie key={similarMovie.id} movie={similarMovie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePage;
