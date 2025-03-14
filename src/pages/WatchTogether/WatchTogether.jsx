import React, { useEffect, useState, useRef, useCallback } from "react";
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
  const [currentTime, setCurrentTime] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const iframeRef = useRef(null);
  const isLeavingRoom = useRef(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [lastReadTime, setLastReadTime] = useState(new Date());
  const [unreadMessages, setUnreadMessages] = useState(0);
  const videoContainerRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraContainerRef = useRef(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [participantStreams, setParticipantStreams] = useState({});
  const [movieUrl, setMovieUrl] = useState("");
  const [cameraError, setCameraError] = useState(null);
  const cameraInitAttemptsRef = useRef(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioAnalyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const animationFrameRef = useRef(null);
  const videoElementRef = useRef(null);

  // Thêm các ref để theo dõi trạng thái
  const isVideoOffRef = useRef(false);
  const isMutedRef = useRef(false);
  const localStreamRef = useRef(null);

  // Cập nhật các ref khi state thay đổi
  useEffect(() => {
    isVideoOffRef.current = isVideoOff;
  }, [isVideoOff]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

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
    } finally {
      isLeavingRoom.current = false;
    }
  };

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
    if (!roomId || !user) return;

    const handleBeforeUnload = (e) => {
      if (!isLeavingRoom.current) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave the room?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId || !user) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl(`https://localhost:7192/roomHub?roomId=${roomId}`)
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
            user.id
          )
          .then(() => {
            console.log("Joined SignalR room:", roomId);

            // Request peer connections after a successful join
            setTimeout(() => {
              if (newConnection.state === "Connected") {
                console.log("Requesting peer connections after joining room");
                newConnection
                  .invoke("RequestPeerConnections", roomId)
                  .catch((error) =>
                    console.error(
                      "Error requesting initial peer connections:",
                      error
                    )
                  );
              }
            }, 2000);
          })
          .catch((error) => {
            console.error("Error joining room:", error);
            notification.error({
              message: "Error",
              description: "Failed to join room: " + error.message,
            });
          });

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

        // Lắng nghe sự kiện UserJoined
        newConnection.on("UserJoined", (joinedUser) => {
          // Only add if not the current user
          if (joinedUser.id === user.id) return;

          console.log("User joined event received:", joinedUser);

          // Kiểm tra xem user đã tồn tại trong roomUsers chưa
          setRoomUsers((prev) => {
            if (prev.some((u) => u.id === joinedUser.id)) {
              return prev;
            }
            console.log("Adding new user to room:", joinedUser);

            // Attempt to initiate a connection with this new user
            if (localStream && newConnection.state === "Connected") {
              setTimeout(() => {
                console.log(
                  `Attempting to connect with new user: ${joinedUser.userName}`
                );
                newConnection
                  .invoke("RequestPeerConnections", roomId)
                  .catch((error) =>
                    console.error(
                      `Error requesting connections with new users:`,
                      error
                    )
                  );
              }, 1500);
            }

            return [...prev, joinedUser];
          });

          // Kiểm tra trùng lặp tin nhắn
          setMessages((prev) => {
            const joinMessage = {
              id: `join-${joinedUser.id}-${Date.now()}`,
              text: `${joinedUser.userName} joined the room`,
              sender: { userName: "System" },
              timestamp: new Date(),
              type: "system",
            };

            // Kiểm tra xem tin nhắn tương tự đã tồn tại trong 5 giây gần đây chưa
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

        // Lắng nghe sự kiện nhận tin nhắn
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
      })
      .catch((error) => console.error("SignalR Connection Error:", error));

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [roomId, user]);

  // Add debug logging to see participant data
  useEffect(() => {
    console.log("Current room users:", roomUsers);
    console.log("Current participant streams:", participantStreams);
  }, [roomUsers, participantStreams]);

  const handleToggleAudio = async () => {
    try {
      console.log("Toggling audio state");
      const newMutedState = !isMuted;

      // Cập nhật state trước
      setIsMuted(newMutedState);
      // Cập nhật ref ngay lập tức để tránh race condition
      isMutedRef.current = newMutedState;

      // Cập nhật trạng thái track nếu có stream
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !newMutedState;
          console.log(`Audio track ${track.label} enabled: ${!newMutedState}`);
        });

        // Cập nhật WebRTC
        webRTCService.toggleAudio(!newMutedState);
      } else {
        console.warn("No local stream available when toggling audio");
      }

      // Thông báo cho server về trạng thái micro
      if (connection && connection.state === "Connected") {
        try {
          await connection.invoke("ToggleAudio", roomId, newMutedState);
          console.log("Server notified of audio state change");
        } catch (error) {
          console.error("Error notifying server of audio state:", error);
        }
      }

      // Khởi tạo lại audio analyser nếu bật micro
      if (!newMutedState) {
        setupAudioAnalyser();
      } else {
        // Dừng phân tích âm thanh nếu tắt micro
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setAudioLevel(0);
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  // Thêm useEffect để gắn stream vào video element khi stream thay đổi
  useEffect(() => {
    if (!localStream || !videoElementRef.current) return;

    console.log("Setting srcObject for video element");
    try {
      // Gắn stream vào video element
      videoElementRef.current.srcObject = localStream;

      // Đảm bảo video element được phát
      const playVideo = () => {
        console.log("Attempting to play video");
        const playPromise = videoElementRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing video:", error);
            // Nếu lỗi là do người dùng chưa tương tác với trang, thử lại sau 1 giây
            if (error.name === "NotAllowedError") {
              console.log(
                "Play not allowed, will retry after user interaction"
              );
            } else {
              // Đối với các lỗi khác, thử lại sau 1 giây
              setTimeout(playVideo, 1000);
            }
          });
        }
      };

      playVideo();
    } catch (error) {
      console.error("Error setting srcObject:", error);
    }

    // Cleanup function
    return () => {
      if (videoElementRef.current && videoElementRef.current.srcObject) {
        videoElementRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  // Sửa lại hàm initCamera để xử lý tốt hơn khi khởi tạo lại camera
  const initCamera = useCallback(async () => {
    console.log("Initializing camera with webRTCService");
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      // Dừng tất cả các tracks hiện tại nếu có
      if (localStreamRef.current) {
        console.log("Stopping existing tracks before reinitializing camera");
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped existing ${track.kind} track: ${track.label}`);
        });
      }

      // Sử dụng webRTCService để khởi tạo media
      const stream = await webRTCService.initializeMedia(
        true, // Luôn yêu cầu video khi khởi tạo
        !isMutedRef.current
      );

      console.log("Camera stream obtained successfully:", stream);
      console.log("Video tracks:", stream.getVideoTracks());
      console.log("Audio tracks:", stream.getAudioTracks());

      // Lưu stream vào state và ref
      setLocalStream(stream);
      localStreamRef.current = stream;

      // Nếu trạng thái hiện tại là video off, disable các video tracks
      if (isVideoOffRef.current && stream.getVideoTracks().length > 0) {
        console.log("Video is off, disabling video tracks");
        stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      // Nếu trạng thái hiện tại là muted, disable các audio tracks
      if (isMutedRef.current && stream.getAudioTracks().length > 0) {
        console.log("Audio is muted, disabling audio tracks");
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      setCameraReady(true);

      // Nếu không muted, thiết lập audio analyser
      if (!isMutedRef.current) {
        setupAudioAnalyser();
      }
    } catch (error) {
      console.error("Error initializing camera:", error);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Camera access denied. Please allow camera access and refresh the page."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError(
          "No camera found. Please connect a camera and refresh the page."
        );
      } else if (error.name === "NotReadableError") {
        setCameraError(
          "Camera is in use by another application. Please close other applications using the camera."
        );
      } else {
        setCameraError(`Could not initialize camera: ${error.message}`);
      }

      setIsVideoOff(true);
      isVideoOffRef.current = true;
    } finally {
      setIsCameraLoading(false);
    }
  }, []); // Không có dependencies

  const handleToggleVideo = async () => {
    try {
      const newVideoState = !isVideoOff;
      console.log("Toggling video state to:", newVideoState);

      // Cập nhật state
      setIsVideoOff(newVideoState);
      // Cập nhật ref ngay lập tức để tránh race condition
      isVideoOffRef.current = newVideoState;

      if (newVideoState) {
        // Tắt camera: Dừng hoàn toàn các video tracks
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          videoTracks.forEach((track) => {
            console.log(`Stopping video track: ${track.label}`);
            track.stop(); // Dừng hoàn toàn track thay vì chỉ disable
          });
        }
      } else {
        // Bật camera: Khởi tạo lại camera
        console.log("Reinitializing camera");
        await initCamera();
      }

      // Thông báo cho server
      try {
        if (connection && connection.state === "Connected") {
          await connection.invoke("ToggleVideo", roomId, newVideoState);
          console.log("Server notified of video state change");
        }
      } catch (error) {
        console.error("Error notifying server of video state:", error);
      }
    } catch (error) {
      console.error("Error in handleToggleVideo:", error);
    }
  };

  // Cập nhật hàm setupAudioAnalyser để phát hiện âm thanh chính xác hơn
  const setupAudioAnalyser = () => {
    if (!localStream) return;

    // Kiểm tra xem có audio track không
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn("No audio tracks available for audio analysis");
      return;
    }

    try {
      // Dừng phân tích âm thanh hiện tại nếu có
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const audioSource = audioContext.createMediaStreamSource(localStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // Tăng độ phân giải để phát hiện chính xác hơn
      analyser.smoothingTimeConstant = 0.2; // Giảm smoothing để phản ứng nhanh hơn với sự thay đổi
      audioSource.connect(analyser);

      audioAnalyserRef.current = analyser;
      audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Thêm biến để theo dõi thời gian im lặng
      let silenceTimer = 0;
      const SILENCE_THRESHOLD = 10; // Giảm ngưỡng để dễ phát hiện âm thanh hơn
      const MAX_SILENCE_FRAMES = 2; // Giảm số frame im lặng để phản ứng nhanh hơn

      const updateAudioLevel = () => {
        if (!audioAnalyserRef.current || !audioDataRef.current) return;

        audioAnalyserRef.current.getByteFrequencyData(audioDataRef.current);
        const values = audioDataRef.current;
        let sum = 0;

        // Tập trung vào dải tần số giọng nói (300-3000Hz)
        // Với fftSize = 2048, chúng ta có 1024 giá trị tần số
        // Dải tần số giọng nói khoảng từ 10-100 trong mảng này
        const voiceRangeStart = 10;
        const voiceRangeEnd = 100;

        for (let i = voiceRangeStart; i < voiceRangeEnd; i++) {
          sum += values[i];
        }

        const average = sum / (voiceRangeEnd - voiceRangeStart);

        // Log mức âm thanh để debug
        if (average > 1) {
          console.log("Audio level detected:", average);
        }

        // Áp dụng ngưỡng và làm mượt sự thay đổi
        if (average > SILENCE_THRESHOLD) {
          // Có âm thanh, đặt lại bộ đếm im lặng
          silenceTimer = 0;

          // Cập nhật mức âm thanh với smoothing
          setAudioLevel((prev) => {
            // Tăng nhanh hơn khi phát hiện âm thanh
            return prev * 0.2 + average * 0.8;
          });
        } else {
          // Không có âm thanh, tăng bộ đếm im lặng
          silenceTimer++;

          if (silenceTimer > MAX_SILENCE_FRAMES) {
            // Đã im lặng đủ lâu, giảm mức âm thanh về 0 nhanh chóng
            setAudioLevel((prev) => prev * 0.3);
          }
        }

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();

      console.log("Audio analyser setup complete");
    } catch (error) {
      console.error("Error setting up audio analyser:", error);
      // Đặt mức âm thanh về 0 nếu có lỗi
      setAudioLevel(0);
    }
  };

  // Cập nhật hàm renderAudioIndicator để không hiển thị thanh xanh ngang
  const renderAudioIndicator = () => {
    // Không hiển thị gì cả, chỉ dùng viền xanh bao quanh video
    return null;
  };

  // Thêm hàm sendMessage nếu chưa có
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

  // Thêm hàm renderParticipantCount nếu chưa có
  const renderParticipantCount = () => {
    return (
      <div className="mb-4 text-white">
        <h3 className="text-lg font-medium mb-2">
          Participants ({roomUsers.length})
        </h3>
      </div>
    );
  };

  // Thêm hàm renderParticipantVideos nếu chưa có
  const renderParticipantVideos = () => {
    return (
      <div className="space-y-4">
        {roomUsers.map((participant) => (
          <div key={participant.id} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
              <img
                src={participant.avatar || "/default-avatar.png"}
                alt={participant.userName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">
                {participant.userName}{" "}
                {participant.id === user?.id ? "(You)" : ""}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {participant.isMuted && (
                  <span className="text-red-500">
                    <MicOff size={12} />
                  </span>
                )}
                {participant.isVideoOff && (
                  <span className="text-red-500">
                    <VideoOff size={12} />
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Thêm useEffect để khởi tạo lại audio analyser khi localStream thay đổi
  useEffect(() => {
    if (localStream && !isMutedRef.current) {
      // Đợi một chút để đảm bảo stream đã được thiết lập đầy đủ
      const timer = setTimeout(() => {
        setupAudioAnalyser();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [localStream]);

  // Cập nhật phần render camera trong UI
  return (
    <div className="fixed inset-0 bg-black flex pt-16">
      {/* Main Content - Movie and Participants */}
      <div className="flex-1 flex">
        {/* Movie Section */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="flex-1 relative">
            <iframe
              id="video-iframe"
              src={movieUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              style={{ border: "none" }}
              ref={iframeRef}
            ></iframe>
          </div>

          {/* Camera Section */}
          <div className="h-36 bg-gray-800 border-t border-gray-700 p-2">
            <div className="flex items-center justify-between h-full">
              {/* Camera Preview */}
              <div
                className="relative w-44 h-full bg-gray-900 rounded-lg overflow-hidden"
                id="camera-container"
              >
                {isCameraLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : isVideoOff || !localStream ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <img
                      src={user?.picture || "/default-avatar.png"}
                      alt="User Avatar"
                      className="w-16 h-16 rounded-full"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative w-full h-full ${
                      audioLevel > 1
                        ? "ring-4 ring-green-500 shadow-lg shadow-green-500/50"
                        : ""
                    }`}
                    style={{
                      transition: "all 0.1s ease",
                    }}
                  >
                    <video
                      ref={videoElementRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{
                        transform: "scaleX(-1)",
                      }}
                    />
                  </div>
                )}

                {/* Hiển thị lỗi camera nếu có */}
                {cameraError && !isCameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="text-center p-2">
                      <div className="text-red-500 text-sm mb-1">
                        Camera Error
                      </div>
                      <p className="text-white text-xs mb-2">{cameraError}</p>
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                        onClick={() => {
                          setCameraError(null);
                          initCamera();
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs truncate max-w-[100px]">
                      {user?.fullName || "You"}
                    </span>
                    <div className="flex items-center gap-1">
                      {isMuted && (
                        <span className="text-red-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 1l22 22"></path>
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                            <path d="M12 19v4"></path>
                            <path d="M8 23h8"></path>
                          </svg>
                        </span>
                      )}
                      {isVideoOff && (
                        <span className="text-red-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                            <path d="M1 1l22 22"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Chỉ báo âm thanh */}
                {renderAudioIndicator()}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 ml-4">
                <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                  <button
                    onClick={handleToggleAudio}
                    className={`p-3 rounded-full ${
                      isMuted
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5 text-white" />
                    ) : (
                      <Mic className="h-5 w-5 text-white" />
                    )}
                  </button>
                </Tooltip>
                <Tooltip
                  title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                >
                  <button
                    onClick={handleToggleVideo}
                    className={`p-3 rounded-full ${
                      isVideoOff
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {isVideoOff ? (
                      <VideoOff className="h-5 w-5 text-white" />
                    ) : (
                      <Video className="h-5 w-5 text-white" />
                    )}
                  </button>
                </Tooltip>

                {/* Nút khởi động lại camera */}
                <Tooltip title="Restart Camera">
                  <button
                    onClick={() => {
                      setCameraError(null);
                      initCamera();
                    }}
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="h-5 w-5 text-white" />
                  </button>
                </Tooltip>
              </div>

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Biểu tượng người dùng */}
                <Tooltip
                  title={
                    showParticipants ? "Hide Participants" : "Show Participants"
                  }
                >
                  <button
                    onClick={() => {
                      setShowParticipants(!showParticipants);
                      setShowChat(false);
                    }}
                    className={`p-3 rounded-full ${
                      showParticipants
                        ? "bg-gray-600 hover:bg-gray-500"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    <Users className="h-5 w-5 text-white" />
                  </button>
                </Tooltip>

                {/* Biểu tượng chat */}
                <Tooltip title={showChat ? "Hide Chat" : "Show Chat"}>
                  <button
                    onClick={() => {
                      setShowChat(!showChat);
                      setShowParticipants(false);
                      if (!showChat) {
                        setUnreadMessages(0);
                        setLastReadTime(new Date());
                      }
                    }}
                    className={`p-3 rounded-full ${
                      showChat
                        ? "bg-gray-600 hover:bg-gray-500"
                        : "bg-gray-700 hover:bg-gray-600"
                    } relative`}
                  >
                    <MessageSquare className="h-5 w-5 text-white" />
                    {!showChat && unreadMessages > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      </div>
                    )}
                  </button>
                </Tooltip>

                {/* Nút Leave Room */}
                <Tooltip title="Leave Room">
                  <button
                    onClick={handleLeaveRoom}
                    className="p-3 rounded-full bg-red-500 hover:bg-red-600"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Participants and Chat Section - Chỉ hiển thị khi được bật */}
        {(showParticipants || showChat) && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            {/* Tiêu đề */}
            <div className="py-3 px-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                {showChat ? "Chat" : "Participants"}
              </h3>
              <button
                onClick={() => {
                  setShowChat(false);
                  setShowParticipants(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {showChat ? (
                <ChatBox
                  messages={messages}
                  onSendMessage={sendMessage}
                  currentUser={user}
                />
              ) : (
                <div className="p-4">
                  {renderParticipantCount()}
                  {renderParticipantVideos()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchTogether;
