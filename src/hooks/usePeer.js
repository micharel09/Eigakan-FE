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

    // Thay đổi cấu hình PeerJS để sử dụng TURN server khác
    const peerConfig = {
      debug: 3,
      secure: true, // Đảm bảo kết nối an toàn
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // Sử dụng TURN server từ Xirsys (miễn phí cho phát triển)
          {
            urls: "turn:us-turn1.xirsys.com:80?transport=udp",
            username:
              "0vKSW_0z9-AvVG-LRD8IvCl7W_YVUmMLcQIxKrEw3ZL-V3VKSbCvVj0AAAAAAAAAABZ9Y2xhdWRlLXdlYnJ0Yy10ZXN0",
            credential: "2aa9e624-3cf1-11ef-8de1-0242ac120004",
          },
          {
            urls: "turn:us-turn1.xirsys.com:3478?transport=udp",
            username:
              "0vKSW_0z9-AvVG-LRD8IvCl7W_YVUmMLcQIxKrEw3ZL-V3VKSbCvVj0AAAAAAAAAABZ9Y2xhdWRlLXdlYnJ0Yy10ZXN0",
            credential: "2aa9e624-3cf1-11ef-8de1-0242ac120004",
          },
          {
            urls: "turn:us-turn1.xirsys.com:80?transport=tcp",
            username:
              "0vKSW_0z9-AvVG-LRD8IvCl7W_YVUmMLcQIxKrEw3ZL-V3VKSbCvVj0AAAAAAAAAABZ9Y2xhdWRlLXdlYnJ0Yy10ZXN0",
            credential: "2aa9e624-3cf1-11ef-8de1-0242ac120004",
          },
          {
            urls: "turn:us-turn1.xirsys.com:3478?transport=tcp",
            username:
              "0vKSW_0z9-AvVG-LRD8IvCl7W_YVUmMLcQIxKrEw3ZL-V3VKSbCvVj0AAAAAAAAAABZ9Y2xhdWRlLXdlYnJ0Yy10ZXN0",
            credential: "2aa9e624-3cf1-11ef-8de1-0242ac120004",
          },
          {
            urls: "turns:us-turn1.xirsys.com:443?transport=tcp",
            username:
              "0vKSW_0z9-AvVG-LRD8IvCl7W_YVUmMLcQIxKrEw3ZL-V3VKSbCvVj0AAAAAAAAAABZ9Y2xhdWRlLXdlYnJ0Yy10ZXN0",
            credential: "2aa9e624-3cf1-11ef-8de1-0242ac120004",
          },
        ],
        iceCandidatePoolSize: 10,
      },
      // Thêm các tùy chọn để ưu tiên TURN
      host: "localhost", // Sử dụng localhost để tránh vấn đề với DNS
      path: "/peerjs", // Đường dẫn mặc định
      port: 443, // Cổng an toàn
    };

    try {
      console.log("Initializing PeerJS with config:", peerConfig);
      const newPeer = new Peer(undefined, peerConfig);

      newPeer.on("open", (id) => {
        console.log("My peer ID is:", id);
        setMyId(id);

        // Cấu hình để ưu tiên TURN
        if (newPeer._options) {
          newPeer._options.config = {
            ...newPeer._options.config,
            iceTransportPolicy: "relay", // Chỉ sử dụng TURN server, bỏ qua STUN
          };
        }

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

      newPeer.on("connection", (conn) => {
        console.log("Peer connection established:", conn.peer);

        conn.on("open", () => {
          console.log("Peer data connection opened with:", conn.peer);
        });

        conn.on("error", (err) => {
          console.error("Peer connection error:", err);
        });
      });

      newPeer.on("iceconnectionstatechange", () => {
        console.log(
          "ICE connection state changed:",
          newPeer.iceConnectionState
        );

        if (newPeer.iceConnectionState === "checking") {
          console.log("Đang kiểm tra kết nối ICE...");
        } else if (newPeer.iceConnectionState === "connected") {
          console.log("Kết nối ICE thành công!");
        } else if (newPeer.iceConnectionState === "failed") {
          console.error(
            "Kết nối ICE thất bại - có thể TURN server không hoạt động"
          );

          // Thử khởi tạo lại ICE
          if (newPeer.restartIce) {
            console.log("Đang thử khởi tạo lại ICE...");
            newPeer.restartIce();

            // Nếu vẫn thất bại sau 5 giây, khởi tạo lại toàn bộ kết nối
            setTimeout(() => {
              if (newPeer.iceConnectionState === "failed") {
                restartConnection();
              }
            }, 5000);
          } else {
            // Nếu không có phương thức restartIce, khởi tạo lại toàn bộ kết nối
            restartConnection();
          }
        }
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

  // Thêm hàm để khởi tạo lại kết nối khi thất bại
  const restartConnection = () => {
    console.log("Đang khởi tạo lại kết nối...");

    // Hủy kết nối cũ
    if (peer) {
      peer.destroy();
    }

    // Đặt lại trạng thái
    isPeerSet.current = false;

    // Khởi tạo lại sau 2 giây
    setTimeout(() => {
      // Kích hoạt useEffect để tạo kết nối mới
      setPeer(null);
    }, 2000);
  };

  return {
    peer,
    myId,
    error,
  };
};

export default usePeer;
