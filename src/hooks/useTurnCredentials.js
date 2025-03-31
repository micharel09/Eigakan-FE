import { useState, useEffect } from "react";
import axios from "axios";

const useTurnCredentials = () => {
  const [iceServers, setIceServers] = useState([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTurnCredentials = async () => {
      try {
        setLoading(true);
        // Thay đổi URL này thành URL của server của bạn
        const response = await axios.get(
          "https://socketserver-production-b2c5.up.railway.app/api/get-turn-credentials"
        );

        if (response.data && response.data.iceServers) {
          console.log("Received TURN credentials:", response.data.iceServers);
          setIceServers([...iceServers, ...response.data.iceServers]);
        }
      } catch (err) {
        console.error("Error fetching TURN credentials:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTurnCredentials();
  }, []);

  return { iceServers, loading, error };
};

export default useTurnCredentials;
