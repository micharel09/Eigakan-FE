import { useState, useEffect, useRef } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mediaStream = null;

    const getMediaStream = async () => {
      try {
        // Thêm log để debug
        console.log("Requesting media permissions...");

        // Thêm các ràng buộc rõ ràng cho video và audio
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
          audio: true,
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Media stream obtained successfully:", mediaStream);
        setStream(mediaStream);
      } catch (err) {
        console.error("Error getting media stream:", err);
        setError(err);

        // Thử lại chỉ với audio nếu video không khả dụng
        try {
          console.log("Trying fallback to audio only...");
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          console.log("Audio-only stream obtained");
          setStream(mediaStream);
        } catch (audioErr) {
          console.error("Could not get audio stream either:", audioErr);
        }
      }
    };

    getMediaStream();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { stream, error };
};

export default useMediaStream;
