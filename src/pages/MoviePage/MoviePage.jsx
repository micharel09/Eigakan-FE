import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactPlayer from "react-player";
import GlobalApi from "../../components/Homepage/GlobalApi";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

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
        setSimilarMovies(similarData.data.results.slice(0, 8)); // Get first 8 similar movies
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
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
      </Helmet>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {trailer ? (
            <div className="aspect-video rounded-lg overflow-hidden">
              <ReactPlayer
                url={`https://www.youtube.com/watch?v=${trailer.key}`}
                width="100%"
                height="100%"
                controls
                playing
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <img
                src={`${IMAGE_BASE_URL}${movie.backdrop_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <h1 className="text-3xl font-bold mb-4">{movie.title}</h1>
          <Link
            to={`/watch/${movie.id}`}
            className="inline-block bg-red-600 text-white px-4 py-2 rounded-md mb-4 hover:bg-red-700 transition-colors"
          >
            Watch Now
          </Link>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400">Release Date</p>
              <p>{new Date(movie.release_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Rating</p>
              <p>{movie.vote_average.toFixed(1)} / 10</p>
            </div>
            <div>
              <p className="text-gray-400">Overview</p>
              <p className="text-sm leading-relaxed">{movie.overview}</p>
            </div>
            <div>
              <p className="text-gray-400">Genres</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Movies Section */}
      {similarMovies.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Similar Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarMovies.map((similarMovie) => (
              <Link
                key={similarMovie.id}
                to={`/movie/${similarMovie.id}`}
                className="group"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                  <img
                    src={
                      similarMovie.poster_path
                        ? `${IMAGE_BASE_URL}${similarMovie.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={similarMovie.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-all duration-200 ease-in"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 p-4">
                      <h3 className="text-lg font-bold text-white">
                        {similarMovie.title}
                      </h3>
                      {similarMovie.release_date && (
                        <p className="text-sm text-gray-300">
                          {new Date(similarMovie.release_date).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePage;
