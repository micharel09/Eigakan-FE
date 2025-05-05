import { useState, useEffect, useCallback } from "react";
import { notification } from "antd";
import UserApi from "../../apis/User/user";
import ratingService from "../../apis/Movie/rating";
import movieService from "../../apis/Movie/movie";

export const useMovieComments = ({
  movieId,
  isAuthenticated = false,
  movie
}) => {
  const [commentInput, setCommentInput] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  /**
   * Submit a comment for the current movie
   */
  const handleCommentSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!commentInput.trim() || !isAuthenticated || !movieId || submittingComment) return null;

    setSubmittingComment(true);
    try {
      const response = await ratingService.createComment(commentInput, movieId);
      if (!response.success) throw new Error(response.message || "Failed to post comment");

      const movieResponse = await movieService.getMovieById(movieId);
      if (!movieResponse.success) throw new Error("Failed to refresh movie data");

      setCommentInput("");
      notification.success({
        message: "Success",
        description: "Comment posted successfully",
      });

      return movieResponse.data;
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to post comment",
      });
      return null;
    } finally {
      setSubmittingComment(false);
    }
  }, [commentInput, isAuthenticated, movieId, submittingComment]);

  /**
   * Fetch user details for comment authors
   */
  useEffect(() => {
    if (!isAuthenticated || !movie?.comments?.length) {
      setLoadingComments(false);
      return;
    }

    const fetchUserDetails = async () => {
      setLoadingComments(true);

      try {
        const userIds = movie.comments.map((comment) => comment.createBy);
        const uniqueUserIds = [...new Set(userIds)];

        const userPromises = uniqueUserIds.map((id) => UserApi.getUserDetail(id));
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
        setLoadingComments(false);
      }
    };

    fetchUserDetails();
  }, [movie, isAuthenticated]);

  return {
    commentInput,
    setCommentInput,
    userDetails,
    loadingComments,
    submittingComment,
    handleCommentSubmit,
  };
};
