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

    // QUAN TRỌNG: Chỉ mute ELEMENT của chính mình, không mute element của người khác
    // Điều này khác với việc bật/tắt audio track
    videoElement.muted = isMe; // Chỉ mute element của mình để tránh echo

    console.log(
      `Creating video element for ${
        isMe ? "me" : "other user"
      }, element muted: ${videoElement.muted}, track muted state: ${muted}`
    );

    videoElement.className = "w-full h-full object-cover";

    // Mirror video if it's your camera
    if (isMe) {
      videoElement.style.transform = "scaleX(-1)";
    }

    // Attach stream to video
    videoElement.srcObject = url;

    // Thêm xử lý sự kiện để đảm bảo audio hoạt động
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch((err) => {
        console.error("Error playing video:", err);
        // Thử lại với user interaction
        document.addEventListener(
          "click",
          () => {
            videoElement
              .play()
              .catch((e) => console.error("Still can't play:", e));
          },
          { once: true }
        );
      });
    };

    // Add video to container
    containerRef.current.appendChild(videoElement);

    // Log for debugging
    console.log(
      `Created new video element for ${
        isMe ? "me" : "other user"
      } with stream:`,
      url
    );

    // Debug audio tracks
    if (url && url.getAudioTracks) {
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

      // Đảm bảo audio tracks được bật/tắt theo trạng thái muted
      audioTracks.forEach((track) => {
        // Nếu là video của người khác, trạng thái enabled phụ thuộc vào muted
        if (!isMe) {
          track.enabled = !muted;
          console.log(
            `Setting remote audio track enabled to: ${track.enabled}`
          );
        }
        // Nếu là video của mình, trạng thái enabled phụ thuộc vào muted
        else {
          track.enabled = !muted;
          console.log(`Setting my audio track enabled to: ${track.enabled}`);
        }
      });
    }

    // Hiển thị video ngay cả khi playing=false
    if (containerRef.current) {
      containerRef.current.style.display = "block";
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
        videoElement.remove();
      }
    };
  }, [url, muted, isMe]); // Bỏ playing khỏi dependencies để tránh re-render không cần thiết

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
      <div ref={containerRef} className="w-full h-full" />

      {!url && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <VideoOff className="text-white" size={isActive ? 48 : 20} />
        </div>
      )}

      {!playing && url && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70">
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
