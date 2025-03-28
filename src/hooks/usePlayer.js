import { useState, useCallback } from "react";
import { cloneDeep } from "lodash";
import { useWatchTogetherSocket } from "../pages/WatchTogether/providers/WatchTogetherSocketProvider";
import { useNavigate } from "react-router-dom";

const usePlayer = (myId, roomId, peer) => {
  const { socket, isConnected } = useWatchTogetherSocket();
  const [players, setPlayers] = useState({});
  const navigate = useNavigate();

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
        // Đảo ngược trạng thái muted
        copy[myId].muted = !copy[myId].muted;
        const newMutedState = copy[myId].muted;

        // Cập nhật trạng thái thực tế của audio tracks
        if (copy[myId].url) {
          const audioTracks = copy[myId].url.getAudioTracks();
          audioTracks.forEach((track) => {
            track.enabled = !newMutedState; // Bật nếu không mute, tắt nếu mute
            console.log(`My audio track enabled set to: ${track.enabled}`);
          });
        }
      }
      return copy;
    });

    socket.emit("user-toggle-audio", { userId: myId, roomId });
  }, [socket, myId, roomId, isConnected]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!socket || !isConnected) return;

    console.log("Toggling video");
    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        // Đảo ngược trạng thái playing
        copy[myId].playing = !copy[myId].playing;

        // Cập nhật trạng thái thực tế của video tracks
        if (copy[myId].url) {
          const videoTracks = copy[myId].url.getVideoTracks();
          if (videoTracks.length > 0) {
            videoTracks.forEach((track) => {
              track.enabled = copy[myId].playing;
              console.log(`Video track enabled: ${track.enabled}`);
            });
          } else {
            console.warn("No video tracks found to toggle");
          }
        }
      }
      return copy;
    });

    socket.emit("user-toggle-video", { userId: myId, roomId });
  }, [socket, myId, roomId, isConnected]);

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
