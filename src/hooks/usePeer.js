import { useState, useEffect, useRef } from "react";
import { useWatchTogetherSocket } from "../pages/WatchTogether/providers/WatchTogetherSocketProvider";
import useTurnCredentials from "./useTurnCredentials";

const usePeer = (roomId) => {
  const { socket, isConnected } = useWatchTogetherSocket();
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const isPeerSet = useRef(false);
  const { iceServers, loading } = useTurnCredentials();

  useEffect(() => {
    if (isPeerSet.current || !roomId || !socket || !isConnected || loading)
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
            iceServers,
            iceCandidatePoolSize: 10,
            iceTransportPolicy: "all",
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            iceServersPolicy: "all",
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
  }, [roomId, socket, isConnected, iceServers, loading]);

  return {
    peer,
    myId,
  };
};

export default usePeer;
