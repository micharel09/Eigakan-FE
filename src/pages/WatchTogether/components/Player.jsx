import React, { useRef, useEffect } from "react";
import { VideoOff, Mic, MicOff } from "lucide-react";

const Player = ({
  url,
  muted = false,
  playing = false,
  isActive = false,
  isMe = false,
}) => {
  const containerRef = useRef(null);

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

    // Chỉ mute video của chính mình hoặc nếu người dùng đã tắt mic
    videoElement.muted = isMe || muted;

    console.log(
      `Creating video element for ${isMe ? "me" : "other user"}, muted: ${
        videoElement.muted
      }`
    );

    videoElement.className = "w-full h-full object-cover";

    // Mirror video if it's your camera
    if (isMe) {
      videoElement.style.transform = "scaleX(-1)";
    }

    // Attach stream to video
    videoElement.srcObject = url;

    // Thêm sự kiện để xử lý khi stream sẵn sàng
    videoElement.onloadedmetadata = () => {
      console.log(
        `Video element loaded metadata for ${isMe ? "me" : "other user"}`
      );
      videoElement.play().catch((err) => {
        console.error("Error playing video:", err);

        // Thử lại phát video sau một khoảng thời gian
        setTimeout(() => {
          videoElement.play().catch((retryErr) => {
            console.error("Retry playing video failed:", retryErr);
          });
        }, 1000);
      });
    };

    // Thêm sự kiện để xử lý khi có lỗi
    videoElement.onerror = (err) => {
      console.error(
        `Video element error for ${isMe ? "me" : "other user"}:`,
        err
      );
    };

    // Add video to container
    containerRef.current.appendChild(videoElement);

    // Debug stream tracks
    if (url) {
      if (url.getVideoTracks) {
        const videoTracks = url.getVideoTracks();
        console.log(
          `Video tracks for ${isMe ? "me" : "other user"}:`,
          videoTracks.map((t) => ({
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
            label: t.label,
          }))
        );
      }

      if (url.getAudioTracks) {
        const audioTracks = url.getAudioTracks();
        console.log(
          `Audio tracks for ${isMe ? "me" : "other user"}:`,
          audioTracks.map((t) => ({
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
            label: t.label,
          }))
        );
      }
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
      }
    };
  }, [url, muted, isMe]);

  // Hiển thị video ngay cả khi playing=false, nhưng ẩn nếu không có url
  const showVideo = url != null;

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
        style={{ display: showVideo ? "block" : "none" }}
      />

      {!showVideo && (
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
