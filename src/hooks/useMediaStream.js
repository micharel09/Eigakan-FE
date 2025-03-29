import { useState, useEffect } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeStream = async () => {
      try {
        console.log("Initializing media stream...");

        // Kiểm tra xem trình duyệt có hỗ trợ getUserMedia không
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Your browser doesn't support media devices");
        }

        // Kiểm tra thiết bị có sẵn
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some((device) => device.kind === "audioinput");
        const hasVideo = devices.some((device) => device.kind === "videoinput");

        console.log("Available devices:", {
          audio: hasAudio,
          video: hasVideo,
          devices: devices.map((d) => ({ kind: d.kind, label: d.label })),
        });

        // Cấu hình constraints dựa trên thiết bị có sẵn
        const constraints = {
          audio: hasAudio
            ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : false,
          video: hasVideo
            ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { max: 30 },
              }
            : false,
        };

        console.log("Using constraints:", constraints);

        // Yêu cầu quyền truy cập
        const mediaStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        // Kiểm tra tracks
        const audioTracks = mediaStream.getAudioTracks();
        const videoTracks = mediaStream.getVideoTracks();

        console.log("Media stream initialized with:", {
          audioTracks: audioTracks.length,
          videoTracks: videoTracks.length,
          audioDetails: audioTracks.map((t) => ({
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          })),
          videoDetails: videoTracks.map((t) => ({
            label: t.label,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          })),
        });

        // Đảm bảo các tracks được bật
        audioTracks.forEach((track) => {
          track.enabled = true;
        });

        videoTracks.forEach((track) => {
          track.enabled = true;
        });

        if (mounted) {
          setStream(mediaStream);
          setError(null);
        }
      } catch (err) {
        console.error("Error initializing media stream:", err);

        // Thử lại với chỉ audio nếu video gây lỗi
        if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError" ||
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
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

            if (mounted) {
              setStream(audioOnlyStream);
              setError(null);
            }
            return;
          } catch (audioErr) {
            console.error("Audio-only fallback also failed:", audioErr);
          }
        }

        if (mounted) {
          setError(err);
        }
      }
    };

    initializeStream();

    return () => {
      mounted = false;
      if (stream) {
        console.log("Cleaning up media stream");
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return { stream, error };
};

export default useMediaStream;
