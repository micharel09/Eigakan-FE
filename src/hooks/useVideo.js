import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/**
 * Custom hook to handle video player functionality
 * @param {Object} options - Configuration options
 * @param {string} options.videoUrl - URL of the video to play
 * @param {Function} options.onTimeUpdate - Callback for time update events
 * @param {Function} options.onPlay - Callback for play events
 * @param {Function} options.onPause - Callback for pause events
 * @param {Function} options.onEnded - Callback for video end events
 * @param {Function} options.onReady - Callback for player ready event
 * @returns {Object} Video player state and control functions
 */
export const useVideo = ({
  videoUrl,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onReady,
}) => {
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const previousUrlRef = useRef(videoUrl);
  const initializedRef = useRef(false);

  /**
   * Format seconds into MM:SS display format
   */
  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Load Player.js script from CDN
   */
  const loadPlayerScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window.playerjs !== "undefined") {
        resolve();
        return;
      }
      
      const script = document.createElement("script");
      script.src = "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
      script.async = true;
      
      script.onload = () => {
        if (typeof window.playerjs !== "undefined") {
          resolve();
        } else {
          reject(new Error("Player.js not available after loading"));
        }
      };
      
      script.onerror = (error) => {
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }, []);

  /**
   * Initialize the player instance
   */
  const initializePlayer = useCallback(async () => {
    if (!iframeRef.current || !videoUrl) return;

    // Skip initialization if player already exists and URL hasn't changed
    if (playerRef.current && previousUrlRef.current === videoUrl && initializedRef.current) return;

    try {
      await loadPlayerScript();
      previousUrlRef.current = videoUrl;
      
      // Clean up existing player if needed
      if (playerRef.current) {
        try {
          // Remove event handlers before creating a new instance
          playerRef.current.off("ready");
          playerRef.current.off("play");
          playerRef.current.off("pause");
          playerRef.current.off("timeupdate");
          playerRef.current.off("ended");
          playerRef.current.off("error");
        } catch (err) {
          console.warn("Error cleaning up player events:", err);
        }
        playerRef.current = null;
      }
      
      // Reset state
      setPlayerReady(false);
      
      // Create new player
      playerRef.current = new window.playerjs.Player(iframeRef.current);
      
      // Set up event listeners
      playerRef.current.on("ready", () => {
        setPlayerReady(true);
        initializedRef.current = true;
        if (onReady) onReady();
      });
      
      playerRef.current.on("play", () => {
        setIsPlaying(true);
        if (onPlay) onPlay();
      });
      
      playerRef.current.on("pause", () => {
        setIsPlaying(false);
        if (onPause) onPause(currentTime);
      });
      
      playerRef.current.on("timeupdate", (data) => {
        if (data && typeof data.seconds === "number") {
          setCurrentTime(data.seconds);
          if (data.duration) setDuration(data.duration);
          if (onTimeUpdate) onTimeUpdate(data.seconds, data.duration);
        }
      });
      
      playerRef.current.on("ended", () => {
        setIsPlaying(false);
        if (onEnded) onEnded();
      });
      
      playerRef.current.on("error", (error) => {
        console.error("Player error:", error);
      });
      
    } catch (error) {
      console.error("Error initializing player:", error);
    }
  }, [videoUrl, onTimeUpdate, onPlay, onPause, onEnded, onReady, loadPlayerScript, currentTime]);

  /**
   * Set up regular interval to poll player time
   */
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          playerRef.current.getCurrentTime((seconds) => {
            if (typeof seconds === "number") {
              setCurrentTime(seconds);
            }
          });
        } catch (error) {
          console.warn("Error in timer:", error);
        }
      }
    }, 1000);
    
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [playerReady, isPlaying]);

  // Initialize player when video URL changes
  useEffect(() => {
    if (videoUrl) {
      initializePlayer();
    }
    
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      
      // Final cleanup
      if (playerRef.current && playerReady) {
        try {
          playerRef.current.getCurrentTime((seconds) => {
            if (typeof seconds === "number" && seconds > 0) {
              if (onPause) onPause(seconds);
            }
          });
        } catch (error) {
          console.warn("Error on unmount:", error);
        }
      }
    };
  }, [videoUrl, initializePlayer, playerReady, onPause]);

  // Clean up player completely on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          // Remove all event listeners
          playerRef.current.off("ready");
          playerRef.current.off("play");
          playerRef.current.off("pause");
          playerRef.current.off("timeupdate");
          playerRef.current.off("ended");
          playerRef.current.off("error");
        } catch (err) {
          console.warn("Error cleaning up player on unmount:", err);
        }
        
        playerRef.current = null;
        initializedRef.current = false;
      }
      
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  // Player control functions - use memoized versions to prevent unnecessary rerenders
  const playVideo = useCallback(() => {
    if (playerRef.current && playerReady) {
      playerRef.current.play();
    }
  }, [playerReady]);

  const pauseVideo = useCallback(() => {
    if (playerRef.current && playerReady) {
      playerRef.current.pause();
    }
  }, [playerReady]);

  const seekTo = useCallback((seconds) => {
    if (playerRef.current && playerReady) {
      playerRef.current.setCurrentTime(seconds);
    }
  }, [playerReady]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current || !playerReady) return;
    isPlaying ? playerRef.current.pause() : playerRef.current.play();
  }, [playerReady, isPlaying]);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current || !playerReady) return;
    
    playerRef.current.getFullscreen((isFullscreen) => {
      if (isFullscreen) {
        playerRef.current.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    });
  }, [playerReady]);

  // Return memoized object to prevent unnecessary re-renders in consuming components
  return useMemo(() => ({
    iframeRef,
    playerRef,
    playerReady,
    isPlaying,
    currentTime,
    duration,
    formatTime,
    playVideo,
    pauseVideo,
    seekTo,
    togglePlay,
    toggleFullscreen,
  }), [
    playerReady, 
    isPlaying, 
    currentTime, 
    duration, 
    formatTime, 
    playVideo, 
    pauseVideo, 
    seekTo, 
    togglePlay, 
    toggleFullscreen
  ]);
}; 