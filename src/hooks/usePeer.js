import { useState, useEffect, useRef } from "react";
import { useWatchTogetherSocket } from "../pages/WatchTogether/providers/WatchTogetherSocketProvider";
import Peer from "peerjs";

const usePeer = (roomId) => {
  const { socket, isConnected } = useWatchTogetherSocket();
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const [error, setError] = useState(null);
  const isPeerSet = useRef(false);

  useEffect(() => {
    if (isPeerSet.current || !roomId || !socket || !isConnected) return;
    isPeerSet.current = true;

    // Thêm cấu hình STUN/TURN server
    const peerConfig = {
      debug: 3, // Mức độ log cao nhất để debug
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          // Thêm TURN server miễn phí
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
        iceCandidatePoolSize: 10,
      },
    };

    try {
      console.log("Initializing PeerJS with config:", peerConfig);
      const newPeer = new Peer(undefined, peerConfig);

      newPeer.on("open", (id) => {
        console.log("My peer ID is:", id);
        setMyId(id);
        socket.emit("join-room", { roomId, userId: id });
      });

      newPeer.on("error", (err) => {
        console.error("PeerJS error:", err);
        setError(err);
        // Try to reconnect after error
        setTimeout(() => {
          if (isPeerSet.current) {
            isPeerSet.current = false;
          }
        }, 5000);
      });

      newPeer.on("icecandidate", (event) => {
        if (event.candidate) {
          console.log("New ICE candidate:", event.candidate.candidate);
        }
      });

      newPeer.on("icecandidateerror", (error) => {
        console.error("ICE candidate error:", error);
      });

      setPeer(newPeer);

      return () => {
        console.log("Destroying peer connection");
        newPeer.destroy();
        isPeerSet.current = false;
      };
    } catch (err) {
      console.error("Error creating Peer instance:", err);
      setError(err);
    }
  }, [roomId, socket, isConnected]);

  return {
    peer,
    myId,
    error,
  };
};

export default usePeer;
