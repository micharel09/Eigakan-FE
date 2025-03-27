import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, Clock } from "lucide-react";
import { Rate, notification } from "antd";
import moment from "moment";
import UserApi from "../../apis/User/user";
import ratingService from "../../apis/Movie/rating";
import Loading from "../../components/Loading/Loading";
import movieService from "../../apis/Movie/movie";
import movieCountService from "../../apis/MovieCount/MovieCount";
import movieHistoryService from "../../apis/MovieHistory/MovieHistory";
import adMediaService from "../../apis/AdMedia/adMedia";
import adPurchaseSlotService from "../../apis/AdPurchaseSlot/adPurchaseSlot";

const WatchPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [commentInput, setCommentInput] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [isViewCounted, setIsViewCounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);
  const viewTimeoutRef = useRef(null);
  const [adMedia, setAdMedia] = useState([]);
  const [sidebarAd, setSidebarAd] = useState(null);
  const [leftSidebarAd, setLeftSidebarAd] = useState(null);
  const [headerAd, setHeaderAd] = useState(null);
  const [footerAd, setFooterAd] = useState(null);
  const [centerAd, setCenterAd] = useState(null);
  const [showCenterAd, setShowCenterAd] = useState(true);

  // Player.js related state variables
  const playerRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [movieId]);

  // Function to get localStorage key for saving video position
  const getPlaybackKey = () => {
    if (!movieId) return null;
    return `eigakan_video_position_${movieId}_${
      showTrailer ? "trailer" : "movie"
    }`;
  };

  // Save playback time to localStorage
  const savePlaybackTime = (seconds) => {
    if (!movieId) return;

    try {
      // Early returns để tăng tính dễ đọc
      if (seconds < 5) return;
      if (duration && duration - seconds < 10) return;

      const key = getPlaybackKey();
      if (!key) return;

      const savedTime = parseFloat(localStorage.getItem(key)) || 0;
      if (Math.abs(savedTime - seconds) < 1) return;

      localStorage.setItem(key, seconds.toString());

      // Log significant changes (for debugging)
      if (Math.abs(savedTime - seconds) > 10) {
        console.log(
          `Saved significant position change: ${seconds.toFixed(
            2
          )} (previous: ${savedTime.toFixed(2)}s)`
        );
      }
    } catch (error) {
      console.error("Error saving playback time:", error);
    }
  };

  // Get saved playback time
  const getSavedPlaybackTime = () => {
    const key = getPlaybackKey();
    if (!key) return 0;

    try {
      const saved = localStorage.getItem(key);
      return saved ? parseFloat(saved) : 0;
    } catch (e) {
      console.error("Error retrieving playback position:", e);
      return 0;
    }
  };

  // Clear saved playback time (e.g., when video finishes)
  const clearPlaybackTime = () => {
    const key = getPlaybackKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
      console.log("Cleared playback position");
    } catch (e) {
      console.error("Error clearing playback position:", e);
    }
  };

  // Initialize Player.js and handle video events
  useEffect(() => {
    if (!movie || !iframeRef.current) return;

    console.log("Starting Player.js initialization for movie:", movie.title);

    // Add timer for saving position regardless of player state
    const saveTimerID = setInterval(() => {
      if (playerRef.current && playerReady) {
        console.log("Regular timer save check");
        try {
          playerRef.current.getCurrentTime((seconds) => {
            if (typeof seconds === "number") {
              console.log("Auto timer saving position:", seconds);
              savePlaybackTime(seconds);
            }
          });
        } catch (error) {
          console.warn("Error in timer save:", error);
        }
      }
    }, 3000); // Save every 3 seconds regardless of state

    // Function to handle player initialization
    const initializePlayer = () => {
      try {
        // Check if Player.js is already loaded
        console.log(
          "Checking if Player.js is loaded in window:",
          typeof window.playerjs !== "undefined"
        );

        if (typeof window.playerjs === "undefined") {
          console.log(
            "Player.js not found, attempting to load from Bunny CDN..."
          );

          // Load the Player.js script
          const script = document.createElement("script");
          script.src =
            "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
          script.async = true;

          script.onload = () => {
            console.log(
              "✅ Player.js script loaded successfully, window.playerjs =",
              typeof window.playerjs
            );
            if (typeof window.playerjs === "undefined") {
              console.error(
                "⚠️ Player.js script loaded but window.playerjs is still undefined"
              );
              // Try loading from direct HTTPS URL
              const httpsScript = document.createElement("script");
              httpsScript.src =
                "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
              httpsScript.async = true;
              httpsScript.onload = () => {
                console.log(
                  "Second attempt with HTTPS loaded, window.playerjs =",
                  typeof window.playerjs
                );
                setupPlayerInstance();
              };
              httpsScript.onerror = (error) => {
                console.error(
                  "❌ Failed to load Player.js with HTTPS URL:",
                  error
                );
              };
              document.head.appendChild(httpsScript);
            } else {
              setupPlayerInstance();
            }
          };

          script.onerror = (error) => {
            console.error(
              "❌ Failed to load Player.js script with protocol-relative URL:",
              error
            );

            // Try loading with explicit HTTPS
            console.log("Attempting to load with explicit HTTPS URL...");
            const httpsScript = document.createElement("script");
            httpsScript.src =
              "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
            httpsScript.async = true;
            httpsScript.onload = () => {
              console.log("✅ Player.js script loaded with HTTPS URL");
              setupPlayerInstance();
            };
            httpsScript.onerror = (error) => {
              console.error(
                "❌ Failed to load Player.js with HTTPS URL:",
                error
              );
            };
            document.head.appendChild(httpsScript);
          };

          document.head.appendChild(script);
        } else {
          console.log(
            "Player.js already loaded, window.playerjs =",
            typeof window.playerjs
          );
          setupPlayerInstance();
        }
      } catch (error) {
        console.error("Error during Player.js initialization check:", error);
      }
    };

    // Function to create player instance and set up event listeners
    const setupPlayerInstance = () => {
      try {
        console.log(
          "Setting up player instance for iframe:",
          iframeRef.current
        );

        if (!iframeRef.current) {
          console.error(
            "❌ Iframe reference is missing when setting up player"
          );
          return;
        }

        if (typeof window.playerjs === "undefined") {
          console.error(
            "❌ Player.js is still undefined, cannot create player instance"
          );
          return;
        }

        // Clean up existing player
        if (playerRef.current) {
          console.log("Clearing existing player reference");
          playerRef.current = null;
        }

        // Create new player instance
        console.log(
          "Creating new Player.js instance for iframe:",
          iframeRef.current.src
        );
        playerRef.current = new window.playerjs.Player(iframeRef.current);
        console.log("Player instance created:", playerRef.current);

        if (!playerRef.current) {
          console.error("❌ Failed to create player instance");
          return;
        }

        // Handle player ready event
        console.log("Setting up 'ready' event listener");
        playerRef.current.on("ready", () => {
          console.log("✅ Player ready event received!");
          setPlayerReady(true);

          // Check for saved position
          const savedTime = getSavedPlaybackTime();
          console.log(`Saved playback position: ${savedTime}s`);

          if (savedTime > 0) {
            console.log(`Showing resume dialog for position ${savedTime}s`);
            setShowResumeDialog(true);

            // Auto-resume after 8 seconds if no user action
            const resumeTimer = setTimeout(() => {
              if (showResumeDialog) {
                console.log("Auto-resuming playback after timeout");
                handleResumePlayback(true);
              }
            }, 8000);

            return () => clearTimeout(resumeTimer);
          } else {
            console.log("No saved position, starting fresh");
            // Automatically start playing
            playerRef.current.play();
          }

          // Set up THREE different methods to save playback time:
          // 1. Periodic interval (already set up outside this function)
          // 2. Save on timeupdate events
          // 3. Save when user pauses video

          console.log("Setting up interval to save playback position");
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }

          // Add event listeners to track play and pause events
          playerRef.current.on("play", () => {
            console.log("Video is playing");
            setIsPlaying(true);
          });

          playerRef.current.on("pause", () => {
            console.log("Video is paused");
            setIsPlaying(false);

            try {
              playerRef.current.getCurrentTime((seconds) => {
                if (typeof seconds === "number") {
                  console.log("Saving position on pause:", seconds);
                  savePlaybackTime(seconds);
                }
              });
            } catch (error) {
              console.warn("Error in pause handler:", error);
            }
          });
        });

        // Track time updates - set up a more aggressive timeupdate event handler
        playerRef.current.on("timeupdate", (data) => {
          try {
            if (data && typeof data.seconds === "number") {
              setCurrentTime(data.seconds);
              if (data.duration) setDuration(data.duration);

              // Always save position on every timeupdate event to ensure it's saved continuously
              savePlaybackTime(data.seconds);
            }
          } catch (error) {
            console.warn("Error in timeupdate handler:", error);
          }
        });

        // Handle end of video
        playerRef.current.on("ended", () => {
          try {
            console.log("Video ended event received");
            clearPlaybackTime();
          } catch (error) {
            console.warn("Error in ended handler:", error);
          }
        });

        // Handle errors
        playerRef.current.on("error", (error) => {
          console.error("Player error event received:", error);
        });
      } catch (error) {
        console.error("Error initializing player:", error);
      }
    };

    // Start initialization
    initializePlayer();

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up player resources");
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }

      // Clear the regular save timer
      clearInterval(saveTimerID);

      // Save position on unmount if player exists
      if (playerRef.current && playerReady) {
        try {
          console.log("Saving position on component unmount");
          playerRef.current.getCurrentTime((seconds) => {
            if (typeof seconds === "number" && seconds > 0) {
              savePlaybackTime(seconds);
            }
          });
        } catch (error) {
          console.warn("Error saving time on unmount:", error);
        }
      }
    };
  }, [movie, showTrailer]);

  // Make a more robust handler for resume playback
  const handleResumePlayback = (shouldResume) => {
    if (!playerRef.current || !playerReady) {
      console.error("Player not ready when trying to handle resume");
      return;
    }

    try {
      if (shouldResume) {
        // Resume from saved position
        const savedTime = getSavedPlaybackTime();
        console.log(`Resuming from saved position: ${savedTime}s`);

        // Use a timeout to ensure the player has time to initialize fully
        setTimeout(() => {
          playerRef.current.setCurrentTime(savedTime);
          playerRef.current.play();
        }, 500);
      } else {
        // Start from beginning
        console.log("Starting playback from beginning");

        // Use a timeout to ensure the player has time to initialize fully
        setTimeout(() => {
          playerRef.current.setCurrentTime(0);
          playerRef.current.play();
        }, 500);
      }

      // Hide the resume dialog
      setShowResumeDialog(false);
    } catch (error) {
      console.error("Error in handleResumePlayback:", error);
      // Try to play anyway
      playerRef.current.play();
      setShowResumeDialog(false);
    }
  };

  // Also modify the event listener for visibility changes to ensure it always saves
  window.addEventListener("visibilitychange", () => {
    if (document.hidden && playerRef.current && playerReady) {
      // When tab is hidden (user switched away), save current position
      playerRef.current.getCurrentTime((seconds) => {
        if (typeof seconds === "number") {
          console.log("Tab visibility changed, saving position:", seconds);
          savePlaybackTime(seconds);
        }
      });
    }
  });

  // Return a formatter function for displaying time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isAuthenticated || !movie?.comments) return;
      setLoadingComments(true); // Start loading

      try {
        const userIds = movie.comments.map((comment) => comment.createBy);
        const uniqueUserIds = [...new Set(userIds)];

        const userPromises = uniqueUserIds.map((id) =>
          UserApi.getUserDetail(id)
        );
        const users = await Promise.all(userPromises);

        const userDetailsMap = {};
        users.forEach((response) => {
          if (response.success) {
            userDetailsMap[response.data.id] = {
              fullName: response.data.fullName,
              picture: response.data.picture,
            };
          }
        });

        setUserDetails(userDetailsMap);
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoadingComments(false); // End loading
      }
    };

    fetchUserDetails();
  }, [movie, isAuthenticated]); // Added isAuthenticated to dependencies

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      const authenticated = !!token && !!user;

      setIsAuthenticated(authenticated);
      setUserRole(role);

      // Call fetchAdMedia after setting isAuthenticated
      fetchAdMedia(role);
    };

    checkSession();
  }, []);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (!isAuthenticated || !movieId) return;

      try {
        const response = await ratingService.getUserRatingForMovie(movieId);
        if (response.success && response.data) {
          setUserRating(response.data.stars);
          setHasUserRated(true);
        }
      } catch (error) {
        console.error("Failed to fetch user rating:", error);
      }
    };

    if (movieId) {
      fetchUserRating();
    }
  }, [movieId, isAuthenticated]); // Added isAuthenticated to dependencies

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const response = await ratingService.createComment(commentInput, movieId);

      if (response.success) {
        // Refresh movie data to get updated comments
        const movieResponse = await movieService.getMovieById(movieId);
        if (movieResponse.success) {
          setMovie(movieResponse.data);
        }

        setCommentInput("");
        notification.success({
          message: "Success",
          description: "Comment posted successfully",
        });
      } else {
        throw new Error(response.message || "Failed to post comment");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to post comment",
      });
    }
  };

  const handleRating = async (value) => {
    if (!isAuthenticated) return;

    setSubmittingRating(true);
    try {
      const response = await ratingService.createMovieRating(value, movieId);
      if (response.success) {
        setUserRating(value);
        setHasUserRated(true);
        notification.success({
          message: "Success",
          description: "Rating submitted successfully",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to submit rating",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  const canRateAndComment = () => {
    const role = localStorage.getItem("role");
    return role === "VIP MEMBER" || role === "ADMIN" || role === "MANAGER";
  };

  // Thay thế component UpgradeMessage
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

  //Đếm view
  const increaseViewCount = async () => {
    const movieId = {
      movieId: movie.id,
    };
    try {
      await movieCountService.increaseMovieCount(movieId);
      console.log("✅ View count increased for movie:", movie.title);
    } catch (error) {
      console.error("❌ Failed to increase view count", error);
    }
  };

  const createMovieHistory = async () => {
    const movieId = {
      movieId: movie.id,
    };
    try {
      await movieHistoryService.CreateMovieHistory(movieId);
      console.log("✅ save to history:", movie.title);
    } catch (error) {
      console.error("❌ not save to history", error);
    }
  };

  const startViewCount = () => {
    if (!isViewCounted) {
      viewTimeoutRef.current = setTimeout(() => {
        increaseViewCount();
        createMovieHistory();
        setIsViewCounted(true);
      }, 5000); // Chờ 5 giây
    }
  };

  const stopViewCount = () => {
    if (viewTimeoutRef.current) {
      clearTimeout(viewTimeoutRef.current);
      viewTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    // Only set up the observer if we have a movie and it's not a trailer
    if (!movie || !iframeRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && document.visibilityState === "visible") {
            startViewCount();
          } else {
            stopViewCount();
          }
        });
      },
      { threshold: 0.5 } // Ít nhất 50% iframe phải hiển thị trên màn hình
    );

    observer.observe(iframeRef.current);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopViewCount();

        // Also save current playback time when tab is hidden
        if (playerRef.current && playerReady) {
          playerRef.current.getCurrentTime((seconds) => {
            if (seconds > 0) {
              savePlaybackTime(seconds);
            }
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (iframeRef.current) observer.unobserve(iframeRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopViewCount();
    };
  }, [movie, isViewCounted, showTrailer, playerReady]);

  // Modified fetchAdMedia function to handle CENTER ad type
  const fetchAdMedia = async (role) => {
    const shouldShowAds = !role || role === "MEMBER";
    console.log("Current role:", role);
    console.log("Should show ads:", shouldShowAds);

    if (!shouldShowAds) {
      console.log("Premium user, no ads shown");
      return;
    }

    try {
      console.log("Fetching ad media...");
      const response = await adMediaService.getActiveAdMedia();
      console.log("Ad Media Response:", response);

      if (response.success && response.data && response.data.length > 0) {
        setAdMedia(response.data);

        // Xử lý từng quảng cáo và phân loại theo vị trí
        for (const ad of response.data) {
          const adSlotId = ad.adPurchaseSlotId;
          try {
            // Use different methods based on authentication status
            const adSlotDetails = isAuthenticated
              ? await adPurchaseSlotService.getAdPurchaseSlotById(adSlotId)
              : await adPurchaseSlotService.getPublicAdPurchaseSlotById(
                  adSlotId
                );

            console.log("Ad Slot Details:", adSlotDetails);

            if (adSlotDetails.success) {
              const slotLocation =
                adSlotDetails.data.adSlotTime.adSlot.slotLocation;
              console.log("Slot location:", slotLocation);

              // Phân loại quảng cáo theo vị trí
              switch (slotLocation) {
                case "SIDEBAR-RIGHT":
                  setSidebarAd(ad);
                  break;
                case "SIDEBAR-LEFT":
                  setLeftSidebarAd(ad);
                  break;
                case "HEADER":
                  setHeaderAd(ad);
                  break;
                case "FOOTER":
                  setFooterAd(ad);
                  break;
                case "CENTER": // Handle CENTER ad type
                  setCenterAd(ad);
                  setShowCenterAd(true);
                  break;
              }
            }
          } catch (slotError) {
            console.error("Failed to fetch ad slot details:", slotError);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch ad media:", error);
    }
  };

  // Thêm component AdDisplay để tái sử dụng cho các quảng cáo
  const AdDisplay = ({ ad, className }) => {
    if (!ad) return null;

    // Kiểm tra xem có phải className chứa "max-h-[100px]" (header ad) không
    const isHeaderAd = className && className.includes("max-h-[100px]");
    // Kiểm tra xem có phải là sidebar ad không (có class h-auto max-h-none)
    const isSidebarAd = className && className.includes("max-h-none");

    return (
      <div
        className={`p-2 bg-black/40 rounded border border-white/10 w-full h-auto flex flex-col items-center ${className}`}
      >
        <div className="text-white text-xs uppercase tracking-wider mb-1 text-center font-light">
          SPONSORED
        </div>

        <a
          href={ad.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <img
            src={ad.image}
            alt="Advertisement"
            className={`w-full object-contain hover:opacity-90 transition-opacity rounded ${
              isHeaderAd
                ? "max-h-[60px]"
                : isSidebarAd
                ? "max-h-[800px]" // Tăng chiều cao tối đa cho sidebar ads
                : "max-h-[400px]"
            }`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/200x400?text=Ad";
            }}
          />
        </a>

        {ad.content && !isHeaderAd && (
          <div className="text-white text-sm mt-2 text-center">
            {ad.content}
          </div>
        )}
      </div>
    );
  };

  // Add a CENTER Ad component
  const CenterAdDisplay = () => {
    if (!centerAd || !showCenterAd) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
        <div className="relative max-w-3xl max-h-[80vh] w-full mx-auto p-4">
          {/* Always show close button, no need for user interaction first */}
          <button
            onClick={() => setShowCenterAd(false)}
            className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-[#FF009F] text-white flex items-center justify-center hover:bg-[#D1007F] transition-colors z-10 shadow-lg animate-pulse hover:animate-none"
            aria-label="Close advertisement"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
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

          {/* Ad content container */}
          <div className="bg-black/90 rounded-xl border border-[#FF009F]/30 p-4 shadow-xl relative">
            <div className="text-[#FF009F] text-sm uppercase tracking-wider mb-3 text-center font-medium border-b border-[#FF009F]/20 pb-2">
              SPONSORED ADVERTISEMENT
            </div>

            <a
              href={centerAd.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <img
                src={centerAd.image}
                alt="Advertisement"
                className="w-full object-contain rounded max-h-[60vh] border border-white/10"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/800x600?text=Ad";
                }}
              />
            </a>

            {/* Clear instruction on how to close */}
            <div className="mt-4 text-center">
              <p className="text-white text-sm bg-[#FF009F]/20 py-2 px-4 rounded-lg inline-block">
                Click the X button in the top-right corner to close this ad
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Custom video progress bar component
  const VideoProgressBar = () => {
    if (!playerReady || duration === 0) return null;

    const progress = (currentTime / duration) * 100;

    const handleProgressClick = (e) => {
      if (!playerRef.current) return;

      // Calculate the position based on click position
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const seekTime = duration * clickPosition;

      // Set the current time in the player
      playerRef.current.setCurrentTime(seekTime);

      // Update our state
      setCurrentTime(seekTime);
    };

    // Format current time and duration
    const formattedCurrentTime = formatTime(currentTime);
    const formattedDuration = formatTime(duration);

    return (
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        } pointer-events-auto z-30`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setTimeout(() => setShowControls(false), 2000)}
      >
        <div className="flex flex-col space-y-2 max-w-4xl mx-auto">
          {/* Progress bar */}
          <div
            className="h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#FF009F] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time display and controls */}
          <div className="flex justify-between items-center">
            <div className="text-white text-sm">
              {formattedCurrentTime} / {formattedDuration}
            </div>

            <div className="flex items-center space-x-4">
              {/* Play/Pause button */}
              <button
                onClick={() => {
                  if (playerRef.current) {
                    if (isPlaying) {
                      playerRef.current.pause();
                    } else {
                      playerRef.current.play();
                    }
                  }
                }}
                className="text-white hover:text-[#FF009F] transition-colors"
                aria-label={isPlaying ? "Pause video" : "Play video"}
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (playerRef.current) {
                      if (isPlaying) {
                        playerRef.current.pause();
                      } else {
                        playerRef.current.play();
                      }
                    }
                  }
                }}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>

              {/* Skip forward/backward buttons */}
              <button
                onClick={() => {
                  if (playerRef.current) {
                    const newTime = Math.max(0, currentTime - 10);
                    playerRef.current.setCurrentTime(newTime);
                  }
                }}
                className="text-white hover:text-[#FF009F] transition-colors"
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
                    d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                  />
                </svg>
              </button>

              <button
                onClick={() => {
                  if (playerRef.current) {
                    const newTime = Math.min(duration, currentTime + 10);
                    playerRef.current.setCurrentTime(newTime);
                  }
                }}
                className="text-white hover:text-[#FF009F] transition-colors"
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
                    d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                  />
                </svg>
              </button>

              {/* Toggle fullscreen button */}
              <button
                onClick={() => {
                  if (playerRef.current) {
                    playerRef.current.getFullscreen((isFullscreen) => {
                      if (isFullscreen) {
                        playerRef.current.exitFullscreen();
                      } else {
                        playerRef.current.requestFullscreen();
                      }
                    });
                  }
                }}
                className="text-white hover:text-[#FF009F] transition-colors"
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
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  const movieUrl = movie.medias?.find((m) => m.type === "FILMVIP")?.url;
  const trailer = movie.medias?.find((m) => m.type === "TRAILER")?.url;

  const getVideoUrl = (url) => {
    if (!url) return "";
    // Nếu là URL từ Bunny CDN thì giữ nguyên
    if (url.includes("mediadelivery.net")) {
      return url;
    }
    return url;
  };

  const directMovieUrl = movieUrl ? getVideoUrl(movieUrl) : "";
  const directTrailerUrl = trailer ? getVideoUrl(trailer) : "";
  const videoUrl = showTrailer ? directTrailerUrl : directMovieUrl;

  // Sửa lại hàm getVideoContainerStyle để video luôn căn giữa hoàn toàn
  const getVideoContainerStyle = () => {
    const role = localStorage.getItem("role");

    // VIP MEMBER có video to, chiếm toàn màn hình
    if (role === "VIP MEMBER") {
      return {
        width: "100%",
        height: "96%",
        position: "absolute",
        inset: 0,
      };
    }

    // Các role khác có video nhỏ hơn và căn giữa hoàn toàn
    return {
      width: "70%", // Giảm kích thước video
      height: "70%", // Giảm kích thước video
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)", // Điều này sẽ căn giữa video hoàn toàn
    };
  };

  return (
    <>
      <Helmet>
        <title>{`Watch ${movie?.title} - Eigakan`}</title>
        {/* Load Player.js in the head to ensure it's available */}
        <script
          type="text/javascript"
          src="https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js"
        ></script>

        {/* Fallback script to ensure Player.js library is loaded */}
        <script type="text/javascript">
          {`
            // Check if Player.js is loaded after a short delay
            setTimeout(function() {
              if (typeof window.playerjs === "undefined") {
                console.log("Fallback: Loading Player.js from CDN...");
                var script = document.createElement('script');
                script.src = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js';
                script.async = false;
                document.head.appendChild(script);
              } else {
                console.log("Player.js already available in window");
              }
            }, 500);
          `}
        </script>
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

        <div className="relative w-full h-full">
          {/* Left Sidebar Ad */}
          {leftSidebarAd && (
            <div className="absolute left-0 top-0 h-full w-[280px] flex flex-col items-start justify-start z-10 pt-20">
              <div className="bg-black/40 p-2 rounded border border-white/10 w-full">
                <div className="text-white text-xs uppercase tracking-wider mb-1 text-center font-light">
                  SPONSORED
                </div>
                <a
                  href={leftSidebarAd.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <img
                    src={leftSidebarAd.image}
                    alt="Advertisement"
                    className="w-full h-[700px] object-cover hover:opacity-90 transition-opacity rounded"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/280x600?text=Ad";
                    }}
                  />
                </a>
                {leftSidebarAd.content && (
                  <div className="text-white text-sm mt-2 text-center">
                    {leftSidebarAd.content}
                  </div>
                )}
                <div className="text-white/50 text-xs text-center mt-2">
                  LEFT
                </div>
              </div>
            </div>
          )}

          {/* Video container */}
          <div style={getVideoContainerStyle()} className="relative">
            {/* Only render iframe after Player.js is loaded to avoid race conditions */}
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
            {showResumeDialog && getSavedPlaybackTime() > 0 && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center z-30 pointer-events-auto">
                <div className="bg-black/80 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center">
                  <p className="mb-3 text-center">
                    Resume from {formatTime(getSavedPlaybackTime())}?
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleResumePlayback(true)}
                      className="px-4 py-2 bg-[#FF009F] text-white rounded hover:bg-[#D1007F] transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => handleResumePlayback(false)}
                      className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CENTER Ad */}
          <CenterAdDisplay />

          {/* Right Sidebar Ad */}
          {sidebarAd && (
            <div className="absolute right-0 top-0 h-full w-[280px] flex flex-col items-start justify-start z-10 pt-20">
              <div className="bg-black/40 p-2 rounded border border-white/10 w-full">
                <div className="text-white text-xs uppercase tracking-wider mb-1 text-center font-light">
                  SPONSORED
                </div>
                <a
                  href={sidebarAd.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <img
                    src={sidebarAd.image}
                    alt="Advertisement"
                    className="w-full h-[700px] object-cover hover:opacity-90 transition-opacity rounded"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/280x600?text=Ad";
                    }}
                  />
                </a>
                {sidebarAd.content && (
                  <div className="text-white/80 text-sm mt-2 text-center">
                    {sidebarAd.content}
                  </div>
                )}
                <div className="text-white/50 text-xs text-center mt-2">
                  RIGHT
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Ad */}
        {footerAd && (
          <div className="absolute bottom-[60px] left-0 right-0 z-10 flex justify-center pointer-events-auto">
            <AdDisplay ad={footerAd} className="max-w-[728px] max-h-[100px]" />
          </div>
        )}

        {/* Video controls - Tăng z-index để đảm bảo luôn hiển thị trên quảng cáo */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            showControls ? "opacity-100" : "opacity-0"
          } pointer-events-none z-20`}
        >
          <div
            className={`fixed left-0 right-0 bottom-0 transform ${
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
                                    {movie.rating}
                                  </span>
                                  <span className="text-[#F6C700]/70 text-sm">
                                    /10
                                  </span>
                                </div>
                                <div className="text-xs text-white/60">
                                  Internet Movie Database
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

                        {/* CTA Buttons */}
                        <div className="hidden flex flex-col gap-3">
                          <button
                            onClick={() => setShowTrailer(!showTrailer)}
                            className={`w-full px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                              showTrailer
                                ? "bg-gradient-to-r from-white to-white/90 text-black hover:from-white/90 hover:to-white/80"
                                : "bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90"
                            }`}
                          >
                            {showTrailer ? (
                              <>
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
                                <span className="font-medium">Watch Movie</span>
                              </>
                            ) : (
                              <>
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
                                <span className="font-medium">
                                  Watch Trailer
                                </span>
                              </>
                            )}
                          </button>

                          <Link
                            to={`/movie/${movie.id}`}
                            className="w-full px-5 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
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
                              <polyline points="12 16 16 12 12 8"></polyline>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            <span className="font-medium">Movie Details</span>
                          </Link>
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
                            Synopsis
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

                        {/* Cast Section */}
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
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Cast & Crew
                          </h3>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                            {movie.person?.map((actor) => (
                              <Link
                                to={`/person/${actor.id}`}
                                key={actor.id}
                                className="group transition-transform hover:scale-105"
                              >
                                <div className="flex flex-col">
                                  <div className="mb-2 w-full aspect-square overflow-hidden rounded-xl relative">
                                    <img
                                      src={actor.picture || "/placeholder.svg"}
                                      alt={actor.name}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute inset-0 ring-1 ring-white/10 rounded-xl group-hover:ring-[#FF009F]/50 transition-all"></div>
                                  </div>
                                  <div className="text-center w-full">
                                    <div className="text-white font-medium truncate group-hover:text-[#FF009F] transition-colors">
                                      {actor.name}
                                    </div>
                                    <div className="text-sm text-white/70 truncate">
                                      {actor.job === "Actor"
                                        ? "Actor"
                                        : actor.job}
                                    </div>
                                  </div>
                                </div>
                              </Link>
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
                                      userDetails[movie.comments[0]?.createBy]
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
