import { useState, useEffect, useRef, useCallback } from "react";
import useAuth from "./useAuth";
import movieCountService from "../apis/MovieCount/MovieCount";
import movieHistoryService from "../apis/MovieHistory/MovieHistory";

/**
 * Custom hook for managing movie watch history and view counts
 * 
 * @param {string} movieId - ID of the movie being watched
 * @returns {Object} - Watch history functions and state
 */
export const useWatchHistory = (movieId) => {
  const { user, isAuthenticated } = useAuth();
  const [isViewCounted, setIsViewCounted] = useState(false);
  const viewTimeoutRef = useRef(null);
  const [isVisible, setIsVisible] = useState(!document.hidden);

  // Increase the view count for the movie
  const increaseViewCount = useCallback(async () => {
    if (!movieId || isViewCounted) return;
    try {
      await movieCountService.increaseCount(movieId);
      setIsViewCounted(true);
      console.log("View count increased for movie:", movieId);
    } catch (error) {
      console.error("Error increasing view count:", error);
    }
  }, [movieId, isViewCounted]);

  // Create movie history entry for the user
  const createMovieHistory = useCallback(async () => {
    if (!isAuthenticated || !user || !movieId) return;
    
    try {
      await movieHistoryService.createMovieHistory(movieId);
      console.log("Movie history created for movie:", movieId);
    } catch (error) {
      console.error("Error creating movie history:", error);
    }
  }, [movieId, isAuthenticated, user]);

  // Start the view count process 
  // (only counts if user watches at least 10 seconds)
  const startViewCount = useCallback(() => {
    if (viewTimeoutRef.current || isViewCounted) return;
    
    viewTimeoutRef.current = setTimeout(() => {
      increaseViewCount();
      createMovieHistory();
    }, 10000); // 10 seconds
    
    console.log("View count timer started");
  }, [increaseViewCount, createMovieHistory, isViewCounted]);

  // Stop the view count process
  const stopViewCount = useCallback(() => {
    if (viewTimeoutRef.current) {
      clearTimeout(viewTimeoutRef.current);
      viewTimeoutRef.current = null;
      console.log("View count timer stopped");
    }
  }, []);

  // Handle page visibility changes (pause count when tab is inactive)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        stopViewCount();
      } else {
        setIsVisible(true);
        if (!isViewCounted) {
          startViewCount();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Initial start
    if (!document.hidden && !isViewCounted) {
      startViewCount();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopViewCount();
    };
  }, [isViewCounted, startViewCount, stopViewCount]);

  return {
    isViewCounted,
    isVisible,
    startViewCount,
    stopViewCount,
    increaseViewCount,
    createMovieHistory
  };
}; 