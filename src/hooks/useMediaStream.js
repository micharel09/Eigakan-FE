import { useState, useEffect, useRef } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mediaStream = null;

    const getMediaStream = async () => {
      try {
        console.log("Requesting media permissions...");

        // Thử với các ràng buộc đơn giản hơn
        const constraints = {
          video: true,
          audio: true,
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Media stream obtained successfully:", mediaStream);

        // Kiểm tra chất lượng stream
        const videoTracks = mediaStream.getVideoTracks();
        if (videoTracks.length > 0) {
          console.log("Video track settings:", videoTracks[0].getSettings());
        }

        setStream(mediaStream);
      } catch (err) {
        console.error("Error getting media stream:", err);
        setError(err);

        // Thử lại chỉ với audio
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
