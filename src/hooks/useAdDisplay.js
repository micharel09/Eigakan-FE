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
          const adSlotId = ad.adPurchaseSlotId;
          
          try {
            // Use different methods based on authentication status
            const adSlotDetails = isAuthenticated
              ? await adPurchaseSlotService.getAdPurchaseSlotById(adSlotId)
              : await adPurchaseSlotService.getPublicAdPurchaseSlotById(adSlotId);

            if (adSlotDetails.success) {
              const slotLocation = adSlotDetails.data.adSlotTime.adSlot.slotLocation;
              
              // Classify ads by location
              switch (slotLocation) {
                case "SIDEBAR-RIGHT":
                  setSidebarAd(ad);
                  break;
                case "SIDEBAR-LEFT":
                  setLeftSidebarAd(ad);
                  break;
                case "HEADER":
                  setHeaderAd(ad);
                  break;
                case "FOOTER":
                  setFooterAd(ad);
                  break;
                case "CENTER":
                  setCenterAd(ad);
                  setShowCenterAd(true);
                  break;
              }
            }
          } catch (slotError) {
            console.error("Failed to fetch ad slot details:", slotError);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch ad media:", error);
    }
  }, [isAuthenticated, shouldShowAds]);

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