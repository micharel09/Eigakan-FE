import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, Clock } from "lucide-react";
import { Rate } from "antd";
import moment from "moment";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import adMediaCountService from "../../apis/AdMedia/adMediaCount";
import {
  useAuth,
  useVideo,
  usePlaybackPosition,
  useViewCounter,
  useMovieRating,
  useMovieComments,
  useAdDisplay,
  AD_CONSTANTS,
  AdUIUtils,
} from "../../hooks";

// Constants - Tập trung các giá trị cố định để dễ bảo trì
const CONSTANTS = {
  PLAYER_SCRIPT_URL:
    "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js",
  FALLBACK_VIDEO_URL:
    "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  FALLBACK_IMAGE_URL: "https://placehold.co/200x400?text=Ad",
};

// Utility functions - Tách các chức năng lặp lại thành các hàm riêng biệt
const FullscreenUtils = {
  // Kiểm tra xem tài liệu có đang ở chế độ fullscreen không
  isFullscreen: () => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  },

  // Lấy element đang ở chế độ fullscreen
  getFullscreenElement: () => {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  },

  // Thoát khỏi chế độ fullscreen
  exitFullscreen: () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  },

  // Yêu cầu chế độ fullscreen cho một element
  requestFullscreen: (element, fallbackToForcedClick = true) => {
    if (!element) return false;

    try {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      } else if (fallbackToForcedClick) {
        FullscreenUtils.useClickMethodForFullscreen(element);
        return true;
      } else {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error entering fullscreen:", error);
      if (fallbackToForcedClick) {
        FullscreenUtils.useClickMethodForFullscreen(element);
        return true;
      }
      return false;
    }
  },

  // Phương pháp thay thế sử dụng click để vào fullscreen (khi API tiêu chuẩn không hoạt động)
  useClickMethodForFullscreen: (element) => {
    console.log("Using click method for fullscreen");
    const tempButton = document.createElement("button");
    tempButton.style.position = "fixed";
    tempButton.style.top = "0";
    tempButton.style.left = "0";
    tempButton.style.width = "100%";
    tempButton.style.height = "100%";
    tempButton.style.opacity = "0";
    tempButton.style.zIndex = "-1";
    tempButton.textContent = "Fullscreen";

    tempButton.addEventListener("click", () => {
      // Thử lại việc vào fullscreen khi có user interaction
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }

      // Xóa nút sau khi click
      document.body.removeChild(tempButton);
    });

    document.body.appendChild(tempButton);
    // Giả lập click sau một chút delay
    setTimeout(() => {
      tempButton.click();
    }, 300);
  },
};

// Utility để tạo player từ script
const PlayerUtils = {
  // Tải player script nếu chưa tải
  loadPlayerScript: async () => {
    if (typeof window.playerjs !== "undefined") return true;

    try {
      const script = document.createElement("script");
      script.src = CONSTANTS.PLAYER_SCRIPT_URL;
      script.async = true;

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      return true;
    } catch (error) {
      console.error("Failed to load player script:", error);
      return false;
    }
  },

  // Khởi tạo player và trả về instance
  initializePlayer: async (elementRef, options = {}) => {
    if (!elementRef.current) return null;

    await PlayerUtils.loadPlayerScript();

    try {
      const player = new window.playerjs.Player(elementRef.current);

      // Thiết lập các event listeners cơ bản
      player.on("ready", () => {
        if (options.autoplay) {
          player.setMute(options.startMuted !== false);
          player.setVolume(options.startMuted !== false ? 0 : 50);

          if (options.loop) {
            player.setLoop(true);
          }

          if (options.hideControls) {
            player.hideControls();
          }

          player.play();

          // Try again để đảm bảo autoplay
          setTimeout(() => {
            player.play();

            // Gradually increase volume after playback starts
            if (options.startMuted !== false) {
              setTimeout(() => {
                player.setMute(false);
                player.setVolume(50);
                if (options.hideControls) {
                  player.hideControls();
                }
              }, AD_CONSTANTS.VOLUME_FADE_DELAY);
            }
          }, 100);
        }
      });

      return player;
    } catch (error) {
      console.error("Failed to initialize player:", error);
      return null;
    }
  },
};

// Extract AdDisplay as a memoized component
const AdDisplay = memo(({ ad, className, movieId }) => {
  if (!ad) return null;

  // Check if it's a header ad or sidebar ad
  const isHeaderAd = className && className.includes("max-h-[100px]");
  const isSidebarAd = className && className.includes("sidebar-ad");

  // For video ads in regular ad slots
  const adVideoRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const isInitializingRef = useRef(false);

  // Get handleAdClick from useAdDisplay hook
  const { handleAdClick } = useAdDisplay({});

  // Initialize video player if this is a video ad
  useEffect(() => {
    if (!ad.video || !adVideoRef.current) return;

    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    let isComponentMounted = true;

    // Sử dụng PlayerUtils thay vì code trực tiếp
    const initPlayer = async () => {
      try {
        // Khởi tạo player với các options phù hợp
        const player = await PlayerUtils.initializePlayer(adVideoRef, {
          autoplay: true,
          startMuted: true,
          loop: true,
          hideControls: true,
        });

        if (!player || !isComponentMounted) return;

        playerInstanceRef.current = player;
      } catch (error) {
        console.error("Failed to initialize ad video player:", error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initPlayer();

    // Clean up function
    return () => {
      isComponentMounted = false;
      isInitializingRef.current = false;

      if (playerInstanceRef.current) {
        // Disconnect events
        try {
          playerInstanceRef.current.off("ready");
          playerInstanceRef.current.off("error");
        } catch (err) {
          console.warn("Error cleaning up player events:", err);
        }
      }
    };
  }, [ad.video]);

  // Clean up player on component unmount
  useEffect(() => {
    return () => {
      if (playerInstanceRef.current) {
        console.log("Final cleanup of ad player");
        try {
          // Try to pause the video before cleanup
          playerInstanceRef.current.pause();
        } catch (err) {}

        playerInstanceRef.current = null;
        isInitializingRef.current = false;
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div className="text-white text-xs uppercase tracking-wider mb-1 text-center font-light">
        SPONSORED
      </div>

      {/* Display video if available */}
      {ad.video ? (
        <div
          className={`relative w-full overflow-hidden rounded ${
            isHeaderAd
              ? "h-[60px]"
              : isSidebarAd
              ? "aspect-[9/16] h-[calc(100vh-220px)] max-h-full flex-1"
              : "aspect-video"
          }`}
          onClick={() => handleAdClick(ad.id, movieId)}
          style={{ cursor: "pointer" }}
        >
          <iframe
            ref={adVideoRef}
            src={`${ad.video}${
              ad.video.includes("?") ? "&" : "?"
            }autoplay=1&muted=1&controls=0&playsinline=1&enablejsapi=1&loop=1&playlist=${ad.video
              .split("/")
              .pop()}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
            frameBorder="0"
            autoPlay
            muted
            playsInline
            loading="eager"
          />
        </div>
      ) : (
        // Display image if no video
        <a
          href={ad.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          onClick={() => handleAdClick(ad.id, movieId)}
        >
          <img
            src={ad.image}
            alt="Advertisement"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = CONSTANTS.FALLBACK_IMAGE_URL;
            }}
          />
        </a>
      )}

      {/* Add visit button for video ads if URL is provided */}
      {ad.video && ad.url && !isHeaderAd && (
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full mt-2 bg-white/10 text-white text-center py-1 text-sm rounded hover:bg-white/20 transition-colors"
          onClick={() => handleAdClick(ad.id, movieId)}
        >
          Visit Site
        </a>
      )}

      {ad.content && !isHeaderAd && (
        <div className="text-white text-sm mt-2 text-center">{ad.content}</div>
      )}
    </div>
  );
});

// Extract CenterAdDisplay as a memoized component
const CenterAdDisplay = memo(({ centerAd, showCenterAd, setShowCenterAd }) => {
  if (!centerAd || !showCenterAd) return null;

  // Add state to track close button visibility
  const [showCloseButton, setShowCloseButton] = useState(false);
  // Add countdown state
  const [countdown, setCountdown] = useState(10);

  // Create a separate useVideo hook instance for the ad video
  const adVideoRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const isInitializingRef = useRef(false);

  // Add effect to show close button after 10 seconds with countdown
  useEffect(() => {
    let timer;
    let countdownInterval;

    if (showCenterAd) {
      // Initialize countdown to 10 seconds
      setCountdown(10);

      // Set up countdown interval
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return newCount;
        });
      }, 1000);

      // Set timeout to show close button after 10 seconds
      timer = setTimeout(() => {
        setShowCloseButton(true);
        clearInterval(countdownInterval);
      }, 10000); // 10 seconds delay
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [showCenterAd]);

  // Only initialize the player when the ad has a video and is visible
  useEffect(() => {
    if (!centerAd?.video || !showCenterAd || !adVideoRef.current) return;

    // Avoid multiple initialization attempts
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    let isComponentMounted = true;

    // Sử dụng PlayerUtils để khởi tạo player
    const initPlayer = async () => {
      try {
        const player = await PlayerUtils.initializePlayer(adVideoRef, {
          autoplay: true,
          startMuted: true,
          loop: true,
          hideControls: true,
        });

        if (!player || !isComponentMounted) return;

        playerInstanceRef.current = player;
      } catch (error) {
        console.error("Failed to initialize center ad player:", error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initPlayer();

    // Cleanup function - disconnect events but don't destroy player
    return () => {
      isComponentMounted = false;
      isInitializingRef.current = false;

      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.off("ready");
          playerInstanceRef.current.off("error");
        } catch (err) {
          console.warn("Error cleaning up center ad player events:", err);
        }
      }
    };
  }, [centerAd?.video, showCenterAd]);

  // Clean up player on component unmount or when ad is closed
  useEffect(() => {
    return () => {
      if (playerInstanceRef.current) {
        console.log("Final cleanup of center ad player");
        try {
          // Try to pause the video before cleanup
          playerInstanceRef.current.pause();
        } catch (err) {}

        playerInstanceRef.current = null;
        isInitializingRef.current = false;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-3xl max-h-[80vh] w-full mx-auto">
        {/* Show close button only after delay - Improved styling */}
        {showCloseButton && (
          <button
            onClick={() => setShowCenterAd(false)}
            className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-[#FF009F] text-white flex items-center justify-center hover:bg-[#D1007F] transition-colors z-10 shadow-lg"
            aria-label="Close advertisement"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
        )}

        {/* Ad content container - Cleaner, more minimalist design */}
        <div className="bg-black/90 rounded-xl overflow-hidden border border-white/10 shadow-xl relative">
          {/* Header */}
          <div className="bg-[#FF009F]/10 px-4 py-2 text-center border-b border-[#FF009F]/20">
            <span className="text-[#FF009F] text-xs uppercase tracking-wider font-medium">
              Sponsored Advertisement
            </span>
          </div>

          {/* Content area */}
          <div className="p-3">
            {/* Video ad content with optimized container */}
            {centerAd.video ? (
              <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-lg group">
                <iframe
                  ref={adVideoRef}
                  src={`${centerAd.video}${
                    centerAd.video.includes("?") ? "&" : "?"
                  }autoplay=1&muted=1&controls=0&playsinline=1&enablejsapi=1&loop=1&playlist=${centerAd.video
                    .split("/")
                    .pop()}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media"
                  frameBorder="0"
                  autoPlay
                  muted
                  playsInline
                  loading="eager"
                />

                {/* Gradient overlay with integrated visit button */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a
                    href={centerAd.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#FF009F]/90 hover:bg-[#FF009F] text-white text-sm font-medium py-2 px-4 rounded-md transition-all transform hover:scale-105 shadow-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Visit Site
                  </a>
                </div>
              </div>
            ) : centerAd.image ? (
              /* Image ad content with improved styling and integrated visit button */
              <a
                href={centerAd.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full group relative"
              >
                <div className="overflow-hidden rounded-lg shadow-lg">
                  <img
                    src={centerAd.image}
                    alt="Advertisement"
                    className="w-full object-contain rounded-lg max-h-[60vh] transform transition-transform group-hover:scale-[1.02]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = CONSTANTS.FALLBACK_IMAGE_URL;
                    }}
                  />

                  {/* Overlay on hover with subtle visit indicator */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                    <div className="inline-flex items-center gap-2 text-white text-sm font-medium">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Visit Advertiser
                    </div>
                  </div>
                </div>
              </a>
            ) : null}

            {/* Ad content text with improved styling */}
            {centerAd.content && (
              <div className="mt-3 text-white/80 text-center text-sm">
                {centerAd.content}
              </div>
            )}

            {/* Close instruction */}
            <div className="mt-4 text-center">
              {showCloseButton ? (
                <p className="text-white/60 text-xs">
                  Click the X button to close this ad
                </p>
              ) : (
                <div className="bg-black/80 py-2 px-4 rounded-lg inline-block">
                  <p className="text-white/90 text-xs mb-2">
                    <span className="text-[#FF009F]">Close button</span> will
                    appear in{" "}
                    <span className="font-bold text-[#FF009F]">
                      {countdown}
                    </span>{" "}
                    seconds
                  </p>
                  {/* Improved progress bar */}
                  <div className="w-32 h-1 bg-[#3A0033] rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF009F] to-[#FF4DB8]"
                      style={{
                        width: `${(countdown / 10) * 100}%`,
                        transition: "width 1s linear",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with privacy notice */}
          <div className="px-4 py-2 border-t border-white/5 bg-black/40">
            <p className="text-white/40 text-[10px] text-center">
              Your privacy matters. No user data is collected from this
              advertisement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

const WatchPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(4);
  const [adPlaybackAttempted, setAdPlaybackAttempted] = useState(false);
  const [prerollAdFinished, setPrerollAdFinished] = useState(false);
  const [showPrerollAd, setShowPrerollAd] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [directVideoUrl, setDirectVideoUrl] = useState("");

  // Refs for ads management
  const adPlayersRef = useRef([]);
  const mainPlayerRef = useRef(null);
  const isMainPlayerInitializingRef = useRef(false);
  const hasShownMidRollAd = useRef(false);
  const inStreamAdRef = useRef(null);

  // Refs for timer management
  const hideTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Authentication hook
  const { isAuthenticated, role } = useAuth();

  // Video player hook
  const { iframeRef, playerReady, duration, formatTime, playVideo, seekTo } =
    useVideo({
      videoUrl: showTrailer
        ? movie?.medias?.find((m) => m.type === "TRAILER")?.url
        : movie?.medias?.find((m) => m.type === "FILMVIP")?.url,
      onTimeUpdate: (seconds) => {
        // Pass current time to playback position hook
        playbackPosition.savePlaybackTime(seconds);

        // Phát quảng cáo khi đạt đến một thời điểm cụ thể
        if (
          role !== "VIP MEMBER" &&
          seconds >= AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME &&
          !hasShownMidRollAd.current &&
          mainPlayerRef.current
        ) {
          console.log(
            `Đã đạt đến ${AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME} giây, hiển thị quảng cáo`
          );
          hasShownMidRollAd.current = true;
          showInStreamAd();
        }
      },
      onPause: (seconds) => {
        playbackPosition.savePlaybackTime(seconds);
      },
      onEnded: () => {
        playbackPosition.clearPlaybackTime();
      },
    });

  // Playback position hook
  const playbackPosition = usePlaybackPosition({
    movieId,
    isTrailer: showTrailer,
    duration,
    playerReady,
  });

  // View counter hook (called for side effects only)
  useViewCounter({
    movie,
    isTrailer: showTrailer,
    playerRef: iframeRef, // Use iframe ref for intersection observer
  });

  // Movie rating hook
  const {
    userRating,
    submittingRating,
    hasUserRated,
    handleRating,
    canRateAndComment,
  } = useMovieRating({
    movieId,
    isAuthenticated,
  });

  // Movie comments hook
  const {
    commentInput,
    setCommentInput,
    userDetails,
    loadingComments,
    handleCommentSubmit: submitComment,
  } = useMovieComments({
    movieId,
    isAuthenticated,
    movie,
  });

  // Ad display hook
  const { centerAd, showCenterAd, setShowCenterAd } = useAdDisplay({
    isAuthenticated,
    userRole: role,
  });

  const handlePrerollAdFinished = useCallback(() => {
    console.log("Quảng cáo pre-roll kết thúc, bắt đầu phát video chính");
    setPrerollAdFinished(true);
    setShowPrerollAd(false);
    setShowSkipButton(false);

    // Bắt đầu phát video chính
    if (mainPlayerRef.current) {
      try {
        // Đặt thời gian về 0 trước khi phát
        mainPlayerRef.current.setCurrentTime(0);

        // Thêm nhiều cách để đảm bảo video phát
        const playVideo = () => {
          mainPlayerRef.current.play();
          console.log("Đang cố gắng phát video chính");

          // Thử phát lại sau một khoảng thời gian ngắn để đảm bảo
          setTimeout(() => {
            try {
              mainPlayerRef.current.play();
            } catch (err) {
              console.warn("Lỗi khi thử phát lại video: ", err);
            }
          }, 1000);
        };

        // Phát video sau một khoảng thời gian ngắn
        setTimeout(() => {
          console.log("Phát video chính sau quảng cáo");
          playVideo();
        }, 500);
      } catch (error) {
        console.error("Lỗi khi phát video chính:", error);

        // Thử cách tiếp cận khác nếu có lỗi
        try {
          if (iframeRef.current) {
            // Truy cập trực tiếp iframe để phát video
            if (iframeRef.current.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                '{"event":"command","func":"playVideo","args":""}',
                "*"
              );
            }
          }
        } catch (fallbackError) {
          console.error("Cả hai cách phát video đều thất bại:", fallbackError);
        }
      }
    } else {
      console.warn("Không thể phát video chính vì không có mainPlayerRef");
      // Nếu không có mainPlayerRef, thử tải lại iframe
      if (iframeRef.current) {
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = "";
        setTimeout(() => {
          iframeRef.current.src = currentSrc;
        }, 100);
      }
    }
  }, []);

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await movieService.getMovieById(movieId);
        if (response.success) {
          setMovie(response.data);
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();

    // Hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => setShowControls(false), 3000);

    // Show controls on mouse move
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [movieId]);

  // Kích hoạt quảng cáo Pre-roll khi trang được tải và video được khởi tạo
  useEffect(() => {
    // Kiểm tra xem có quảng cáo hợp lệ không (video hoặc hình ảnh)
    const hasValidAd =
      (centerAd?.video && centerAd.video.trim() !== "") ||
      (centerAd?.image && centerAd.image.trim() !== "");

    // Chỉ kích hoạt Pre-roll khi có quảng cáo hợp lệ và người dùng không phải VIP MEMBER
    if (
      movie &&
      playerReady &&
      role !== "VIP MEMBER" &&
      !prerollAdFinished &&
      hasValidAd
    ) {
      console.log("Kích hoạt quảng cáo Pre-roll khi trang được tải");
      console.log("Thông tin quảng cáo:", centerAd);

      // Để đảm bảo iframe đã được tải hoàn toàn trước khi hiển thị quảng cáo
      const timer = setTimeout(() => {
        // Kích hoạt quảng cáo thông qua setShowPrerollAd để useEffect tương ứng được gọi
        setShowPrerollAd(true);
      }, 500);

      return () => clearTimeout(timer);
    } else if (
      movie &&
      playerReady &&
      role !== "VIP MEMBER" &&
      !prerollAdFinished
    ) {
      console.log(
        "Không thể hiển thị quảng cáo Pre-roll vì không có quảng cáo hợp lệ",
        centerAd
      );
    }
  }, [
    movie,
    playerReady,
    role,
    prerollAdFinished,
    centerAd,
    handlePrerollAdFinished,
    iframeRef,
  ]);

  // Handle comment submission with movie data update
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const updatedMovie = await submitComment(e);
    if (updatedMovie) {
      setMovie(updatedMovie);
    }
  };

  // Handle resume dialog response
  const handleResumePlayback = (shouldResume) => {
    if (!playerReady) return;

    try {
      // First clear any existing timers
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      setCountdown(0);

      if (shouldResume) {
        // Resume from saved position
        const savedTime = playbackPosition.getSavedPlaybackTime();
        seekTo(savedTime);
        playVideo();
      } else {
        // Start from beginning
        seekTo(0);
        playVideo();
      }

      // Hide the resume dialog
      playbackPosition.setShowResumeDialog(false);
    } catch (error) {
      console.error("Error in handleResumePlayback:", error);
      playVideo();
      playbackPosition.setShowResumeDialog(false);
    }
  };

  // Helper components
  const UpgradeMessage = ({ message, isAuthenticated }) => (
    <div className="bg-black/90 rounded-xl p-0 overflow-hidden">
      <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
        <p className="text-white mb-2">
          {isAuthenticated ? message : "Please login to access this feature"}
        </p>
        <Link
          to={isAuthenticated ? "/subscription-plans" : "/login"}
          className="inline-block px-6 py-2 bg-[#FF009F] text-white rounded-md hover:bg-[#FF009F]/90 transition-colors mt-2"
          aria-label={
            isAuthenticated
              ? "Upgrade your membership"
              : "Login to your account"
          }
          tabIndex="0"
        >
          {isAuthenticated ? "Upgrade Now" : "Login Now"}
        </Link>
      </div>
    </div>
  );

  const getVideoContainerStyle = () => {
    // Tất cả các role đều dùng chung một kích thước video
    return {
      width: "100vw",
      height: "97vh",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 15,
    };
  };

  // Get video URLs directly
  const directMovieUrl =
    movie?.medias?.find((m) => m.type === "FILMVIP")?.url || "";
  const directTrailerUrl =
    movie?.medias?.find((m) => m.type === "TRAILER")?.url || "";

  // Utility function to force play ads when user interacts with the page
  const forcePlayAds = useCallback(() => {
    if (adPlaybackAttempted) return;

    setAdPlaybackAttempted(true);

    // Find all iframes that are ad players and force play them
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      if (iframe.src.includes("autoplay=1")) {
        try {
          // Sử dụng PlayerUtils để khởi tạo player nếu có thể
          if (typeof window.playerjs !== "undefined") {
            const player = new window.playerjs.Player(iframe);
            player.on("ready", () => {
              player.play();
              adPlayersRef.current.push(player);
            });
          }

          // Try native postMessage API as backup
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"playVideo","args":""}',
              "*"
            );
          }
        } catch (err) {
          console.warn("Error forcing ad playback:", err);
        }
      }
    });
  }, [adPlaybackAttempted]);

  // Listen for user interaction to force play ads
  useEffect(() => {
    const handleUserInteraction = () => {
      forcePlayAds();
    };

    // Sử dụng các sự kiện phổ biến nhất để bắt user interaction
    const interactionEvents = ["click", "touchstart", "keydown", "scroll"];

    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [forcePlayAds]);

  // Clean up ad players on unmount
  useEffect(() => {
    return () => {
      adPlayersRef.current.forEach((player) => {
        try {
          player.off("ready");
          player.off("error");
        } catch (err) {
          // Bỏ qua lỗi khi cleanup
        }
      });
      adPlayersRef.current = [];
    };
  }, []);

  // Add useEffect to auto-hide resume dialog after 4 seconds
  useEffect(() => {
    // Clear any existing timers
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Only run this effect when the dialog first appears
    if (
      playbackPosition.showResumeDialog &&
      playbackPosition.savedPosition > 0
    ) {
      // Reset countdown
      setCountdown(4);

      // Set up countdown interval
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
          }
          return Math.max(newCount, 0);
        });
      }, 1000);

      // Set up hide timeout
      hideTimeoutRef.current = setTimeout(() => {
        playbackPosition.setShowResumeDialog(false);
        // Auto-start from beginning when dialog auto-hides
        if (playerReady) {
          seekTo(0);
          playVideo();
        }

        // Clear refs
        hideTimeoutRef.current = null;
      }, 4000);
    }

    // Cleanup function
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackPosition.showResumeDialog, playbackPosition.savedPosition]);

  // Thêm useEffect để gọi forcePlayAds sau khi trang load xong
  useEffect(() => {
    // Force play ads when component mounts and video URL is available
    if (movie && centerAd?.video) {
      // Wait for a short time to ensure iframe has loaded
      const timer = setTimeout(() => {
        forcePlayAds();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [movie, centerAd, forcePlayAds]);

  // Hàm để bỏ qua quảng cáo pre-roll
  const handleSkipPrerollAd = useCallback(() => {
    console.log("Người dùng bỏ qua quảng cáo pre-roll");

    // Tìm container quảng cáo
    const adContainer = document.getElementById("in-stream-ad-container");
    if (adContainer && adContainer.parentNode) {
      adContainer.parentNode.removeChild(adContainer);

      // Clear any countdown timers that might be running
      const intervalId = adContainer.dataset.countdownIntervalId;
      if (intervalId) {
        clearInterval(parseInt(intervalId));
      }
    }

    // Gọi hàm để hoàn thiện xử lý preroll ad
    handlePrerollAdFinished();
  }, [handlePrerollAdFinished]);

  // Hàm chung để hiển thị quảng cáo, được sử dụng cho cả pre-roll và mid-roll
  const displayAd = useCallback(
    ({
      isPreroll = false,
      currentPosition = 0,
      wasFullscreen = false,
      fullscreenElement = null,
      onFinish = null,
    }) => {
      console.log(`Hiển thị quảng cáo ${isPreroll ? "pre-roll" : "mid-roll"}`);

      // Tìm container của video chính
      if (!iframeRef.current || !iframeRef.current.parentNode) {
        console.error("Không tìm thấy container video");
        if (mainPlayerRef.current) {
          mainPlayerRef.current.play();
        }
        return;
      }

      const videoContainer = iframeRef.current.parentNode;

      // Đảm bảo rằng video-container có ID để có thể tham chiếu sau này
      if (!videoContainer.id) {
        videoContainer.id = "video-container";
      }

      // Kiểm tra xem đã có container quảng cáo chưa
      const existingAdContainer = document.getElementById(
        "in-stream-ad-container"
      );
      if (existingAdContainer) {
        console.log("Đã có container quảng cáo, xóa trước khi tạo mới");
        existingAdContainer.remove();
      }

      // Tạo container quảng cáo với utilities
      const adContainer = AdUIUtils.createAdContainer(
        wasFullscreen,
        fullscreenElement ? fullscreenElement.id || "video-container" : null
      );

      // Tạo các UI elements cho quảng cáo
      const skipButton = AdUIUtils.createSkipButton();
      const adLabel = AdUIUtils.createAdLabel();

      // Hàm để kết thúc quảng cáo và tiếp tục video chính
      const finishAd = () => {
        console.log(`${isPreroll ? "Pre-roll" : "Mid-roll"} ad ended`);

        // Clear all timers
        if (countdownInterval) {
          clearInterval(countdownInterval);
        }

        // Clear auto-close timer
        if (autoCloseTimer) {
          clearTimeout(autoCloseTimer);
        }

        // Clear skip button timer if exists
        if (skipButtonTimer) {
          clearTimeout(skipButtonTimer);
        }

        // Xóa container quảng cáo
        if (adContainer && adContainer.parentNode) {
          adContainer.parentNode.removeChild(adContainer);
        }

        // For mid-roll ads, resume video from saved position
        if (!isPreroll && mainPlayerRef.current) {
          // Lấy thông tin về trạng thái fullscreen từ trước
          const needsFullscreen = adContainer.dataset.wasFullscreen === "true";

          // Set a flag to prevent immediate triggering of another midroll ad
          let lastAdTime = Date.now();
          adContainer.dataset.lastAdTime = lastAdTime;

          // Đặt lại vị trí và phát video
          mainPlayerRef.current.setCurrentTime(currentPosition);
          mainPlayerRef.current.play();

          // Nếu trước đó đang ở chế độ fullscreen, thì quay lại fullscreen sau khi đóng quảng cáo
          if (needsFullscreen) {
            // Tìm phần tử để làm fullscreen
            let elementToFullscreen = iframeRef.current;
            if (!elementToFullscreen) {
              // Fallback đến container của video
              elementToFullscreen =
                document.getElementById("video-container") ||
                document.querySelector(".video-container");
            }

            if (elementToFullscreen) {
              // Delay trước khi cố gắng quay lại fullscreen
              setTimeout(() => {
                console.log("Đang cố gắng quay lại chế độ fullscreen...");
                FullscreenUtils.requestFullscreen(elementToFullscreen);
              }, AD_CONSTANTS.FULLSCREEN_RETRY_DELAY);
            }
          }
        }

        // For preroll ads, call specific handler
        if (isPreroll && onFinish) {
          onFinish();
        }
      };

      // Tạo countdown timer
      const adCountdown = AdUIUtils.createCountdownTimer(
        AD_CONSTANTS.AD_COUNTDOWN_SECONDS
      );
      adContainer.appendChild(adCountdown);

      // Setup countdown timer
      let countdownTime = AD_CONSTANTS.AD_COUNTDOWN_SECONDS;
      const countdownInterval = setInterval(() => {
        countdownTime--;
        if (countdownTime <= 0) {
          clearInterval(countdownInterval);
          finishAd();
        } else {
          adCountdown.textContent = `Ad ends in: ${countdownTime}s`;
        }
      }, 1000);

      // Store the interval ID in the container's dataset for later cleanup
      adContainer.dataset.countdownIntervalId = countdownInterval;

      // Skip button visibility
      let skipButtonTimer;
      if (isPreroll) {
        // Hiển thị nút bỏ qua sau thời gian quy định cho pre-roll
        skipButtonTimer = setTimeout(() => {
          skipButton.style.display = "block";
          if (isPreroll) {
            setShowSkipButton(true);
          }
        }, AD_CONSTANTS.SKIP_AD_DELAY);
      } else {
        // Hiển thị nút skip ngay lập tức cho mid-roll
        skipButton.style.display = "block";
      }

      // Xử lý sự kiện khi bỏ qua quảng cáo
      skipButton.onclick = () => {
        console.log("Người dùng bỏ qua quảng cáo");
        finishAd();
      };

      // Xử lý khác nhau dựa trên loại quảng cáo (video hoặc hình ảnh)
      if (centerAd?.video && centerAd.video.trim() !== "") {
        const isMediaDeliveryUrl = centerAd.video.includes("mediadelivery.net");

        if (isMediaDeliveryUrl) {
          console.log("URL media delivery, sử dụng phương pháp xử lý nâng cao");

          // Tạo video element
          const videoElement = document.createElement("video");
          videoElement.style.width = "100%";
          videoElement.style.height = "100%";
          videoElement.style.objectFit = "contain";
          videoElement.style.backgroundColor = "#000";
          videoElement.controls = false;
          videoElement.autoplay = true;
          videoElement.muted = false;
          videoElement.playsInline = true;

          // Thêm event listeners
          videoElement.addEventListener("canplay", () => {
            console.log("Video quảng cáo đã sẵn sàng phát");
            videoElement.play();
          });

          videoElement.addEventListener("ended", () => {
            console.log("Video quảng cáo đã kết thúc tự nhiên");
            clearInterval(countdownInterval);
            finishAd();
          });

          videoElement.addEventListener("error", (e) => {
            console.error("Lỗi phát video quảng cáo:", e);
            fallbackToIframe();
          });

          // Tạo source element
          const tempSource = document.createElement("source");
          tempSource.type = "video/mp4";

          // Trích xuất mediaId từ URL
          const mediaId = centerAd.video.split("/").pop().split("?")[0];
          if (mediaId) {
            tempSource.src = CONSTANTS.FALLBACK_VIDEO_URL;
            videoElement.appendChild(tempSource);
          } else {
            fallbackToIframe();
            return;
          }

          // Hàm fallback dùng iframe nếu video không phát được
          function fallbackToIframe() {
            console.log(
              "Chuyển sang sử dụng iframe vì không thể phát video trực tiếp"
            );

            const adIframe = document.createElement("iframe");
            adIframe.src = `${centerAd.video}${
              centerAd.video.includes("?") ? "&" : "?"
            }autoplay=true&controls=false&enablejsapi=true`;
            adIframe.style.width = "100%";
            adIframe.style.height = "100%";
            adIframe.style.border = "none";
            adIframe.allow = "autoplay; fullscreen; encrypted-media";
            adIframe.allowFullscreen = true;

            // Xóa video element nếu đã thêm vào DOM
            if (videoElement.parentNode) {
              videoElement.parentNode.removeChild(videoElement);
            }

            // Thêm iframe vào container
            adContainer.appendChild(adIframe);
          }

          // Thêm các elements vào DOM
          adContainer.appendChild(videoElement);
        } else {
          // Quảng cáo video thông thường hoặc iframe dựa trên loại
          console.log("Hiển thị quảng cáo dạng video:", centerAd.video);

          // Tạo iframe cho quảng cáo
          const adIframe = document.createElement("iframe");
          adIframe.src = `${centerAd.video}${
            centerAd.video.includes("?") ? "&" : "?"
          }autoplay=true&controls=false&enablejsapi=true`;
          adIframe.style.width = "100%";
          adIframe.style.height = "100%";
          adIframe.style.border = "none";
          adIframe.allow = "autoplay; fullscreen; encrypted-media";
          adIframe.allowFullscreen = true;

          // Khởi tạo player cho quảng cáo khi iframe đã load xong
          adIframe.onload = async () => {
            try {
              // Sử dụng PlayerUtils để khởi tạo player
              const player = await PlayerUtils.initializePlayer(
                { current: adIframe },
                {
                  autoplay: true,
                  startMuted: false,
                  loop: false,
                  hideControls: false,
                }
              );

              if (!player) return;

              // Đăng ký sự kiện kết thúc
              player.on("ended", () => {
                console.log("Quảng cáo video đã kết thúc");
                clearInterval(countdownInterval);
                finishAd();
              });

              player.on("error", (error) => {
                console.error("Lỗi quảng cáo video:", error);
                clearInterval(countdownInterval);
                finishAd();
              });
            } catch (error) {
              console.error("Lỗi khởi tạo quảng cáo video:", error);
              clearInterval(countdownInterval);
              finishAd();
            }
          };

          // Thêm iframe vào container
          adContainer.appendChild(adIframe);
        }
      } else if (centerAd?.image && centerAd.image.trim() !== "") {
        // Quảng cáo hình ảnh
        console.log("Hiển thị quảng cáo dạng hình ảnh:", centerAd.image);

        // Tạo container cho hình ảnh
        const imageContainer = AdUIUtils.createImageAdContainer();

        // Tạo phần tử img
        const adImage = AdUIUtils.createAdImage(centerAd.image);

        // Xử lý click vào hình ảnh - sử dụng xử lý khác nhau cho pre-roll và mid-roll
        adImage.style.cursor = "pointer";
        adImage.onclick = async () => {
          // Tăng lượt xem quảng cáo, chỉ trong trường hợp pre-roll
          if (isPreroll) {
            try {
              if (centerAd.id && movieId) {
                await adMediaCountService.increaseAdMediaCount({
                  adMediaId: centerAd.id,
                  movieId: movieId,
                });
              }
            } catch (error) {
              console.error("Error increasing ad view count:", error);
            }
          }

          // Nếu có URL thì mở URL trong tab mới
          if (centerAd.url) {
            window.open(centerAd.url, "_blank");
          }
        };

        // Thêm URL nếu có
        if (centerAd.url) {
          // Thêm label URL
          const urlLabel = AdUIUtils.createUrlLabel();
          adContainer.appendChild(urlLabel);
        }

        // Thêm các phần tử vào DOM
        imageContainer.appendChild(adImage);
        adContainer.appendChild(imageContainer);
      } else {
        // Không có quảng cáo hợp lệ
        const noAdMessage = document.createElement("div");
        noAdMessage.textContent = "No valid advertisement";
        noAdMessage.style.position = "absolute";
        noAdMessage.style.top = "50%";
        noAdMessage.style.left = "50%";
        noAdMessage.style.transform = "translate(-50%, -50%)";
        noAdMessage.style.color = "white";
        noAdMessage.style.fontSize = "20px";

        adContainer.appendChild(noAdMessage);

        // Tự động đóng sau 2 giây
        setTimeout(() => {
          finishAd();
        }, 2000);
      }

      // Thêm nút skip và label vào container
      adContainer.appendChild(skipButton);
      adContainer.appendChild(adLabel);

      // Thêm container vào video container
      videoContainer.appendChild(adContainer);

      // Auto-close sau một khoảng thời gian
      const autoCloseTimer = setTimeout(
        finishAd,
        AD_CONSTANTS.AD_AUTO_CLOSE_DELAY
      );

      return {
        cleanup: () => {
          // Clear all timers on unmount
          if (countdownInterval) {
            clearInterval(countdownInterval);
          }
          if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
          }
          if (skipButtonTimer) {
            clearTimeout(skipButtonTimer);
          }
        },
      };
    },
    [centerAd, iframeRef, mainPlayerRef, movieId]
  );

  // Khởi tạo quảng cáo pre-roll khi nó được hiển thị
  useEffect(() => {
    if (!showPrerollAd || prerollAdFinished || !iframeRef.current) return;

    // Đảm bảo video chính bị tạm dừng khi hiển thị quảng cáo pre-roll
    if (mainPlayerRef.current) {
      mainPlayerRef.current.pause();
    }

    // Sử dụng hàm displayAd để hiển thị quảng cáo pre-roll
    const { cleanup } = displayAd({
      isPreroll: true,
      onFinish: handlePrerollAdFinished,
    });

    // Cleanup function
    return cleanup;
  }, [
    showPrerollAd,
    prerollAdFinished,
    handlePrerollAdFinished,
    displayAd,
    iframeRef,
    mainPlayerRef,
  ]);

  // Khởi tạo directVideoUrl khi component mount lần đầu và movie có sẵn
  useEffect(() => {
    if (!movie) return;

    // Lấy URL video dựa vào trạng thái ban đầu
    const originalUrl = movie?.medias?.find((m) => m.type === "FILMVIP")?.url;

    if (!originalUrl) return;

    // Kiểm tra nếu là URL của Bunny Stream hoặc Media Delivery
    if (originalUrl.includes("iframe.mediadelivery.net/embed/")) {
      // URL đã ở định dạng iframe embed, chỉ cần thêm tham số cho playerjs
      setDirectVideoUrl(
        `${originalUrl}${
          originalUrl.includes("?") ? "&" : "?"
        }autoplay=1&controls=1&playsinline=1&enablejsapi=1`
      );
    } else {
      // URL khác, giữ nguyên
      setDirectVideoUrl(originalUrl);
    }
  }, [movie]);

  // Hàm hiển thị quảng cáo khi không ở chế độ fullscreen (thay thế hàm cũ)
  const showAdOutsideFullscreen = useCallback(
    (currentPosition, wasFullscreen = false, fullscreenElement = null) => {
      displayAd({
        isPreroll: false,
        currentPosition,
        wasFullscreen,
        fullscreenElement,
      });
    },
    [displayAd]
  );

  // Hàm hiển thị quảng cáo in-stream
  const showInStreamAd = useCallback(() => {
    console.log("Đang cố gắng hiển thị quảng cáo in-stream");
    if (role === "VIP MEMBER" || !mainPlayerRef.current) {
      console.log("Không thể hiển thị quảng cáo: ", {
        role,
        hasMainPlayer: !!mainPlayerRef.current,
      });
      return;
    }

    // Kiểm tra xem có quảng cáo hợp lệ không
    if (!centerAd) {
      console.log("Không có quảng cáo để hiển thị");
      return;
    }

    console.log("Thông tin quảng cáo:", centerAd);

    // Kiểm tra xem có video hoặc hình ảnh không
    const hasVideo = centerAd.video && centerAd.video.trim() !== "";
    const hasImage = centerAd.image && centerAd.image.trim() !== "";

    if (!hasVideo && !hasImage) {
      console.log("Quảng cáo không có video hoặc hình ảnh, bỏ qua");
      return;
    }

    // Kiểm tra có đang ở chế độ fullscreen không
    const isFullscreen = FullscreenUtils.isFullscreen();
    console.log("Trạng thái fullscreen:", isFullscreen);

    // Lưu vị trí hiện tại của video
    mainPlayerRef.current.getCurrentTime((currentPosition) => {
      // Tạm dừng video chính
      mainPlayerRef.current.pause();
      console.log("Đã lưu vị trí video tại:", currentPosition);

      // Xử lý khác nhau cho chế độ fullscreen và không fullscreen
      if (isFullscreen) {
        // Nếu đang ở chế độ fullscreen
        console.log("Hiển thị quảng cáo trong chế độ fullscreen");

        // Lưu phần tử fullscreen để có thể quay lại sau
        const fullscreenElement = FullscreenUtils.getFullscreenElement();

        // Thoát khỏi chế độ fullscreen tạm thời
        FullscreenUtils.exitFullscreen();

        // Đợi fullscreen thoát xong rồi hiển thị quảng cáo
        setTimeout(() => {
          // Sử dụng hàm displayAd thay vì showAdOutsideFullscreen
          displayAd({
            isPreroll: false,
            currentPosition,
            wasFullscreen: true,
            fullscreenElement,
          });

          // Hiển thị thông báo
          const fullscreenNotice = document.createElement("div");
          fullscreenNotice.textContent =
            "You have exited fullscreen mode to view the advertisement";
          fullscreenNotice.style.position = "fixed";
          fullscreenNotice.style.top = "10px";
          fullscreenNotice.style.left = "50%";
          fullscreenNotice.style.transform = "translateX(-50%)";
          fullscreenNotice.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          fullscreenNotice.style.color = "white";
          fullscreenNotice.style.padding = "10px 20px";
          fullscreenNotice.style.borderRadius = "5px";
          fullscreenNotice.style.zIndex = "9999";
          fullscreenNotice.style.fontSize = "14px";

          document.body.appendChild(fullscreenNotice);

          // Xóa thông báo sau 5 giây
          setTimeout(() => {
            if (fullscreenNotice.parentNode) {
              fullscreenNotice.parentNode.removeChild(fullscreenNotice);
            }
          }, 5000);
        }, 500);
      } else {
        // Nếu không ở chế độ fullscreen
        displayAd({
          isPreroll: false,
          currentPosition,
          wasFullscreen: false,
        });
      }
    });
  }, [centerAd, role, displayAd]);

  // Bổ sung một hàm để có thể kích hoạt quảng cáo tại bất kỳ điểm nào trong video
  const triggerMidrollAd = useCallback(() => {
    if (role === "VIP MEMBER" || !mainPlayerRef.current || !iframeRef.current)
      return;

    // Lưu vị trí hiện tại
    mainPlayerRef.current.getCurrentTime((currentTime) => {
      // Lưu vị trí để có thể tiếp tục sau quảng cáo
      const resumePosition = currentTime;

      // Tạm dừng video chính
      mainPlayerRef.current.pause();

      console.log("Displaying mid-roll ad at position:", resumePosition);

      // Kiểm tra nếu đang ở chế độ fullscreen
      const isFullscreen = FullscreenUtils.isFullscreen();

      if (isFullscreen) {
        // Nếu đang ở chế độ fullscreen
        const fullscreenElement = FullscreenUtils.getFullscreenElement();

        // Thoát khỏi chế độ fullscreen tạm thời
        FullscreenUtils.exitFullscreen();

        // Đợi fullscreen thoát xong rồi hiển thị quảng cáo
        setTimeout(() => {
          displayAd({
            isPreroll: false,
            currentPosition: resumePosition,
            wasFullscreen: true,
            fullscreenElement,
          });
        }, 500);
      } else {
        // Nếu không ở chế độ fullscreen
        displayAd({
          isPreroll: false,
          currentPosition: resumePosition,
          wasFullscreen: false,
        });
      }
    });
  }, [role, iframeRef, mainPlayerRef, displayAd]);

  // Khởi tạo mainPlayerRef khi component được mount
  useEffect(() => {
    if (!iframeRef.current || !playerReady) return;

    // Khởi tạo main player nếu chưa tồn tại
    if (!mainPlayerRef.current && typeof window.playerjs !== "undefined") {
      console.log("Khởi tạo mainPlayerRef khi playerReady");

      try {
        mainPlayerRef.current = new window.playerjs.Player(iframeRef.current);

        // Đảm bảo sự kiện ready được kích hoạt
        mainPlayerRef.current.on("ready", () => {
          console.log("Main player is ready for ads integration");
        });

        // Loại bỏ lỗi metrics
        if (window.location.hostname === "localhost") {
          console.log("Đang chạy ở localhost - vô hiệu hóa metrics");
          window.playerjs.metrics = {
            send: () => {},
          };
        }
      } catch (error) {
        console.error("Lỗi khởi tạo player chính:", error);
      }
    }
  }, [playerReady]);

  // Khởi tạo quảng cáo ngay sau khi player đã sẵn sàng
  useEffect(() => {
    if (!playerReady || !mainPlayerRef.current || role === "VIP MEMBER") return;

    console.log("Player đã sẵn sàng, thiết lập listener cho thời gian phát");

    // Store the position where the ad was triggered to prevent duplicate ads
    let adTriggeredPosition = -1;

    // Thiết lập một kiểm tra thời gian định kỳ
    const timeCheckInterval = setInterval(() => {
      if (!mainPlayerRef.current) {
        clearInterval(timeCheckInterval);
        return;
      }

      // Check if ad is currently showing - if so, don't trigger another one
      const adContainer = document.getElementById("in-stream-ad-container");
      if (adContainer) {
        // Ad is already showing, skip this check
        return;
      }

      // Check if an ad was recently shown - add a cooldown period (10 seconds)
      const lastAdContainer = document.querySelector("[data-last-ad-time]");
      if (lastAdContainer) {
        const lastAdTime = parseInt(lastAdContainer.dataset.lastAdTime || "0");
        const currentTime = Date.now();
        const timeSinceLastAd = currentTime - lastAdTime;

        // If less than 10 seconds since last ad closed, don't trigger another
        if (timeSinceLastAd < 10000) {
          return;
        }
      }

      mainPlayerRef.current.getCurrentTime((currentTime) => {
        // If we're within 0.5 seconds of where we triggered an ad before, don't trigger again
        if (Math.abs(currentTime - adTriggeredPosition) < 0.5) {
          return;
        }

        if (
          currentTime >= AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME &&
          !hasShownMidRollAd.current
        ) {
          console.log(
            `Reached ${AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME} seconds, displaying ad`
          );
          adTriggeredPosition = currentTime; // Remember where we triggered the ad
          hasShownMidRollAd.current = true;
          showInStreamAd();
          clearInterval(timeCheckInterval);
        }
      });
    }, 1000);

    return () => {
      clearInterval(timeCheckInterval);
    };
  }, [playerReady, role, showInStreamAd]);

  // Reset trạng thái mid-roll ad khi thay đổi video
  useEffect(() => {
    console.log("Reset trạng thái quảng cáo khi thay đổi video");
    hasShownMidRollAd.current = false;
  }, [showTrailer, movieId]);

  // Dọn dẹp tham chiếu đến player khi component unmount
  useEffect(() => {
    return () => {
      if (mainPlayerRef.current) {
        try {
          mainPlayerRef.current.off("ready");
        } catch (err) {
          console.warn("Error cleaning up main player:", err);
        }
        mainPlayerRef.current = null;
      }

      // Dọn dẹp inStreamAdRef
      inStreamAdRef.current = null;
    };
  }, []);

  if (loading) return <Loading />;

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
          <Link
            to="/homescreen"
            className="text-[#FF009F] hover:text-[#D1007F] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Watch ${movie?.title} - Eigakan`}</title>
        <link
          rel="preload"
          href="https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js"
          as="script"
        />
        <script
          id="playerjs-script"
          type="text/javascript"
          src="https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js"
        ></script>
      </Helmet>

      <div className="fixed inset-0 bg-black">
        {/* Main content with grid layout giống nhau cho tất cả các role */}
        <div className="w-full h-full grid grid-cols-[1fr]">
          {/* Center Video Column - Centered for all roles */}
          <div className="relative flex items-center justify-center h-full py-2">
            <div style={getVideoContainerStyle()} className="relative">
              {/* Pre-roll ad - được xử lý thông qua AdUIUtils trong useEffect */}
              <iframe
                ref={iframeRef}
                id="bunny-stream-embed"
                src={showTrailer ? directTrailerUrl : directMovieUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen"
                frameBorder="0"
              />

              {/* Resume playback dialog */}
              {playbackPosition.showResumeDialog &&
                playbackPosition.savedPosition > 0 && (
                  <div className="absolute bottom-24 left-0 right-0 flex justify-center z-30 pointer-events-auto">
                    <div className="bg-black/90 text-white w-72 rounded shadow-xl overflow-hidden">
                      <div className="px-4 pt-4 pb-2.5 text-center">
                        <p className="text-base font-normal">
                          Resume from{" "}
                          {formatTime(playbackPosition.savedPosition)}?
                        </p>
                      </div>
                      <div className="flex">
                        <button
                          onClick={() => handleResumePlayback(true)}
                          className="flex-1 py-2.5 bg-[#FF009F] text-white hover:bg-[#D1007F] transition-colors"
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => handleResumePlayback(false)}
                          className="flex-1 py-2.5 bg-[#333333] text-white hover:bg-[#444444] transition-colors"
                        >
                          Start Over
                        </button>
                      </div>
                      <div className="w-full h-[1px]">
                        <div
                          className="h-full bg-[#FF009F]"
                          style={{
                            width: `${(countdown / 4) * 100}%`,
                            transition: "width 1s linear",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* CENTER Ad - Full screen overlay (hide for VIP members) */}
        {/* Đã chuyển sang in-stream ads */}

        {/* Movie info panel */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            showControls ? "opacity-100" : "opacity-0"
          } pointer-events-none z-20`}
        >
          <div
            className={`fixed left-1/2 -translate-x-1/2 bottom-0 w-full transform ${
              showInfo ? "translate-y-0" : "translate-y-full"
            } transition-transform duration-500 ease-in-out pointer-events-auto`}
          >
            <div className="absolute -top-10 left-0 right-0 h-10 flex items-end justify-center group">
              <div
                onClick={() => setShowInfo(!showInfo)}
                className="w-36 h-12 bg-gradient-to-r from-[#FF009F]/90 to-[#FF6B9F]/90 rounded-t-xl flex items-center justify-center cursor-pointer shadow-lg hover:from-[#FF009F] hover:to-[#FF6B9F] transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-0.5 bg-white rounded-full" />
                  <span className="text-white text-sm font-medium tracking-wide">
                    Movie Info
                  </span>
                </div>
              </div>
            </div>

            {/* Movie info content - this part is too long to include in full, 
                but would contain the movie details, ratings, comments, etc. */}
            <div className="px-0 py-0 h-[70vh] overflow-y-auto scrollbar-hide bg-gradient-to-b from-black/80 via-black/85 to-black/90 backdrop-blur-xl">
              <div className="max-w-5xl mx-auto">
                {/* Content Container */}
                <div className="px-4 sm:px-6 py-8">
                  <div className="flex flex-col space-y-6">
                    {/* Movie Title Section */}
                    <div className="text-center">
                      <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]">
                        {movie.title}
                      </h1>

                      {/* Quick toggle buttons */}
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <button
                          onClick={() => setShowTrailer(false)}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all backdrop-blur-md ${
                            !showTrailer
                              ? "bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white shadow-md"
                              : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/10"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path>
                            <rect
                              x="3"
                              y="6"
                              width="12"
                              height="12"
                              rx="2"
                              ry="2"
                            ></rect>
                          </svg>
                          <span className="font-medium">Movie</span>
                        </button>

                        <button
                          onClick={() => setShowTrailer(true)}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all backdrop-blur-md ${
                            showTrailer
                              ? "bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white shadow-md"
                              : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/10"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                          <span className="font-medium">Trailer</span>
                        </button>

                        <Link
                          to={`/movie/${movie.id}`}
                          className="px-4 py-2 rounded-lg flex items-center gap-2 bg-white/10 text-white/70 hover:bg-white/20 transition-all backdrop-blur-md border border-white/10"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                          <span className="font-medium">Details</span>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                      {/* Left Column - Quick Info */}
                      <div className="lg:col-span-1 space-y-6">
                        {/* Ratings Display */}
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg">
                          <h3 className="text-white/90 text-sm uppercase tracking-wider mb-3 font-medium">
                            Ratings
                          </h3>
                          <div className="space-y-4">
                            {/* IMDb Rating */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-12 h-12 bg-[#F6C700]/10 rounded-lg">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="32"
                                  height="16"
                                  viewBox="0 0 64 32"
                                  fill="none"
                                  className="scale-90"
                                >
                                  <rect width="64" height="32" fill="#F6C700" />
                                  <path d="M8 8H12V24H8V8Z" fill="black" />
                                  <path
                                    d="M16 8H21.6C25.4 8 27.2 10.4 27.2 13.6V18.4C27.2 21.6 25.4 24 21.6 24H16V8ZM21.6 20.8C23.2 20.8 23.6 19.6 23.6 18.4V13.6C23.6 12.4 23.2 11.2 21.6 11.2H19.6V20.8H21.6Z"
                                    fill="black"
                                  />
                                  <path
                                    d="M29.6 8H36.8L39.2 18.4L41.6 8H48.8V24H45.2V11.2L42.4 24H36L33.2 11.2V24H29.6V8Z"
                                    fill="black"
                                  />
                                  <path d="M52 8H56V24H52V8Z" fill="black" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-[#F6C700]">
                                    {movie.imdbRating?.toFixed(1) ||
                                      movie.rating?.toFixed(1) ||
                                      "0"}
                                  </span>
                                  <span className="text-[#F6C700]/70 text-sm">
                                    /10
                                  </span>
                                </div>
                                <div className="text-xs text-white/60">
                                  Internet Movie Database
                                  {movie.imdbVotes > 0 && (
                                    <span className="block mt-0.5">
                                      {new Intl.NumberFormat().format(
                                        movie.imdbVotes
                                      )}{" "}
                                      votes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Community Rating */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-7 h-7 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-white">
                                    {movie.userRating || "-"}
                                  </span>
                                  <span className="text-white/70 text-sm">
                                    /5
                                  </span>
                                </div>
                                <div className="text-xs text-white/60">
                                  Community Rating
                                </div>
                              </div>
                            </div>

                            {/* Your Rating */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-12 h-12 bg-[#FF009F]/10 rounded-lg">
                                <svg
                                  className="w-7 h-7 text-[#FF009F]"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-[#FF009F]">
                                    {userRating || "?"}
                                  </span>
                                  <span className="text-[#FF009F]/70 text-sm">
                                    /5
                                  </span>
                                </div>
                                <div className="text-xs text-white/60">
                                  Your Rating
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Key Info Tags */}
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg">
                          <h3 className="text-white/90 text-sm uppercase tracking-wider mb-3 font-medium">
                            Details
                          </h3>
                          <div className="flex flex-col gap-2">
                            {[
                              {
                                label: "Release Year",
                                value: movie.releaseYear,
                                icon: (
                                  <Calendar className="w-4 h-4 text-white/60" />
                                ),
                              },
                              {
                                label: "Duration",
                                value: `${movie.duration} minutes`,
                                icon: (
                                  <Clock className="w-4 h-4 text-white/60" />
                                ),
                              },
                              {
                                label: "Country",
                                value: movie.nation,
                                icon: (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4 text-white/60"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 22c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"></path>
                                    <path d="M12 13V8"></path>
                                    <path d="M12 16h.01"></path>
                                  </svg>
                                ),
                              },
                              {
                                label: "Director",
                                value: movie.director,
                                icon: (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4 text-white/60"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M8 19l3-3 3 3"></path>
                                    <path d="M11 16V4"></path>
                                    <path d="M3 12h6"></path>
                                    <path d="M15 12h6"></path>
                                  </svg>
                                ),
                              },
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                              >
                                <div className="w-5 h-5 flex-shrink-0">
                                  {item.icon}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-white/50">
                                    {item.label}
                                  </span>
                                  <span className="text-sm text-white">
                                    {item.value}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cast Section */}
                        <div className="bg-black/80 backdrop-blur-md rounded-xl py-3 border border-white/10 shadow-lg">
                          <div className="flex items-center justify-center mb-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-[#FF009F] mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <h3 className="text-base font-semibold text-white">
                              Cast & Crew
                            </h3>
                          </div>

                          <div className="grid grid-cols-4 gap-2 px-3 justify-items-center">
                            {movie.person?.slice(0, 4).map((actor, index) => (
                              <Link
                                to={`/person/${actor.id}`}
                                key={actor.id}
                                className="group flex flex-col items-center"
                              >
                                <div className="w-12 h-12 overflow-hidden rounded-full mb-1 border border-white/20 group-hover:border-[#FF009F]/50 transition-all">
                                  <img
                                    src={actor.picture || "/placeholder.svg"}
                                    alt={actor.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="text-center">
                                  <div className="text-white text-sm font-semibold tracking-wide">
                                    {actor.name.split(" ")[0].charAt(0)}
                                  </div>
                                  <div className="text-white/90 text-sm font-semibold tracking-wide -mt-1">
                                    {actor.name.split(" ").length > 1
                                      ? actor.name
                                          .split(" ")
                                          .slice(-1)[0]
                                          .charAt(0)
                                      : ""}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Movie Content */}
                      <div className="lg:col-span-4 space-y-8">
                        {/* Synopsis */}
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
                          <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-[#FF009F]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Description
                          </h3>

                          <p className="text-white/90 leading-relaxed text-base">
                            {movie.description}
                          </p>

                          {/* Genres Pills */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {movie.genreNames &&
                              movie.genreNames
                                .split(", ")
                                .map((genre, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-[#FF009F]/10 text-[#FF009F] rounded-full text-sm font-medium"
                                  >
                                    {genre}
                                  </span>
                                ))}
                          </div>
                        </div>

                        {/* Rate This Movie */}
                        {canRateAndComment() ? (
                          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-[#FF009F]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                              Rate This Movie
                            </h3>

                            <div className="flex flex-col items-center gap-6 py-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-4xl font-bold text-[#FF009F]">
                                  {userRating || "?"}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm text-white">
                                    Your rating
                                  </span>
                                  <span className="text-xs text-white/60">
                                    out of 5
                                  </span>
                                </div>
                              </div>

                              <div className="relative">
                                <Rate
                                  value={userRating}
                                  onChange={handleRating}
                                  disabled={submittingRating || hasUserRated}
                                  className="flex gap-2"
                                  character={({ index, value }) => (
                                    <div className="relative cursor-pointer transition-transform hover:scale-110">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        className="w-10 h-10 text-white/20"
                                        strokeWidth="1"
                                      >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                      <div
                                        className="absolute inset-0 transition-opacity"
                                        style={{
                                          opacity: value > index ? 1 : 0,
                                        }}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                          className="w-10 h-10 text-[#FF009F]"
                                        >
                                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                />
                              </div>

                              <div className="text-center mt-2">
                                {submittingRating ? (
                                  <div className="flex items-center gap-2 text-[#FF009F]">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    <span>Submitting...</span>
                                  </div>
                                ) : (
                                  <div className="text-white font-medium">
                                    {userRating ? (
                                      <>
                                        <span className="text-[#FF009F]">
                                          {userRating} stars
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span className="text-white">
                                          {hasUserRated
                                            ? "You've already rated this movie"
                                            : "Thanks for rating!"}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="animate-pulse text-white">
                                        Click the stars to rate
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-black/90 backdrop-blur-md rounded-xl overflow-hidden">
                            <div className="px-4 py-3 flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-[#FF009F]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                              <span className="text-white font-bold">
                                Rate This Movie
                              </span>
                            </div>
                            <div className="px-4 py-8 bg-[#1c1c1c] flex flex-col items-center justify-center text-center">
                              <div className="mb-4">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 mx-auto text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line
                                    x1="12"
                                    y1="16"
                                    x2="12.01"
                                    y2="16"
                                  ></line>
                                </svg>
                              </div>
                              <p className="text-white mb-2">
                                {isAuthenticated
                                  ? "Upgrade your account to rate movies"
                                  : "Please login to access this feature"}
                              </p>
                              <Link
                                to={
                                  isAuthenticated
                                    ? "/subscription-plans"
                                    : "/login"
                                }
                                className="inline-block px-6 py-2 bg-[#FF009F] text-white rounded-md hover:bg-[#FF009F]/90 transition-colors mt-2"
                              >
                                {isAuthenticated ? "Upgrade Now" : "Login Now"}
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* Comments Section */}
                        {isAuthenticated && role !== "MEMBER" ? (
                          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-5 h-5 text-[#FF009F]"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Comments
                              </h3>
                              <span className="text-white/70 text-sm bg-white/10 px-2 py-1 rounded-full">
                                {movie.comments?.length || 0} comments
                              </span>
                            </div>

                            {canRateAndComment() ? (
                              <div className="mb-6">
                                <div className="flex gap-4">
                                  <img
                                    src={
                                      userDetails[movie.comments?.[0]?.createBy]
                                        ?.picture ||
                                      "https://ui-avatars.com/api/?name=User&background=FF009F&color=fff" ||
                                      "/placeholder.svg"
                                    }
                                    alt="User"
                                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                                  />
                                  <form
                                    onSubmit={handleCommentSubmit}
                                    className="flex-1"
                                  >
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={commentInput}
                                        onChange={(e) =>
                                          setCommentInput(e.target.value)
                                        }
                                        placeholder="Add a comment..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FF009F]/50 focus:border-transparent transition-all"
                                      />
                                      <button
                                        type="submit"
                                        disabled={!commentInput.trim()}
                                        className="px-4 py-2 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90 transition-all font-medium"
                                      >
                                        Post
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 text-center">
                                <div className="mb-4">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 mx-auto text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line
                                      x1="12"
                                      y1="16"
                                      x2="12.01"
                                      y2="16"
                                    ></line>
                                  </svg>
                                </div>
                                <p className="text-white mb-2">
                                  {isAuthenticated
                                    ? "Upgrade your account to view and post comments"
                                    : "Please login to access this feature"}
                                </p>
                                <Link
                                  to={
                                    isAuthenticated
                                      ? "/subscription-plans"
                                      : "/login"
                                  }
                                  className="inline-block px-6 py-2 bg-[#FF009F] text-white rounded-md hover:bg-[#FF009F]/90 transition-colors mt-2"
                                >
                                  {isAuthenticated
                                    ? "Upgrade Now"
                                    : "Login Now"}
                                </Link>
                              </div>
                            )}

                            <div className="space-y-6">
                              {loadingComments ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="flex items-center gap-2 text-[#FF009F]">
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    <span>Loading comments...</span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {movie.comments?.map((comment) => (
                                    <div
                                      key={comment.id}
                                      className="flex gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors backdrop-blur-sm border border-white/5 hover:border-white/10"
                                    >
                                      <img
                                        src={
                                          userDetails[comment.createBy]
                                            ?.picture ||
                                          `https://ui-avatars.com/api/?name=${
                                            userDetails[
                                              comment.createBy
                                            ]?.fullName?.charAt(0) || "U"
                                          }&background=FF009F&color=fff`
                                        }
                                        alt={
                                          userDetails[comment.createBy]
                                            ?.fullName
                                        }
                                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                                      />
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-medium text-white flex items-center gap-2">
                                            {
                                              userDetails[comment.createBy]
                                                ?.fullName
                                            }
                                            {comment.createBy ===
                                              localStorage.getItem(
                                                "userId"
                                              ) && (
                                              <span className="text-xs bg-[#FF009F]/20 text-[#FF009F] px-2 py-0.5 rounded-full">
                                                You
                                              </span>
                                            )}
                                          </h4>
                                          <span className="text-white/60 text-sm">
                                            {moment(
                                              comment.createDate
                                            ).fromNow()}
                                          </span>
                                        </div>
                                        <p className="text-white">
                                          {comment.content}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                  {(!movie.comments ||
                                    movie.comments.length === 0) && (
                                    <div className="text-center py-8 bg-white/5 rounded-lg backdrop-blur-md border border-white/10">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-12 h-12 mx-auto mb-3 text-white/30"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                      </svg>
                                      <p className="text-white/70">
                                        No comments yet
                                      </p>
                                      <p className="text-white/50 text-sm mt-1">
                                        Be the first to share your thoughts!
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 text-center">
                            <div className="mb-4">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 mx-auto text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                            </div>
                            <p className="text-white mb-2">
                              {isAuthenticated
                                ? "Upgrade your account to view and post comments"
                                : "Please login to access this feature"}
                            </p>
                            <Link
                              to={
                                isAuthenticated
                                  ? "/subscription-plans"
                                  : "/login"
                              }
                              className="inline-block px-6 py-2 bg-[#FF009F] text-white rounded-md hover:bg-[#FF009F]/90 transition-colors mt-2"
                            >
                              {isAuthenticated ? "Upgrade Now" : "Login Now"}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WatchPage;
