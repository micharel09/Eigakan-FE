import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, Clock } from "lucide-react";
import { Rate } from "antd";
import moment from "moment";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import {
  useAuth,
  useVideo,
  usePlaybackPosition,
  useViewCounter,
  useMovieRating,
  useMovieComments,
  useAdDisplay,
} from "../../hooks";

// Extract AdDisplay as a memoized component
const AdDisplay = memo(({ ad, className }) => {
  if (!ad) return null;

  // Check if it's a header ad or sidebar ad
  const isHeaderAd = className && className.includes("max-h-[100px]");
  const isSidebarAd = className && className.includes("sidebar-ad");

  // For video ads in regular ad slots
  const adVideoRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const isInitializingRef = useRef(false);

  // Initialize video player if this is a video ad
  useEffect(() => {
    if (!ad.video || !adVideoRef.current) return;

    // Avoid multiple initialization attempts
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    let isComponentMounted = true;

    const initAdVideoPlayer = async () => {
      try {
        // Check if PlayerJS is loaded
        if (typeof window.playerjs === "undefined") {
          // Load PlayerJS if not already loaded
          const script = document.createElement("script");
          script.src =
            "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Avoid creating a player if component unmounted during async operations
        if (!isComponentMounted || !adVideoRef.current) return;

        // Initialize player only if we don't already have an instance
        if (!playerInstanceRef.current) {
          console.log("Creating new ad player instance");
          playerInstanceRef.current = new window.playerjs.Player(
            adVideoRef.current
          );

          playerInstanceRef.current.on("ready", () => {
            if (isComponentMounted) {
              console.log("Ad player ready");
              // Force autoplay with multiple attempts
              try {
                // Set video to muted first to allow autoplay and disable controls
                playerInstanceRef.current.setMute(true);
                playerInstanceRef.current.setVolume(0);
                playerInstanceRef.current.setLoop(true);
                playerInstanceRef.current.hideControls();
                playerInstanceRef.current.play();

                // Try again after a short delay
                setTimeout(() => {
                  if (isComponentMounted && playerInstanceRef.current) {
                    playerInstanceRef.current.setMute(true);
                    playerInstanceRef.current.hideControls();
                    playerInstanceRef.current.play();

                    // Gradually increase volume after playback starts but keep controls hidden
                    setTimeout(() => {
                      if (isComponentMounted && playerInstanceRef.current) {
                        playerInstanceRef.current.setMute(false);
                        playerInstanceRef.current.setVolume(50);
                        playerInstanceRef.current.hideControls();
                      }
                    }, 1500);
                  }
                }, 100);
              } catch (err) {
                console.warn("Error in initial play attempt:", err);
              }
            }
          });

          // Force play on timeupdate as well
          playerInstanceRef.current.on("timeupdate", () => {
            // Do nothing, but this ensures the player is active
          });

          playerInstanceRef.current.on("error", (error) => {
            console.error("Ad player error:", error);
          });
        }
      } catch (error) {
        console.error("Failed to initialize ad video player:", error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initAdVideoPlayer();

    // Clean up function
    return () => {
      isComponentMounted = false;
      isInitializingRef.current = false;

      if (playerInstanceRef.current) {
        // Just disconnect events, don't destroy the player instance
        try {
          playerInstanceRef.current.off("ready");
          playerInstanceRef.current.off("error");
        } catch (err) {
          console.warn("Error cleaning up player events:", err);
        }
      }
    };
  }, [ad.video]); // Simplify dependencies

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
    <div
      className={`p-2 bg-black/40 rounded border border-white/10 w-full flex flex-col items-center ${
        isSidebarAd ? "h-full" : "h-auto"
      } ${className}`}
    >
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
          className={`block w-full ${isSidebarAd ? "flex-1" : ""}`}
        >
          <img
            src={ad.image}
            alt="Advertisement"
            className={`w-full hover:opacity-90 transition-opacity rounded ${
              isHeaderAd
                ? "max-h-[60px] object-contain"
                : isSidebarAd
                ? "h-[calc(100vh-220px)] max-h-full object-cover"
                : "max-h-[400px] object-contain"
            }`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/200x400?text=Ad";
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

    const initAdPlayer = async () => {
      try {
        // Check if PlayerJS is loaded
        if (typeof window.playerjs === "undefined") {
          // Load PlayerJS if not already loaded
          const script = document.createElement("script");
          script.src =
            "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Avoid creating a player if component unmounted during async operations
        if (!isComponentMounted || !adVideoRef.current) return;

        // Initialize player only if we don't already have one
        if (!playerInstanceRef.current) {
          console.log("Creating new center ad player instance");
          playerInstanceRef.current = new window.playerjs.Player(
            adVideoRef.current
          );

          playerInstanceRef.current.on("ready", () => {
            if (isComponentMounted) {
              console.log("Center ad player ready");
              // Force autoplay with multiple attempts
              try {
                // Set video to muted first to allow autoplay and disable controls
                playerInstanceRef.current.setMute(true);
                playerInstanceRef.current.setVolume(0);
                playerInstanceRef.current.setLoop(true);
                playerInstanceRef.current.hideControls();
                playerInstanceRef.current.play();

                // Try again after a short delay
                setTimeout(() => {
                  if (isComponentMounted && playerInstanceRef.current) {
                    playerInstanceRef.current.setMute(true);
                    playerInstanceRef.current.hideControls();
                    playerInstanceRef.current.play();
                  }
                }, 100);

                // And one more time after a longer delay
                setTimeout(() => {
                  if (isComponentMounted && playerInstanceRef.current) {
                    playerInstanceRef.current.hideControls();
                    playerInstanceRef.current.play();

                    // Gradually increase volume after playback starts but keep controls hidden
                    setTimeout(() => {
                      if (isComponentMounted && playerInstanceRef.current) {
                        playerInstanceRef.current.setMute(false);
                        playerInstanceRef.current.setVolume(50);
                        playerInstanceRef.current.hideControls();
                      }
                    }, 1500);
                  }
                }, 1000);
              } catch (err) {
                console.warn("Error in initial play attempt:", err);
              }
            }
          });

          // Force play on timeupdate as well
          playerInstanceRef.current.on("timeupdate", () => {
            // Do nothing, but this ensures the player is active
          });

          playerInstanceRef.current.on("error", (error) => {
            console.error("Center ad player error:", error);
          });
        }
      } catch (error) {
        console.error("Failed to initialize ad video player:", error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initAdPlayer();

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
  }, [centerAd?.video, showCenterAd]); // Simplify dependencies

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
                  {centerAd.url && (
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
                  )}
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
                      e.target.src = "https://placehold.co/800x600?text=Ad";
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

  // Refs for ads management
  const adPlayersRef = useRef([]);

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

  // Utility function to force play ads when user interacts with the page
  const forcePlayAds = useCallback(() => {
    if (adPlaybackAttempted) return;

    setAdPlaybackAttempted(true);

    // Find all iframes that are ad players and force play them
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      if (iframe.src.includes("autoplay=1")) {
        try {
          // Try to create player instances for any ads that might not have been initialized
          if (typeof window.playerjs !== "undefined") {
            const player = new window.playerjs.Player(iframe);
            player.on("ready", () => {
              player.play();
              adPlayersRef.current.push(player);
            });
          }

          // Also try the native play() method on the content window
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

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [forcePlayAds]);

  // Clean up ad players on unmount
  useEffect(() => {
    return () => {
      adPlayersRef.current.forEach((player) => {
        try {
          player.off("ready");
          player.off("error");
        } catch (err) {}
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
  const {
    sidebarAd,
    leftSidebarAd,
    headerAd,
    footerAd,
    centerAd,
    showCenterAd,
    setShowCenterAd,
  } = useAdDisplay({
    isAuthenticated,
    userRole: role,
  });

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

  // Helper function for video container styling
  const getVideoContainerStyle = () => {
    // VIP MEMBER has full-screen video
    if (role === "VIP MEMBER") {
      return {
        width: "100%",
        height: "96%",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5,
      };
    }

    // Other roles have larger centered video (increased width and height for better visibility)
    return {
      width: "100%",
      height: "80%",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 5,
      borderRadius: "8px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    };
  };

  // Get video URLs directly
  const directMovieUrl =
    movie?.medias?.find((m) => m.type === "FILMVIP")?.url || "";
  const directTrailerUrl =
    movie?.medias?.find((m) => m.type === "TRAILER")?.url || "";

  // Thêm useEffect để gọi forcePlayAds sau khi trang load xong
  useEffect(() => {
    // Force play ads when component mounts and video URL is available
    if (
      movie &&
      (centerAd?.video ||
        leftSidebarAd?.video ||
        sidebarAd?.video ||
        headerAd?.video ||
        footerAd?.video)
    ) {
      // Wait for a short time to ensure iframe has loaded
      const timer = setTimeout(() => {
        forcePlayAds();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    movie,
    centerAd,
    leftSidebarAd,
    sidebarAd,
    headerAd,
    footerAd,
    forcePlayAds,
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
        {/* Header Ad */}
        {headerAd && (
          <div className="absolute top-2 left-0 right-0 z-10 flex justify-center">
            <AdDisplay
              ad={headerAd}
              className="max-w-[900px] max-h-[180px] bg-opacity-70 overflow-hidden"
            />
          </div>
        )}

        {/* Main content with 3-column grid layout - Adjust column widths for larger center column */}
        <div className="grid grid-cols-[250px_1fr_250px] w-full h-full">
          {/* Left Sidebar Ad Column - Reduced width slightly */}
          <div className="h-full overflow-hidden z-10">
            {leftSidebarAd ? (
              <div className="h-full pt-[80px] pb-[60px] pr-2">
                <AdDisplay ad={leftSidebarAd} className="sidebar-ad h-full" />
              </div>
            ) : (
              // Empty placeholder to maintain grid
              <div className="h-full"></div>
            )}
          </div>

          {/* Center Video Column - Always centered with more space */}
          <div className="relative flex items-center justify-center h-full py-2">
            <div style={getVideoContainerStyle()} className="relative">
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

          {/* Right Sidebar Ad Column - Reduced width slightly */}
          <div className="h-full overflow-hidden z-10">
            {sidebarAd ? (
              <div className="h-full pt-[80px] pb-[60px] pl-2">
                <AdDisplay ad={sidebarAd} className="sidebar-ad h-full" />
              </div>
            ) : (
              // Empty placeholder to maintain grid
              <div className="h-full"></div>
            )}
          </div>
        </div>

        {/* CENTER Ad - Full screen overlay */}
        <CenterAdDisplay
          centerAd={centerAd}
          showCenterAd={showCenterAd}
          setShowCenterAd={setShowCenterAd}
        />

        {/* Footer Ad */}
        {footerAd && (
          <div className="absolute bottom-[60px] left-0 right-0 z-10 flex justify-center pointer-events-auto">
            <AdDisplay ad={footerAd} className="max-w-[728px] max-h-[100px]" />
          </div>
        )}

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
                        {isAuthenticated ? (
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
                              <div className="mb-6">
                                <UpgradeMessage
                                  message="Upgrade your account to join the discussion"
                                  isAuthenticated={isAuthenticated}
                                />
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
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                              <span className="text-white font-bold">
                                Comments
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
                                Please login to view comments
                              </p>
                              <Link
                                to="/login"
                                className="inline-flex items-center px-6 py-2 bg-[#FF009F] text-white rounded-md hover:bg-[#FF009F]/90 transition-colors mt-2"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-2"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                  <polyline points="10 17 15 12 10 7"></polyline>
                                  <line x1="15" y1="12" x2="3" y2="12"></line>
                                </svg>
                                Login Now
                              </Link>
                            </div>
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
