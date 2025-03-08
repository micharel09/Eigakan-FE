import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ChevronLeft, Info, Calendar, Clock } from "lucide-react";
import { Rate, notification } from "antd";
import moment from "moment";
import UserApi from "../../apis/User/user";
import ratingService from "../../apis/Movie/rating";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";

const WatchPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [commentInput, setCommentInput] = useState("");
  const [ratingValue, setRatingValue] = useState(movie?.userRating || 0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

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
    const fetchUserDetails = async () => {
      if (!isAuthenticated || !movie?.comments) return;
      setLoadingComments(true); // Bắt đầu loading

      try {
        const userIds = movie.comments.map((comment) => comment.createBy);
        const uniqueUserIds = [...new Set(userIds)];

        const userPromises = uniqueUserIds.map((id) =>
          UserApi.getUserDetail(id)
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
      } finally {
        setLoadingComments(false); // Kết thúc loading
      }
    };

    fetchUserDetails();
  }, [movie, isAuthenticated]); // Thêm isAuthenticated vào dependencies

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      setIsAuthenticated(!!token && !!user);
      setUserRole(role); // Cập nhật userRole từ localStorage
    };

    checkSession();
  }, []);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const response = await ratingService.createComment(commentInput, movieId);
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
        description: "Failed to post comment",
      });
    }
  };

  const handleRatingChange = async (value) => {
    setRatingValue(value);
    setSubmittingRating(true);
    try {
      const response = await ratingService.createMovieRating(value, movieId);
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
        description: "Failed to submit rating",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  const canRateAndComment = () => {
    const role = localStorage.getItem("role");
    return role === "VIP MEMBER" || role === "ADMIN" || role === "MANAGER";
  };

  // Sửa lại component UpgradeMessage để nhận thêm prop isAuthenticated
  const UpgradeMessage = ({ message, isAuthenticated }) => (
    <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 text-center">
      <p className="text-white/70">
        {isAuthenticated ? message : "Please login to access this feature"}
      </p>
      <Link
        to={isAuthenticated ? "/subscription-plans" : "/login"}
        className="text-[#FF009F] hover:text-[#D1007F] mt-2 inline-block"
      >
        {isAuthenticated ? "Upgrade Now" : "Login Now"}
      </Link>
    </div>
  );

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

  const movieUrl = movie.medias?.find((m) => m.type === "FILMVIP")?.url;
  const trailer = movie.medias?.find((m) => m.type === "TRAILER")?.url;

  const getVideoUrl = (url) => {
    if (!url) return "";
    // Nếu là URL từ Bunny CDN thì giữ nguyên
    if (url.includes("mediadelivery.net")) {
      return url;
    }
    // Nếu là URL khác (ví dụ YouTube) thì xử lý riêng
    return url;
  };

  const directMovieUrl = movieUrl ? getVideoUrl(movieUrl) : "";
  const directTrailerUrl = trailer ? getVideoUrl(trailer) : "";

  // Thêm hàm để xác định style cho video container
  const getVideoContainerStyle = () => {
    const role = localStorage.getItem("role");
    if (role === "MEMBER") {
      return {
        width: "70%",
        height: "80%",
        border: "none",
        margin: "auto",
        position: "absolute",
        top: "10%",
        left: "15%",
        transform: "none",
      };
    }
    return {
      width: "100%",
      height: "80%",
      border: "none",
      margin: "auto",
      position: "absolute",
      top: "10%",
      left: "0%",
      transform: "none",
    };
  };

  return (
    <>
      <Helmet>
        <title>{`Watch ${movie?.title} - Eigakan`}</title>
      </Helmet>

      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <iframe
              src={showTrailer ? directTrailerUrl : directMovieUrl}
              className="absolute top-0 left-0"
              style={getVideoContainerStyle()}
              allowFullScreen
              allow="autoplay; fullscreen"
              frameBorder="0"
            />
          </div>
        </div>

        {/* Controls Container */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            showControls ? "opacity-100" : "opacity-0"
          } pointer-events-none`}
        >
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

                  {/* Rating Pills - Đặt chung một hàng */}
                  <div className="flex items-center gap-4">
                    {/* IMDB Rating */}
                    <div className="flex items-center gap-3 bg-[#F6C700]/10 px-4 py-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="16"
                          viewBox="0 0 64 32"
                          fill="none"
                        >
                          <rect width="64" height="32" fill="#F6C700" />
                          <path d="M8 8H12V24H8V8Z" fill="black" />
                          <path
                            d="M16 8H21.6C25.4 8 27.2 10.4 27.2 13.6V18.4C27.2 21.6 25.4 24 21.6 24H16V8ZM21.6 20.8C23.2 20.8 23.6 19.6 23.6 18.4V13.6C23.6 12.4 23.2 11.2 21.6 11.2H19.6V20.8H21.6Z"
                            fill="black"
                          />
                          <path
                            d="M29.6 8H36.8L39.2 18.4L41.6 8H48.8V24H45.2V11.2L42.4 24H36L33.2 11.2V24H29.6V8Z"
                            fill="black"
                          />
                          <path d="M52 8H56V24H52V8Z" fill="black" />
                        </svg>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-[#F6C700]">
                          {movie.rating}
                        </span>
                        <span className="text-[#F6C700]/70 text-sm">/10</span>
                      </div>
                    </div>

                    {/* User Rating */}
                    <div className="flex items-center gap-3 bg-[#FF009F]/10 px-4 py-2 rounded-xl">
                      <div className="flex -space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(movie.userRating)
                                ? "text-[#FF009F]"
                                : "text-[#FF009F]/20"
                            }`}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-[#FF009F]">
                          {movie.userRating}
                        </span>
                        <span className="text-[#FF009F]/70 text-sm">/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Pills - Các thông tin khác */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {[
                      {
                        icon: <Calendar className="w-4 h-4" />,
                        text: movie.releaseYear,
                      },
                      {
                        icon: <Clock className="w-4 h-4" />,
                        text: `${movie.duration}m`,
                      },
                      {
                        text: movie.genreNames,
                        className: "bg-[#FF009F]/10 text-[#FF009F]",
                      },
                      {
                        text: `Director: ${movie.director}`,
                        className: "bg-white/10",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                          item.className || "bg-white/10"
                        }`}
                      >
                        {item.icon}
                        <span>{item.text}</span>
                      </div>
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
                        <Link
                          to={`/person/${actor.id}`}
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
                              {actor.job === "Diễn viên" ? "Actor" : actor.job}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                {canRateAndComment() ? (
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#FF009F]">
                        Rate This Movie
                      </h3>
                    </div>

                    <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-8 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-6">
                        {/* Current Rating Display */}
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-bold text-white">
                            {ratingValue || "?"}
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
                ) : (
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <UpgradeMessage
                      message="Upgrade your account to rate movies"
                      isAuthenticated={isAuthenticated}
                    />
                  </div>
                )}

                {/* Comments Section */}
                {isAuthenticated ? (
                  <div className="space-y-6 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#FF009F]">
                        Comments
                      </h3>
                      <span className="text-white/50 text-sm">
                        {movie.comments?.length || 0} comments
                      </span>
                    </div>

                    {/* Comment Input - Chỉ hiện khi là VIP */}
                    {canRateAndComment() ? (
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
                    ) : (
                      <UpgradeMessage
                        message="Upgrade your account to join the discussion"
                        isAuthenticated={isAuthenticated}
                      />
                    )}

                    {/* Comments List */}
                    <div className="space-y-6">
                      {loadingComments ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex items-center gap-2 text-[#FF009F]">
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading comments...</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {movie.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-4">
                              <img
                                src={
                                  userDetails[comment.createBy]?.picture ||
                                  `https://ui-avatars.com/api/?name=${userDetails[
                                    comment.createBy
                                  ]?.fullName?.charAt(
                                    0
                                  )}&background=FF009F&color=fff`
                                }
                                alt={userDetails[comment.createBy]?.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-white">
                                    {userDetails[comment.createBy]?.fullName}
                                  </h4>
                                  <span className="text-white/30 text-sm">
                                    {moment(comment.createDate).fromNow()}
                                  </span>
                                </div>
                                <p className="text-white/70">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(!movie.comments || movie.comments.length === 0) && (
                            <p className="text-center text-white/50">
                              No comments yet
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 text-center">
                      <p className="text-white/70">
                        Please login to view comments
                      </p>
                      <Link
                        to="/login"
                        className="text-[#FF009F] hover:text-[#D1007F] mt-2 inline-block"
                      >
                        Login Now
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WatchPage;
