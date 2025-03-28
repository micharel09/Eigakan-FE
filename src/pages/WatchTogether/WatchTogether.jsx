import { useEffect, useState, useCallback } from "react";
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

          // Tăng ưu tiên cho audio trong SDP
          let modifiedSdp = sdp;

          // Tăng băng thông cho audio
          modifiedSdp = modifiedSdp.replace(
            /a=mid:audio\r\n/g,
            "a=mid:audio\r\nb=AS:128\r\n"
          );

          // Đảm bảo audio được ưu tiên trong bundle
          modifiedSdp = modifiedSdp.replace(
            "a=group:BUNDLE audio video",
            "a=group:BUNDLE audio video"
          );

          // Đảm bảo opus codec được sử dụng cho audio với chất lượng cao
          if (modifiedSdp.indexOf("opus/48000/2") !== -1) {
            // Tìm dòng opus và thêm các tham số để cải thiện chất lượng
            const opusLine = modifiedSdp.match(/a=rtpmap:(\d+) opus\/48000\/2/);
            if (opusLine && opusLine[1]) {
              const opusPayloadType = opusLine[1];
              const fmtpLine = `a=fmtp:${opusPayloadType} minptime=10;useinbandfec=1;stereo=1;maxaveragebitrate=128000`;

              // Thêm hoặc thay thế dòng fmtp cho opus
              if (modifiedSdp.indexOf(`a=fmtp:${opusPayloadType}`) !== -1) {
                modifiedSdp = modifiedSdp.replace(
                  new RegExp(`a=fmtp:${opusPayloadType}.*\r\n`),
                  `${fmtpLine}\r\n`
                );
              } else {
                modifiedSdp = modifiedSdp.replace(
                  new RegExp(`a=rtpmap:${opusPayloadType} opus/48000/2\r\n`),
                  `a=rtpmap:${opusPayloadType} opus/48000/2\r\nb=AS:128\r\n${fmtpLine}\r\n`
                );
              }
            }
          }

          console.log("Modified SDP:", modifiedSdp);
          return modifiedSdp;
        },
      };

      // Đợi một chút để đảm bảo kết nối dữ liệu được thiết lập
      setTimeout(() => {
        const call = peer.call(newUser, stream, callOptions);
        console.log("Calling user with my stream:", call);

        call.on("stream", (incomingStream) => {
          console.log(`incoming stream from ${newUser}`);
          console.log("Incoming stream details:", {
            audioTracks: incomingStream.getAudioTracks().length,
            videoTracks: incomingStream.getVideoTracks().length,
            audioEnabled:
              incomingStream.getAudioTracks().length > 0
                ? incomingStream.getAudioTracks()[0].enabled
                : false,
          });

          setPlayers((prev) => ({
            ...prev,
            [newUser]: {
              url: incomingStream,
              muted: false, // Mặc định không mute
              playing: true,
            },
          }));

          setUsers((prev) => ({
            ...prev,
            [newUser]: call,
          }));
        });

        // Thêm xử lý lỗi
        call.on("error", (err) => {
          console.error("Error in call with user", newUser, err);
        });

        // Thêm xử lý đóng kết nối
        call.on("close", () => {
          console.log("Call with user", newUser, "was closed");
        });
      }, 1000);
    };
    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [peer, setPlayers, socket, stream, myId, roomId]);

  useEffect(() => {
    if (!socket) return;
    const handleToggleAudio = (userId) => {
      console.log(`user with id ${userId} toggled audio`);

      // Lấy trạng thái hiện tại
      const currentMutedState = players[userId]?.muted;
      const newMutedState = !currentMutedState;

      console.log(
        `Remote user ${userId} changing muted from ${currentMutedState} to ${newMutedState}`
      );

      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          // Đảo ngược trạng thái muted
          copy[userId].muted = newMutedState;

          // Quan trọng: Nếu stream có sẵn, cập nhật trạng thái của video element
          if (copy[userId].url) {
            // Tìm video element hiển thị stream này
            const videoElements = document.querySelectorAll("video");
            videoElements.forEach((video) => {
              if (video.srcObject === copy[userId].url) {
                video.muted = newMutedState;
                console.log(
                  `Updated video element muted state to ${video.muted}`
                );

                // Đảm bảo audio tracks cũng được cập nhật
                const audioTracks = copy[userId].url.getAudioTracks();
                if (audioTracks.length > 0) {
                  audioTracks.forEach((track) => {
                    // Quan trọng: enabled = !muted
                    track.enabled = !newMutedState;
                    console.log(
                      `Remote audio track ${
                        track.label
                      } enabled set to ${!newMutedState}`
                    );
                  });
                }
              }
            });
          }
        }
        return { ...copy };
      });
    };

    const handleToggleVideo = (userId) => {
      console.log(`user with id ${userId} toggled video`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].playing = !copy[userId].playing;
        return { ...copy };
      });
    };

    const handleUserLeave = (userId) => {
      console.log(`user ${userId} is leaving the room`);
      users[userId]?.close();
      const playersCopy = cloneDeep(players);
      delete playersCopy[userId];
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

    const handleIncomingCall = (call) => {
      const { peer: callerId } = call;
      console.log("Incoming call from:", callerId);

      // Đảm bảo audio track được bật trước khi trả lời
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          track.enabled = true;
          console.log(
            `Ensuring audio track ${track.label} is enabled before answering`
          );
        });
      }

      // Trả lời cuộc gọi với stream của mình
      call.answer(stream);
      console.log("Answered call with my stream");

      call.on("stream", (incomingStream) => {
        console.log(`incoming stream from ${callerId}`);

        // Log thông tin về stream nhận được
        console.log(
          "Incoming stream audio tracks:",
          incomingStream.getAudioTracks().map((t) => ({
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
          }))
        );

        // Đảm bảo audio tracks từ stream đến được bật
        const incomingAudioTracks = incomingStream.getAudioTracks();
        incomingAudioTracks.forEach((track) => {
          track.enabled = true;
          console.log(
            `Ensuring incoming audio track ${track.label} is enabled`
          );
        });

        setPlayers((prev) => ({
          ...prev,
          [callerId]: {
            url: incomingStream,
            muted: false, // Mặc định KHÔNG mute người dùng mới
            playing: true,
          },
        }));

        setUsers((prev) => ({
          ...prev,
          [callerId]: call,
        }));
      });

      call.on("error", (err) => {
        console.error("Error in incoming call:", err);
      });
    };

    peer.on("call", handleIncomingCall);

    return () => {
      peer.off("call", handleIncomingCall);
    };
  }, [peer, setPlayers, stream]);

  useEffect(() => {
    if (stream && myId && !players[myId]) {
      console.log("Setting up my stream in players");
      setPlayers((prev) => ({
        ...prev,
        [myId]: {
          url: stream,
          muted: false, // Mặc định không mute
          playing: true,
        },
      }));

      // Đảm bảo audio tracks được bật
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        console.log("My audio track enabled:", track.enabled);
      });
    }
  }, [stream, myId, players, setPlayers]);

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

  // Thêm hàm để khởi động lại kết nối âm thanh
  const restartAudioConnection = useCallback(() => {
    console.log("Restarting audio connection for all users");

    // Đóng tất cả kết nối hiện tại
    Object.values(users).forEach((call) => {
      if (call && typeof call.close === "function") {
        call.close();
      }
    });

    // Xóa tất cả người dùng khác
    const myPlayerData = players[myId];
    setPlayers({
      [myId]: myPlayerData,
    });
    setUsers({});

    // Đảm bảo audio track của mình được bật
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        console.log("Enabled my audio track for restart");
      });
    }

    // Thông báo cho server để tất cả người dùng khác kết nối lại
    socket.emit("restart-connections", { roomId });

    // Hiển thị thông báo
    alert("Đang khởi động lại kết nối âm thanh. Vui lòng đợi trong giây lát.");
  }, [myId, players, setPlayers, socket, stream, users, roomId]);

  // Thêm xử lý sự kiện restart-connections
  useEffect(() => {
    if (!socket) return;

    const handleRestartConnections = () => {
      console.log("Received restart-connections event");

      // Đóng tất cả kết nối hiện tại
      Object.values(users).forEach((call) => {
        if (call && typeof call.close === "function") {
          call.close();
        }
      });

      // Xóa tất cả người dùng khác
      const myPlayerData = players[myId];
      setPlayers({
        [myId]: myPlayerData,
      });
      setUsers({});

      // Đảm bảo audio track của mình được bật
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
          console.log("Enabled my audio track for restart");
        });
      }

      // Kết nối lại với phòng
      socket.emit("join-room", { roomId, userId: myId });
    };

    socket.on("restart-connections", handleRestartConnections);

    return () => {
      socket.off("restart-connections", handleRestartConnections);
    };
  }, [socket, users, players, myId, setPlayers, stream, roomId]);

  // Thêm nút khởi động lại kết nối âm thanh
  const restartButton = (
    <button
      onClick={restartAudioConnection}
      className="absolute top-16 right-4 z-50 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
    >
      Khởi động lại kết nối âm thanh
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

      {/* Nút khởi động lại kết nối âm thanh */}
      {restartButton}

      {/* Right panel - other participants' videos */}
      {Object.keys(otherPlayers).length > 0 && (
        <div className="absolute flex flex-col overflow-y-auto z-20 space-y-3 w-[220px] h-[calc(100vh-40px-80px)] right-5 top-5">
          {Object.keys(otherPlayers).map((playerId) => {
            const { url, muted, playing } = otherPlayers[playerId];
            return (
              <Player
                key={playerId}
                url={url}
                muted={muted}
                playing={playing}
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
            muted={myPlayer.muted}
            playing={myPlayer.playing}
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
          muted={myPlayer?.muted}
          playing={myPlayer?.playing}
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
