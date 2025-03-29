import { useEffect, useState } from "react";
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

      // Thiết lập kết nối dữ liệu trước
      const dataConnection = peer.connect(newUser, {
        reliable: true,
        serialization: "json",
      });

      dataConnection.on("open", () => {
        console.log("Data connection opened with:", newUser);
        dataConnection.send({ type: "greeting", from: myId });
      });

      // Log thông tin về stream hiện tại trước khi gọi
      console.log("My stream before calling:", {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioEnabled:
          stream.getAudioTracks().length > 0
            ? stream.getAudioTracks()[0].enabled
            : false,
      });

      // Đảm bảo audio track được bật trước khi gọi
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          // Đảm bảo audio track được bật
          track.enabled = true;
          console.log(
            `Ensuring audio track ${track.label} is enabled before call`
          );
        });
      } else {
        console.warn("No audio tracks found before call!");
        // Thử thêm audio track nếu không có
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((audioStream) => {
            const audioTrack = audioStream.getAudioTracks()[0];
            if (audioTrack) {
              stream.addTrack(audioTrack);
              console.log("Added new audio track to stream before call");
            }
          })
          .catch((err) =>
            console.error("Failed to add audio track before call:", err)
          );
      }

      // Tạo options cho cuộc gọi với cấu hình tối ưu cho audio
      const callOptions = {
        metadata: {
          userId: myId,
          roomId: roomId,
        },
        sdpTransform: (sdp) => {
          // Log SDP để debug
          console.log("Original SDP:", sdp);

          // Đảm bảo audio được ưu tiên trong SDP
          // Không thay đổi SDP, chỉ log để debug
          return sdp;
        },
      };

      // Đợi một chút để đảm bảo kết nối dữ liệu được thiết lập
      setTimeout(() => {
        const call = peer.call(newUser, stream, callOptions);
        console.log("Calling user with my stream:", call);

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
    const handleToggleAudio = (userId) => {
      console.log(`user with id ${userId} toggled audio`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          copy[userId].muted = !copy[userId].muted;
        }
        return { ...copy };
      });
    };

    const handleToggleVideo = (userId) => {
      console.log(`user with id ${userId} toggled video`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          copy[userId].playing = !copy[userId].playing;
        }
        return { ...copy };
      });
    };

    const handleUserLeave = (userId) => {
      console.log(`user ${userId} is leaving the room`);
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

  // Thêm state để theo dõi trạng thái audio context
  const [audioActivated, setAudioActivated] = useState(false);

  // Thêm hàm để kích hoạt audio
  const activateAudio = () => {
    try {
      // Tạo và kích hoạt audio context
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      audioContext.resume().then(() => {
        console.log("Audio context activated by user");
        setAudioActivated(true);

        // Phát âm thanh test
        const oscillator = audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = 440;
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);

        // Đảm bảo tất cả video elements đều được unmute nếu cần
        document.querySelectorAll("video").forEach((video) => {
          if (!video.muted && video.paused) {
            video.play().catch((e) => console.error("Error playing video:", e));
          }
        });
      });
    } catch (e) {
      console.error("Error activating audio:", e);
    }
  };

  // Thêm một hàm để kiểm tra và đồng bộ trạng thái audio
  const syncAudioState = useCallback(() => {
    console.log("Syncing audio state for all players");

    // Đồng bộ trạng thái audio của bản thân
    if (players[myId] && players[myId].url) {
      const myAudioTracks = players[myId].url.getAudioTracks();
      const shouldBeEnabled = !players[myId].muted;

      myAudioTracks.forEach((track) => {
        if (track.enabled !== shouldBeEnabled) {
          track.enabled = shouldBeEnabled;
          console.log(
            `Fixed my audio track enabled state to ${shouldBeEnabled}`
          );
        }
      });
    }

    // Đồng bộ trạng thái audio của người khác
    Object.keys(players).forEach((userId) => {
      if (userId !== myId && players[userId] && players[userId].url) {
        const audioTracks = players[userId].url.getAudioTracks();
        const shouldBeEnabled = !players[userId].muted;

        audioTracks.forEach((track) => {
          if (track.enabled !== shouldBeEnabled) {
            track.enabled = shouldBeEnabled;
            console.log(
              `Fixed remote audio track for ${userId} enabled state to ${shouldBeEnabled}`
            );
          }
        });

        // Đồng bộ trạng thái muted của video elements
        document.querySelectorAll("video").forEach((video) => {
          if (video.srcObject === players[userId].url) {
            if (video.muted !== players[userId].muted) {
              video.muted = players[userId].muted;
              console.log(
                `Fixed video muted state for ${userId} to ${players[userId].muted}`
              );
            }
          }
        });
      }
    });
  }, [players, myId]);

  // Gọi hàm này định kỳ để đảm bảo trạng thái luôn đồng bộ
  useEffect(() => {
    const interval = setInterval(syncAudioState, 5000);
    return () => clearInterval(interval);
  }, [syncAudioState]);

  // Thêm nút để người dùng có thể đồng bộ thủ công
  const syncButton = (
    <button
      onClick={syncAudioState}
      className="absolute top-4 right-4 z-50 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
    >
      Đồng bộ âm thanh
    </button>
  );

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden">
      {/* Nút kích hoạt âm thanh */}
      {!audioActivated && (
        <button
          onClick={activateAudio}
          className="absolute top-4 left-4 z-50 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Kích hoạt âm thanh
        </button>
      )}

      {/* Nút đồng bộ âm thanh */}
      {syncButton}

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
