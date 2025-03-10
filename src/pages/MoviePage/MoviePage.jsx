import React, { useEffect, useState, Suspense, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { PlayCircle, Clock, Calendar, Star } from "lucide-react";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";

// Lazy load các components không cần thiết ngay lập tức
const SimilarMovies = React.lazy(() =>
  import("../../components/Movies/SimilarMovies")
);
const CastAndCrew = React.lazy(() =>
  import("../../components/Movies/CastAndCrew")
);

// Tách MovieHero thành component riêng để tránh re-render không cần thiết
const MovieHero = memo(({ movie, onTrailerClick }) => {
  const banner = movie.medias?.find((m) => m.type === "BANNER");
  const poster = movie.medias?.find((m) => m.type === "POSTER");
  const trailer = movie.medias?.find((m) => m.type === "TRAILER");

  return (
    <div className="relative w-full h-[70vh] overflow-hidden -mt-16 pt-16">
      {/* Background Banner */}
      <div className="absolute inset-0">
        <img
          src={banner?.url || poster?.url || "/placeholder.jpg"}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80" />
      </div>

      {/* Movie Info Container */}
      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Poster */}
            <div className="w-64 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl">
              <img
                src={poster?.url || "/placeholder.jpg"}
                alt={movie.title}
                className="w-full h-auto"
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {movie.releaseYear}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {movie.duration}m
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  {movie.rating}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-white/20 transition"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className="text-gray-300 text-lg leading-relaxed mb-8 line-clamp-3">
                {movie.description}
              </p>

              <div className="flex gap-4">
                <Link
                  to={`/watch/${movie.id}`}
                  className="flex items-center gap-2 bg-[#FF009F] hover:bg-[#D1007F] text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
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
    </div>
  );
});

// Tách MovieFacts thành component riêng
const MovieFacts = memo(({ movie }) => {
  return (
    <div className="lg:w-1/3 space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-6 mt-14">
        <h2 className="text-xl font-bold mb-4 text-white">Movie Facts</h2>
        <div className="space-y-4">
          {[
            { label: "Director", value: movie.director },
            { label: "Release Year", value: movie.releaseYear },
            { label: "Duration", value: `${movie.duration} minutes` },
            { label: "Nation", value: movie.nation },
            { label: "Genre", value: movie.genreNames },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-400">{label}</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Section */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Ratings</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">IMDB Rating</span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 font-bold">{movie.rating}</span>
              <span className="text-gray-400">/10</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">User Rating</span>
            <div className="flex items-center gap-2">
              <span className="text-[#FF009F] font-bold">
                {movie.userRating}
              </span>
              <span className="text-gray-400">/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Hàm helper để chuyển đổi YouTube URL thành embed URL
const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  // Xử lý youtu.be URL
  if (url.includes("youtu.be")) {
    const videoId = url.split("/").pop();
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Xử lý youtube.com URL
  if (url.includes("youtube.com/watch")) {
    const videoId = new URLSearchParams(url.split("?")[1]).get("v");
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // Trả về URL gốc nếu không phải YouTube URL
  return url;
};

// Tách URL trực tiếp thành iframe embed URL nếu cần
const getBunnyStreamEmbedUrl = (url) => {
  if (!url) return null;

  // Nếu URL đã có dạng iframe, sử dụng nó trực tiếp
  if (url.includes("iframe.mediadelivery.net")) {
    return url;
  }

  // Nếu URL là dạng video play URL, chuyển đổi sang URL embed nếu cần
  if (
    url.includes("dash.bunny.net/stream") ||
    url.includes("bunny.net/stream")
  ) {
    // Trích xuất video ID từ URL
    const regex = /\/stream\/(\d+)\//;
    const match = url.match(regex);
    if (match && match[1]) {
      return `https://iframe.mediadelivery.net/play/${match[1]}`;
    }
  }

  // Trả về URL gốc nếu không khớp với các pattern trên
  return url;
};

const MoviePage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieData = async () => {
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

    fetchMovieData();
  }, [movieId]);

  if (loading) return <Loading />;
  if (!movie) return <div>Movie not found</div>;

  return (
    <>
      <Helmet>
        <title>{movie.title} - Eigakan</title>
        <meta name="description" content={movie.description} />
      </Helmet>

      <MovieHero
        movie={movie}
        onTrailerClick={() =>
          document
            .getElementById("trailer")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="lg:w-2/3">
            {movie.medias?.find((m) => m.type === "TRAILER") && (
              <div id="trailer">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                  <PlayCircle className="w-6 h-6" />
                  Official Trailer
                </h2>
                <div
                  className="aspect-video rounded-lg overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: "#0f172a",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      paddingTop: "56.25%",
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      src={getBunnyStreamEmbedUrl(
                        movie.medias.find((m) => m.type === "TRAILER")?.url
                      )}
                      title="Movie Trailer"
                      style={{
                        position: "absolute",
                        top: "0%",
                        left: "0%",
                        width: "100%",
                        height: "100%",
                        border: "none",
                        padding: 0,
                        margin: 0,
                      }}
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <MovieFacts movie={movie} />
        </div>

        <Suspense
          fallback={
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
          }
        >
          <CastAndCrew persons={movie.person} />
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
