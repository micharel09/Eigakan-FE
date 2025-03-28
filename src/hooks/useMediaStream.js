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
            // Quan trọng: Luôn bật audio track khi khởi tạo
            track.enabled = true;

            console.log("Audio track enabled:", {
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              constraints: track.getConstraints(),
            });

            // Thêm sự kiện để theo dõi trạng thái
            track.onmute = () => console.log("Audio track muted by browser");
            track.onunmute = () =>
              console.log("Audio track unmuted by browser");
            track.onended = () => console.log("Audio track ended");
          });
        } else {
          console.warn("No audio tracks found in the stream!");
        }

        // Kích hoạt audio context để đảm bảo audio hoạt động
        try {
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          if (audioContext.state === "suspended") {
            await audioContext.resume();
            console.log("Audio context resumed");
          }
          console.log("Audio context state:", audioContext.state);
        } catch (e) {
          console.error("Error with audio context:", e);
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
