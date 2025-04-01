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
        const myPeer = new Peer(undefined, {
          host: "eigakan.metered.live", // Dùng Metered Domain của bạn
          port: 443,
          secure: true, // Bật bảo mật HTTPS
          debug: 3,
          config: {
            iceServers: [
              { urls: "stun:stun.relay.metered.ca:80" },
              {
                urls: "turn:global.relay.metered.ca:80",
                username: "295a034c94d499118aa0b5bd",
                credential: "5x8yaBNbZrjBYLo0",
              },
              {
                urls: "turn:global.relay.metered.ca:443",
                username: "295a034c94d499118aa0b5bd",
                credential: "5x8yaBNbZrjBYLo0",
              },
              {
                urls: "turns:global.relay.metered.ca:443",
                username: "295a034c94d499118aa0b5bd",
                credential: "5x8yaBNbZrjBYLo0",
              },
            ],
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
