import { useState, useCallback } from "react";
import { notification } from "antd";
import adMediaService from "../apis/AdMedia/adMedia";
import adMediaCountService from "../apis/AdMedia/adMediaCount";

const useAdMediaManagement = () => {
  // States
  const [selectedAdMediaDetail, setSelectedAdMediaDetail] = useState(null);
  const [selectedAdMediaId, setSelectedAdMediaId] = useState(null);
  const [viewStatistics, setViewStatistics] = useState({});

  // Modal states
  const [isAdMediaDetailModalVisible, setIsAdMediaDetailModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);

  // Fetch ad media details
  const getAdMediaDetails = useCallback(async (mediaId) => {
    try {
      const response = await adMediaService.getAdMediaById(mediaId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch ad media details");
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch ad media details",
      });
      return null;
    }
  }, []);

  // Fetch view statistics for ad media
  const getAdMediaStatistics = useCallback(async (mediaId) => {
    try {
      const statsResponse = await adMediaCountService.getStatisticAdMediaCount(mediaId);
      if (statsResponse?.result?.success) {
        setViewStatistics((prev) => ({
          ...prev,
          [mediaId]: statsResponse.result.data || [],
        }));
        return statsResponse.result.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching view statistics:", error);
      return [];
    }
  }, []);

  // View ad media details
  const handleViewAdMediaDetails = useCallback(async (mediaId) => {
    try {
      const adMediaData = await getAdMediaDetails(mediaId);
      if (!adMediaData) return;

      // Fetch view statistics
      await getAdMediaStatistics(mediaId);

      setSelectedAdMediaDetail(adMediaData);
      setIsAdMediaDetailModalVisible(true);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch ad media details",
      });
    }
  }, [getAdMediaDetails, getAdMediaStatistics]);

  // Create new ad media
  const createAdMedia = useCallback(
    async (mediaData, options = {}) => {
      const { onSuccess, onError } = options;
      
      try {
        const response = await adMediaService.createAdMedia(mediaData);

        if (response.success) {
          notification.success({
            message: "Success",
            description: "Ad media created successfully",
          });
          if (onSuccess) onSuccess(response.data);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to create ad media");
        }
      } catch (error) {
        notification.error({
          message: "Error",
          description: error.message || "Failed to create ad media",
        });
        if (onError) onError(error);
        return null;
      }
    },
    []
  );

  // Update ad media
  const updateAdMedia = useCallback(
    async (mediaId, mediaData, options = {}) => {
      const { onSuccess, onError } = options;
      
      try {
        console.log("Sending update request with data:", mediaData);
        const response = await adMediaService.updateAdMedia(mediaId, mediaData);

        if (response.success) {
          notification.success({
            message: "Success",
            description: "Ad media updated successfully",
          });
          if (onSuccess) onSuccess(response.data);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to update ad media");
        }
      } catch (error) {
        console.error("Error updating ad media:", error);
        notification.error({
          message: "Error",
          description: error.message || "Failed to update ad media. Please check if you've filled all required fields correctly.",
        });
        if (onError) onError(error);
        return null;
      }
    },
    []
  );

  // Prepare modal for updating ad media
  const handleUpdateAdMedia = useCallback(async (mediaId) => {
    try {
      const adMedia = await getAdMediaDetails(mediaId);
      if (!adMedia) return;
      
      setSelectedAdMediaId(mediaId);
      setSelectedAdMediaDetail(adMedia);
      setIsUpdateModalVisible(true);
      
      return adMedia;
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch ad media details for update",
      });
      return null;
    }
  }, [getAdMediaDetails]);

  return {
    // States
    selectedAdMediaDetail,
    selectedAdMediaId,
    viewStatistics,
    isAdMediaDetailModalVisible,
    isUpdateModalVisible,
    
    // Setters
    setSelectedAdMediaDetail,
    setSelectedAdMediaId,
    setIsAdMediaDetailModalVisible,
    setIsUpdateModalVisible,
    
    // Functions
    getAdMediaDetails,
    getAdMediaStatistics,
    handleViewAdMediaDetails,
    handleUpdateAdMedia,
    createAdMedia,
    updateAdMedia,
  };
};

export default useAdMediaManagement; 