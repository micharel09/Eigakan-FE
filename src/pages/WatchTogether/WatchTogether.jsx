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

      // Log thông tin về stream hiện tại trước khi gọi
      console.log("My stream before calling:", {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioEnabled:
          stream.getAudioTracks().length > 0
            ? stream.getAudioTracks()[0].enabled
            : false,
      });

      const call = peer.call(newUser, stream);
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

          // Không cần thay đổi trạng thái audio track của người khác
          // Chỉ cập nhật UI
          console.log(
            `Updated muted state for user ${userId} to ${copy[userId].muted}`
          );
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
    peer.on("call", (call) => {
      const { peer: callerId } = call;
      call.answer(stream);

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

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden">
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
