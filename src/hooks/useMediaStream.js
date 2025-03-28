import { useState, useEffect, useRef } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const isStreamSet = useRef(false);

  useEffect(() => {
    if (isStreamSet.current) return;

    const initStream = async () => {
      try {
        console.log("Requesting media permissions...");

        // Thử với audio trước, sau đó thêm video nếu có thể
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        console.log("Audio stream initialized successfully");
        console.log("Audio tracks:", audioStream.getAudioTracks().length);

        // Log chi tiết về audio tracks
        const audioTracks = audioStream.getAudioTracks();
        audioTracks.forEach((track) => {
          console.log("Audio track:", {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            constraints: track.getConstraints(),
          });
        });

        try {
          // Thử thêm video nếu có thể
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { max: 30 },
            },
          });

          // Kết hợp audio và video streams
          const combinedStream = new MediaStream();

          // Thêm audio tracks
          audioStream.getAudioTracks().forEach((track) => {
            combinedStream.addTrack(track);
          });

          // Thêm video tracks
          videoStream.getVideoTracks().forEach((track) => {
            combinedStream.addTrack(track);
          });

          console.log("Combined stream created with audio and video");
          setStream(combinedStream);
        } catch (videoErr) {
          console.log("Could not get video, using audio only:", videoErr);
          // Nếu không thể lấy video, chỉ sử dụng audio
          setStream(audioStream);
        }

        isStreamSet.current = true;
      } catch (err) {
        console.error("Error accessing media devices:", err);
        isStreamSet.current = false;
      }
    };

    initStream();

    return () => {
      if (stream) {
        console.log("Cleaning up media stream");
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    };
  }, [stream]);

  return {
    stream,
  };
};

export default useMediaStream;
