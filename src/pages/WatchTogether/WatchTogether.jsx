import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { notification, Avatar, Tooltip, Button, Input, List, Grid } from "antd";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  X,
  Settings,
  ScreenShare,
} from "lucide-react";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import roomService from "../../apis/Room/room";
import ChatBox from "../ChatBox/ChatBox.jsx";
import { HubConnectionBuilder } from "@microsoft/signalr";
import webRTCService from "../../utils/webRTC";

const WatchTogether = () => {
  const { movieId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const connectionRef = useRef(null);
  const isConnectingRef = useRef(false);
  const user = useSelector((state) => state.auth.user);
  const [connection, setConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleLeaveRoom = async () => {
    try {
      // Cleanup local media streams
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Leave room via API
      await roomService.leaveRoom(roomId);

      // Leave SignalR room and stop connection
      if (connection) {
        try {
          await connection.invoke("LeaveRoom", roomId);
          await connection.stop();
        } catch (error) {
          console.error("Error leaving SignalR room:", error);
        }
      }

      // Cleanup WebRTC
      webRTCService.cleanup();

      notification.success({
        message: "Success",
        description: "You have left the room",
      });

      // Navigate back to movie page
      navigate(`/movie/${movieId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
      notification.error({
        message: "Error",
        description: "Failed to leave room: " + error.message,
      });
    }
  };

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
  }, [movieId]);

  useEffect(() => {
    if (!roomId || !user) return;

    // Kiểm tra xem có phải refresh page không
    const isRefresh =
      (window.performance.navigation &&
        window.performance.navigation.type === 1) ||
      window.performance.getEntriesByType("navigation")[0]?.type === "reload";

    if (isRefresh) {
      const handleRefresh = async () => {
        const confirmed = window.confirm(
          "Are you sure you want to refresh? You will leave the room."
        );

        if (confirmed) {
          try {
            // Cleanup local media streams
            if (localStream) {
              localStream.getTracks().forEach((track) => track.stop());
            }

            // Leave room via API
            await roomService.leaveRoom(roomId);

            // Cleanup WebRTC
            webRTCService.cleanup();

            // Redirect về MoviePage
            window.location.href = `/movie/${movieId}`;
          } catch (error) {
            console.error("Error during refresh cleanup:", error);
            // Vẫn redirect về MoviePage ngay cả khi có lỗi
            window.location.href = `/movie/${movieId}`;
          }
        }
      };

      handleRefresh();
      return;
    }

    const newConnection = new HubConnectionBuilder()
      .withUrl(`https://localhost:7192/roomHub?roomId=${roomId}`)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    // Handle back button and page navigation
    const handlePopState = (event) => {
      event.preventDefault();
      handleLeaveRoom();
    };

    window.addEventListener("popstate", handlePopState);

    newConnection
      .start()
      .then(() => {
        console.log("Connected to SignalR");

        newConnection
          .invoke(
            "JoinRoom",
            roomId,
            user.fullName,
            user.picture || "/default-avatar.png",
            user.id
          )
          .then(() => {
            console.log("Joined SignalR room:", roomId);
          })
          .catch(console.error);

        // Lắng nghe sự kiện UserLeft
        newConnection.on("UserLeft", (data) => {
          console.log("User left event received:", data);
          console.log("Current room users before update:", roomUsers);

          // Update room users list using user id
          setRoomUsers((prev) => {
            const updatedUsers = prev.filter((u) => u.id !== data.id);
            console.log("Updated room users:", updatedUsers);
            return updatedUsers;
          });

          // Add system message for user leaving
          const leaveMessage = {
            id: `leave-${Date.now()}`,
            text: `${data.userName} left the room`,
            sender: { userName: "System" },
            timestamp: new Date(),
            type: "system",
          };

          setMessages((prev) => [...prev, leaveMessage]);

          // Request updated participants list from server
          newConnection
            .invoke("RequestParticipants", roomId)
            .catch((error) =>
              console.error("Error requesting participants:", error)
            );
        });

        // Thêm sự kiện cập nhật danh sách người dùng từ server
        newConnection.on("UpdateParticipants", (participants) => {
          // Remove duplicates based on user id
          const uniqueParticipants = participants.filter(
            (participant, index, self) =>
              index === self.findIndex((p) => p.id === participant.id)
          );
          setRoomUsers(uniqueParticipants);
        });

        // Lắng nghe sự kiện UserJoined
        newConnection.on("UserJoined", (joinedUser) => {
          setRoomUsers((prev) => {
            // Remove any existing entries for this user
            const withoutUser = prev.filter((u) => u.id !== joinedUser.id);
            // Add the new user entry
            return [...withoutUser, joinedUser];
          });

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: `${joinedUser.userName} joined the room`,
              sender: { userName: "System" },
              timestamp: new Date(),
              type: "system",
            },
          ]);
        });

        // Lắng nghe sự kiện nhận tin nhắn
        newConnection.on("ReceiveMessage", (message) => {
          console.log("Received message:", message);
          // Chuyển đổi format từ backend sang frontend
          const formattedMessage = {
            id: message.id || Date.now().toString(),
            text: message.text,
            sender: message.sender,
            timestamp: new Date(message.timestamp),
          };
          console.log("Formatted message:", formattedMessage);

          // Kiểm tra xem tin nhắn đã tồn tại chưa
          setMessages((prev) => {
            // Nếu tin nhắn đã tồn tại (có cùng id), không thêm vào nữa
            if (prev.some((m) => m.id === formattedMessage.id)) {
              return prev;
            }
            return [...prev, formattedMessage];
          });
        });
      })
      .catch((error) => console.error("SignalR Connection Error:", error));

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [roomId, user]);

  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        console.log("Initializing WebRTC...");
        if (!videoRef.current) {
          console.error("Video ref not found");
          return;
        }

        const stream = await webRTCService.initializeMedia(
          !isVideoOff,
          !isMuted
        );
        console.log("Got media stream:", stream);
        setLocalStream(stream);

        // Set the stream to the video element
        videoRef.current.srcObject = stream;
        console.log("Set local video source");
      } catch (error) {
        console.error("Failed to initialize media devices:", error);
        notification.error({
          message: "Camera/Microphone Error",
          description:
            "Failed to access media devices. Please check your permissions and make sure no other application is using them.",
        });
      }
    };

    if (user && roomId) {
      initializeWebRTC();
    }

    return () => {
      if (localStream) {
        console.log("Cleaning up local stream");
        localStream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
      webRTCService.cleanup();
    };
  }, [user, roomId]);

  useEffect(() => {
    if (!connection) return;

    // Set up WebRTC event handlers
    webRTCService.onTrack = (userId, stream) => {
      setRemoteStreams((prev) => new Map(prev).set(userId, stream));

      const videoElement = document.getElementById(`video-${userId}`);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    };

    // Handle WebRTC signaling
    connection.on("InitiateCall", async (targetUserId) => {
      await webRTCService.initiateCall(targetUserId, connection);
    });

    connection.on("ReceiveOffer", async (userId, offer) => {
      await webRTCService.handleIncomingCall(userId, offer, connection);
    });

    connection.on("ReceiveAnswer", async (userId, answer) => {
      await webRTCService.handleAnswer(userId, answer);
    });

    connection.on("ReceiveIceCandidate", async (userId, candidate) => {
      await webRTCService.handleIceCandidate(userId, candidate);
    });

    connection.on("UserToggleAudio", (userId, isMuted) => {
      setRoomUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isMuted } : u))
      );
    });

    connection.on("UserToggleVideo", (userId, isVideoOff) => {
      setRoomUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isVideoOff } : u))
      );
    });

    return () => {
      connection.off("InitiateCall");
      connection.off("ReceiveOffer");
      connection.off("ReceiveAnswer");
      connection.off("ReceiveIceCandidate");
      connection.off("UserToggleAudio");
      connection.off("UserToggleVideo");
    };
  }, [connection]);

  const sendMessage = async (message) => {
    if (!connection || !message.trim() || !user || !roomId) return;

    try {
      console.log("Sending message:", {
        roomId,
        userName: user.fullName,
        message,
        avatar: user.picture,
      });

      // Gửi tin nhắn lên server và đợi server gửi lại qua ReceiveMessage
      await connection.invoke(
        "SendMessage",
        roomId,
        user.fullName,
        message,
        user.picture || "/default-avatar.png"
      );
    } catch (error) {
      console.error("Send Message Error:", error);
      notification.error({
        message: "Failed to send message",
        description: error.message,
      });
    }
  };

  const handleToggleAudio = async () => {
    try {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);

      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !newMutedState;
          console.log(`Audio track ${track.label} enabled:`, !newMutedState);
        });
      }

      webRTCService.toggleAudio(!newMutedState);
      await connection?.invoke("ToggleAudio", roomId, newMutedState);
    } catch (error) {
      console.error("Error toggling audio:", error);
      notification.error({
        message: "Error",
        description: "Failed to toggle audio: " + error.message,
      });
    }
  };

  const handleToggleVideo = async () => {
    try {
      const newVideoState = !isVideoOff;
      setIsVideoOff(newVideoState);

      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !newVideoState;
          console.log(`Video track ${track.label} enabled:`, !newVideoState);
        });
      }

      webRTCService.toggleVideo(!newVideoState);
      await connection?.invoke("ToggleVideo", roomId, newVideoState);
    } catch (error) {
      console.error("Error toggling video:", error);
      notification.error({
        message: "Error",
        description: "Failed to toggle video: " + error.message,
      });
    }
  };

  if (loading) return <Loading />;
  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
          <Button type="primary" href="/homescreen">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const movieUrl = movie.medias?.find((m) => m.type === "FILMVIP")?.url;

  return (
    <div className="fixed inset-0 bg-black flex pt-16">
      {/* Main Content - Movie and Participants */}
      <div className="flex-1 flex">
        {/* Movie Section */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="relative flex-1">
            <iframe
              src={movieUrl}
              className="w-full h-full"
              allowFullScreen
              frameBorder="0"
            />
          </div>

          {/* Controls Bar */}
          <div className="h-16 bg-gray-800 flex items-center justify-between px-4 border-t border-gray-700">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                <button
                  onClick={handleToggleAudio}
                  className="p-2 rounded-full hover:bg-gray-700"
                >
                  {isMuted ? (
                    <MicOff className="text-red-500" />
                  ) : (
                    <Mic className="text-white" />
                  )}
                </button>
              </Tooltip>
              <Tooltip
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                <button
                  onClick={handleToggleVideo}
                  className="p-2 rounded-full hover:bg-gray-700"
                >
                  {isVideoOff ? (
                    <VideoOff className="text-red-500" />
                  ) : (
                    <Video className="text-white" />
                  )}
                </button>
              </Tooltip>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                danger
                icon={<X size={16} />}
                onClick={handleLeaveRoom}
                className="hover:bg-red-600"
              >
                Leave Room
              </Button>
              <Button
                type="text"
                icon={<Settings className="text-white" />}
                className="text-white hover:bg-gray-700"
              >
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Participants Section */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
          <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
            <h3 className="text-white font-medium">
              Participants ({roomUsers.length})
            </h3>
          </div>

          {/* Video Grid */}
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2">
            {roomUsers.map((participant) => (
              <div
                key={participant.id}
                className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {participant.isVideoOff ? (
                    <Avatar
                      size={64}
                      src={participant.avatar || "/default-avatar.png"}
                    />
                  ) : (
                    <video
                      id={`video-${participant.id}`}
                      ref={participant.id === user.id ? videoRef : null}
                      autoPlay
                      playsInline
                      muted={participant.id === user.id}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm truncate">
                      {participant.userName}
                      {participant.id === user.id ? " (You)" : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      {participant.isMuted && (
                        <MicOff className="text-red-500 h-4 w-4" />
                      )}
                      {participant.isVideoOff && (
                        <VideoOff className="text-red-500 h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Toggle */}
          <div className="h-16 border-t border-gray-700 flex items-center justify-between px-4">
            <Button
              type="text"
              icon={<MessageSquare className="text-white" />}
              onClick={() => setShowChat(!showChat)}
              className="text-white hover:bg-gray-700"
            >
              Chat
            </Button>
          </div>
        </div>

        {/* Chat Section */}
        {showChat && (
          <div className="w-80 bg-gray-900 border-l border-gray-700">
            <ChatBox
              messages={messages}
              onSendMessage={sendMessage}
              currentUser={user}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchTogether;
