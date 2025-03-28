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

  return {
    peer,
    myId,
  };
};

export default usePeer;
