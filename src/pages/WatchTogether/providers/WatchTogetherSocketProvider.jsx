import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const WatchTogetherSocketContext = createContext(null);

export const useWatchTogetherSocket = () => {
  return useContext(WatchTogetherSocketContext);
};

export const WatchTogetherSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Khởi tạo socket
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      auth: {
        token: localStorage.getItem("token") || "",
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Xử lý các sự kiện socket
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (newSocket) {
        console.log("Cleaning up socket connection");
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <WatchTogetherSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WatchTogetherSocketContext.Provider>
  );
};
