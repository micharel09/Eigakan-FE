import { useState, useEffect, useRef } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const isStreamSet = useRef(false);

  useEffect(() => {
    if (isStreamSet.current) return;

    const getMediaStream = async () => {
      try {
        console.log("Requesting media stream...");

        // Kiểm tra quyền truy cập trước
        const permissions = await navigator.permissions.query({
          name: "microphone",
        });
        console.log("Microphone permission status:", permissions.state);

        // Yêu cầu cả audio và video
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        console.log("Media stream obtained successfully");
        console.log(
          "Video tracks:",
          mediaStream.getVideoTracks().map((t) => ({
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
          }))
        );
        console.log(
          "Audio tracks:",
          mediaStream.getAudioTracks().map((t) => ({
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
          }))
        );

        setStream(mediaStream);
        isStreamSet.current = true;
      } catch (error) {
        console.error("Error getting media stream:", error);
        setPermissionError(error.message);

        // Nếu lỗi video, thử lại với chỉ audio
        if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          try {
            console.log("Trying audio only...");
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });

            console.log("Audio-only stream obtained successfully");
            setStream(audioOnlyStream);
            isStreamSet.current = true;
          } catch (audioError) {
            console.error("Error getting audio-only stream:", audioError);
            setPermissionError(audioError.message);
          }
        }
      }
    };

    getMediaStream();

    return () => {
      if (stream) {
        console.log("Cleaning up media stream");
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [stream]);

  return {
    stream,
    permissionError,
  };
};

export default useMediaStream;
