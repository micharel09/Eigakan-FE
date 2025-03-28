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

    // Navigate to home page
    navigate("/");
  }, [socket, myId, roomId, isConnected, navigate]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!socket || !isConnected) return;

    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        copy[myId].muted = !copy[myId].muted;

        // Actually toggle the audio tracks in the stream
        if (copy[myId].url) {
          const audioTracks = copy[myId].url.getAudioTracks();
          console.log("Audio tracks before toggle:", audioTracks);

          if (audioTracks.length > 0) {
            audioTracks.forEach((track) => {
              track.enabled = !copy[myId].muted;
              console.log(`Audio track enabled: ${track.enabled}`);
            });
          } else {
            console.warn("No audio tracks found to toggle");
          }
        }
      }
      return copy;
    });

    socket.emit("user-toggle-audio", { userId: myId, roomId });
  }, [socket, myId, roomId, isConnected]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!socket || !isConnected) return;

    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        copy[myId].playing = !copy[myId].playing;

        // Actually toggle the video tracks in the stream
        if (copy[myId].url) {
          const videoTracks = copy[myId].url.getVideoTracks();
          console.log("Video tracks before toggle:", videoTracks);

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
