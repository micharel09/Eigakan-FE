<<<<<<< HEAD
import { useState, useCallback, useEffect } from "react";
import { cloneDeep } from "lodash";
=======
import { useState, useEffect, useRef } from "react";
>>>>>>> parent of f1141fa (fix audio 7)
import { useWatchTogetherSocket } from "../pages/WatchTogether/providers/WatchTogetherSocketProvider";

const usePeer = (roomId) => {
  const { socket, isConnected } = useWatchTogetherSocket();
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const isPeerSet = useRef(false);

<<<<<<< HEAD
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

<<<<<<< HEAD
    console.log("Toggling audio");
    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        copy[myId].muted = !copy[myId].muted;
        const newState = !copy[myId].muted;
=======
    console.log("Toggling audio for user", myId);

    setPlayers((prev) => {
      const copy = cloneDeep(prev);
      if (copy[myId]) {
        // Đảo ngược trạng thái muted
        copy[myId].muted = !copy[myId].muted;
>>>>>>> parent of f4d9547 (fix audio 5)

        // Cập nhật trạng thái thực tế của audio tracks
        if (copy[myId].url) {
          const audioTracks = copy[myId].url.getAudioTracks();
<<<<<<< HEAD
          audioTracks.forEach((track) => {
            track.enabled = newState;
            console.log(`Audio track ${track.label} enabled:`, track.enabled);
          });
=======
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
>>>>>>> parent of f4d9547 (fix audio 5)
        }
      }
      return copy;
    });

<<<<<<< HEAD
    // Gửi trạng thái mới
    const newAudioState = players[myId]?.muted ? false : true;
    socket.emit("user-toggle-audio", {
      userId: myId,
      roomId,
      enabled: newAudioState,
    });
  }, [socket, myId, roomId, isConnected, players]);
=======
    // Thông báo cho người dùng khác
    socket.emit("user-toggle-audio", { userId: myId, roomId });
    console.log("Emitted user-toggle-audio event");
  }, [socket, myId, roomId, isConnected]);
>>>>>>> parent of f4d9547 (fix audio 5)
=======
  useEffect(() => {
    if (isPeerSet.current || !roomId || !socket || !isConnected) return;
    isPeerSet.current = true;

    // Dynamically import PeerJS
    import("peerjs")
      .then(({ default: Peer }) => {
        // Thêm cấu hình để ưu tiên audio
        const peerConfig = {
          host: "0.peerjs.com",
          port: 443,
          secure: true,
          debug: 3,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              { urls: "stun:stun2.l.google.com:19302" },
              { urls: "stun:stun3.l.google.com:19302" },
              { urls: "stun:stun4.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" },
              {
                urls: "turn:numb.viagenie.ca",
                username: "webrtc@live.com",
                credential: "muazkh",
              },
              {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject",
              },
              {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject",
              },
              {
                urls: "turn:openrelay.metered.ca:443?transport=tcp",
                username: "openrelayproject",
                credential: "openrelayproject",
              },
            ],
          },
          // Thêm cấu hình media để ưu tiên audio
          constraints: {
            audio: {
              mandatory: {
                echoCancellation: true,
                googEchoCancellation: true,
                googAutoGainControl: true,
                googNoiseSuppression: true,
                googHighpassFilter: true,
                googTypingNoiseDetection: true,
                googAudioMirroring: false,
              },
            },
            video: true,
          },
          // Thêm cấu hình để ưu tiên audio trong kết nối
          sdpTransform: (sdp) => {
            // Tăng ưu tiên cho audio trong SDP
            return sdp.replace(
              "a=group:BUNDLE audio video",
              "a=group:BUNDLE video audio"
            );
          },
        };

        const myPeer = new Peer(undefined, peerConfig);
>>>>>>> parent of f1141fa (fix audio 7)

        setPeer(myPeer);

<<<<<<< HEAD
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
=======
        myPeer.on("open", (id) => {
          console.log(`Your peer ID is ${id}`);
          setMyId(id);
          socket.emit("join-room", { roomId, userId: id });
        });

        // Xử lý sự kiện kết nối
        myPeer.on("connection", (conn) => {
          console.log("New data connection established:", conn.peer);

          conn.on("open", () => {
            console.log("Data connection opened with:", conn.peer);
            // Gửi thông báo để kiểm tra kết nối
            conn.send({ type: "connection-test", message: "Hello from peer" });
          });

          conn.on("data", (data) => {
            console.log("Received data from peer:", data);
          });

          conn.on("error", (err) => {
            console.error("Data connection error:", err);
          });
        });

        myPeer.on("error", (err) => {
          console.error("PeerJS error:", err);
          // Try to reconnect after error
          setTimeout(() => {
            if (isPeerSet.current) {
              isPeerSet.current = false;
            }
          }, 5000);
        });

        // Clean up on unmount
        return () => {
          myPeer.destroy();
          isPeerSet.current = false;
        };
      })
      .catch((err) => {
        console.error("Failed to load PeerJS:", err);
      });
  }, [roomId, socket, isConnected]);
>>>>>>> parent of f1141fa (fix audio 7)

  return {
    peer,
    myId,
  };
};

export default usePeer;
