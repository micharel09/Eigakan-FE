import React, { useRef, useEffect } from "react";
import { VideoOff, Mic, MicOff } from "lucide-react";

const Player = ({ url, muted, playing, isActive, isMe = false }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    // Remove old video if exists
    const oldVideo = containerRef.current.querySelector("video");
    if (oldVideo) {
      oldVideo.srcObject = null;
      oldVideo.remove();
    }

    // Create new video element
    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.playsInline = true;

    // Quan trọng: Chỉ mute video của chính mình để tránh echo
    // Với video của người khác, không mute để nghe được âm thanh
    videoElement.muted = isMe ? true : muted;

    console.log(
      `Creating video for ${isMe ? "me" : "other user"}, muted:`,
      videoElement.muted
    );

    // Đảm bảo audio tracks được bật nếu không phải là video của mình
    if (!isMe && url) {
      const audioTracks = url.getAudioTracks();
      audioTracks.forEach((track) => {
        // Quan trọng: Luôn bật audio track của người khác
        track.enabled = true;
        console.log(`Ensuring remote audio track ${track.label} is enabled`);
      });
    }

    // Thêm sự kiện để đảm bảo video phát
    videoElement.oncanplay = () => {
      videoElement.play().catch((e) => {
        console.error("Error playing video:", e);
        // Thử lại sau một khoảng thời gian
        setTimeout(() => {
          videoElement
            .play()
            .catch((e2) => console.error("Error playing video on retry:", e2));
        }, 1000);
      });
    };

    // Thêm sự kiện để xử lý khi audio bị mute
    videoElement.onvolumechange = () => {
      console.log(
        "Volume changed:",
        videoElement.volume,
        "muted:",
        videoElement.muted
      );
    };

    // Attach stream to video
    videoElement.srcObject = url;
    videoRef.current = videoElement;

    // Add video to container
    containerRef.current.appendChild(videoElement);

    // Kích hoạt audio context để đảm bảo audio hoạt động
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      if (audioContext.state === "suspended") {
        audioContext.resume().then(() => {
          console.log("Audio context resumed for video element");
        });
      }
    } catch (e) {
      console.error("Error with audio context for video element:", e);
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
      }
    };
  }, [url, isMe, muted]);

  // Cập nhật trạng thái muted khi props thay đổi
  useEffect(() => {
    if (videoRef.current && !isMe) {
      videoRef.current.muted = muted;
      console.log(`Updated muted state for video to: ${muted}`);

      // Thêm log để kiểm tra audio context
      try {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        console.log("Audio context state:", audioContext.state);

        // Đảm bảo audio context được kích hoạt
        if (audioContext.state === "suspended") {
          audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully");
          });

          // Thử phát một âm thanh ngắn để kích hoạt audio context
          const oscillator = audioContext.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = 440; // 440Hz - âm thanh A4
          oscillator.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          console.log("Played test tone to activate audio");
        }

        // Thử kết nối stream với audio context để đảm bảo nó hoạt động
        if (url && url.getAudioTracks().length > 0 && !muted) {
          try {
            const source = audioContext.createMediaStreamSource(url);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            console.log("Connected stream to audio context");

            // Đảm bảo audio tracks được bật
            url.getAudioTracks().forEach((track) => {
              track.enabled = !muted;
              console.log(`Set incoming audio track enabled: ${track.enabled}`);
            });
          } catch (e) {
            console.error("Error connecting stream to audio context:", e);
          }
        }
      } catch (e) {
        console.error("Error with audio context:", e);
      }

      // Thử phát video lại để kích hoạt audio
      if (videoRef.current.paused) {
        videoRef.current
          .play()
          .catch((e) => console.error("Error playing video:", e));
      }
    }
  }, [muted, isMe, url]);

  // Thêm một useEffect mới để xử lý khi component mount
  useEffect(() => {
    // Thêm sự kiện click để kích hoạt audio context
    const handleUserInteraction = () => {
      if (videoRef.current && !isMe) {
        try {
          // Kích hoạt audio context
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          if (audioContext.state === "suspended") {
            audioContext.resume();
          }

          // Phát video
          if (videoRef.current.paused) {
            videoRef.current
              .play()
              .catch((e) => console.log("Error playing video:", e));
          }

          // Đảm bảo muted state được áp dụng
          videoRef.current.muted = muted;

          // Đảm bảo audio tracks được bật nếu không muted
          if (url && !muted && !isMe) {
            url.getAudioTracks().forEach((track) => {
              track.enabled = true;
            });
          }

          console.log("User interaction handled, audio context activated");

          // Xóa sự kiện sau khi đã xử lý
          document.removeEventListener("click", handleUserInteraction);
        } catch (e) {
          console.error("Error handling user interaction:", e);
        }
      }
    };

    // Thêm sự kiện click vào document
    document.addEventListener("click", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
    };
  }, [isMe, muted, url]);

  return (
    <div
      className={`relative overflow-hidden bg-gray-800 ${
        isActive
          ? "w-full h-full rounded-lg"
          : isMe
          ? "w-full h-full rounded-lg"
          : "w-full h-40 rounded-md shadow-md"
      }`}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ display: url ? "block" : "none" }}
      />

      {(!playing || !url) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <VideoOff className="text-white" size={isActive ? 48 : 20} />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 flex justify-between items-center">
        <span className="text-xs text-white">
          {isMe ? "You" : "Other user"}
        </span>

        {/* Hiển thị icon mic dựa trên trạng thái muted */}
        {!isMe && (
          <div className="flex items-center">
            {muted ? (
              <MicOff className="text-red-500" size={16} />
            ) : (
              <Mic className="text-green-500" size={16} />
            )}
            <span className="text-xs ml-1">{muted ? "Muted" : "Unmuted"}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;
