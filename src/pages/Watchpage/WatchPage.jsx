import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, Clock } from "lucide-react";
import { Rate } from "antd";
import moment from "moment";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import adMediaCountService from "../../apis/AdMedia/adMediaCount";
// ScreenfullUtils is now used through AdUIUtils.handleFullscreen
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

const CONSTANTS = {
  PLAYER_SCRIPT_URL:
    "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js",
  FALLBACK_VIDEO_URL:
    "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  FALLBACK_IMAGE_URL: "https://placehold.co/200x400?text=Ad",
};

// Removed FullscreenUtils in favor of ScreenfullUtils

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

// AdDisplay component removed - only using pre-roll and mid-roll ads

// CenterAdDisplay component removed - only using pre-roll and mid-roll ads

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
  const adPauseIntervalRef = useRef(null);

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

  // Get ad hook values to display ads
  const { midrollAdSequence } = useAdDisplay({
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
    // Chỉ kích hoạt Pre-roll khi người dùng không phải VIP MEMBER
    if (movie && playerReady && role !== "VIP MEMBER" && !prerollAdFinished) {
      console.log("Kích hoạt quảng cáo Pre-roll khi trang được tải");

      // Để đảm bảo iframe đã được tải hoàn toàn trước khi hiển thị quảng cáo
      const timer = setTimeout(() => {
        // Kích hoạt quảng cáo thông qua setShowPrerollAd để useEffect tương ứng được gọi
        setShowPrerollAd(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    movie,
    playerReady,
    role,
    prerollAdFinished,
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

  // Listen for user interaction to force play ads and video
  useEffect(() => {
    const handleUserInteraction = () => {
      forcePlayAds();

      // Cũng cố gắng phát video quảng cáo đang hiển thị
      const forcePlayVisibleAdVideos = () => {
        const adContainer = document.getElementById("in-stream-ad-container");
        if (adContainer) {
          const adVideos = adContainer.querySelectorAll("video");
          adVideos.forEach((video) => {
            if (video.paused) {
              console.log("User interaction - forcing ad video playback");
              // Thử phát video sau khi có tương tác người dùng
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch((err) => {
                  console.error(
                    "Cannot play ad video after user interaction:",
                    err
                  );
                  // Nếu vẫn không thể phát, thử tắt tiếng và phát lại
                  video.muted = true;
                  video
                    .play()
                    .then(() => {
                      // Bật âm thanh sau khi video đã bắt đầu phát
                      setTimeout(() => {
                        video.muted = false;
                      }, 500);
                    })
                    .catch((e) => console.error("Still cannot play:", e));
                });
              }
            }
          });
        }
      };

      // Thử phát video quảng cáo ngay lập tức và sau một khoảng thời gian
      forcePlayVisibleAdVideos();
      setTimeout(forcePlayVisibleAdVideos, 500);
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
    if (movie) {
      // Wait for a short time to ensure iframe has loaded
      const timer = setTimeout(() => {
        forcePlayAds();

        // Thêm xử lý đặc biệt cho video quảng cáo khi reload trang
        const forcePlayAdVideos = () => {
          // Tìm tất cả các video quảng cáo đang hiển thị
          const adContainer = document.getElementById("in-stream-ad-container");
          if (adContainer) {
            const adVideos = adContainer.querySelectorAll("video");
            adVideos.forEach((video) => {
              if (video.paused) {
                console.log("Force playing paused ad video after reload");
                // Tắt tiếng trước khi phát để đảm bảo autoplay hoạt động
                video.muted = true;
                const playPromise = video.play();

                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      // Bật âm thanh sau khi video đã bắt đầu phát
                      setTimeout(() => {
                        video.muted = false;
                      }, 500);
                    })
                    .catch((err) => {
                      console.error("Still cannot play ad video:", err);
                    });
                }
              }
            });
          }
        };

        // Thử phát video quảng cáo ngay lập tức và sau một khoảng thời gian
        forcePlayAdVideos();
        setTimeout(forcePlayAdVideos, 1000);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [movie, forcePlayAds]);

  // Hàm bỏ qua quảng cáo đã được thay thế bằng AdUIUtils.setupSkipButton

  // Hàm hiển thị quảng cáo pre-roll - được tối ưu hóa và đơn giản hóa
  const displayAd = useCallback(
    ({
      isPreroll = false,
      wasFullscreen = false,
      fullscreenElement = null,
      onFinish = null,
    }) => {
      console.log(`Hiển thị quảng cáo ${isPreroll ? "pre-roll" : "mid-roll"}`);

      // Đảm bảo video chính bị tạm dừng
      if (mainPlayerRef.current) {
        mainPlayerRef.current.pause();

        // Thiết lập kiểm tra định kỳ để đảm bảo video vẫn tạm dừng trong quá trình phát quảng cáo
        const pauseCheckInterval = setInterval(() => {
          if (mainPlayerRef.current) mainPlayerRef.current.pause();
        }, 500);

        adPauseIntervalRef.current = pauseCheckInterval;
      }

      // Kiểm tra container video
      if (!iframeRef.current?.parentNode) {
        console.error("Không tìm thấy container video");
        if (adPauseIntervalRef.current) {
          clearInterval(adPauseIntervalRef.current);
          adPauseIntervalRef.current = null;
        }
        return { cleanup: () => {} };
      }

      const videoContainer = iframeRef.current.parentNode;
      if (!videoContainer.id) videoContainer.id = "video-container";

      // Xóa container quảng cáo cũ nếu có
      const existingAdContainer = document.getElementById(
        "in-stream-ad-container"
      );
      if (existingAdContainer) existingAdContainer.remove();

      // Tạo container quảng cáo mới
      const adContainer = AdUIUtils.createAdContainer(
        wasFullscreen,
        fullscreenElement ? fullscreenElement.id || "video-container" : null
      );

      // Tạo các thành phần UI
      const skipButton = AdUIUtils.createSkipButton();
      const adLabel = AdUIUtils.createAdLabel();
      const adCountdown = AdUIUtils.createCountdownTimer(
        AD_CONSTANTS.AD_COUNTDOWN_SECONDS
      );

      // Hàm kết thúc quảng cáo
      const finishAd = () => {
        console.log("Kết thúc quảng cáo");

        // Xóa interval tạm dừng
        if (adPauseIntervalRef.current) {
          clearInterval(adPauseIntervalRef.current);
          adPauseIntervalRef.current = null;
        }

        // Xóa container quảng cáo
        if (adContainer?.parentNode) {
          // Xóa interval đếm ngược
          const intervalId = adContainer.dataset.countdownIntervalId;
          if (intervalId) clearInterval(parseInt(intervalId));

          adContainer.parentNode.removeChild(adContainer);
        }

        // Xử lý fullscreen nếu cần
        const needsFullscreen =
          wasFullscreen ||
          (fullscreenElement && document.fullscreenElement === null);

        if (needsFullscreen) {
          setTimeout(() => {
            const elementToFullscreen =
              iframeRef.current ||
              document.getElementById("video-container") ||
              document.querySelector(".video-container");

            if (elementToFullscreen) {
              AdUIUtils.handleFullscreen.requestFullscreen(elementToFullscreen);
            }
          }, AD_CONSTANTS.FULLSCREEN_RETRY_DELAY);
        }

        // Gọi callback cho pre-roll ads
        if (isPreroll && onFinish) onFinish();
      };

      // Thiết lập đếm ngược
      adContainer.appendChild(adCountdown);
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
      adContainer.dataset.countdownIntervalId = countdownInterval;

      // Thiết lập nút bỏ qua với hành vi chuẩn hóa
      AdUIUtils.setupSkipButton(skipButton, adContainer, () => {
        clearInterval(countdownInterval);
        finishAd();
      });

      // Hiển thị nút bỏ qua ngay lập tức cho pre-roll nếu cần
      if (isPreroll) {
        skipButton.style.display = "block";
      }

      adContainer.appendChild(adLabel);

      // Lấy quảng cáo hiện tại
      // Sử dụng quảng cáo mid-roll cho cả pre-roll và mid-roll
      const currentAd = midrollAdSequence[0];

      // Nếu không có quảng cáo, kết thúc ngay
      if (!currentAd) {
        console.log("Không có quảng cáo để hiển thị");
        if (isPreroll && onFinish) onFinish();
        return { cleanup: () => {} };
      }

      // Tạo nội dung quảng cáo dựa trên loại (video hoặc hình ảnh)
      if (currentAd.video && currentAd.video.trim() !== "") {
        // Quảng cáo video
        const videoElement = document.createElement("video");
        Object.assign(videoElement.style, {
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "#000",
        });
        videoElement.controls = false;
        videoElement.autoplay = true;
        // Mặc định tắt tiếng để đảm bảo autoplay hoạt động
        videoElement.muted = true;
        videoElement.playsInline = true;

        // Hàm để đảm bảo video được phát
        const ensureVideoPlayback = () => {
          console.log("Ensuring video playback");
          const playPromise = videoElement.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Video playback started successfully");
                // Bật âm thanh sau khi video đã bắt đầu phát
                setTimeout(() => {
                  videoElement.muted = false;
                }, 500);
              })
              .catch((error) => {
                console.error("Auto-play was prevented:", error);
                // Nếu không thể phát tự động, giữ tắt tiếng và thử lại
                videoElement.muted = true;
                videoElement
                  .play()
                  .catch((e) => console.error("Still cannot play:", e));
              });
          }
        };

        // Thêm các sự kiện
        videoElement.addEventListener("canplay", ensureVideoPlayback);
        videoElement.addEventListener("loadeddata", ensureVideoPlayback);
        videoElement.addEventListener("ended", () => {
          clearInterval(countdownInterval);
          finishAd();
        });
        videoElement.addEventListener("error", () => {
          console.error("Video error event triggered");
          clearInterval(countdownInterval);
          finishAd();
        });

        // Thêm sự kiện click để bật âm thanh và phát video
        adContainer.addEventListener("click", () => {
          if (videoElement.paused) {
            videoElement.muted = false;
            videoElement.play();
          }
        });

        const source = document.createElement("source");
        source.type = "video/mp4";
        source.src = currentAd.video;
        videoElement.appendChild(source);
        adContainer.appendChild(videoElement);

        // Thêm overlay click nếu có URL
        if (currentAd.redirectUrl?.trim()) {
          const clickOverlay = document.createElement("div");
          Object.assign(clickOverlay.style, {
            position: "absolute",
            inset: "0",
            cursor: "pointer",
            zIndex: "1", // Lower z-index than skip button
          });

          // Standardized click handler for ad overlays
          clickOverlay.addEventListener("click", (e) => {
            // Always check for skip-button class to avoid interfering with skip button
            if (!e.target.closest(".skip-button")) {
              // Open ad URL in new tab
              window.open(currentAd.redirectUrl, "_blank");
            }
          });
          adContainer.appendChild(clickOverlay);

          const urlLabel = AdUIUtils.createUrlLabel();
          adContainer.appendChild(urlLabel);
        }

        // Skip button z-index and class are handled by AdUIUtils.setupSkipButton
      } else if (currentAd.image) {
        // Quảng cáo hình ảnh
        const imageContainer = AdUIUtils.createImageAdContainer();
        const adImage = AdUIUtils.createAdImage(
          currentAd.image,
          currentAd.alternativeImage ||
            "https://placehold.co/800x450/FF009F/FFFFFF?text=Fallback+Ad"
        );

        if (currentAd.redirectUrl?.trim()) {
          const linkWrapper = document.createElement("a");
          linkWrapper.href = currentAd.redirectUrl;
          linkWrapper.target = "_blank";
          linkWrapper.style.display = "block";
          linkWrapper.appendChild(adImage);
          imageContainer.appendChild(linkWrapper);

          const urlLabel = AdUIUtils.createUrlLabel();
          imageContainer.appendChild(urlLabel);
        } else {
          imageContainer.appendChild(adImage);
        }

        adContainer.appendChild(imageContainer);
      }

      // Thêm nội dung văn bản nếu có
      if (currentAd.content?.trim()) {
        const contentDiv = document.createElement("div");
        contentDiv.textContent = currentAd.content;
        Object.assign(contentDiv.style, {
          position: "absolute",
          bottom: "100px",
          left: "0",
          width: "100%",
          textAlign: "center",
          color: "white",
          fontSize: "18px",
          padding: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        });
        adContainer.appendChild(contentDiv);
      }

      // Thêm vào DOM
      videoContainer.appendChild(adContainer);

      // Trả về hàm dọn dẹp
      return {
        cleanup: () => {
          clearInterval(countdownInterval);
          if (adPauseIntervalRef.current) {
            clearInterval(adPauseIntervalRef.current);
            adPauseIntervalRef.current = null;
          }
          if (adContainer?.parentNode) {
            adContainer.parentNode.removeChild(adContainer);
          }
        },
      };
    },
    [midrollAdSequence, iframeRef, mainPlayerRef]
  );

  // Initialize pre-roll ad when it should be displayed
  useEffect(() => {
    if (!showPrerollAd || prerollAdFinished || !iframeRef.current) return;

    // Ensure main video is paused when showing pre-roll ad
    if (mainPlayerRef.current) {
      mainPlayerRef.current.pause();
    }

    // Use displayAd function to show pre-roll ad
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

  // Initialize directVideoUrl when component mounts and movie is available
  useEffect(() => {
    if (!movie) return;

    // Get video URL based on initial state
    const originalUrl = movie?.medias?.find((m) => m.type === "FILMVIP")?.url;

    if (!originalUrl) return;

    // Check if it's a Bunny Stream or Media Delivery URL
    if (originalUrl.includes("iframe.mediadelivery.net/embed/")) {
      // URL is already in iframe embed format, just add playerjs parameters
      setDirectVideoUrl(
        `${originalUrl}${
          originalUrl.includes("?") ? "&" : "?"
        }autoplay=1&controls=1&playsinline=1&enablejsapi=1`
      );
    } else {
      // Other URL, keep as is
      setDirectVideoUrl(originalUrl);
    }
  }, [movie]);

  // Function to display in-stream ad - simplified and combined with showAdOutsideFullscreen
  const showInStreamAd = useCallback(() => {
    console.log("Attempting to display in-stream ad");
    if (role === "VIP MEMBER" || !mainPlayerRef.current) {
      console.log("Cannot display ad: VIP user or no player");
      return;
    }

    // Check if there are midroll ads available
    if (!midrollAdSequence || midrollAdSequence.length === 0) {
      console.log("No midroll ads available to display");
      return;
    }

    // Check if currently in fullscreen mode
    const isFullscreen = AdUIUtils.handleFullscreen.isFullscreen();

    // Save current video position and pause main video
    mainPlayerRef.current.getCurrentTime((currentPosition) => {
      // Pause main video - ensure it's properly paused
      mainPlayerRef.current.pause();
      console.log("Saved video position at:", currentPosition);

      // Force pause again to ensure it's really paused
      setTimeout(() => {
        if (mainPlayerRef.current) {
          mainPlayerRef.current.pause();
        }
      }, 100);

      // Start displaying the sequence of ads
      displayMidrollAdSequence(currentPosition, isFullscreen);
    });
  }, [midrollAdSequence, role, mainPlayerRef]);

  // Function to display sequence of midroll ads - simplified
  const displayMidrollAdSequence = useCallback(
    (currentPosition, isFullscreen) => {
      // Clone ad sequence to avoid affecting state
      let adSequence = [...midrollAdSequence];
      let currentAdIndex = 0;

      // Set up an interval to ensure the main video stays paused during ad playback
      const pauseInterval = setInterval(() => {
        if (mainPlayerRef.current) {
          mainPlayerRef.current.pause();
        }
      }, 500);

      // Store the interval in the ref for cleanup
      adPauseIntervalRef.current = pauseInterval;

      // Helper function to create and display ad
      const createAdElement = (ad, wasFullscreen) => {
        // Create ad container with utilities
        const adContainer = AdUIUtils.createAdContainer(wasFullscreen);
        const skipButton = AdUIUtils.createSkipButton();
        const adLabel = AdUIUtils.createAdLabel();
        const videoContainer = iframeRef.current.parentNode;

        // Ensure video-container has ID
        if (!videoContainer.id) {
          videoContainer.id = "video-container";
        }

        // Setup skip button with standardized behavior
        AdUIUtils.setupSkipButton(skipButton, adContainer, finishCurrentAd);
        adContainer.appendChild(adLabel);

        // Create countdown timer
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
            finishCurrentAd(adContainer);
          } else {
            adCountdown.textContent = `Ad ends in: ${countdownTime}s`;
          }
        }, 1000);

        // Store the interval ID for later cleanup
        adContainer.dataset.countdownIntervalId = countdownInterval;

        // Create ad content based on type
        if (ad.video && ad.video.trim() !== "") {
          // Video ad
          const videoElement = document.createElement("video");
          videoElement.style.width = "100%";
          videoElement.style.height = "100%";
          videoElement.style.objectFit = "contain";
          videoElement.style.backgroundColor = "#000";
          videoElement.controls = false;
          videoElement.autoplay = true;
          // Mặc định tắt tiếng để đảm bảo autoplay hoạt động
          videoElement.muted = true;
          videoElement.style.zIndex = "1"; // Lower z-index than skip button
          videoElement.playsInline = true;

          // Hàm để đảm bảo video được phát
          const ensureVideoPlayback = () => {
            console.log("Ensuring midroll video playback");
            const playPromise = videoElement.play();

            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Midroll video playback started successfully");
                  // Bật âm thanh sau khi video đã bắt đầu phát
                  setTimeout(() => {
                    videoElement.muted = false;
                  }, 500);
                })
                .catch((error) => {
                  console.error("Midroll auto-play was prevented:", error);
                  // Nếu không thể phát tự động, giữ tắt tiếng và thử lại
                  videoElement.muted = true;
                  videoElement
                    .play()
                    .catch((e) =>
                      console.error("Still cannot play midroll:", e)
                    );
                });
            }
          };

          // Thêm các sự kiện
          videoElement.addEventListener("canplay", ensureVideoPlayback);
          videoElement.addEventListener("loadeddata", ensureVideoPlayback);

          // Auto-finish when video ends
          videoElement.addEventListener("ended", () => {
            clearInterval(countdownInterval);
            finishCurrentAd(adContainer);
          });

          // Add error handling
          videoElement.addEventListener("error", () => {
            console.error("Video ad playback error");
            clearInterval(countdownInterval);
            finishCurrentAd(adContainer);
          });

          // Thêm sự kiện click để bật âm thanh và phát video
          adContainer.addEventListener("click", () => {
            if (videoElement.paused) {
              videoElement.muted = false;
              videoElement.play();
            }
          });

          const source = document.createElement("source");
          source.type = "video/mp4";
          source.src = ad.video;
          videoElement.appendChild(source);
          adContainer.appendChild(videoElement);
        } else if (ad.image && ad.image.trim() !== "") {
          // Image ad
          const imageContainer = AdUIUtils.createImageAdContainer();
          const adImage = AdUIUtils.createAdImage(
            ad.image,
            ad.alternativeImage ||
              "https://placehold.co/800x450/FF009F/FFFFFF?text=Fallback+Ad"
          );

          // Make clickable if URL provided
          if (ad.redirectUrl && ad.redirectUrl.trim() !== "") {
            const linkWrapper = document.createElement("a");
            linkWrapper.href = ad.redirectUrl;
            linkWrapper.target = "_blank";
            linkWrapper.style.display = "block";
            linkWrapper.appendChild(adImage);
            imageContainer.appendChild(linkWrapper);

            const urlLabel = AdUIUtils.createUrlLabel();
            imageContainer.appendChild(urlLabel);
          } else {
            imageContainer.appendChild(adImage);
          }

          adContainer.appendChild(imageContainer);
        }

        // Add content text if available
        if (ad.content && ad.content.trim() !== "") {
          const contentDiv = document.createElement("div");
          contentDiv.textContent = ad.content;
          contentDiv.style.position = "absolute";
          contentDiv.style.bottom = "100px";
          contentDiv.style.left = "0";
          contentDiv.style.width = "100%";
          contentDiv.style.textAlign = "center";
          contentDiv.style.color = "white";
          contentDiv.style.fontSize = "18px";
          contentDiv.style.padding = "10px";
          contentDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
          adContainer.appendChild(contentDiv);
        }

        // Add to DOM
        videoContainer.appendChild(adContainer);
        return adContainer;
      };

      // Function to finish current ad and move to next
      const finishCurrentAd = (adContainer) => {
        console.log(
          `Midroll ad ${currentAdIndex + 1}/${adSequence.length} finished`
        );

        // Remove ad container
        if (adContainer && adContainer.parentNode) {
          // Clear countdown timer
          const intervalId = adContainer.dataset.countdownIntervalId;
          if (intervalId) clearInterval(parseInt(intervalId));

          // Remove from DOM
          adContainer.parentNode.removeChild(adContainer);
        }

        // Increment index and show next ad
        currentAdIndex++;
        setTimeout(showNextAd, 300);
      };

      // Function to show next ad
      const showNextAd = () => {
        if (currentAdIndex >= adSequence.length) {
          // All ads finished, return to main video
          console.log("Finished displaying ad sequence, returning to video");

          // Clear pause intervals
          clearInterval(pauseInterval);
          if (adPauseIntervalRef.current) {
            clearInterval(adPauseIntervalRef.current);
            adPauseIntervalRef.current = null;
          }

          // Resume main video
          if (mainPlayerRef.current) {
            mainPlayerRef.current.setCurrentTime(currentPosition);
            mainPlayerRef.current.play();

            // Return to fullscreen if needed
            if (isFullscreen) {
              setTimeout(() => {
                const elementToFullscreen =
                  iframeRef.current ||
                  document.getElementById("video-container") ||
                  document.querySelector(".video-container");

                if (elementToFullscreen) {
                  AdUIUtils.handleFullscreen.requestFullscreen(
                    elementToFullscreen
                  );
                }
              }, AD_CONSTANTS.FULLSCREEN_RETRY_DELAY);
            }
          }
          return;
        }

        // Get current ad
        const currentAd = adSequence[currentAdIndex];
        console.log(
          `Displaying midroll ad ${currentAdIndex + 1}/${adSequence.length}:`,
          currentAd
        );

        // Handle fullscreen state
        if (isFullscreen && currentAdIndex === 0) {
          // Exit fullscreen for first ad
          AdUIUtils.handleFullscreen.exitFullscreen();

          // Wait for fullscreen to exit before showing ad
          setTimeout(() => {
            createAdElement(currentAd, true);
          }, 500);
        } else {
          // Show ad immediately
          createAdElement(currentAd, false);
        }
      };

      // Start showing ads
      showNextAd();
    },
    [midrollAdSequence, mainPlayerRef, iframeRef]
  );

  // Removed unused triggerMidrollAd function

  // Initialize ads immediately after player is ready
  useEffect(() => {
    if (!playerReady || !mainPlayerRef.current || role === "VIP MEMBER") return;

    console.log("Player ready, setting up playback time listener");

    // Store the position where the ad was triggered to prevent duplicate ads
    let adTriggeredPosition = -1;

    // Set up periodic time check
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

  // Initialize mainPlayerRef when component mounts
  useEffect(() => {
    if (!iframeRef.current || !playerReady) return;

    // Initialize main player if not already existing
    if (!mainPlayerRef.current && typeof window.playerjs !== "undefined") {
      console.log("Initializing mainPlayerRef when playerReady");

      try {
        mainPlayerRef.current = new window.playerjs.Player(iframeRef.current);

        // Ensure ready event is triggered
        mainPlayerRef.current.on("ready", () => {
          console.log("Main player is ready for ads integration");
        });

        // Remove metrics errors
        if (window.location.hostname === "localhost") {
          console.log("Running on localhost - disabling metrics");
          window.playerjs.metrics = {
            send: () => {},
          };
        }
      } catch (error) {
        console.error("Error initializing main player:", error);
      }
    }
  }, [playerReady]);

  // Reset mid-roll ad state when video changes
  useEffect(() => {
    console.log("Resetting ad state when video changes");
    hasShownMidRollAd.current = false;
  }, [showTrailer, movieId]);

  // Clean up player reference when component unmounts
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

      // Clean up inStreamAdRef
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
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen"
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
                            {movie.person?.slice(0, 4).map((actor) => (
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
