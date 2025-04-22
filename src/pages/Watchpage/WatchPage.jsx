import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react";
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

  // Refs for ads management
  const adPlayersRef = useRef([]);
  const mainPlayerRef = useRef(null);

  const shownAdPositions = useRef([]);
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
        if (role !== "VIP MEMBER" && mainPlayerRef.current) {
          // Kiểm tra xem có đạt đến vị trí quảng cáo nào không
          const positions = adPositions || [
            AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME,
          ];

          // Tìm vị trí quảng cáo phù hợp để hiển thị
          const adPositionToShow = positions.find((position) => {
            // Kiểm tra xem đã đến vị trí quảng cáo chưa
            const isAtPosition =
              seconds >= position && Math.abs(seconds - position) < 2;

            // Kiểm tra xem quảng cáo này đã hiển thị chưa
            const hasShownThisAd = shownAdPositions.current.includes(position);

            // Chỉ trả về true nếu đã đến vị trí và chưa hiển thị quảng cáo này
            return isAtPosition && !hasShownThisAd;
          });

          if (adPositionToShow !== undefined) {
            console.log(
              `Đã đạt đến vị trí quảng cáo ${adPositionToShow} giây (thời gian hiện tại: ${seconds.toFixed(
                1
              )}), hiển thị quảng cáo`
            );

            // Thêm vị trí quảng cáo vào danh sách đã hiển thị
            shownAdPositions.current.push(adPositionToShow);

            // Hiển thị quảng cáo với vị trí cụ thể
            showInStreamAd(adPositionToShow);
          }
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
    submittingComment,
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
    movieId, // Thêm movieId để lấy quảng cáo từ API
  });

  // Lấy vị trí quảng cáo trực tiếp từ midrollAdSequence
  const adPositions = useMemo(() => {
    if (!midrollAdSequence || midrollAdSequence.length === 0) {
      return [AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME]; // Giá trị mặc định
    }

    // Lấy vị trí của tất cả quảng cáo
    const positions = midrollAdSequence.map(
      (ad) => ad.position || AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME
    );
    console.log("Ad positions from sequence:", positions);
    return positions;
  }, [midrollAdSequence]);

  // Fetch movie data and handle controls
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

  // Auto-hide resume dialog after 4 seconds
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

  // Unified ad management effect - handles all ad-related functionality
  useEffect(() => {
    // 1. Force play ads when user interacts with the page
    const handleUserInteraction = () => {
      forcePlayAds();

      // Cố gắng phát video quảng cáo đang hiển thị
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

    // 2. Force play ads when component mounts and video URL is available
    let forcePlayTimer;
    if (movie) {
      // Wait for a short time to ensure iframe has loaded
      forcePlayTimer = setTimeout(() => {
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
    }

    // 3. Set up event listeners for user interaction
    const interactionEvents = ["click", "touchstart", "keydown", "scroll"];
    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleUserInteraction, { once: true });
    });

    // Cleanup function
    return () => {
      // Clean up timers
      if (forcePlayTimer) {
        clearTimeout(forcePlayTimer);
      }

      // Clean up event listeners
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleUserInteraction);
      });

      // Clean up ad players
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
  }, [movie, forcePlayAds]);

  // Hàm bỏ qua quảng cáo đã được thay thế bằng AdUIUtils.setupSkipButton

  // Hàm tăng lượt xem quảng cáo
  const increaseAdMediaCount = useCallback(async (adMediaId) => {
    if (!adMediaId) {
      console.error("Không có adMediaId để tăng lượt xem");
      return;
    }

    try {
      console.log(`Tăng lượt xem cho quảng cáo có ID: ${adMediaId}`);
      const response = await adMediaCountService.increaseAdMediaCount(
        adMediaId
      );
      console.log("Kết quả tăng lượt xem quảng cáo:", response);
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem quảng cáo:", error);
    }
  }, []);

  // Hàm hiển thị quảng cáo mid-roll
  const displayAd = useCallback(
    ({
      wasFullscreen = false,
      fullscreenElement = null,
      onFinish = null,
      adIndex = 0,
    }) => {
      console.log("Hiển thị quảng cáo mid-roll, index:", adIndex);

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

        // Tiếp tục phát video chính
        if (mainPlayerRef.current) {
          console.log("Resuming main video playback");

          // Hàm để đảm bảo video được phát sau khi quảng cáo kết thúc
          const ensureVideoResumes = () => {
            try {
              // Thử phát video
              const playPromise = mainPlayerRef.current.play();

              // Xử lý promise nếu có
              if (playPromise && typeof playPromise.then === "function") {
                playPromise.catch((error) => {
                  console.error("Error resuming video after ad:", error);
                  // Thử lại sau 500ms
                  setTimeout(ensureVideoResumes, 500);
                });
              }
            } catch (error) {
              console.error("Exception when resuming video:", error);
              // Thử lại sau 500ms
              setTimeout(ensureVideoResumes, 500);
            }
          };

          // Thử phát video sau 100ms để đảm bảo các thao tác khác đã hoàn tất
          setTimeout(ensureVideoResumes, 100);

          // Thử lại sau 1 giây và 2 giây để đảm bảo video được phát
          setTimeout(ensureVideoResumes, 1000);
          setTimeout(ensureVideoResumes, 2000);
        }

        // Chỉ khôi phục fullscreen nếu video đã ở chế độ fullscreen trước khi hiển thị quảng cáo
        if (wasFullscreen === true) {
          console.log("Restoring fullscreen after ad");
          setTimeout(() => {
            const elementToFullscreen =
              iframeRef.current ||
              document.getElementById("video-container") ||
              document.querySelector(".video-container");

            if (elementToFullscreen) {
              AdUIUtils.handleFullscreen.requestFullscreen(elementToFullscreen);
            }
          }, AD_CONSTANTS.FULLSCREEN_RETRY_DELAY);
        } else {
          console.log(
            "Not restoring fullscreen as video was not in fullscreen before ad"
          );
        }

        // Gọi callback nếu được cung cấp
        if (onFinish) onFinish();
      };

      // Thiết lập đếm ngược
      adContainer.appendChild(adCountdown);
      let countdownTime = AD_CONSTANTS.AD_COUNTDOWN_SECONDS;
      let skipButtonShown = false;

      const countdownInterval = setInterval(() => {
        countdownTime--;
        if (countdownTime <= 0) {
          clearInterval(countdownInterval);
          finishAd();
        } else {
          // Cập nhật text đếm ngược
          adCountdown.textContent = `Ad ends in: ${countdownTime}s`;

          // Hiển thị nút skip trong 5 giây cuối
          if (
            countdownTime <= AD_CONSTANTS.SKIP_AD_DELAY_SECONDS &&
            !skipButtonShown
          ) {
            skipButton.style.display = "block";
            skipButton.style.animation = "fadeIn 0.5s ease-in-out";
            skipButtonShown = true;
          }
        }
      }, 1000);
      adContainer.dataset.countdownIntervalId = countdownInterval;

      // Thiết lập nút bỏ qua với hành vi chuẩn hóa
      AdUIUtils.setupSkipButton(skipButton, adContainer, () => {
        clearInterval(countdownInterval);
        finishAd();
      });

      adContainer.appendChild(adLabel);

      // Lấy quảng cáo hiện tại dựa trên index được truyền vào
      const currentAd = midrollAdSequence[adIndex];

      console.log("Current ad to display:", currentAd, "at index:", adIndex);

      // Tăng lượt xem quảng cáo ngay khi trigger
      if (currentAd && currentAd.id) {
        increaseAdMediaCount(currentAd.id);
      }

      // Nếu không có quảng cáo, kết thúc ngay
      if (!currentAd) {
        console.log("Không có quảng cáo để hiển thị");
        if (onFinish) onFinish();
        return { cleanup: () => {} };
      }

      // Tạo nội dung quảng cáo dựa trên loại (video hoặc hình ảnh)
      if (currentAd.video && currentAd.video.trim() !== "") {
        console.log("Creating video ad with URL:", currentAd.video);

        // Tạo container cho video để dễ dàng style
        const videoContainer = document.createElement("div");
        videoContainer.className = "video-ad-container";
        videoContainer.style.width = "100%";
        videoContainer.style.height = "100%";
        videoContainer.style.display = "flex";
        videoContainer.style.justifyContent = "center";
        videoContainer.style.alignItems = "center";
        videoContainer.style.backgroundColor = "#000";
        videoContainer.style.position = "relative";

        // Tạo video element
        const videoElement = document.createElement("video");
        Object.assign(videoElement.style, {
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "#000",
          zIndex: "1",
        });

        // Thiết lập các thuộc tính của video
        videoElement.controls = false;
        videoElement.autoplay = true;
        videoElement.muted = true; // Mặc định tắt tiếng để đảm bảo autoplay hoạt động
        videoElement.playsInline = true;
        videoElement.preload = "auto";
        videoElement.crossOrigin = "anonymous";
        videoElement.setAttribute("playsinline", "");
        videoElement.setAttribute("webkit-playsinline", "");

        // Tạo fallback image trong trường hợp video không tải được
        const fallbackImage = document.createElement("img");
        fallbackImage.src =
          currentAd.alternativeImage ||
          "https://placehold.co/800x450/FF009F/FFFFFF?text=Alternative+Ad";
        fallbackImage.style.display = "none";
        fallbackImage.style.width = "100%";
        fallbackImage.style.height = "100%";
        fallbackImage.style.objectFit = "contain";
        fallbackImage.style.position = "absolute";
        fallbackImage.style.top = "0";
        fallbackImage.style.left = "0";
        fallbackImage.style.zIndex = "0";

        // Hàm để đảm bảo video được phát
        const ensureVideoPlayback = () => {
          console.log("Ensuring video playback");

          // Hiển thị video, ẩn fallback image
          videoElement.style.display = "block";
          fallbackImage.style.display = "none";

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
                videoElement.play().catch((e) => {
                  console.error("Still cannot play:", e);
                  // Nếu vẫn không thể phát, hiển thị fallback image
                  videoElement.style.display = "none";
                  fallbackImage.style.display = "block";
                });
              });
          }
        };

        // Thêm các sự kiện
        videoElement.addEventListener("canplay", ensureVideoPlayback);
        videoElement.addEventListener("loadeddata", ensureVideoPlayback);
        videoElement.addEventListener("loadedmetadata", ensureVideoPlayback);
        videoElement.addEventListener("ended", () => {
          clearInterval(countdownInterval);
          finishAd();
        });
        videoElement.addEventListener("error", (e) => {
          console.error("Video error event triggered:", e);
          // Hiển thị fallback image khi có lỗi
          videoElement.style.display = "none";
          fallbackImage.style.display = "block";
          // Không kết thúc quảng cáo ngay, vẫn hiển thị fallback image
        });

        // Thêm sự kiện click để bật âm thanh và phát video
        videoContainer.addEventListener("click", (e) => {
          // Kiểm tra xem có phải là nút skip không
          if (!e.target.closest(".skip-button")) {
            if (videoElement.paused) {
              videoElement.muted = false;
              videoElement.play();
            }
          }
        });

        // Thêm source cho video
        const source = document.createElement("source");
        source.type = "video/mp4";
        source.src = currentAd.video;
        videoElement.appendChild(source);

        // Thêm video và fallback image vào container
        videoContainer.appendChild(videoElement);
        videoContainer.appendChild(fallbackImage);

        // Thêm container vào ad container
        adContainer.appendChild(videoContainer);

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
        console.log("Displaying image ad with URL:", currentAd.image);

        // Tạo container cho hình ảnh để dễ dàng style
        const imageContainer = document.createElement("div");
        imageContainer.className = "image-ad-container";
        imageContainer.style.width = "100%";
        imageContainer.style.height = "100%";
        imageContainer.style.display = "flex";
        imageContainer.style.justifyContent = "center";
        imageContainer.style.alignItems = "center";
        imageContainer.style.backgroundColor = "#000";
        imageContainer.style.position = "relative";
        imageContainer.style.animation = "fadeIn 0.5s ease-in-out";

        // Tạo style cho animation nếu chưa có
        if (!document.getElementById("ad-animations")) {
          const style = document.createElement("style");
          style.id = "ad-animations";
          style.textContent = `
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }

            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `;
          document.head.appendChild(style);
        }

        // Tạo hình ảnh quảng cáo
        const adImage = document.createElement("img");
        adImage.src = currentAd.image;
        adImage.className = "ad-image";
        adImage.style.maxWidth = "80%";
        adImage.style.maxHeight = "80%";
        adImage.style.objectFit = "contain";
        adImage.style.borderRadius = "8px";
        adImage.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
        adImage.style.animation = "pulse 3s infinite ease-in-out";

        // Xử lý lỗi nếu hình ảnh không tải được
        adImage.onerror = () => {
          adImage.onerror = null;
          adImage.src =
            currentAd.alternativeImage ||
            "https://placehold.co/800x450/FF009F/FFFFFF?text=Fallback+Ad";
        };

        // Xử lý URL chuyển hướng nếu có
        if (currentAd.redirectUrl?.trim()) {
          // Tạo wrapper cho hình ảnh
          const linkWrapper = document.createElement("a");
          linkWrapper.href = currentAd.redirectUrl;
          linkWrapper.target = "_blank";
          linkWrapper.style.display = "block";
          linkWrapper.style.cursor = "pointer";

          // Thêm hình ảnh vào wrapper
          linkWrapper.appendChild(adImage);
          imageContainer.appendChild(linkWrapper);

          // Thêm nhãn URL
          const urlLabel = document.createElement("div");
          urlLabel.textContent = "Click to learn more";
          urlLabel.className = "url-label";
          urlLabel.style.position = "absolute";
          urlLabel.style.bottom = "12px";
          urlLabel.style.left = "0";
          urlLabel.style.right = "0";
          urlLabel.style.textAlign = "center";
          urlLabel.style.color = "white";
          urlLabel.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
          urlLabel.style.padding = "8px";
          urlLabel.style.borderRadius = "4px";
          urlLabel.style.width = "200px";
          urlLabel.style.margin = "0 auto";
          urlLabel.style.fontSize = "14px";
          imageContainer.appendChild(urlLabel);
        } else {
          // Nếu không có URL, chỉ thêm hình ảnh vào container
          imageContainer.appendChild(adImage);
        }

        // Thêm container vào ad container
        adContainer.appendChild(imageContainer);
      } else {
        // Trường hợp không có video hoặc hình ảnh, hiển thị fallback
        console.log("No video or image found in ad, using fallback", currentAd);

        // Tạo container cho fallback
        const fallbackContainer = document.createElement("div");
        fallbackContainer.className = "fallback-ad-container";
        fallbackContainer.style.width = "100%";
        fallbackContainer.style.height = "100%";
        fallbackContainer.style.display = "flex";
        fallbackContainer.style.flexDirection = "column";
        fallbackContainer.style.justifyContent = "center";
        fallbackContainer.style.alignItems = "center";
        fallbackContainer.style.backgroundColor = "#3A0033";
        fallbackContainer.style.color = "white";
        fallbackContainer.style.textAlign = "center";
        fallbackContainer.style.padding = "20px";

        // Tạo tiêu đề cho fallback
        const fallbackTitle = document.createElement("h2");
        fallbackTitle.textContent = "Alternative Ad";
        fallbackTitle.style.fontSize = "32px";
        fallbackTitle.style.fontWeight = "bold";
        fallbackTitle.style.marginBottom = "16px";
        fallbackTitle.style.color = "#FF009F";

        // Tạo nội dung cho fallback
        const fallbackContent = document.createElement("p");
        fallbackContent.textContent =
          currentAd.content || "Advertisement content";
        fallbackContent.style.fontSize = "18px";
        fallbackContent.style.maxWidth = "80%";
        fallbackContent.style.lineHeight = "1.5";

        // Thêm các phần tử vào container
        fallbackContainer.appendChild(fallbackTitle);
        fallbackContainer.appendChild(fallbackContent);

        // Nếu có URL chuyển hướng, thêm nút
        if (currentAd.redirectUrl?.trim()) {
          const fallbackButton = document.createElement("a");
          fallbackButton.href = currentAd.redirectUrl;
          fallbackButton.target = "_blank";
          fallbackButton.textContent = "Learn More";
          fallbackButton.style.display = "inline-block";
          fallbackButton.style.marginTop = "20px";
          fallbackButton.style.padding = "10px 20px";
          fallbackButton.style.backgroundColor = "#FF009F";
          fallbackButton.style.color = "white";
          fallbackButton.style.borderRadius = "4px";
          fallbackButton.style.textDecoration = "none";
          fallbackButton.style.fontWeight = "bold";
          fallbackButton.style.transition = "background-color 0.3s";

          // Thêm hover effect
          fallbackButton.onmouseover = () => {
            fallbackButton.style.backgroundColor = "#D1007F";
          };
          fallbackButton.onmouseout = () => {
            fallbackButton.style.backgroundColor = "#FF009F";
          };

          fallbackContainer.appendChild(fallbackButton);
        }

        // Thêm container vào ad container
        adContainer.appendChild(fallbackContainer);
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

  // Function to display in-stream ad - simplified and combined with showAdOutsideFullscreen
  const showInStreamAd = useCallback(
    (adPosition) => {
      console.log(
        "Attempting to display in-stream ad at position:",
        adPosition
      );
      if (role === "VIP MEMBER" || !mainPlayerRef.current) {
        console.log("Cannot display ad: VIP user or no player");
        return;
      }

      // Check if there are midroll ads available
      if (!midrollAdSequence || midrollAdSequence.length === 0) {
        console.log("No midroll ads available to display");
        return;
      }

      // Tìm quảng cáo phù hợp với vị trí hiện tại
      const adIndex = midrollAdSequence.findIndex(
        (ad) => ad.position === adPosition
      );
      const adToShow = adIndex !== -1 ? adIndex : 0; // Nếu không tìm thấy, sử dụng quảng cáo đầu tiên

      console.log("Selected ad index:", adToShow, "for position:", adPosition);

      // Kiểm tra xem có đang ở chế độ fullscreen không
      const isCurrentlyFullscreen = AdUIUtils.handleFullscreen.isFullscreen();
      const fullscreenElement = document.getElementById("video-container");

      // Lưu trạng thái fullscreen trước khi hiển thị quảng cáo
      console.log(
        "Current fullscreen state before ad:",
        isCurrentlyFullscreen ? "fullscreen" : "non-fullscreen"
      );

      // Nếu đang ở chế độ fullscreen, thoát khỏi fullscreen trước khi hiển thị quảng cáo
      if (isCurrentlyFullscreen) {
        console.log("Exiting fullscreen before showing ad");
        AdUIUtils.handleFullscreen.exitFullscreen().then(() => {
          // Sau khi thoát khỏi fullscreen, hiển thị quảng cáo
          setTimeout(() => {
            // Use the displayAd function to show mid-roll ad
            displayAd({
              wasFullscreen: true, // Đánh dấu là đã ở chế độ fullscreen trước đó
              fullscreenElement: fullscreenElement,
              adIndex: adToShow, // Truyền index của quảng cáo cần hiển thị
            });
          }, 100); // Chờ một chút để đảm bảo thoát khỏi fullscreen hoàn tất
        });
      } else {
        // Nếu không ở chế độ fullscreen, hiển thị quảng cáo ngay
        console.log("Showing ad in non-fullscreen mode");
        displayAd({
          wasFullscreen: false, // Đánh dấu rõ ràng là không ở chế độ fullscreen
          fullscreenElement: null, // Không cần lưu fullscreenElement vì không có ý định khôi phục
          adIndex: adToShow, // Truyền index của quảng cáo cần hiển thị
        });
      }
    },
    [midrollAdSequence, role, mainPlayerRef, displayAd]
  );

  // Removed unused triggerMidrollAd function

  // Unified player initialization and ad management effect
  useEffect(() => {
    // 1. Initialize mainPlayerRef when component mounts
    if (
      iframeRef.current &&
      playerReady &&
      !mainPlayerRef.current &&
      typeof window.playerjs !== "undefined"
    ) {
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

    // 2. Reset mid-roll ad state when video changes
    console.log("Resetting ad state when video changes");
    shownAdPositions.current = [];

    // 3. Set up ad trigger for non-VIP members
    if (!playerReady || !mainPlayerRef.current || role === "VIP MEMBER") return;

    console.log("Player ready, setting up playback time listener");

    // Store the position where the ad was triggered to prevent duplicate ads
    let adTriggeredPosition = -1;

    // Get ad positions from API or use default value
    const adTriggerPositions = adPositions || [
      AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME,
    ];
    console.log("Ad trigger positions:", adTriggerPositions);

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

        // If less than cooldown period since last ad closed, don't trigger another
        const adCooldownPeriod = 10000; // 10 seconds in milliseconds
        if (timeSinceLastAd < adCooldownPeriod) {
          return;
        }
      }

      mainPlayerRef.current.getCurrentTime((currentTime) => {
        // If we're within margin of where we triggered an ad before, don't trigger again
        const adPositionMargin = 0.5; // 0.5 seconds margin
        if (Math.abs(currentTime - adTriggeredPosition) < adPositionMargin) {
          return;
        }

        // Skip first few seconds of video
        const skipInitialSeconds = 5; // Skip first 5 seconds
        if (currentTime < skipInitialSeconds) {
          return;
        }

        // Find appropriate ad position to display
        const adPositionToShow = adTriggerPositions.find((position) => {
          // Check if we've reached the ad position (allow margin)
          const adTriggerMargin = 2; // 2 second margin
          const isAtPosition =
            currentTime >= position &&
            Math.abs(currentTime - position) < adTriggerMargin;

          // Check if this ad has already been shown
          const hasShownThisAd = shownAdPositions.current.includes(position);

          // Only return true if we've reached the position and haven't shown this ad yet
          return isAtPosition && !hasShownThisAd;
        });

        // If we found a suitable ad position
        if (adPositionToShow !== undefined) {
          console.log(
            `Reached ad trigger position at ${adPositionToShow} seconds (current time: ${currentTime.toFixed(
              1
            )}), displaying ad`
          );

          // Add ad position to list of shown ads
          shownAdPositions.current.push(adPositionToShow);
          adTriggeredPosition = currentTime; // Remember where we triggered the ad

          // Display ad with specific position
          showInStreamAd(adPositionToShow);
        }
      });
    }, 1000);

    // Cleanup function
    return () => {
      // Clear interval
      clearInterval(timeCheckInterval);

      // Clean up player reference
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
  }, [
    playerReady,
    role,
    showInStreamAd,
    adPositions,
    iframeRef,
    showTrailer,
    movieId,
  ]);

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
                                        disabled={
                                          !commentInput.trim() ||
                                          submittingComment
                                        }
                                        className="px-4 py-2 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90 transition-all font-medium"
                                      >
                                        {submittingComment ? (
                                          <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Posting...
                                          </span>
                                        ) : (
                                          "Post"
                                        )}
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
