import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ChevronLeft, Info } from "lucide-react";
import ReactPlayer from "react-player";
import movieService from "../../apis/Movie/movie";
import Loading from "../../components/Loading/Loading";
import { Comment } from "@ant-design/compatible";
import { Modal, Rate, notification } from "antd";
import moment from "moment";

const WatchPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [commentInput, setCommentInput] = useState("");
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(movie?.userRating || 0);
  const [submittingRating, setSubmittingRating] = useState(false);

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

  useEffect(() => {
    const fetchUserNames = async () => {
      if (!movie?.comments) return;

      try {
        const userIds = movie.comments.map((comment) => comment.createBy);
        const uniqueUserIds = [...new Set(userIds)];

        const userPromises = uniqueUserIds.map((id) =>
          movieService.getUserById(id)
        );
        const users = await Promise.all(userPromises);

        const userNameMap = {};
        users.forEach((response) => {
          if (response.success) {
            userNameMap[response.data.id] = response.data.fullName;
          }
        });

        setUserNames(userNameMap);
      } catch (error) {
        console.error("Error fetching user names:", error);
      }
    };

    fetchUserNames();
  }, [movie]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!movie?.comments) return;

      try {
        const userIds = movie.comments.map((comment) => comment.createBy);
        const uniqueUserIds = [...new Set(userIds)];

        const userPromises = uniqueUserIds.map((id) =>
          movieService.getUserById(id)
        );
        const users = await Promise.all(userPromises);

        const userDetailsMap = {};
        users.forEach((response) => {
          if (response.success) {
            userDetailsMap[response.data.id] = {
              fullName: response.data.fullName,
              picture: response.data.picture,
            };
          }
        });

        setUserDetails(userDetailsMap);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, [movie]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const response = await movieService.createComment(commentInput, movieId);
      if (response.success) {
        const movieResponse = await movieService.getMovieById(movieId);
        if (movieResponse.success) {
          setMovie(movieResponse.data);
        }
        setCommentInput("");
        notification.success({
          message: "Success",
          description: "Comment posted successfully!",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to post comment",
      });
    }
  };

  const handleRatingChange = async (value) => {
    setRatingValue(value);
    setSubmittingRating(true);
    try {
      const response = await movieService.createMovieRating(value, movieId);
      if (response.success) {
        const movieResponse = await movieService.getMovieById(movieId);
        if (movieResponse.success) {
          setMovie(movieResponse.data);
        }
        notification.success({
          message: "Success",
          description: "Rating submitted successfully!",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to submit rating",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

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

                {/* Rating Section */}
                <div className="space-y-4 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#FF009F]">
                      Rate This Movie
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">Average:</span>
                      <span className="text-white font-semibold">
                        {movie.rating || 0}/5
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-8 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-6">
                      {/* Current Rating Display */}
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-white">
                          {movie.userRating || "?"}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm text-white/70">
                            Your rating
                          </span>
                          <span className="text-xs text-white/50">
                            out of 5
                          </span>
                        </div>
                      </div>

                      {/* Rating Stars - Cải tiến */}
                      <div className="relative">
                        <Rate
                          value={ratingValue}
                          onChange={handleRatingChange}
                          disabled={submittingRating}
                          className="flex gap-2"
                          character={({ index, value }) => (
                            <div className="relative cursor-pointer transition-transform hover:scale-110">
                              {/* Star Border - Luôn hiển thị */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className="w-10 h-10 text-white/20"
                                strokeWidth="1"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              {/* Star Fill - Chỉ hiển thị khi được chọn */}
                              <div
                                className="absolute inset-0 transition-opacity"
                                style={{
                                  opacity: value > index ? 1 : 0,
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-10 h-10 text-[#FF009F]"
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        />
                      </div>

                      {/* Status Message */}
                      <div className="text-center">
                        {submittingRating ? (
                          <div className="flex items-center gap-2 text-[#FF009F]">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          <div className="text-white/70 font-medium">
                            {ratingValue ? (
                              <>
                                <span className="text-[#FF009F]">
                                  {ratingValue} stars
                                </span>
                                <span className="mx-2">•</span>
                                <span>Thanks for rating!</span>
                              </>
                            ) : (
                              <span className="animate-pulse">
                                Click the stars to rate
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Stats */}
                <div className="flex justify-center gap-8 text-sm text-white/50">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.89-8.9c-1.78-.59-2.64-.96-2.64-1.9 0-1.02 1.11-1.39 1.81-1.39 1.31 0 1.79.99 1.9 1.34l1.58-.67c-.15-.44-.82-1.91-2.66-2.23V5h-1.75v1.26c-2.6.56-2.62 2.85-2.62 2.96 0 2.27 2.25 2.91 3.35 3.31 1.58.56 2.28 1.07 2.28 2.03 0 1.13-1.05 1.61-1.98 1.61-1.82 0-2.34-1.87-2.4-2.09l-1.66.67c.63 2.19 2.28 2.78 3.02 2.96V19h1.75v-1.24c.52-.09 3.02-.59 3.02-3.22.01-1.39-.4-2.61-2-3.44z" />
                    </svg>
                    <span>{movie.ratingCount || 0} ratings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.5 8.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S11.17 7 12 7s1.5.67 1.5 1.5zM13 17v-5h-2v5h2zm-1-6.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm8-3c0-4.87-3.13-9-8-9s-8 4.13-8 9c0 3.63 2.58 6.84 6 7.72V22h4v-3.28c3.42-.88 6-4.09 6-7.72z" />
                    </svg>
                    <span>Rate to see recommendations</span>
                  </div>
                </div>

                {/* Comments Section - Sửa lại phần này */}
                <div className="space-y-6 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#FF009F]">
                      Comments
                    </h3>
                    <span className="text-white/50 text-sm">
                      {movie.comments?.length || 0} comments
                    </span>
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-4">
                    <img
                      src={
                        userDetails[movie.comments[0]?.createBy]?.picture ||
                        "https://ui-avatars.com/api/?name=User&background=FF009F&color=fff"
                      }
                      alt="User"
                      className="w-10 h-10 rounded-full"
                    />
                    <form onSubmit={handleCommentSubmit} className="flex-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#FF009F]"
                        />
                        <button
                          type="submit"
                          disabled={!commentInput.trim()}
                          className="px-4 py-2 bg-[#FF009F] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D1007F] transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Comments List từ API */}
                  <div className="space-y-6">
                    {movie.comments?.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <img
                          src={
                            userDetails[comment.createBy]?.picture ||
                            `https://ui-avatars.com/api/?name=${
                              userDetails[comment.createBy]?.fullName?.charAt(
                                0
                              ) || "U"
                            }&background=FF009F&color=fff`
                          }
                          alt={
                            userDetails[comment.createBy]?.fullName || "User"
                          }
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">
                              {userDetails[comment.createBy]?.fullName ||
                                "Unknown User"}
                            </h4>
                            <span className="text-white/30 text-sm">
                              {moment(comment.createDate).fromNow()}
                            </span>
                          </div>
                          <p className="text-white/70">{comment.content}</p>
                          <div className="flex items-center gap-4">
                            <button className="text-white/50 hover:text-[#FF009F] text-sm">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!movie.comments || movie.comments.length === 0) && (
                      <p className="text-center text-white/50">
                        No comments yet
                      </p>
                    )}
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
