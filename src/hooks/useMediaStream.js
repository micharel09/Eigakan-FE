import { useState, useEffect, useRef } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const isStreamSet = useRef(false);

  useEffect(() => {
    if (isStreamSet.current) return;

    const initStream = async () => {
      try {
        console.log("Requesting media permissions...");

        // Yêu cầu quyền truy cập audio với các tùy chọn cụ thể
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Thêm các tùy chọn để đảm bảo audio hoạt động
            channelCount: 2,
            sampleRate: 48000,
            sampleSize: 16,
          },
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { max: 30 },
          },
        });

        console.log("Media stream initialized successfully");

        // Đảm bảo audio track được bật
        const audioTracks = mediaStream.getAudioTracks();
        console.log("Audio tracks:", audioTracks.length);

        if (audioTracks.length > 0) {
          // Đảm bảo tất cả audio tracks đều được bật
          audioTracks.forEach((track) => {
            track.enabled = true;
            console.log("Audio track enabled:", {
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              constraints: track.getConstraints(),
            });
          });
        } else {
          console.warn("No audio tracks found in the stream!");
        }

        setStream(mediaStream);
        isStreamSet.current = true;
      } catch (err) {
        console.error("Error accessing media devices:", err);
        isStreamSet.current = false;

        // Thử lại với chỉ audio nếu video thất bại
        try {
          console.log("Trying audio only...");
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              // Thêm các tùy chọn để đảm bảo audio hoạt động
              channelCount: 2,
              sampleRate: 48000,
              sampleSize: 16,
            },
            video: false,
          });

          // Đảm bảo audio track được bật
          const audioTracks = audioOnlyStream.getAudioTracks();
          audioTracks.forEach((track) => {
            track.enabled = true;
            console.log("Audio-only track enabled:", {
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
            });
          });

          console.log("Audio-only stream initialized");
          setStream(audioOnlyStream);
          isStreamSet.current = true;
        } catch (audioErr) {
          console.error("Failed to get even audio stream:", audioErr);
        }
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
  }, []);

  return {
    stream,
  };
};

export default useMediaStream;
