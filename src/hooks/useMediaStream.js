import { useState, useEffect, useRef } from "react";

const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const isStreamSet = useRef(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (isStreamSet.current) return;

    const initStream = async () => {
      try {
        console.log("Requesting media permissions...");

        // Tạo audio context trước
        try {
          audioContextRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
          console.log("Audio context created:", audioContextRef.current.state);

          // Kích hoạt audio context
          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
            console.log("Audio context resumed");
          }
        } catch (e) {
          console.error("Error creating audio context:", e);
        }

        // Yêu cầu quyền truy cập với các tùy chọn cụ thể cho audio
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 2,
            sampleRate: 48000,
            sampleSize: 16,
            // Thêm các ràng buộc để đảm bảo chất lượng audio
            latency: 0.01,
            volume: 1.0,
          },
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { max: 30 },
          },
        });

        console.log("Media stream initialized successfully");

        // Đảm bảo audio tracks được bật và có chất lượng tốt
        const audioTracks = mediaStream.getAudioTracks();
        console.log("Audio tracks:", audioTracks.length);

        if (audioTracks.length > 0) {
          // Đảm bảo tất cả audio tracks đều được bật
          audioTracks.forEach((track) => {
            track.enabled = true;

            // Thử áp dụng các ràng buộc để cải thiện chất lượng
            try {
              const capabilities = track.getCapabilities();
              console.log("Audio track capabilities:", capabilities);

              // Nếu có thể, áp dụng các ràng buộc tốt nhất
              if (capabilities) {
                const constraints = {};
                if (capabilities.autoGainControl)
                  constraints.autoGainControl = true;
                if (capabilities.echoCancellation)
                  constraints.echoCancellation = true;
                if (capabilities.noiseSuppression)
                  constraints.noiseSuppression = true;

                track
                  .applyConstraints(constraints)
                  .then(() =>
                    console.log("Applied optimal constraints to audio track")
                  )
                  .catch((e) =>
                    console.error("Error applying constraints:", e)
                  );
              }
            } catch (e) {
              console.error("Error optimizing audio track:", e);
            }

            console.log("Audio track enabled:", {
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              constraints: track.getConstraints(),
            });
          });

          // Thử xử lý audio qua AudioContext để cải thiện chất lượng
          try {
            if (audioContextRef.current) {
              const source =
                audioContextRef.current.createMediaStreamSource(mediaStream);
              const destination =
                audioContextRef.current.createMediaStreamDestination();

              // Thêm một compressor để cải thiện âm thanh
              const compressor =
                audioContextRef.current.createDynamicsCompressor();
              compressor.threshold.value = -50;
              compressor.knee.value = 40;
              compressor.ratio.value = 12;
              compressor.attack.value = 0;
              compressor.release.value = 0.25;

              // Thêm một gain node để tăng âm lượng
              const gainNode = audioContextRef.current.createGain();
              gainNode.gain.value = 1.5; // Tăng âm lượng lên 50%

              // Kết nối các node
              source.connect(compressor);
              compressor.connect(gainNode);
              gainNode.connect(destination);

              console.log("Audio processing chain set up");

              // Thêm các track từ destination vào stream
              const processedAudioTrack =
                destination.stream.getAudioTracks()[0];
              if (processedAudioTrack) {
                // Thay thế audio track cũ bằng track đã xử lý
                const originalTrack = mediaStream.getAudioTracks()[0];
                mediaStream.removeTrack(originalTrack);
                mediaStream.addTrack(processedAudioTrack);
                console.log(
                  "Replaced original audio track with processed track"
                );
              }
            }
          } catch (e) {
            console.error("Error setting up audio processing:", e);
          }
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
              channelCount: 2,
              sampleRate: 48000,
              sampleSize: 16,
              latency: 0.01,
              volume: 1.0,
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

    // Cleanup function
    return () => {
      if (stream) {
        console.log("Cleaning up media stream");
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }

      // Đóng audio context
      if (audioContextRef.current) {
        audioContextRef.current
          .close()
          .then(() => {
            console.log("Audio context closed");
          })
          .catch((e) => {
            console.error("Error closing audio context:", e);
          });
      }
    };
  }, []);

  return {
    stream,
  };
};

export default useMediaStream;
