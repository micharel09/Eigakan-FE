import { useState, useCallback, useEffect } from "react";
import { cloneDeep } from "lodash";
import { useWatchTogetherSocket } from "../pages/WatchTogether/providers/WatchTogetherSocketProvider";
import { useNavigate } from "react-router-dom";

const usePlayer = (myId, roomId, peer) => {
  const { socket, isConnected } = useWatchTogetherSocket();
  const [players, setPlayers] = useState({});
  const navigate = useNavigate();

  // Theo dõi trạng thái audio/video của người dùng khác
  useEffect(() => {
    if (!socket) return;

    const handleUserToggleAudio = (userId) => {
      console.log(`User ${userId} toggled audio`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          copy[userId].muted = !copy[userId].muted;

          // Nếu stream có sẵn, cập nhật trạng thái thực tế của audio tracks
          if (copy[userId].url && copy[userId].url.getAudioTracks) {
            const audioTracks = copy[userId].url.getAudioTracks();
            audioTracks.forEach((track) => {
              // Không thay đổi enabled của remote tracks, chỉ cập nhật UI
              console.log(`Remote audio track ${track.label} status:`, {
                enabled: track.enabled,
                muted: copy[userId].muted,
              });
            });
          }
        }
        return copy;
      });
    };

    socket.on("user-toggle-audio", handleUserToggleAudio);

    return () => {
      socket.off("user-toggle-audio", handleUserToggleAudio);
    };
  }, [socket]);

  // Get a copy of players without modifying the original
  const playersCopy = cloneDeep(players);

  // Extract the current user's player
  const playerHighlighted = playersCopy[myId];

  // Remove current user from the copy to get other players
  delete playersCopy[myId];

  // Store other players
  const nonHighlightedPlayers = playersCopy;

  // Handle leaving the room
  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected) return;

    console.log("Leaving room:", roomId);
    socket.emit("user-leave", { userId: myId, roomId });

    // Close peer connection
    if (peer) {
      peer.disconnect();
    }

    // Navigate back to home
    navigate("/");
  }, [socket, myId, roomId, peer, navigate, isConnected]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!socket || !isConnected) return;

    console.log("Toggling audio");
    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        copy[myId].muted = !copy[myId].muted;
        const newState = !copy[myId].muted;

        // Cập nhật trạng thái thực tế của audio tracks
        if (copy[myId].url) {
          const audioTracks = copy[myId].url.getAudioTracks();
          audioTracks.forEach((track) => {
            track.enabled = newState;
            console.log(`Audio track ${track.label} enabled:`, track.enabled);
          });
        }
      }
      return copy;
    });

    // Gửi trạng thái mới
    const newAudioState = players[myId]?.muted ? false : true;
    socket.emit("user-toggle-audio", {
      userId: myId,
      roomId,
      enabled: newAudioState,
    });
  }, [socket, myId, roomId, isConnected, players]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!socket || !isConnected) return;

    console.log("Toggling video");
    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        // Đảo ngược trạng thái playing
        copy[myId].playing = !copy[myId].playing;
        const newState = copy[myId].playing;

        // Cập nhật trạng thái thực tế của video tracks
        if (copy[myId].url) {
          const videoTracks = copy[myId].url.getVideoTracks();
          if (videoTracks.length > 0) {
            videoTracks.forEach((track) => {
              track.enabled = newState;
              console.log(`Video track ${track.label} enabled:`, track.enabled);
            });
          } else {
            console.warn("No video tracks found to toggle");
          }
        }
      }
      return copy;
    });

    // Gửi trạng thái mới
    const newVideoState = players[myId]?.playing ? false : true;
    socket.emit("user-toggle-video", {
      userId: myId,
      roomId,
      enabled: newVideoState,
    });
  }, [socket, myId, roomId, isConnected, players]);

  return {
    players,
    setPlayers,
    playerHighlighted,
    nonHighlightedPlayers,
    toggleAudio,
    toggleVideo,
    leaveRoom,
  };
};

export default usePlayer;
