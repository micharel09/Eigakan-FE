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
    // Với video của người khác, chỉ mute nếu họ đã tắt mic (muted=true)
    videoElement.muted = isMe ? true : muted;

    console.log(
      `Creating video for ${isMe ? "me" : "other user"}, muted:`,
      videoElement.muted
    );

    videoElement.className = "w-full h-full object-cover";

    // Mirror video if it's your camera
    if (isMe) {
      videoElement.style.transform = "scaleX(-1)";
    }

    // Attach stream to video
    videoElement.srcObject = url;
    videoRef.current = videoElement;

    // Add video to container
    containerRef.current.appendChild(videoElement);

    // Log for debugging
    console.log(
      `Created new video element for ${
        isMe ? "me" : "other user"
      } with stream:`,
      url
    );

    // Log audio tracks
    const audioTracks = url.getAudioTracks();
    console.log(
      `Audio tracks for ${isMe ? "me" : "other user"}:`,
      audioTracks.map((t) => ({
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState,
      }))
    );

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
      }
    };
  }, [url, isMe]);

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

        // Thử phát một âm thanh ngắn để kích hoạt audio context
        if (audioContext.state === "suspended") {
          const oscillator = audioContext.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = 0; // 0Hz - không nghe thấy
          oscillator.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.001);
          console.log("Attempted to resume audio context");
        }
      } catch (e) {
        console.error("Error checking audio context:", e);
      }
    }
  }, [muted, isMe]);

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

        {!isMe &&
          (muted ? (
            <MicOff className="text-white" size={16} />
          ) : (
            <Mic className="text-white" size={16} />
          ))}
      </div>
    </div>
  );
};

export default Player;
