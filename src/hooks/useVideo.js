import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for managing video playback state and operations
 * 
 * @param {string} videoId - Unique identifier for the video
 * @param {string} videoType - Type of video ('movie' or 'trailer')
 * @returns {Object} - Video playback state and functions
 */
export const useVideo = (videoId, videoType = 'movie') => {
  // Player element and state
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Get localStorage key for saving video position
  const getPlaybackKey = useCallback(() => {
    if (!videoId) return null;
    return `eigakan_video_position_${videoId}_${videoType}`;
  }, [videoId, videoType]);

  // Save playback time to localStorage
  const savePlaybackTime = useCallback((seconds) => {
    if (!videoId) return;

    try {
      // Early returns to improve readability
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
          `Saved significant position change: ${seconds.toFixed(2)} (previous: ${savedTime.toFixed(2)}s)`
        );
      }
    } catch (error) {
      console.error("Error saving playback time:", error);
    }
  }, [videoId, duration, getPlaybackKey]);

  // Get saved playback time
  const getSavedPlaybackTime = useCallback(() => {
    const key = getPlaybackKey();
    if (!key) return 0;

    try {
      const saved = localStorage.getItem(key);
      return saved ? parseFloat(saved) : 0;
    } catch (e) {
      console.error("Error retrieving playback position:", e);
      return 0;
    }
  }, [getPlaybackKey]);

  // Clear saved playback time (e.g., when video finishes)
  const clearPlaybackTime = useCallback(() => {
    const key = getPlaybackKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
      console.log("Cleared playback position");
    } catch (e) {
      console.error("Error clearing playback position:", e);
    }
  }, [getPlaybackKey]);

  // Format time for display (MM:SS or HH:MM:SS)
  const formatTime = useCallback((seconds) => {
    if (!seconds) return "00:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  }, []);

  // Handle resume dialog response
  const handleResumePlayback = useCallback((shouldResume) => {
    if (!playerRef.current || !playerReady) return;
    
    setShowResumeDialog(false);
    
    if (shouldResume) {
      const savedTime = getSavedPlaybackTime();
      if (savedTime > 0) {
        playerRef.current.setCurrentTime(savedTime);
        console.log(`Resumed playback at ${savedTime.toFixed(2)}s`);
      }
    } else {
      // Start from beginning
      playerRef.current.setCurrentTime(0);
      clearPlaybackTime();
    }
    
    // Start playback
    setTimeout(() => {
      playerRef.current.play();
    }, 500);
  }, [playerReady, getSavedPlaybackTime, clearPlaybackTime]);

  // Seek to specific time
  const seekTo = useCallback((timeInSeconds) => {
    if (playerRef.current && playerReady) {
      playerRef.current.setCurrentTime(timeInSeconds);
      savePlaybackTime(timeInSeconds);
    }
  }, [playerReady, savePlaybackTime]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current || !playerReady) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, [isPlaying, playerReady]);

  // Show controls on mouse movement
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      // Clear previous timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Hide controls after 3 seconds of inactivity
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Regular timer to save position
  useEffect(() => {
    const saveTimerID = setInterval(() => {
      if (playerRef.current && playerReady && isPlaying) {
        try {
          playerRef.current.getCurrentTime((seconds) => {
            if (typeof seconds === "number") {
              savePlaybackTime(seconds);
            }
          });
        } catch (error) {
          console.warn("Error in timer save:", error);
        }
      }
    }, 3000); // Save every 3 seconds

    return () => clearInterval(saveTimerID);
  }, [playerReady, isPlaying, savePlaybackTime]);

  // Initialize playerjs API
  const initializePlayer = useCallback((onPlayerReady) => {
    if (!iframeRef.current) return;

    // Function to setup player instance
    const setupPlayerInstance = () => {
      try {
        if (typeof window.playerjs === "undefined") {
          console.error("Player.js library not loaded");
          return;
        }

        // Create player instance
        playerRef.current = new window.playerjs.Player(iframeRef.current);

        // Setup event listeners
        playerRef.current.on("ready", () => {
          console.log("Player.js: Player is ready");
          setPlayerReady(true);
          
          // Check for saved position
          const savedTime = getSavedPlaybackTime();
          if (savedTime > 0) {
            setShowResumeDialog(true);
          } else {
            // No saved position, just play
            playerRef.current.play();
          }
          
          // Get duration
          playerRef.current.getDuration((seconds) => {
            setDuration(seconds);
          });
          
          // Setup time update listener with regular interval
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }
          
          timeUpdateIntervalRef.current = setInterval(() => {
            if (playerRef.current) {
              playerRef.current.getCurrentTime((seconds) => {
                setCurrentTime(seconds);
              });
            }
          }, 250); // Update 4 times per second
          
          if (onPlayerReady) {
            onPlayerReady();
          }
        });

        playerRef.current.on("play", () => {
          console.log("Player.js: Video started playing");
          setIsPlaying(true);
        });

        playerRef.current.on("pause", () => {
          console.log("Player.js: Video paused");
          setIsPlaying(false);
          setShowControls(true); // Always show controls when paused
        });

        playerRef.current.on("ended", () => {
          console.log("Player.js: Video ended");
          setIsPlaying(false);
          clearPlaybackTime(); // Clear saved position when video ends
          setShowControls(true);
        });

        playerRef.current.on("timeupdate", (data) => {
          if (data && typeof data.seconds === 'number') {
            setCurrentTime(data.seconds);
            
            // Don't save on every timeupdate to avoid excessive writes
            if (Math.random() < 0.05) { // ~5% chance to save
              savePlaybackTime(data.seconds);
            }
          }
        });

        // Handle errors
        playerRef.current.on("error", (error) => {
          console.error("Player.js error:", error);
        });
      } catch (error) {
        console.error("Error setting up Player.js:", error);
      }
    };

    // Check if Player.js is already loaded
    if (typeof window.playerjs !== "undefined") {
      setupPlayerInstance();
    } else {
      // Load the Player.js script
      console.log("Loading Player.js script...");
      const script = document.createElement("script");
      script.src = "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
      script.async = true;

      script.onload = () => {
        console.log("Player.js script loaded");
        setupPlayerInstance();
      };

      script.onerror = (error) => {
        console.error("Error loading Player.js script:", error);
      };

      document.body.appendChild(script);
    }
  }, [getSavedPlaybackTime, savePlaybackTime, clearPlaybackTime]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      
      // Save final position before unmounting
      if (playerRef.current && playerReady && currentTime > 0) {
        savePlaybackTime(currentTime);
      }
    };
  }, [playerReady, currentTime, savePlaybackTime]);

  return {
    // Refs
    playerRef,
    iframeRef,
    
    // State
    playerReady,
    isPlaying,
    currentTime,
    duration,
    showControls,
    showResumeDialog,
    
    // Time utility functions
    formatTime,
    
    // Playback functions
    seekTo,
    togglePlayPause,
    handleResumePlayback,
    initializePlayer,
    savePlaybackTime,
    clearPlaybackTime,
    
    // Video progress helpers
    progress: duration ? (currentTime / duration) * 100 : 0,
    timeRemaining: duration ? duration - currentTime : 0,
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
  };
}; 