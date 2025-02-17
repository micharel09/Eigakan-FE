import React, { useEffect, useState, Suspense, memo } from "react";
import { useParams } from "react-router-dom";
import movieService from "../../apis/Movie/movie";
import { Helmet } from "react-helmet";
import Loading from "../../components/Loading/Loading";
import { Star, Clock, Calendar, Info } from "lucide-react";

// Tách các components để tối ưu re-renders
const MovieInfo = memo(({ title, duration, releaseYear, rating }) => (
  <div>
    <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">{title}</h1>
    <div className="flex flex-wrap gap-4 text-gray-400">
      <div className="flex items-center">
        <Clock className="w-4 h-4 mr-2" />
        <span>{duration} min</span>
      </div>
      <div className="flex items-center">
        <Calendar className="w-4 h-4 mr-2" />
        <span>{releaseYear}</span>
      </div>
      <div className="flex items-center">
        <Star className="w-4 h-4 mr-2 text-yellow-500" />
        <span>{rating}/10</span>
      </div>
    </div>
  </div>
));

const VideoPlayer = memo(({ url, title }) => (
  <div className="relative overflow-hidden">
    <div className="w-full aspect-video bg-black">
      <iframe
        src={url}
        title={title}
        className="w-full h-full outline-none"
        frameBorder="0"
        allowFullScreen
        scrolling="no"
        style={{
          overflow: "hidden",
          border: "none",
        }}
        loading="lazy"
      />
    </div>
  </div>
));

const CastMember = memo(({ actor }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
    <img
      src={actor.picture}
      alt={actor.name}
      className="w-full aspect-[3/4] object-cover"
      loading="lazy"
    />
    <div className="p-4">
      <h3 className="text-white font-medium truncate">{actor.name}</h3>
      <p className="text-gray-400 text-sm truncate">{actor.job}</p>
    </div>
  </div>
));

const WatchPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          setMovie(response.data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  if (loading) return <Loading />;

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
          <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl">Movie not found</p>
        </div>
      </div>
    );
  }

  const movieUrl = movie.medias?.find((media) => media.type === "Movie")?.url;

  if (!movieUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
          <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl">Movie URL not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Helmet>
        <title>Watch {movie.title} - Eigakan</title>
        <meta name="description" content={movie.description} />
      </Helmet>

      <Suspense fallback={<Loading />}>
        <VideoPlayer url={movieUrl} title={movie.title} />
      </Suspense>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-8">
          <MovieInfo
            title={movie.title}
            duration={movie.duration}
            releaseYear={movie.releaseYear}
            rating={movie.rating}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-white mb-4">
                Overview
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {movie.description}
              </p>
            </div>

            <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Director
                </h3>
                <p className="text-gray-300">{movie.director}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Genre</h3>
                <p className="text-gray-300">{movie.genreNames}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Nation</h3>
                <p className="text-gray-300">{movie.nation}</p>
              </div>
            </div>
          </div>

          {movie.person && movie.person.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movie.person.map((actor) => (
                  <CastMember key={actor.id} actor={actor} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default WatchPage;
