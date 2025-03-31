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

    // Thêm debug cho các kết nối mới
    const originalCall = peer.call;
    peer.call = function (peerId, stream) {
      console.log(`Calling peer ${peerId}...`);
      const call = originalCall.call(this, peerId, stream);

      // Debug kết nối
      if (call.peerConnection) {
        call.peerConnection.addEventListener("iceconnectionstatechange", () => {
          console.log(
            `ICE connection state with ${peerId}: ${call.peerConnection.iceConnectionState}`
          );
        });

        call.peerConnection.addEventListener("connectionstatechange", () => {
          console.log(
            `Connection state with ${peerId}: ${call.peerConnection.connectionState}`
          );
        });

        call.peerConnection.addEventListener("icecandidateerror", (event) => {
          console.error("ICE candidate error:", event);
        });
      }

      return call;
    };

    // Debug cho các cuộc gọi đến
    const originalOn = peer.on;
    peer.on = function (event, callback) {
      if (event === "call") {
        return originalOn.call(this, event, (call) => {
          console.log(`Received call from ${call.peer}`);

          // Debug kết nối
          if (call.peerConnection) {
            call.peerConnection.addEventListener(
              "iceconnectionstatechange",
              () => {
                console.log(
                  `ICE connection state with ${call.peer}: ${call.peerConnection.iceConnectionState}`
                );
              }
            );

            call.peerConnection.addEventListener(
              "connectionstatechange",
              () => {
                console.log(
                  `Connection state with ${call.peer}: ${call.peerConnection.connectionState}`
                );
              }
            );

            call.peerConnection.addEventListener(
              "icecandidateerror",
              (event) => {
                console.error("ICE candidate error:", event);
              }
            );
          }

          callback(call);
        });
      }

      return originalOn.call(this, event, callback);
    };
  }, [peer, stream]);

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

  // Thêm kiểm tra null/undefined cho myPlayer
  const isMuted = myPlayer?.muted || false;
  const isPlaying = myPlayer?.playing || false;

  // Thêm vào useEffect để xử lý lỗi ICE candidate
  useEffect(() => {
    if (!peer || !stream) return;

    // Thêm xử lý lỗi ICE candidate
    const handleIceError = (event) => {
      console.warn("ICE candidate error:", event);

      // Nếu lỗi liên quan đến TURN server, thử kết nối lại
      if (event.url && event.url.includes("turn:")) {
        console.log("TURN server connection failed, trying to reconnect...");

        // Thử kết nối lại sau 2 giây
        setTimeout(() => {
          if (peer && peer.reconnect) {
            console.log("Attempting to reconnect peer...");
            peer.reconnect();
          }
        }, 2000);
      }
    };

    // Thêm event listener cho tất cả các kết nối
    if (peer._connections) {
      Object.values(peer._connections).forEach((conn) => {
        if (conn.peerConnection) {
          conn.peerConnection.addEventListener(
            "icecandidateerror",
            handleIceError
          );
        }
      });
    }

    return () => {
      // Cleanup
      if (peer._connections) {
        Object.values(peer._connections).forEach((conn) => {
          if (conn.peerConnection) {
            conn.peerConnection.removeEventListener(
              "icecandidateerror",
              handleIceError
            );
          }
        });
      }
    };
  }, [peer, stream]);

  // Thêm vào useEffect để kiểm tra trạng thái kết nối
  useEffect(() => {
    if (!peer || !users) return;

    // Kiểm tra trạng thái kết nối mỗi 5 giây
    const checkInterval = setInterval(() => {
      Object.entries(users).forEach(([peerId, call]) => {
        if (call && call.peerConnection) {
          const state = call.peerConnection.iceConnectionState;
          console.log(`ICE connection state with ${peerId}: ${state}`);

          // Nếu kết nối bị ngắt hoặc thất bại, thử kết nối lại
          if (state === "disconnected" || state === "failed") {
            console.log(
              `Connection to ${peerId} is ${state}, attempting to reconnect...`
            );

            // Đóng kết nối cũ
            call.close();

            // Tạo kết nối mới sau 1 giây
            setTimeout(() => {
              if (peer && stream) {
                console.log(`Calling ${peerId} again...`);
                const newCall = peer.call(peerId, stream);

                newCall.on("stream", (incomingStream) => {
                  console.log(`Reconnected to ${peerId}`);
                  setPlayers((prev) => ({
                    ...prev,
                    [peerId]: {
                      url: incomingStream,
                      muted: true,
                      playing: true,
                    },
                  }));

                  setUsers((prev) => ({
                    ...prev,
                    [peerId]: newCall,
                  }));
                });
              }
            }, 1000);
          }
        }
      });
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [peer, users, stream, setPlayers, setUsers]);

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
