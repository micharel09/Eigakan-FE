import { useEffect, useState, useRef } from "react";
import { Avatar, Tooltip, Button, notification, List } from "antd";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  X,
  SkipForward,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import movieService from "../../apis/Movie/movie";
import roomService from "../../apis/Room/room";
import ChatBox from "../ChatBox/ChatBox";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { cloneDeep } from "lodash";
import {
  useWatchTogetherSocket,
  WatchTogetherSocketProvider,
} from "./providers/WatchTogetherSocketProvider";
import usePeer from "../../hooks/usePeer";
import useMediaStream from "../../hooks/useMediaStream";
import usePlayer from "../../hooks/usePlayer";
import Player from "./components/Player";
import Bottom from "./components/Bottom";
import CopySection from "./components/CopySection";

const WatchTogetherPage = () => {
  const { movieId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [connection, setConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const isLeavingRoom = useRef(false);
  const [lastReadTime, setLastReadTime] = useState(new Date());
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [participantStreams, setParticipantStreams] = useState({});
  const [movieUrl, setMovieUrl] = useState("");
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef(null);
  const [isHost, setIsHost] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showParticipantGrid, setShowParticipantGrid] = useState(false);
  const [showOtherVideos, setShowOtherVideos] = useState(true);

  const { socket, isConnected } = useWatchTogetherSocket();
  const { peer, myId } = usePeer(roomId);
  const { stream } = useMediaStream();
  const {
    players,
    setPlayers,
    playerHighlighted,
    nonHighlightedPlayers,
    toggleAudio,
    toggleVideo,
    leaveRoom: disconnectFromRoom,
  } = usePlayer(myId, roomId, peer);

  const [users, setUsers] = useState({});
  const [showMyVideo, setShowMyVideo] = useState(true);

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          setMovie(response.data);
          // Set the movie URL
          const mediaUrl =
            response.data.medias?.find((m) => m.type === "FILMVIP")?.url ||
            response.data.medias?.find((m) => m.type === "FILM")?.url ||
            response.data.medias?.find((m) => m.type === "VIDEO")?.url;
          if (mediaUrl) {
            setMovieUrl(mediaUrl);
          } else {
            console.error("No valid media URL found for this movie");
            notification.error({
              message: "Media Error",
              description: "No valid media URL found for this movie",
            });
          }
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
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Cập nhật state với user từ localStorage
    }
  }, []);

  //signalR
  useEffect(() => {
    if (!roomId || !user) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl(
        `https://eigakan2222-001-site1.jtempurl.com/roomHub?roomId=${roomId}`
      )
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

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
            user.userId
          )
          .then(() => {
            console.log("Joined SignalR room:", roomId);
          })
          .catch((error) => {
            console.error("Error joining room:", error);
            notification.error({
              message: "Error",
              description: "Failed to join room: " + error.message,
            });
          });

        //=================================================================
        // Lắng nghe sự kiện UserJoined
        newConnection.on("UserJoined", (joinedUser) => {
          if (joinedUser.id === user.id) return;

          // ✅ Cập nhật danh sách người dùng
          setRoomUsers((prev) => {
            if (prev.some((u) => u.id === joinedUser.id)) {
              return prev;
            }

            console.log("Adding new user to room:", joinedUser);
            return [...prev, joinedUser];
          });

          // Chỉ cập nhật host nếu host hiện tại đã rời phòng
          setIsHost((prevIsHost) => {
            if (prevIsHost) {
              console.log("👑 Host hiện tại không đổi:", prevIsHost);
              return prevIsHost; // Giữ nguyên host
            }
            console.log("🔄 Cập nhật host mới:", joinedUser.isHost);
            return joinedUser.isHost;
          });

          const joinMessage = {
            id: `join-${joinedUser.id}-${Date.now()}`,
            text: `${joinedUser.userName} joined the room ${
              joinedUser.isHost ? "(Host)" : ""
            }`,
            sender: { userName: "System" },
            timestamp: new Date(),
            type: "system",
          };

          setMessages((prev) => {
            const recentDuplicate = prev.some(
              (msg) =>
                msg.type === "system" &&
                msg.text === joinMessage.text &&
                new Date(msg.timestamp).getTime() > Date.now() - 5000
            );

            if (recentDuplicate) {
              return prev;
            }
            return [...prev, joinMessage];
          });
        });

        //=================================================================
        // Lắng nghe sự kiện UserLeft
        newConnection.on("UserLeft", (data) => {
          console.log("User left event received:", data);

          // Update room users list using user id
          setRoomUsers((prev) => {
            const updatedUsers = prev.filter((u) => u.id !== data.id);
            console.log("Updated room users after left:", updatedUsers);
            return updatedUsers;
          });

          // Also clean up any streams for this user
          setParticipantStreams((prev) => {
            const newStreams = { ...prev };
            if (newStreams[data.id]) {
              console.log(`Removing stream for departed user: ${data.id}`);
              delete newStreams[data.id];
            }
            return newStreams;
          });

          // Remove video element and container for this user
          try {
            const videoElement = document.getElementById(`video-${data.id}`);
            if (videoElement) {
              videoElement.srcObject = null;
            }

            const container = document.getElementById(
              `video-container-${data.id}`
            );
            if (container) {
              container.remove();
            }
          } catch (error) {
            console.error("Error removing video elements:", error);
          }

          // Add system message for user leaving
          const leaveMessage = {
            id: `leave-${Date.now()}`,
            text: `${data.userName} left the room`,
            sender: { userName: "System" },
            timestamp: new Date(),
            type: "system",
          };

          setMessages((prev) => [...prev, leaveMessage]);
        });

        //=================================================================
        // Thêm sự kiện cập nhật danh sách người dùng từ server
        newConnection.on("UpdateParticipants", (participants) => {
          console.log("Received participant update:", participants);

          // Remove duplicates based on user id or connectionId
          const uniqueParticipants = [];
          const addedIds = new Set();
          const addedNames = new Set();

          participants.forEach((participant) => {
            // Skip if undefined or null
            if (!participant) return;

            // Try to get a stable ID (either userId or connection Id)
            const stableId = participant.userId || participant.id;
            const userName = participant.userName;

            // Skip if we've already added this user by ID or name
            if (!stableId || addedIds.has(stableId) || addedNames.has(userName))
              return;

            addedIds.add(stableId);
            addedNames.add(userName);
            uniqueParticipants.push(participant);
          });

          console.log("Filtered to unique participants:", uniqueParticipants);
          setRoomUsers(uniqueParticipants);

          // Check if there are new participants we need to connect with
          if (localStream) {
            const previousUserIds = new Set(roomUsers.map((u) => u.id));
            const newUsers = uniqueParticipants.filter(
              (u) => !previousUserIds.has(u.id) && u.id !== user?.id
            );

            if (newUsers.length > 0) {
              console.log(
                "Detected new users, will request connections:",
                newUsers.map((u) => u.userName)
              );

              // Set a small delay to ensure participants are stored first
              setTimeout(() => {
                if (connection.state === "Connected") {
                  console.log("Requesting peer connections with new users");
                  connection
                    .invoke("RequestPeerConnections", roomId)
                    .catch((error) =>
                      console.error(
                        "Error requesting peer connections with new users:",
                        error
                      )
                    );
                }
              }, 1000);
            }
          }
        });

        //=================================================================
        // Thông báo hostchanged
        newConnection.on("HostChanged", (data) => {
          // Cập nhật trạng thái host dựa trên UserId mới
          setIsHost(data.UserId === user.id);
          console.log("🔄 Updated isHost:", data.UserId === user.id);

          setMessages((prev) => {
            const hostMessage = {
              id: `host-${data.UserId}-${Date.now()}`,
              text: `${data.message}`,
              sender: { userName: "System" },
              timestamp: new Date(),
              type: "system",
            };

            // Kiểm tra trùng lặp trong vòng 5 giây gần đây
            const recentDuplicate = prev.some(
              (msg) =>
                msg.type === "system" &&
                msg.text === hostMessage.text &&
                new Date(msg.timestamp).getTime() > Date.now() - 5000
            );

            if (recentDuplicate) {
              return prev;
            }
            return [...prev, hostMessage];
          });
        });

        //=================================================================
        // sự kiện nhận tin nhắn
        newConnection.on("ReceiveMessage", (message) => {
          console.log("Received message:", message);
          const messageTime = new Date(message.timestamp);
          const formattedMessage = {
            id: message.id || Date.now().toString(),
            text: message.text,
            sender: message.sender,
            timestamp: messageTime,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === formattedMessage.id)) {
              return prev;
            }
            return [...prev, formattedMessage];
          });

          // Kiểm tra điều kiện để hiển thị notification:
          // 1. Chat đang đóng
          // 2. Tin nhắn mới hơn lần đọc cuối cùng
          // 3. Người gửi không phải là người dùng hiện tại
          if (
            !showChat &&
            messageTime > lastReadTime &&
            message.sender.userName !== user.fullName
          ) {
            setUnreadMessages((prev) => prev + 1);
          }
        });

        //=================================================================
        // sự kiện play/pause từ host
        newConnection.on("SyncPlayPause", (data) => {
          if (playerRef.current) {
            if (data.action === "play") {
              playerRef.current.play();
              console.log("🎬 Sync: Playing video");
            } else if (data.action === "pause") {
              playerRef.current.pause();
              notification.info({
                message: "Success",
                description: "Host has paused the video",
              });
              console.log("⏸ Sync: Stoping video");
            }
          }
        });
      })
      .catch((error) => console.error("SignalR Connection Error:", error));

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [roomId, user]);

  // Debug logs
  useEffect(() => {
    console.log("Current room users:", roomUsers);
    console.log("Current participant streams:", participantStreams);
  }, [roomUsers, participantStreams]);

  //Khởi tạo player khi `movieUrl` thay đổi
  useEffect(() => {
    if (!iframeRef.current) return;

    const handleLoad = () => {
      console.log("✅ Iframe loaded:", iframeRef.current);

      try {
        playerRef.current = new playerjs.Player(iframeRef.current);
      } catch (error) {
        console.error("❌ Error initializing Player.js:", error);
      }

      if (playerRef.current) {
        playerRef.current.on("ready", () => {
          console.log("🎬 Player is ready!");
          setIsPlayerReady(true);
        });
      }
    };

    iframeRef.current.addEventListener("load", handleLoad);

    return () => {
      iframeRef.current?.removeEventListener("load", handleLoad);
      playerRef.current = null;
      setIsPlayerReady(false); // Reset khi unmount
    };
  }, [movieUrl]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) {
      console.log("⏳ Player chưa sẵn sàng, đợi chút...");
      return;
    }

    console.log("🔥 Host status changed:", isHost);

    if (isHost) {
      console.log("👑 You are the host! Enabling controls...");
      playerRef.current.on("play", () => {
        console.log("▶️ Video is playing");
        connection
          .invoke("SyncPlayPause", { action: "play" })
          .catch((err) => console.error(err));
      });

      playerRef.current.on("pause", () => {
        console.log("⏸ Video is paused");
        connection
          .invoke("SyncPlayPause", { action: "pause" })
          .catch((err) => console.error(err));
      });

      playerRef.current.on("seeked", (time) =>
        console.log("⏩ Seeked to:", time)
      );
    } else {
      console.log("❌ Not a host, disabling controls...");
    }
  }, [isHost, isPlayerReady]);

  //Host gửi thời gian hiện tại
  useEffect(() => {
    if (!isHost || !isPlayerReady || !connection) return;

    console.log("🚀 Bắt đầu đồng bộ thời gian...");

    const syncTime = () => {
      if (playerRef.current) {
        playerRef.current.getCurrentTime((time) => {
          console.log("⏳ Gửi thời gian hiện tại:", time);
          connection.invoke("SyncTime", { currentTime: time });
        });
      }
    };

    // Gửi ngay lập tức khi có người mới vào
    syncTime();

    // Nếu interval đã tồn tại, không cần tạo mới
    let interval = null;

    if (!interval) {
      interval = setInterval(syncTime, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHost, isPlayerReady]);

  // Nhận thời gian từ host và đồng bộ
  useEffect(() => {
    if (!isPlayerReady) return;

    const handleSyncTime = (data) => {
      console.log("⏳ Nhận thời gian từ host:", data.currentTime);

      if (!playerRef.current) return;

      // Kiểm tra xem player có đang pause không
      playerRef.current.getPaused((isPaused) => {
        if (isPaused) return; // Nếu đang pause thì không đồng bộ

        playerRef.current.getCurrentTime((current) => {
          const diff = Math.abs(current - data.currentTime);

          if (diff > 0.5) {
            // Nếu lệch hơn 0.5s thì mới đồng bộ
            console.log("⏩ Đồng bộ thời gian với host:", data.currentTime);
            notification.info({
              message: "Success",
              description: "Auto synced with host",
            });
            playerRef.current.setCurrentTime(data.currentTime);
          }
        });
      });
    };

    connection.on("SyncTime", handleSyncTime);

    return () => {
      connection.off("SyncTime", handleSyncTime);
    };
  }, [isPlayerReady, connection]);

  const sendMessage = async (text) => {
    if (!connection || !text.trim()) return;

    try {
      await connection.invoke(
        "SendMessage",
        roomId,
        user.fullName,
        text,
        user.picture || "/default-avatar.png"
      );
    } catch (error) {
      console.error("Error sending message:", error);
      notification.error({
        message: "Error",
        description: "Failed to send message: " + error.message,
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (isLeavingRoom.current) return;
    isLeavingRoom.current = true;

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
    } finally {
      isLeavingRoom.current = false;
    }
  };

  const handleSync = () => {
    if (connection) {
      connection
        .invoke("RequestCurrentTime", roomId)
        .catch((err) => console.error("❌ Sync Error:", err));
    }
  };

  //skip video
  const handleSeek10Minutes = () => {
    if (playerRef.current) {
      playerRef.current.getCurrentTime((seconds) => {
        const newTime = seconds + 600;
        console.log("⏩ Seeking to:", newTime);
        playerRef.current.setCurrentTime(newTime);
      });
    }
  };
  //=================================================================
  //màn hình khách tham gia
  const renderParticipantVideos = () => {
    return (
      <List
        className="participants-list"
        itemLayout="horizontal"
        dataSource={roomUsers}
        renderItem={(participant) => (
          <List.Item className="border-b border-gray-700 py-3">
            <div className="flex items-center w-full">
              <Avatar
                src={
                  participant.avatar || "/placeholder.svg?height=40&width=40"
                }
                size={40}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="text-white font-medium">
                  {participant.userName}
                  {participant.id === user?.id && " (You)"}
                </div>
                <div className="flex items-center mt-1 text-gray-400 text-xs">
                  {participant.isMuted ? (
                    <MicOff size={14} className="text-red-500 mr-1" />
                  ) : (
                    <Mic size={14} className="text-green-500 mr-1" />
                  )}
                  {participant.isVideoOff ? (
                    <VideoOff size={14} className="text-red-500 ml-2 mr-1" />
                  ) : (
                    <Video size={14} className="text-green-500 ml-2 mr-1" />
                  )}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    );
  };
  //=================================================================

  // Debug stream
  useEffect(() => {
    if (stream) {
      console.log("Stream in WatchTogether:", stream);
      console.log(
        "Video tracks:",
        stream.getVideoTracks().map((t) => ({
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        }))
      );
    }
  }, [stream]);

  // Separate current user from other users
  const otherPlayers = { ...nonHighlightedPlayers };
  const myPlayer = players[myId];

  useEffect(() => {
    if (!socket || !peer || !stream) return;
    const handleUserConnected = (newUser) => {
      console.log(`user connected in room with userId ${newUser}`);

      const call = peer.call(newUser, stream);

      call.on("stream", (incomingStream) => {
        console.log(`incoming stream from ${newUser}`);
        setPlayers((prev) => ({
          ...prev,
          [newUser]: {
            url: incomingStream,
            muted: true,
            playing: true,
          },
        }));

        setUsers((prev) => ({
          ...prev,
          [newUser]: call,
        }));
      });
    };
    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [peer, setPlayers, socket, stream]);

  useEffect(() => {
    if (!socket) return;

    const handleToggleAudio = (data) => {
      console.log(
        `user with id ${data.userId} toggled audio to ${data.isMuted}`
      );
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[data.userId]) {
          copy[data.userId].muted = data.isMuted;
        }
        return { ...copy };
      });
    };

    const handleToggleVideo = (data) => {
      console.log(
        `user with id ${data.userId} toggled video to ${data.isVideoOff}`
      );
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[data.userId]) {
          copy[data.userId].playing = !data.isVideoOff;
        }
        return { ...copy };
      });
    };

    // Xử lý khi nhận danh sách participants với trạng thái
    const handleRoomParticipants = (data) => {
      console.log("Received room participants with states:", data.participants);

      // Cập nhật trạng thái cho mỗi participant
      data.participants.forEach((participant) => {
        if (participant.id !== myId && players[participant.id]) {
          setPlayers((prev) => ({
            ...prev,
            [participant.id]: {
              ...prev[participant.id],
              muted: participant.isMuted || false,
              playing: !(participant.isVideoOff || false),
            },
          }));
        }
      });
    };

    socket.on("user-toggle-audio", handleToggleAudio);
    socket.on("user-toggle-video", handleToggleVideo);
    socket.on("room-participants", handleRoomParticipants);

    return () => {
      socket.off("user-toggle-audio", handleToggleAudio);
      socket.off("user-toggle-video", handleToggleVideo);
      socket.off("room-participants", handleRoomParticipants);
    };
  }, [players, setPlayers, socket, myId]);

  useEffect(() => {
    if (!peer || !stream) return;
    peer.on("call", (call) => {
      const { peer: callerId } = call;
      call.answer(stream);

      call.on("stream", (incomingStream) => {
        console.log(`incoming stream from ${callerId}`);
        setPlayers((prev) => ({
          ...prev,
          [callerId]: {
            url: incomingStream,
            muted: true,
            playing: true,
          },
        }));

        setUsers((prev) => ({
          ...prev,
          [callerId]: call,
        }));
      });
    });
  }, [peer, setPlayers, stream]);

  useEffect(() => {
    if (!stream || !myId) return;
    console.log(`setting my stream ${myId}`);
    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        url: stream,
        muted: true,
        playing: true,
      },
    }));
  }, [myId, setPlayers, stream]);

  const toggleMyVideoVisibility = () => {
    setShowMyVideo(!showMyVideo);
  };

  // Thêm kiểm tra null/undefined cho myPlayer
  const isMuted = myPlayer?.muted || false;
  const isPlaying = myPlayer?.playing || false;

  // Thêm hàm để toggle hiển thị
  const toggleOtherVideos = () => {
    setShowOtherVideos(!showOtherVideos);
  };

  //=================================================================
  return (
    <div className="fixed inset-0 bg-black flex flex-col pt-16">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col relative">
          {/* Video Player */}
          <div className="flex-1 relative bg-black">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <iframe
                id="bunnyPlayer"
                src={movieUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ border: "none" }}
                ref={iframeRef}
              ></iframe>
            )}

            {/* Participant Videos Grid */}
            {showParticipantGrid && (
              <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 z-10 max-w-[40%]">
                {roomUsers
                  .filter(
                    (participant) =>
                      participant.id !== user?.id &&
                      participant.userName !== user?.fullName
                  )
                  .map((participant) => (
                    <div
                      key={participant.id}
                      className="w-32 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                    >
                      {participantStreams[participant.id] ? (
                        <ParticipantVideo
                          participant={participant}
                          participantStream={participantStreams[participant.id]}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <div className="flex flex-col items-center">
                            <Avatar
                              src={
                                participant.avatar ||
                                "/placeholder.svg?height=40&width=40"
                              }
                              size={40}
                              className="mb-1"
                            />
                            <span className="text-white text-xs truncate max-w-[80px]">
                              {participant.userName}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              {participant.isMuted && (
                                <MicOff size={10} className="text-red-500" />
                              )}
                              {participant.isVideoOff && (
                                <VideoOff size={10} className="text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="bg-gray-900 p-4 border-t border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left Controls - Room ID */}
              <div className="flex items-center gap-3">
                {roomId && <CopySection roomId={roomId} inline={true} />}
              </div>

              {/* Center Controls - Video Playback */}
              <div className="flex items-center gap-3">
                <Tooltip title="Skip 10 seconds">
                  <button
                    onClick={handleSeek10Minutes}
                    className="p-2 bg-blue-500 text-white"
                  >
                    ⏩ Skip 10 minustes
                  </button>
                </Tooltip>

                <Tooltip title="Sync Video">
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<RefreshCw className="h-4 w-4" />}
                    onClick={handleSync}
                    className="flex items-center justify-center"
                  />
                </Tooltip>
              </div>

              {/* Right Controls - Chat & Participants */}
              <div className="flex items-center gap-3">
                {/* Participants Button */}
                <Tooltip
                  title={
                    showParticipants ? "Hide Participants" : "Show Participants"
                  }
                >
                  <Button
                    type={showParticipants ? "primary" : "default"}
                    shape="circle"
                    icon={<Users className="h-4 w-4" />}
                    onClick={() => {
                      setShowParticipants(!showParticipants);
                      setShowChat(false);
                    }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Participant Count Badge */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                      {roomUsers.length}
                    </span>
                  </Button>
                </Tooltip>

                {/* Thêm nút mới để hiển thị/ẩn camera của người dùng khác */}
                <Tooltip
                  title={
                    showOtherVideos
                      ? "Hide Other Cameras"
                      : "Show Other Cameras"
                  }
                >
                  <Button
                    type={showOtherVideos ? "primary" : "default"}
                    shape="circle"
                    icon={
                      showOtherVideos ? (
                        <Video className="h-4 w-4" />
                      ) : (
                        <VideoOff className="h-4 w-4" />
                      )
                    }
                    onClick={toggleOtherVideos}
                    className="relative flex items-center justify-center"
                  />
                </Tooltip>

                {/* Chat Button */}
                <Tooltip title={showChat ? "Hide Chat" : "Show Chat"}>
                  <Button
                    type={showChat ? "primary" : "default"}
                    shape="circle"
                    icon={<MessageSquare className="h-4 w-4" />}
                    onClick={() => {
                      setShowChat(!showChat);
                      setShowParticipants(false);
                      if (!showChat) {
                        setUnreadMessages(0);
                        setLastReadTime(new Date());
                      }
                    }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Unread Messages Badge */}
                    {!showChat && unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </Button>
                </Tooltip>

                {/* Leave Room Button */}
                <Tooltip title="Leave Room">
                  <Button
                    danger
                    type="primary"
                    shape="circle"
                    icon={<X className="h-4 w-4" />}
                    onClick={handleLeaveRoom}
                    className="flex items-center justify-center"
                  />
                </Tooltip>

                {/* Toggle Participant Grid Button */}
                <Button
                  onClick={() => setShowParticipantGrid(!showParticipantGrid)}
                  className="ml-2"
                >
                  {showParticipantGrid ? "Hide Grid" : "Show Grid"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Chat or Participants */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            {/* Sidebar Header */}
            <div className="py-3 px-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
              <h3 className="text-lg font-medium text-white">
                {showChat ? "Chat" : "Participants"}
              </h3>
              <Button
                type="text"
                icon={<X className="h-4 w-4 text-gray-400" />}
                onClick={() => {
                  setShowChat(false);
                  setShowParticipants(false);
                }}
                className="text-gray-400 hover:text-white"
              />
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {showChat ? (
                <ChatBox
                  messages={messages}
                  onSendMessage={sendMessage}
                  currentUser={user}
                />
              ) : (
                <div className="p-4">
                  <div className="mb-4 text-white">
                    <h3 className="text-lg font-medium mb-2">
                      Participants ({roomUsers.length})
                    </h3>
                  </div>
                  {renderParticipantVideos()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right panel - other participants' videos */}
      {Object.keys(otherPlayers).length > 0 && showOtherVideos && (
        <div
          className={`absolute flex flex-col overflow-y-auto z-20 space-y-3 w-[220px] max-h-[60vh] right-5 top-20 ${
            showChat || showParticipants ? "right-[340px]" : "right-5"
          }`}
        >
          {Object.keys(otherPlayers).map((playerId) => {
            if (!otherPlayers[playerId]) return null;

            const { url, muted, playing } = otherPlayers[playerId];
            return (
              <Player
                key={playerId}
                url={url}
                muted={muted || false}
                playing={playing || false}
                isActive={false}
              />
            );
          })}
        </div>
      )}

      {/* Your video - bottom left corner */}
      {myPlayer && showMyVideo && (
        <div className="absolute left-5 bottom-32 z-30 rounded-lg overflow-hidden shadow-lg w-[180px] h-[135px] border-2 border-white/20">
          <Player
            url={myPlayer.url}
            muted={myPlayer.muted || false}
            playing={myPlayer.playing || false}
            isActive={false}
            isMe={true}
          />
          <button
            className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1"
            onClick={toggleMyVideoVisibility}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Controls - Đặt ở chính giữa màn hình */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 p-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-full ${
              isMuted
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isMuted ? "Turn on mic" : "Turn off mic"}
            disabled={isLeaving}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-2 rounded-full ${
              !isPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={!isPlaying ? "Turn on camera" : "Turn off camera"}
            disabled={isLeaving}
          >
            {!isPlaying ? (
              <VideoOff className="h-5 w-5 text-white" />
            ) : (
              <Video className="h-5 w-5 text-white" />
            )}
          </button>

          <button
            onClick={toggleMyVideoVisibility}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
            title={showMyVideo ? "Hide my video" : "Show my video"}
            disabled={isLeaving}
          >
            {showMyVideo ? (
              <Eye className="h-5 w-5 text-white" />
            ) : (
              <EyeOff className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const WatchTogether = () => {
  return (
    <WatchTogetherSocketProvider>
      <WatchTogetherPage />
    </WatchTogetherSocketProvider>
  );
};

export default WatchTogether;
