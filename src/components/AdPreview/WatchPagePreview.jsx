import React, { useState, useEffect, useRef } from "react";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  CloseOutlined,
  SoundOutlined,
  ExpandOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SettingOutlined,
} from "@ant-design/icons";
const WatchPagePreview = ({
  slotLocation = "CENTER",
  image = "",
  video = "",
  content = "",
  url = "",
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(33);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [remainingTime, setRemainingTime] = useState("-48:58");
  const [showAd, setShowAd] = useState(true);
  const [countDown, setCountDown] = useState(5);
  const [hovered, setHovered] = useState(false);
  const [canClose, setCanClose] = useState(false);

  // Giả lập video player với hình ảnh tĩnh (Joker movie screenshot)
  const mockMovieFrame =
    "https://i.pinimg.com/736x/a4/8c/3e/a48c3eddd75956b8cdf9f6b465df605d.jpg";

  // Tạo ad object
  const adObject = {
    image,
    video,
    content,
    url,
    id: "preview-ad-id",
  };

  // Hiệu ứng đếm ngược cho quảng cáo
  useEffect(() => {
    let timer;
    if (showAd && countDown > 0) {
      timer = setInterval(() => {
        setCountDown((prev) => prev - 1);
      }, 1000);
    }

    if (countDown === 0) {
      setCanClose(true);
    }

    return () => clearInterval(timer);
  }, [showAd, countDown]);

  const handleCloseAd = () => {
    if (canClose) {
      setShowAd(false);
    }
  };

  // Sidebar Ad Component
  const SidebarAd = () => {
    if (!adObject.image && !adObject.video && !adObject.content) return null;

    return (
      <div className="rounded overflow-hidden bg-black bg-opacity-40 h-full w-full flex flex-col">
        <div className="text-white text-[10px] uppercase text-center p-1 font-light">
          SPONSORED
        </div>
        {adObject.image ? (
          <a
            href={adObject.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block flex-1 overflow-hidden"
          >
            <img
              src={adObject.image}
              alt="Advertisement"
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/240x600?text=Ad";
              }}
            />
          </a>
        ) : (
          <div className="flex-1 bg-gray-800 flex items-center justify-center text-white text-sm p-4 text-center">
            {adObject.content || "Advertisement Content"}
          </div>
        )}

        {adObject.content && (
          <div className="text-white text-xs p-1 text-center">
            {adObject.content}
          </div>
        )}

        {adObject.url && (
          <a
            href={adObject.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#FF009F]/30 text-white text-center py-0.5 text-[10px] px-1 hover:bg-[#FF009F]/50 transition-colors"
          >
            Learn More
          </a>
        )}
      </div>
    );
  };

  // Header & Footer Ad Component
  const BannerAd = ({ className }) => {
    if (!adObject.image && !adObject.content) return null;

    return (
      <div className={`relative w-full h-full ${className}`}>
        <a
          href={adObject.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <img
            src={adObject.image || "https://placehold.co/728x90?text=Ad"}
            alt="Advertisement"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/728x90?text=Ad";
            }}
          />
        </a>
      </div>
    );
  };

  // Center Ad Overlay
  const CenterAd = () => {
    if (!showAd) return null;

    return (
      <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="max-w-xl w-full mx-auto relative">
          {canClose && (
            <button
              className="absolute -top-4 -right-4 w-8 h-8 bg-[#FF009F] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#d1007f] transition-colors z-10"
              onClick={handleCloseAd}
            >
              <CloseOutlined style={{ fontSize: "12px" }} />
            </button>
          )}

          <div className="bg-black rounded-lg overflow-hidden border border-white/10 shadow-xl">
            <div className="bg-[#FF009F]/10 px-3 py-1 text-center border-b border-[#FF009F]/20">
              <span className="text-[#FF009F] text-[10px] uppercase tracking-wider font-medium">
                SPONSORED ADVERTISEMENT
              </span>
            </div>

            <div className="p-3">
              {adObject.video ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                  <video
                    src={adObject.video}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                  />
                </div>
              ) : adObject.image ? (
                <a
                  href={adObject.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={adObject.image}
                    alt="Advertisement"
                    className="w-full max-h-[300px] object-contain rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/800x600?text=Ad";
                    }}
                  />
                </a>
              ) : (
                <div className="bg-gray-800 h-[200px] w-full flex items-center justify-center text-white rounded-lg">
                  Advertisement Content
                </div>
              )}

              {adObject.content && (
                <div className="mt-2 text-white/80 text-xs text-center">
                  {adObject.content}
                </div>
              )}

              {!canClose && (
                <div className="mt-2 text-center">
                  <div className="bg-black/50 py-1 px-3 rounded-lg inline-block">
                    <p className="text-white/90 text-[10px] mb-1">
                      <span className="text-[#FF009F]">Close button</span> will
                      appear in{" "}
                      <span className="font-bold text-[#FF009F]">
                        {countDown}
                      </span>{" "}
                      seconds
                    </p>
                    <div className="w-24 h-1 bg-[#3A0033] rounded-full overflow-hidden mx-auto">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF009F] to-[#FF4DB8]"
                        style={{
                          width: `${(countDown / 5) * 100}%`,
                          transition: "width 1s linear",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-1 border-t border-white/5 bg-black/40">
              <p className="text-white/40 text-[8px] text-center">
                Your privacy matters. No user data is collected from this
                advertisement.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-black overflow-hidden text-white relative">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/10 bg-black z-10 relative">
        <div className="text-[#FF009F] font-bold text-lg">EIGAKAN</div>

        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-1 text-white/80 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
            </svg>
            <span>Dashboard</span>
          </div>
          <div className="flex items-center space-x-1 text-white/80 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h-2v-2h2zm-2-2h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zM7 9h2v2H7V9zm0 4h2v2H7v-2zM5 5h2v2H5V5zm0 4h2v2H5V9zm0 4h2v2H5v-2z"
                clipRule="evenodd"
              />
            </svg>
            <span>Movies</span>
          </div>
          <div className="flex items-center space-x-1 text-white/80 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            <span>Genres</span>
          </div>
          <div className="flex items-center space-x-1 text-white/80 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span>Popular People</span>
          </div>
          <div className="flex items-center space-x-1 text-white/80 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                clipRule="evenodd"
              />
              <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
            </svg>
            <span>News</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-[#FF009F] text-white px-2 py-0.5 rounded-full text-[10px]">
            <span>Join Room</span>
          </div>

          <div className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-2.5 w-2.5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-white text-[10px]">Search</span>
          </div>
        </div>
      </div>

      {/* Header Ad */}
      {slotLocation === "HEADER" && (
        <div className="absolute top-12 left-0 right-0 z-10 flex justify-center items-center pointer-events-auto px-4">
          <div className="w-full max-w-[600px] bg-black/40 rounded overflow-hidden">
            <div className="relative w-full aspect-[12/1]">
              <BannerAd className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Giữ kích thước cố định không phụ thuộc vào sidebar */}
      <div className="flex bg-black absolute inset-0 pt-[40px]">
        {/* Left Sidebar */}
        <div
          className={`w-[165px] ${
            slotLocation === "SIDEBAR-LEFT" ? "" : "invisible"
          }`}
        >
          {slotLocation === "SIDEBAR-LEFT" && <SidebarAd />}
        </div>

        {/* Video Area - Luôn giữ vị trí và kích thước cố định */}
        <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="relative w-full max-w-[600px] aspect-video mx-auto">
            {/* Video Content */}
            <img
              src={mockMovieFrame}
              alt="Movie Scene"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://i.pinimg.com/736x/a4/8c/3e/a48c3eddd75956b8cdf9f6b465df605d.jpg";
              }}
            />

            {/* Eigakan logo watermark */}
            <div className="absolute top-2 right-2 opacity-50">
              <span className="text-[#FF009F] font-bold text-sm">EIGAKAN</span>
            </div>

            {/* Progress bar (pink line at bottom) */}
            <div className="absolute bottom-14 left-0 right-0 h-0.5 bg-[#FF009F]"></div>

            {/* Player Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="text-white p-0.5">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="text-white/80 text-[10px]">
                    <span>-48:58</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="text-white p-0.5">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  </button>
                  <button className="text-white p-0.5">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Movie Info Button */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-5 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] rounded-t-lg flex items-center justify-center cursor-pointer">
              <span className="text-white text-[10px]">Movie Info</span>
            </div>
          </div>

          {/* Center Ad */}
          {slotLocation === "CENTER" && <CenterAd />}
        </div>

        {/* Right Sidebar */}
        <div
          className={`w-[165px] ${
            slotLocation === "SIDEBAR-RIGHT" ? "" : "invisible"
          }`}
        >
          {slotLocation === "SIDEBAR-RIGHT" && <SidebarAd />}
        </div>
      </div>

      {/* Footer Ad */}
      {slotLocation === "FOOTER" && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center pointer-events-auto px-4 z-10">
          <div className="w-full max-w-[600px] bg-black/40 rounded overflow-hidden">
            <div className="relative w-full aspect-[12/1]">
              <BannerAd className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      {/* Movie Info Button - Đảm bảo hiển thị trên cùng so với footer ad */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-20 h-5 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] rounded-t-lg flex items-center justify-center cursor-pointer">
          <span className="text-white text-[10px]">Movie Info</span>
        </div>
      </div>
    </div>
  );
};

export default WatchPagePreview;
