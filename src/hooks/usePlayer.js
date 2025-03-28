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

    console.log("Toggling audio for user", myId);

    // Lấy trạng thái hiện tại trước khi thay đổi
    const currentMutedState = players[myId]?.muted;
    const newMutedState = !currentMutedState;

    console.log(
      `Changing muted state from ${currentMutedState} to ${newMutedState}`
    );

    // Quan trọng: Cập nhật trạng thái audio track trước khi cập nhật UI
    if (players[myId]?.url) {
      const audioTracks = players[myId].url.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          // Quan trọng: enabled = !muted
          const shouldEnable = !newMutedState;
          track.enabled = shouldEnable;
          console.log(`Set audio track ${track.label} enabled:`, shouldEnable);
        });
      }
    }

    // Cập nhật UI sau khi đã cập nhật audio track
    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        copy[myId].muted = newMutedState;
      }
      return copy;
    });

    // Thông báo cho người dùng khác
    socket.emit("user-toggle-audio", { userId: myId, roomId });
    console.log("Emitted user-toggle-audio event");
  }, [socket, myId, roomId, isConnected, players]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!socket || !isConnected) return;

    console.log("Toggling video for user", myId);

    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        // Đảo ngược trạng thái playing
        copy[myId].playing = !copy[myId].playing;

        // Thực sự bật/tắt video tracks
        if (copy[myId].url) {
          const videoTracks = copy[myId].url.getVideoTracks();
          console.log("Video tracks found:", videoTracks.length);

          videoTracks.forEach((track) => {
            track.enabled = copy[myId].playing;
            console.log(
              `Set video track ${track.label} enabled:`,
              track.enabled
            );
          });
        } else {
          console.warn("No stream found for toggling video");
        }
      }
      return copy;
    });

    // Thông báo cho người dùng khác
    socket.emit("user-toggle-video", { userId: myId, roomId });
    console.log("Emitted user-toggle-video event");
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
