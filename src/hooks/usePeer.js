import { useState, useEffect, useRef } from "react";
import { useWatchTogetherSocket } from "../pages/WatchTogether/providers/WatchTogetherSocketProvider";
import axios from "axios";

const usePeer = (roomId) => {
  const { socket, isConnected } = useWatchTogetherSocket();
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const isPeerSet = useRef(false);
  const [iceServers, setIceServers] = useState([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ]);

  // Lấy TURN credentials từ Twilio
  useEffect(() => {
    const fetchTurnCredentials = async () => {
      try {
        const response = await axios.get(
          "https://socketserver-production-b2c5.up.railway.app/api/turn-credentials"
        );
        if (response.data && response.data.iceServers) {
          console.log(
            "Received Twilio TURN credentials:",
            response.data.iceServers
          );
          setIceServers(response.data.iceServers);
        }
      } catch (error) {
        console.error("Error fetching TURN credentials:", error);
      }
    };

    fetchTurnCredentials();
  }, []);

  useEffect(() => {
    if (
      isPeerSet.current ||
      !roomId ||
      !socket ||
      !isConnected ||
      iceServers.length < 3
    )
      return;
    isPeerSet.current = true;

    console.log("Initializing PeerJS with ICE servers:", iceServers);

    // Dynamically import PeerJS
    import("peerjs")
      .then(({ default: Peer }) => {
        const myPeer = new Peer(undefined, {
          host: "0.peerjs.com",
          port: 443,
          secure: true,
          debug: 3,
          config: {
            iceServers: iceServers,
            iceCandidatePoolSize: 10,
          },
        });

        myPeer.on("open", (id) => {
          console.log(`Your peer ID is ${id}`);
          setMyId(id);
          socket.emit("join-room", { roomId, userId: id });

          // Log khi kết nối thành công
          console.log("PeerJS connection established successfully");
        });

        // Thêm debug cho kết nối
        myPeer.on("error", (err) => {
          console.error("PeerJS error:", err);

          // Log chi tiết hơn về lỗi
          if (err.type === "peer-unavailable") {
            console.log("Peer unavailable - this is normal when a user leaves");
          } else if (err.type === "network") {
            console.error("Network error - check your connection");
          } else if (err.type === "server-error") {
            console.error("PeerJS server error - try again later");
          }

          // Try to reconnect after error
          setTimeout(() => {
            if (isPeerSet.current) {
              isPeerSet.current = false;
            }
          }, 5000);
        });

        setPeer(myPeer);

        // Clean up on unmount
        return () => {
          myPeer.destroy();
          isPeerSet.current = false;
        };
      })
      .catch((err) => {
        console.error("Failed to load PeerJS:", err);
        isPeerSet.current = false;
      });
  }, [roomId, socket, isConnected, iceServers]);

  return {
    peer,
    myId,
  };
};

export default usePeer;
