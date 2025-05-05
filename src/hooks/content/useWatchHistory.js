import { useState, useEffect, useCallback } from "react";
import movieHistoryService from "../../apis/MovieHistory/MovieHistory";

export const useWatchHistory = ({ 
  isAuthenticated = false 
}) => {
  const [watchHistory, setWatchHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /**
   * Fetch user's watch history
   */
  const fetchWatchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoadingHistory(true);
    
    try {
      const response = await movieHistoryService.GetMovieHistory();
      
      if (response.success && response.data) {
        setWatchHistory(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch watch history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, [isAuthenticated]);

  /**
   * Add a movie to watch history
   */
  const addToHistory = useCallback(async (movieId) => {
    if (!isAuthenticated || !movieId) return;
    
    try {
      await movieHistoryService.CreateMovieHistory({ movieId });
      fetchWatchHistory();
    } catch (error) {
      console.error("Failed to add to watch history:", error);
    }
  }, [isAuthenticated, fetchWatchHistory]);

  /**
   * Remove a movie from watch history
   */
  const removeFromHistory = useCallback(async (movieId) => {
    if (!isAuthenticated || !movieId) return;
    
    try {
      await movieHistoryService.DeleteMovieHistory(movieId);
      fetchWatchHistory();
    } catch (error) {
      console.error("Failed to remove from watch history:", error);
    }
  }, [isAuthenticated, fetchWatchHistory]);

  /**
   * Clear entire watch history
   */
  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await movieHistoryService.DeleteAllMovieHistory();
      setWatchHistory([]);
    } catch (error) {
      console.error("Failed to clear watch history:", error);
    }
  }, [isAuthenticated]);

  /**
   * Check if a movie is in watch history
   */
  const isInHistory = useCallback((movieId) => {
    return watchHistory.some(item => item.movieId === movieId);
  }, [watchHistory]);

  /**
   * Load watch history on component mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchHistory();
    }
  }, [isAuthenticated, fetchWatchHistory]);

  return {
    watchHistory,
    loadingHistory,
    fetchWatchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isInHistory,
  };
};
