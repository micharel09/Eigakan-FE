import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  useWatchTogetherSocket,
  WatchTogetherSocketProvider,
} from "./providers/WatchTogetherSocketProvider";
import useLiveKit from "../../hooks/useLiveKit";
import roomService from "../../apis/Room/room";

import Bottom from "./components/Bottom";
import { VideoRenderer } from "./components/VideoRenderer";

const WatchTogetherContent = () => {
  const { movieId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showMyVideo, setShowMyVideo] = useState(true);

  // Sử dụng LiveKit thay vì WebRTC trực tiếp
  const {
    room,
    participants,
    isConnected,
    error,
    toggleMicrophone,
    toggleCamera,
    leaveRoom,
  } = useLiveKit(roomId, "user_" + Math.floor(Math.random() * 10000));

  // Lấy người dùng hiện tại và người dùng khác
  const localParticipant = participants.find((p) => p.isLocal);
  const remoteParticipants = participants.filter((p) => !p.isLocal);

  // Xử lý rời phòng
  const handleLeaveRoom = async () => {
    if (isLeaving) return;

    try {
      setIsLeaving(true);

      // Ngắt kết nối LiveKit
      leaveRoom();

      // Gọi API để rời phòng
      if (roomId) {
        await roomService.leaveRoom(roomId);
        console.log("Successfully left room via API");
      }

      // Chuyển hướng về trang chủ
      navigate("/");
    } catch (error) {
      console.error("Error leaving room:", error);
      navigate("/");
    } finally {
      setIsLeaving(false);
    }
  };

  const toggleMyVideoVisibility = () => {
    setShowMyVideo(!showMyVideo);
  };

  // Trạng thái audio/video
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Xử lý toggle audio
  const handleToggleAudio = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleMicrophone(!newMutedState);
  };

  // Xử lý toggle video
  const handleToggleVideo = () => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    toggleCamera(!newVideoState);
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden">
      {/* Hiển thị video của người dùng khác */}
      {remoteParticipants.length > 0 && (
        <div className="absolute flex flex-col overflow-y-auto z-20 space-y-3 w-[220px] h-[calc(100vh-40px-80px)] right-5 top-5">
          {remoteParticipants.map((participant) => (
            <div
              key={participant.identity}
              className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video"
            >
              <VideoRenderer participant={participant} />
            </div>
          ))}
        </div>
      )}

      {/* Hiển thị video của bản thân */}
      {localParticipant && showMyVideo && (
        <div className="absolute left-5 bottom-20 z-30 rounded-lg overflow-hidden shadow-lg w-[180px] h-[135px] border-2 border-white/20">
          <VideoRenderer participant={localParticipant} />
          <button
            className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1"
            onClick={toggleMyVideoVisibility}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 py-3">
        <Bottom
          muted={isMuted}
          playing={!isVideoOff}
          toggleAudio={handleToggleAudio}
          toggleVideo={handleToggleVideo}
          leaveRoom={handleLeaveRoom}
          showMyVideo={showMyVideo}
          toggleMyVideoVisibility={toggleMyVideoVisibility}
          isLeaving={isLeaving}
        />
      </div>

      {/* Hiển thị thông báo lỗi */}
      {error && (
        <div className="absolute top-5 left-0 right-0 mx-auto w-fit bg-red-500 text-white px-4 py-2 rounded-md">
          Lỗi kết nối: {error.message || "Không thể kết nối đến phòng"}
        </div>
      )}

      {/* Hiển thị thông báo đang kết nối */}
      {!isConnected && !error && (
        <div className="absolute top-5 left-0 right-0 mx-auto w-fit bg-blue-500 text-white px-4 py-2 rounded-md">
          Đang kết nối đến phòng...
        </div>
      )}
    </div>
  );
};

// Component để render video từ LiveKit
const VideoRenderer = ({ participant }) => {
  const [videoEl, setVideoEl] = useState(null);

  useEffect(() => {
    if (!videoEl || !participant) return;

    // Tìm video track
    const videoPublication = Array.from(
      participant.trackPublications.values()
    ).find((pub) => pub.kind === "video" && pub.isSubscribed);

    if (videoPublication && videoPublication.track) {
      videoPublication.track.attach(videoEl);
    }

    return () => {
      if (videoPublication && videoPublication.track) {
        videoPublication.track.detach(videoEl);
      }
    };
  }, [participant, videoEl]);

  return (
    <video
      ref={setVideoEl}
      autoPlay
      playsInline
      muted={participant.isLocal}
      className="w-full h-full object-cover"
    />
  );
};

const WatchTogether = () => {
  return (
    <WatchTogetherSocketProvider>
      <WatchTogetherContent />
    </WatchTogetherSocketProvider>
  );
};

export default WatchTogether;
