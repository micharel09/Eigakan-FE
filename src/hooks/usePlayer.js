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
    if (!socket || !myId || !roomId) return;

    const newMutedState = !players[myId]?.muted;

    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        ...prev[myId],
        muted: newMutedState,
      },
    }));

    // Gửi trạng thái mới đến server
    socket.emit("user-toggle-audio", {
      userId: myId,
      roomId,
      isMuted: newMutedState,
    });
  }, [socket, myId, roomId, players]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!socket || !myId || !roomId) return;

    const newVideoState = !players[myId]?.playing;

    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        ...prev[myId],
        playing: newVideoState,
      },
    }));

    // Gửi trạng thái mới đến server
    socket.emit("user-toggle-video", {
      userId: myId,
      roomId,
      isVideoOff: !newVideoState,
    });
  }, [socket, myId, roomId, players]);

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
