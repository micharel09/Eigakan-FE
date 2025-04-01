import { useState, useEffect, useCallback } from "react";
import adMediaService from "../apis/AdMedia/adMedia";
import adPurchaseSlotService from "../apis/AdPurchaseSlot/adPurchaseSlot";

/**
 * Custom hook to handle advertisement display
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAuthenticated - Whether the user is authenticated
 * @param {string} options.userRole - User role
 * @returns {Object} Ad state and control functions
 */
export const useAdDisplay = ({ 
  isAuthenticated = false,
  userRole = null 
}) => {
  const [adMedia, setAdMedia] = useState([]);
  const [sidebarAd, setSidebarAd] = useState(null);
  const [leftSidebarAd, setLeftSidebarAd] = useState(null);
  const [headerAd, setHeaderAd] = useState(null);
  const [footerAd, setFooterAd] = useState(null);
  const [centerAd, setCenterAd] = useState(null);
  const [showCenterAd, setShowCenterAd] = useState(true);

  /**
   * Check if ads should be shown based on user role
   */
  const shouldShowAds = useCallback(() => {
    return !userRole || userRole === "MEMBER";
  }, [userRole]);

  /**
   * Process an individual ad and update its state
   */
  const processAdMedia = useCallback(async (ad) => {
    if (!ad || !ad.adPurchaseSlotId) return;
    
    try {
      const adSlotId = ad.adPurchaseSlotId;
      
      // Use different methods based on authentication status
      const adSlotDetails = isAuthenticated
        ? await adPurchaseSlotService.getAdPurchaseSlotById(adSlotId)
        : await adPurchaseSlotService.getPublicAdPurchaseSlotById(adSlotId);

      if (!adSlotDetails.success || !adSlotDetails.data) return;
      
      const slotLocation = adSlotDetails.data.adSlotTime.adSlot.slotLocation;
      
      // Ensure we have either image or video content for the ad
      if (!ad.image && !ad.video && !ad.content) {
        console.warn("Ad missing content (no image, video, or text):", ad.id);
        return;
      }
      
      // Create an enhanced ad object with additional properties as needed
      const enhancedAd = {
        ...ad,
        slotLocation,
        // Any other properties you want to add
      };
      
      // Classify ads by location
      switch (slotLocation) {
        case "SIDEBAR-RIGHT":
          setSidebarAd(enhancedAd);
          break;
        case "SIDEBAR-LEFT":
          setLeftSidebarAd(enhancedAd);
          break;
        case "HEADER":
          setHeaderAd(enhancedAd);
          break;
        case "FOOTER":
          setFooterAd(enhancedAd);
          break;
        case "CENTER":
          setCenterAd(enhancedAd);
          setShowCenterAd(true);
          break;
        default:
          console.log(`Unknown ad slot location: ${slotLocation}`);
      }
    } catch (error) {
      console.error("Failed to process ad media:", error);
    }
  }, [isAuthenticated]);

  /**
   * Fetch and categorize ads
   */
  const fetchAdMedia = useCallback(async () => {
    if (!shouldShowAds()) {
      console.log("Premium user, no ads shown");
      return;
    }

    try {
      console.log("Fetching ad media...");
      const response = await adMediaService.getActiveAdMedia();
      
      if (response.success && response.data && response.data.length > 0) {
        setAdMedia(response.data);

        // Process each ad and categorize by position
        for (const ad of response.data) {
          await processAdMedia(ad);
        }
      }
    } catch (error) {
      console.error("Failed to fetch ad media:", error);
    }
  }, [shouldShowAds, processAdMedia]);

  /**
   * Load ads on component mount
   */
  useEffect(() => {
    fetchAdMedia();
  }, [fetchAdMedia]);

  return {
    adMedia,
    sidebarAd,
    leftSidebarAd,
    headerAd,
    footerAd,
    centerAd,
    showCenterAd,
    setShowCenterAd,
    fetchAdMedia,
    shouldShowAds,
  };
}; 