import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { cloneDeep } from "lodash";

import {
  useWatchTogetherSocket,
  WatchTogetherSocketProvider,
} from "./providers/WatchTogetherSocketProvider";
import usePeer from "../../hooks/usePeer";
import useMediaStream from "../../hooks/useMediaStream";
import usePlayer from "../../hooks/usePlayer";
import roomService from "../../apis/Room/room";

import Player from "./components/Player";
import Bottom from "./components/Bottom";

const WatchTogetherContent = () => {
  const { movieId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const { socket, isConnected } = useWatchTogetherSocket();
  const { peer, myId } = usePeer(roomId);
  const { stream, error: streamError } = useMediaStream();
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
          label: t.label,
        }))
      );
      console.log(
        "Audio tracks:",
        stream.getAudioTracks().map((t) => ({
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
          label: t.label,
        }))
      );
    }
  }, [stream]);

  // Xử lý lỗi stream
  useEffect(() => {
    if (streamError) {
      console.error("Media stream error:", streamError);
    }
  }, [streamError]);

  // Separate current user from other users
  const otherPlayers = { ...nonHighlightedPlayers };
  const myPlayer = players[myId];

  // Xử lý kết nối người dùng mới
  useEffect(() => {
    if (!socket || !peer || !stream) return;

    const handleUserConnected = (newUser) => {
      console.log(`User connected in room with userId ${newUser}`);

      try {
        const call = peer.call(newUser, stream);

        call.on("stream", (incomingStream) => {
          console.log(`Incoming stream from ${newUser}`);

          // Log incoming stream details
          console.log("Incoming stream details:", {
            audioTracks: incomingStream.getAudioTracks().length,
            videoTracks: incomingStream.getVideoTracks().length,
            audioEnabled: incomingStream
              .getAudioTracks()
              .some((t) => t.enabled),
            videoEnabled: incomingStream
              .getVideoTracks()
              .some((t) => t.enabled),
          });

          setPlayers((prev) => ({
            ...prev,
            [newUser]: {
              url: incomingStream,
              muted: false, // Mặc định không mute người dùng mới
              playing: true,
            },
          }));

          setUsers((prev) => ({
            ...prev,
            [newUser]: call,
          }));
        });

        call.on("error", (err) => {
          console.error(`Error in call with user ${newUser}:`, err);
        });

        call.on("close", () => {
          console.log(`Call with user ${newUser} was closed`);
        });
      } catch (err) {
        console.error(`Error calling user ${newUser}:`, err);
      }
    };

    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [peer, setPlayers, socket, stream]);

  // Xử lý các sự kiện từ người dùng khác
  useEffect(() => {
    if (!socket) return;

    const handleToggleAudio = (userId) => {
      console.log(`User with id ${userId} toggled audio`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          copy[userId].muted = !copy[userId].muted;
        }
        return { ...copy };
      });
    };

    const handleToggleVideo = (userId) => {
      console.log(`User with id ${userId} toggled video`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          copy[userId].playing = !copy[userId].playing;
        }
        return { ...copy };
      });
    };

    const handleUserLeave = (userId) => {
      console.log(`User ${userId} is leaving the room`);
      users[userId]?.close();
      const playersCopy = cloneDeep(players);
      if (playersCopy[userId]) {
        delete playersCopy[userId];
      }
      setPlayers(playersCopy);
    };

    socket.on("user-toggle-audio", handleToggleAudio);
    socket.on("user-toggle-video", handleToggleVideo);
    socket.on("user-leave", handleUserLeave);

    return () => {
      socket.off("user-toggle-audio", handleToggleAudio);
      socket.off("user-toggle-video", handleToggleVideo);
      socket.off("user-leave", handleUserLeave);
    };
  }, [players, setPlayers, socket, users]);

  // Xử lý cuộc gọi đến
  useEffect(() => {
    if (!peer || !stream) return;

    const handleIncomingCall = (call) => {
      const { peer: callerId } = call;
      console.log(`Incoming call from ${callerId}`);

      try {
        call.answer(stream);

        call.on("stream", (incomingStream) => {
          console.log(`Incoming stream from ${callerId}`);

          // Log incoming stream details
          console.log("Incoming stream details:", {
            audioTracks: incomingStream.getAudioTracks().length,
            videoTracks: incomingStream.getVideoTracks().length,
            audioEnabled: incomingStream
              .getAudioTracks()
              .some((t) => t.enabled),
            videoEnabled: incomingStream
              .getVideoTracks()
              .some((t) => t.enabled),
          });

          setPlayers((prev) => ({
            ...prev,
            [callerId]: {
              url: incomingStream,
              muted: false, // Mặc định không mute người dùng mới
              playing: true,
            },
          }));

          setUsers((prev) => ({
            ...prev,
            [callerId]: call,
          }));
        });

        call.on("error", (err) => {
          console.error(`Error in call with user ${callerId}:`, err);
        });

        call.on("close", () => {
          console.log(`Call with user ${callerId} was closed`);
        });
      } catch (err) {
        console.error(`Error answering call from ${callerId}:`, err);
      }
    };

    peer.on("call", handleIncomingCall);

    return () => {
      peer.off("call", handleIncomingCall);
    };
  }, [peer, setPlayers, stream]);

  // Thêm đoạn code này vào useEffect để xử lý khi stream thay đổi
  useEffect(() => {
    if (!stream || !myId) return;

    console.log("Setting up initial stream state");

    // Đảm bảo tất cả tracks đều được bật khi khởi tạo
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    // Bật tất cả video tracks
    videoTracks.forEach((track) => {
      track.enabled = true;
      console.log(
        `Initial video track ${track.label} enabled: ${track.enabled}`
      );
    });

    // Bật tất cả audio tracks
    audioTracks.forEach((track) => {
      track.enabled = true;
      console.log(
        `Initial audio track ${track.label} enabled: ${track.enabled}`
      );
    });

    // Cập nhật state players với trạng thái đúng
    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        url: stream,
        muted: false,
        playing: true,
      },
    }));

    // Thông báo cho các người dùng khác về trạng thái video/audio của bạn
    if (socket && isConnected) {
      // Gửi trạng thái ban đầu
      socket.emit("user-initial-media-state", {
        userId: myId,
        roomId,
        videoEnabled: true,
        audioEnabled: true,
      });
    }
  }, [stream, myId, socket, isConnected, roomId]);

  const toggleMyVideoVisibility = () => {
    setShowMyVideo(!showMyVideo);
  };

  // Handle leaving room with API call
  const handleLeaveRoom = async () => {
    if (isLeaving) return;

    try {
      setIsLeaving(true);

      // First disconnect from WebRTC and socket
      disconnectFromRoom();

      // Then call the API to leave the room
      if (roomId) {
        await roomService.leaveRoom(roomId);
        console.log("Successfully left room via API");
      }

      // Navigate back to home page
      navigate("/");
    } catch (error) {
      console.error("Error leaving room:", error);

      // Still navigate away even if API call fails
      navigate("/");
    } finally {
      setIsLeaving(false);
    }
  };

  // Thêm kiểm tra null/undefined cho myPlayer
  const isMuted = myPlayer?.muted || false;
  const isPlaying = myPlayer?.playing || false;

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden">
      {/* Right panel - other participants' videos */}
      {Object.keys(otherPlayers).length > 0 && (
        <div className="absolute flex flex-col overflow-y-auto z-20 space-y-3 w-[220px] h-[calc(100vh-40px-80px)] right-5 top-5">
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
        <div className="absolute left-5 bottom-20 z-30 rounded-lg overflow-hidden shadow-lg w-[180px] h-[135px] border-2 border-white/20">
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

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 py-3">
        <Bottom
          muted={isMuted}
          playing={isPlaying}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          leaveRoom={handleLeaveRoom}
          showMyVideo={showMyVideo}
          toggleMyVideoVisibility={toggleMyVideoVisibility}
          isLeaving={isLeaving}
        />
      </div>
    </div>
  );
};

const WatchTogether = () => {
  return (
    <WatchTogetherSocketProvider>
      <WatchTogetherContent />
    </WatchTogetherSocketProvider>
  );
};

export default WatchTogether;
