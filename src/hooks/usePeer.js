import { useState, useEffect, useRef } from "react";
import { useWatchTogetherSocket } from "../pages/WatchTogether/providers/WatchTogetherSocketProvider";

const usePeer = (roomId) => {
  const { socket, isConnected } = useWatchTogetherSocket();
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const isPeerSet = useRef(false);

  useEffect(() => {
    if (isPeerSet.current || !roomId || !socket || !isConnected) return;
    isPeerSet.current = true;

    // Dynamically import PeerJS
    import("peerjs")
      .then(({ default: Peer }) => {
        // Tạo peer với cấu hình tối ưu cho audio
        const myPeer = new Peer(undefined, {
          host: "0.peerjs.com",
          port: 443,
          secure: true,
          debug: 3,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" },
            ],
          },
          // Thêm cấu hình media để ưu tiên audio
          constraints: {
            audio: true,
            video: true,
          },
        });

        setPeer(myPeer);

        myPeer.on("open", (id) => {
          console.log(`Your peer ID is ${id}`);
          setMyId(id);
          socket.emit("join-room", { roomId, userId: id });
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

  return {
    peer,
    myId,
  };
};

export default usePeer;
