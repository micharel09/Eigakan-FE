import { useState, useRef, useEffect, useCallback } from "react";
import movieCountService from "../../apis/MovieCount/MovieCount";
import movieHistoryService from "../../apis/MovieHistory/MovieHistory";

/**
 * Custom hook to handle movie view counting and history tracking
 * @param {Object} options - Configuration options
 * @param {Object} options.movie - Movie object
 * @param {boolean} options.isTrailer - Whether the current view is a trailer
 * @param {React.RefObject} options.playerRef - Reference to player element for intersection observation
 * @returns {Object} View counter state and control functions
 */
export const useViewCounter = ({ 
  movie, 
  isTrailer = false,
  playerRef 
}) => {
  const [isViewCounted, setIsViewCounted] = useState(false);
  const viewTimeoutRef = useRef(null);

  /**
   * Increment the view count for the current movie
   */
  const increaseViewCount = useCallback(async () => {
    if (!movie || !movie.id) return;

    const movieId = {
      movieId: movie.id,
    };
    
    try {
      await movieCountService.increaseMovieCount(movieId);
      console.log("✅ View count increased for movie:", movie.title);
    } catch (error) {
      console.error("❌ Failed to increase view count", error);
    }
  }, [movie]);

  /**
   * Save the current movie to user's watch history
   */
  const createMovieHistory = useCallback(async () => {
    if (!movie || !movie.id) return;

    const movieId = {
      movieId: movie.id,
    };
    
    try {
      await movieHistoryService.CreateMovieHistory(movieId);
      console.log("✅ Saved to history:", movie.title);
    } catch (error) {
      console.error("❌ Not saved to history", error);
    }
  }, [movie]);

  /**
   * Start the view count timer
   */
  const startViewCount = useCallback(() => {
    if (isViewCounted || isTrailer) return;
    
    viewTimeoutRef.current = setTimeout(() => {
      increaseViewCount();
      createMovieHistory();
      setIsViewCounted(true);
    }, 5000); // Wait 5 seconds before counting view
  }, [isViewCounted, isTrailer, increaseViewCount, createMovieHistory]);

  /**
   * Stop the view count timer
   */
  const stopViewCount = useCallback(() => {
    if (viewTimeoutRef.current) {
      clearTimeout(viewTimeoutRef.current);
      viewTimeoutRef.current = null;
    }
  }, []);

  /**
   * Set up intersection observer to track when video is visible
   */
  useEffect(() => {
    // Only observe if we have a player reference and it's not a trailer
    if (!playerRef?.current || isTrailer || !movie) return;

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
      { threshold: 0.5 } // At least 50% of the iframe must be visible
    );

    if (playerRef.current) {
      observer.observe(playerRef.current);
    }

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopViewCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (playerRef.current) observer.unobserve(playerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopViewCount();
    };
  }, [movie, isTrailer, playerRef, startViewCount, stopViewCount]);

  return {
    isViewCounted,
    startViewCount,
    stopViewCount,
  };
};
