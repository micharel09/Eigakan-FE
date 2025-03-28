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

        // Yêu cầu quyền truy cập camera và microphone với cấu hình chi tiết hơn
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Thêm các tùy chọn để đảm bảo micro hoạt động
            channelCount: 2,
            sampleRate: 48000,
            sampleSize: 16,
            volume: 1.0,
          },
        });

        console.log("Media stream initialized successfully");
        console.log("Video tracks:", mediaStream.getVideoTracks().length);
        console.log("Audio tracks:", mediaStream.getAudioTracks().length);

        // Log chi tiết về audio tracks
        const audioTracks = mediaStream.getAudioTracks();
        console.log(
          "Audio track details:",
          audioTracks.map((t) => ({
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
            id: t.id,
            settings: t.getSettings ? t.getSettings() : "N/A",
          }))
        );

        // Đảm bảo audio tracks được bật
        audioTracks.forEach((track) => {
          track.enabled = true;
          console.log(
            `Ensuring initial audio track is enabled: ${track.enabled}`
          );
        });

        setStream(mediaStream);
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
            },
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
