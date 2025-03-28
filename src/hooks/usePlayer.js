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

    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        // Đảo ngược trạng thái muted
        copy[myId].muted = !copy[myId].muted;

        // Thực sự bật/tắt audio tracks
        if (copy[myId].url) {
          const audioTracks = copy[myId].url.getAudioTracks();
          console.log("Audio tracks found:", audioTracks.length);

          if (audioTracks.length > 0) {
            audioTracks.forEach((track) => {
              // Quan trọng: enabled = !muted (nếu muted = true thì enabled = false)
              track.enabled = !copy[myId].muted;
              console.log(
                `Set audio track ${track.label} enabled:`,
                track.enabled
              );

              // Thêm log để kiểm tra trạng thái sau khi thay đổi
              setTimeout(() => {
                console.log(`Audio track ${track.label} status after toggle:`, {
                  enabled: track.enabled,
                  muted: track.muted,
                  readyState: track.readyState,
                });
              }, 500);
            });
          } else {
            console.warn(
              "No audio tracks found in stream! Trying to add audio..."
            );
            // Thử thêm audio track nếu không có
            navigator.mediaDevices
              .getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              })
              .then((audioStream) => {
                const audioTrack = audioStream.getAudioTracks()[0];
                if (audioTrack) {
                  // Đảm bảo track được bật
                  audioTrack.enabled = !copy[myId].muted;
                  copy[myId].url.addTrack(audioTrack);
                  console.log("Added new audio track to stream");
                }
              })
              .catch((err) => console.error("Failed to add audio track:", err));
          }
        } else {
          console.warn("No stream found for toggling audio");
        }
      }
      return copy;
    });

    // Thông báo cho người dùng khác
    socket.emit("user-toggle-audio", { userId: myId, roomId });
    console.log("Emitted user-toggle-audio event");
  }, [socket, myId, roomId, isConnected]);

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
