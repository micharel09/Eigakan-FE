import { useState, useEffect, useCallback } from "react";
import { notification } from "antd";
import ratingService from "../../apis/Movie/rating";

export const useMovieRating = ({ 
  movieId, 
  isAuthenticated = false 
}) => {
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);

  /**
   * Submit a rating for the current movie
   */
  const handleRating = useCallback(async (value) => {
    if (!isAuthenticated || !movieId) return;

    setSubmittingRating(true);
    
    try {
      const response = await ratingService.createMovieRating(value, movieId);
      
      if (!response.success) {
        throw new Error(response.message || "Failed to submit rating");
      }
      
      setUserRating(value);
      setHasUserRated(true);
      
      notification.success({
        message: "Success",
        description: "Rating submitted successfully",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to submit rating",
      });
    } finally {
      setSubmittingRating(false);
    }
  }, [isAuthenticated, movieId]);

  /**
   * Check if the user can rate based on their role
   */
  const canRateAndComment = useCallback(() => {
    const role = localStorage.getItem("role");
    return role === "VIP MEMBER" || role === "ADMIN" || role === "MANAGER";
  }, []);

  /**
   * Check if user has already rated this movie
   */
  useEffect(() => {
    if (!isAuthenticated || !movieId) return;

    const fetchUserRating = async () => {
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

    fetchUserRating();
  }, [movieId, isAuthenticated]);

  return {
    userRating,
    submittingRating,
    hasUserRated,
    handleRating,
    canRateAndComment,
  };
};
