import { useState, useEffect, useRef } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const isStreamSet = useRef(false);

  useEffect(() => {
    if (isStreamSet.current) return;

    const getMedia = async () => {
      try {
        console.log("Requesting media permissions...");
        isStreamSet.current = true;

        // Yêu cầu quyền truy cập camera và microphone
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        console.log("Media stream initialized successfully");
        console.log("Video tracks:", mediaStream.getVideoTracks().length);
        console.log("Audio tracks:", mediaStream.getAudioTracks().length);

        // Mặc định tắt audio track khi mới khởi tạo
        const audioTracks = mediaStream.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = false; // Mặc định tắt micro
          console.log(`Initial audio track enabled set to: ${track.enabled}`);
        });

        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        isStreamSet.current = false;

        // Thử lại với chỉ audio nếu video thất bại
        try {
          console.log("Trying audio only...");
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          console.log("Audio-only stream initialized");
          setStream(audioOnlyStream);
        } catch (audioErr) {
          console.error("Failed to get even audio stream:", audioErr);
        }
      }
    };

    getMedia();

    // Cleanup function
    return () => {
      if (stream) {
        console.log("Cleaning up media stream");
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    };
  }, []);

  return {
    stream,
  };
};

export default useMediaStream;
