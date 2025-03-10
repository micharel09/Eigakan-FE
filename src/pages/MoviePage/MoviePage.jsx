import React, { useEffect, useState, Suspense, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { PlayCircle, Clock, Calendar, Star, Users } from "lucide-react";
import { Modal, Input, notification, Button } from "antd";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import roomService from "../../apis/Room/room";
import { useSelector } from "react-redux";
import {
  PlayCircleOutlined,
  YoutubeOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

// Lazy load các components không cần thiết ngay lập tức
const SimilarMovies = React.lazy(() =>
  import("../../components/Movies/SimilarMovies")
);
const CastAndCrew = React.lazy(() =>
  import("../../components/Movies/CastAndCrew")
);

// Tách MovieHero thành component riêng để tránh re-render không cần thiết
const MovieHero = memo(
  ({ movie, onTrailerClick, onCreateRoom, onJoinRoom, onWatchNow }) => {
    const banner = movie.medias?.find((m) => m.type === "BANNER");
    const poster = movie.medias?.find((m) => m.type === "POSTER");
    const trailer = movie.medias?.find((m) => m.type === "TRAILER");

    return (
      <div className="relative w-full h-[70vh] overflow-hidden">
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

                <div className="flex gap-3">
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    size="large"
                    onClick={onWatchNow}
                    className="min-w-[120px] h-10 flex items-center justify-center gap-2 bg-[#FF009F] hover:bg-[#D1007F]"
                  >
                    Watch Now
                  </Button>
                  {trailer && (
                    <Button
                      icon={<YoutubeOutlined />}
                      size="large"
                      onClick={onTrailerClick}
                      className="min-w-[120px] h-10 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-none"
                    >
                      Watch Trailer
                    </Button>
                  )}
                  <Button
                    icon={<TeamOutlined />}
                    size="large"
                    onClick={onCreateRoom}
                    className="min-w-[120px] h-10 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-none"
                  >
                    Create Room
                  </Button>
                  <Button
                    icon={<UsergroupAddOutlined />}
                    size="large"
                    onClick={onJoinRoom}
                    className="min-w-[120px] h-10 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-none"
                  >
                    Join Room
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

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
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCreateRoomModalVisible, setIsCreateRoomModalVisible] =
    useState(false);
  const [isJoinRoomModalVisible, setIsJoinRoomModalVisible] = useState(false);
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          console.log("Movie data:", response.data);
          console.log("Movie medias:", response.data.medias);
          setMovie(response.data);
        } else {
          notification.error({
            message: "Failed to load movie",
            description: response.message || "Could not load movie details",
          });
        }
      } catch (error) {
        console.error("Error:", error);
        notification.error({
          message: "Failed to load movie",
          description: error.message || "Could not load movie details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  const handleCreateRoom = async () => {
    if (isCreatingRoom) return; // Prevent multiple calls

    try {
      setIsCreatingRoom(true);

      if (!isAuthenticated || !user) {
        notification.error({
          message: "Please login to create a room",
          description: "You need to be logged in to create a watch room",
        });
        return;
      }

      const filmMedia = movie.medias.find((m) => {
        return (
          m.type?.toUpperCase() === "FILMVIP" ||
          m.type?.toUpperCase() === "FILM" ||
          m.type?.toUpperCase() === "VIDEO" ||
          m.type?.toUpperCase() === "MOVIE"
        );
      });

      if (!user || !user.userId) {
        console.error("User data is missing:", user);
        notification.error({
          message: "User data missing",
          description: "Cannot create room without user ID",
        });
        return;
      }

      const roomData = {
        hostId: user.userId.replace(/^userid:\s*/i, ""),
        movieID: movieId,
        fileUrl: filmMedia?.url,
      };

      console.log("Creating room with data:", roomData);

      const response = await roomService.createRoom(roomData);
      if (response.success) {
        setIsCreateRoomModalVisible(false);
        navigate(`/watch-together/${movieId}?roomId=${response.data.id}`);
      }
    } catch (error) {
      console.error("Create room error:", error);
      notification.error({
        message: "Failed to create room",
        description: error.message || "Could not create room",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async () => {
    if (isJoining) return; // Ngăn chặn gọi lại nếu đang trong quá trình Join
    setIsJoining(true); // Đánh dấu là đang Join

    try {
      if (!isAuthenticated || !user) {
        notification.error({
          message: "Please login to join a room",
          description: "You need to be logged in to join a watch room",
        });
        return;
      }

      if (!roomId.trim()) {
        notification.error({
          message: "Room ID required",
          description: "Please enter a room ID",
        });
        return;
      }

      const response = await roomService.joinRoom({
        roomId: roomId.trim(),
        userId: user.id,
      });

      console.log("API Response:", response); // Debug API response

      if (response.success) {
        notification.success({ message: "Joined room successfully!" });
        setIsJoinRoomModalVisible(false);
        navigate(`/watch-together/${movieId}?roomId=${roomId}`);
      }
    } catch (error) {
      notification.error({
        message: "Failed to join room",
        description: error.message || "Could not join room",
      });
    } finally {
      setIsJoining(false); // Reset trạng thái sau khi xong
    }
  };

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
        onCreateRoom={() => setIsCreateRoomModalVisible(true)}
        onJoinRoom={() => setIsJoinRoomModalVisible(true)}
        onWatchNow={() => navigate(`/watch/${movieId}`)}
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

      {/* Create Room Modal */}
      <Modal
        title="Create Watch Room"
        open={isCreateRoomModalVisible}
        onOk={handleCreateRoom}
        onCancel={() => setIsCreateRoomModalVisible(false)}
        okText="Create"
        cancelText="Cancel"
        okButtonProps={{ loading: isCreatingRoom }}
        cancelButtonProps={{ disabled: isCreatingRoom }}
      >
        <p>Create a new room to watch this movie with friends?</p>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        title="Join Watch Room"
        open={isJoinRoomModalVisible}
        onOk={handleJoinRoom} // Chỉ gọi API khi bấm nút Join
        onCancel={() => {
          setRoomId("");
          setIsJoinRoomModalVisible(false);
        }}
        okText="Join"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="mt-4"
        />
      </Modal>
    </>
  );
};

export default MoviePage;
