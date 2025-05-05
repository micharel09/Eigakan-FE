import { useState, useEffect, useCallback } from "react";

export const usePlaybackPosition = ({ 
  movieId, 
  isTrailer = false, 
  duration = 0, 
  playerReady = false 
}) => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);

  /**
   * Generate storage key for the current video
   */
  const getPlaybackKey = useCallback(() => {
    if (!movieId) return null;
    return `eigakan_video_position_${movieId}_${isTrailer ? "trailer" : "movie"}`;
  }, [movieId, isTrailer]);

  /**
   * Save current playback position to localStorage
   */
  const savePlaybackTime = useCallback((seconds) => {
    if (!movieId) return;

    try {
      // Early returns for better readability
      if (seconds < 5) return;
      if (duration && duration - seconds < 10) return;

      const key = getPlaybackKey();
      if (!key) return;

      const savedTime = parseFloat(localStorage.getItem(key)) || 0;
      if (Math.abs(savedTime - seconds) < 1) return;

      localStorage.setItem(key, seconds.toString());
      setSavedPosition(seconds);

      // Log significant changes (for debugging)
      if (Math.abs(savedTime - seconds) > 10) {
        console.log(
          `Saved significant position change: ${seconds.toFixed(2)} (previous: ${savedTime.toFixed(2)}s)`
        );
      }
    } catch (error) {
      console.error("Error saving playback time:", error);
    }
  }, [movieId, duration, getPlaybackKey]);

  /**
   * Get saved playback position from localStorage
   */
  const getSavedPlaybackTime = useCallback(() => {
    const key = getPlaybackKey();
    if (!key) return 0;

    try {
      const saved = localStorage.getItem(key);
      const position = saved ? parseFloat(saved) : 0;
      setSavedPosition(position);
      return position;
    } catch (e) {
      console.error("Error retrieving playback position:", e);
      return 0;
    }
  }, [getPlaybackKey]);

  /**
   * Clear saved playback position (e.g., when video finishes)
   */
  const clearPlaybackTime = useCallback(() => {
    const key = getPlaybackKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
      setSavedPosition(0);
      console.log("Cleared playback position");
    } catch (e) {
      console.error("Error clearing playback position:", e);
    }
  }, [getPlaybackKey]);

  /**
   * Check for saved position when player is ready
   */
  useEffect(() => {
    if (playerReady) {
      const savedTime = getSavedPlaybackTime();
      console.log(`Saved playback position: ${savedTime}s`);

      if (savedTime > 0) {
        setShowResumeDialog(true);
      }
    }
  }, [playerReady, getSavedPlaybackTime]);

  /**
   * Handle visibility change events to save position when tab is hidden
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playerReady) {
        const currentPos = savedPosition;
        if (currentPos > 0) {
          savePlaybackTime(currentPos);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playerReady, savedPosition, savePlaybackTime]);

  return {
    showResumeDialog,
    setShowResumeDialog,
    savedPosition,
    savePlaybackTime,
    getSavedPlaybackTime,
    clearPlaybackTime,
  };
};
