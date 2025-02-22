import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ChevronLeft, Info } from "lucide-react";
import ReactPlayer from "react-player";
import movieService from "../../apis/Movie/movie";
import Loading from "../../components/Loading/Loading";

const WatchPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const LIBRARY_ID = "384568"; // Thêm Library ID của Bunny CDN

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          setMovie(response.data);
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();

    // Hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => setShowControls(false), 3000);

    // Show controls on mouse move
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [movieId]);

  if (loading) return <Loading />;
  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
          <Link
            to="/homescreen"
            className="text-[#FF009F] hover:text-[#D1007F] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const getVideoUrl = (videoId) => {
    return `https://iframe.mediadelivery.net/play/${LIBRARY_ID}/${videoId}`;
  };

  const movieUrl = movie.medias?.find((m) => m.type === "Movie")?.url;
  const directMovieUrl = movieUrl ? getVideoUrl(movieUrl) : "";

  const trailer = movie.medias?.find((m) => m.type === "Trailer")?.url;
  const directTrailerUrl = trailer ? getVideoUrl(trailer) : "";

  return (
    <>
      <Helmet>
        <title>{`Watch ${movie?.title} - Eigakan`}</title>
      </Helmet>

      <div className="fixed inset-0 bg-black">
        {/* Video Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={showTrailer ? directTrailerUrl : directMovieUrl}
              className="absolute top-0 left-0"
              style={{
                width: "100%",
                height: "100%",
                minWidth: "160vh",
                minHeight: "90vh",
                border: "none",
                margin: "auto",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1.5)",
                transformOrigin: "center",
              }}
              allowFullScreen
              allow="autoplay; fullscreen"
            />
          </div>
        </div>

        {/* Controls Container */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            showControls ? "opacity-100" : "opacity-0"
          } pointer-events-none`}
        >
          {/* Top Bar - Transparent Design */}
          <div className="absolute top-0 left-0 right-0 py-3 px-6 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/40 to-transparent">
            <Link
              to={`/movie/${movieId}`}
              className="flex items-center gap-2 text-white/90 hover:text-[#FF009F] transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>

            <div className="flex items-center gap-4">
              {trailer && (
                <button
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="px-3 py-1 rounded-full bg-[#FF009F]/90 text-white hover:bg-[#FF009F] transition-all duration-300 text-xs font-medium"
                >
                  {showTrailer ? "Watch Movie" : "Watch Trailer"}
                </button>
              )}
              <Link
                to={`/movie/${movieId}`}
                className="flex items-center gap-1.5 text-white/90 hover:text-[#FF009F] transition-all duration-300"
              >
                <Info className="w-4 h-4" />
                <span className="text-xs font-medium">Info</span>
              </Link>
            </div>
          </div>

          {/* Bottom Info Panel */}
          <div
            className={`fixed left-0 right-0 bottom-0 transform ${
              showInfo ? "translate-y-0" : "translate-y-full"
            } transition-transform duration-500 ease-in-out bg-black/90 pointer-events-auto`}
          >
            {/* Handle Bar */}
            <div className="absolute -top-10 left-0 right-0 h-10 flex items-end justify-center group">
              <div
                onClick={() => setShowInfo(!showInfo)}
                className="w-32 h-10 bg-[#FF009F]/80 rounded-t-xl flex items-center justify-center cursor-pointer"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-0.5 bg-white/80 rounded-full" />
                  <span className="text-white/80 text-xs">Movie Info</span>
                </div>
              </div>
            </div>

            {/* Content Panel - Thêm scroll */}
            <div className="px-8 py-6 h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-8">
                {/* Existing Content */}
                <div className="space-y-6">
                  {/* Title Section */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]">
                        {movie.title}
                      </h1>
                      <h2 className="text-lg text-white/70">
                        {movie.originName}
                      </h2>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-3 py-1 bg-[#FF009F]/20 text-[#FF009F] rounded-full text-sm font-semibold">
                        HD
                      </span>
                      <span className="text-white/60 mt-2">{movie.nation}</span>
                    </div>
                  </div>

                  {/* Info Pills */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {[
                      movie.releaseYear,
                      `${movie.duration}m`,
                      `Rating: ${movie.rating}/10`,
                      movie.genreNames,
                      `Director: ${movie.director}`,
                    ].map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-white/10 text-white/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-white/70 leading-relaxed text-lg">
                    {movie.description}
                  </p>

                  {/* Cast Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#FF009F]">
                      Cast
                    </h3>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                      {movie.person?.map((actor) => (
                        <div
                          key={actor.id}
                          className="flex-none group transition-transform hover:scale-105"
                        >
                          <img
                            src={actor.picture}
                            alt={actor.name}
                            className="w-20 h-20 rounded-xl object-cover mb-2 group-hover:ring-2 ring-[#FF009F] transition-all"
                          />
                          <div className="text-center">
                            <div className="text-white font-medium">
                              {actor.name}
                            </div>
                            <div className="text-sm text-white/50">
                              {actor.job}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating Section - New */}
                <div className="space-y-4 border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-[#FF009F]">
                    Rating & Reviews
                  </h3>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        {movie.rating}/10
                      </div>
                      <div className="text-sm text-white/50">
                        Average Rating
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <button className="px-4 py-2 bg-[#FF009F]/20 hover:bg-[#FF009F]/30 rounded-full text-[#FF009F] text-sm font-medium transition-colors">
                          Rate This Movie
                        </button>
                        <span className="text-white/50 text-sm">
                          152 ratings
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Section - New */}
                <div className="space-y-6 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#FF009F]">
                      Comments
                    </h3>
                    <span className="text-white/50 text-sm">24 comments</span>
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-4">
                    <img
                      src="https://ui-avatars.com/api/?name=User&background=FF009F&color=fff"
                      alt="User"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#FF009F]"
                      />
                    </div>
                  </div>

                  {/* Hardcoded Comments */}
                  <div className="space-y-6">
                    {[
                      {
                        name: "John Doe",
                        avatar:
                          "https://ui-avatars.com/api/?name=JD&background=FF009F&color=fff",
                        comment:
                          "This movie is absolutely amazing! The visual effects are stunning and the story keeps you engaged throughout.",
                        time: "2 hours ago",
                        likes: 12,
                      },
                      {
                        name: "Alice Smith",
                        avatar:
                          "https://ui-avatars.com/api/?name=AS&background=FF009F&color=fff",
                        comment:
                          "Jim Carrey's performance is outstanding as always. Can't wait for the next one!",
                        time: "5 hours ago",
                        likes: 8,
                      },
                      {
                        name: "Robert Wilson",
                        avatar:
                          "https://ui-avatars.com/api/?name=RW&background=FF009F&color=fff",
                        comment:
                          "The action sequences are well choreographed. Keanu Reeves never disappoints.",
                        time: "1 day ago",
                        likes: 15,
                      },
                    ].map((comment, index) => (
                      <div key={index} className="flex gap-4">
                        <img
                          src={comment.avatar}
                          alt={comment.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">
                              {comment.name}
                            </h4>
                            <span className="text-white/30 text-sm">
                              {comment.time}
                            </span>
                          </div>
                          <p className="text-white/70">{comment.comment}</p>
                          <div className="flex items-center gap-4">
                            <button className="text-white/50 hover:text-[#FF009F] text-sm flex items-center gap-1">
                              <span>👍</span> {comment.likes}
                            </button>
                            <button className="text-white/50 hover:text-[#FF009F] text-sm">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WatchPage;
