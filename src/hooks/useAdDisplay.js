import { useState, useEffect, useCallback } from "react";
import adMediaService from "../apis/AdMedia/adMedia";
import adPurchaseSlotService from "../apis/AdPurchaseSlot/adPurchaseSlot";
import adMediaCountService from "../apis/AdMedia/adMediaCount";

// Constants for ad display
export const AD_CONSTANTS = {
  SKIP_AD_DELAY: 5000, // Time before skip button appears
  AD_AUTO_CLOSE_DELAY: 15000, // Time before ad auto-closes
  AD_COUNTDOWN_SECONDS: 15, // Countdown duration for ads
  FULLSCREEN_RETRY_DELAY: 500, // Delay before retrying fullscreen
  VOLUME_FADE_DELAY: 1500, // Delay for volume fade in
  MIDROLL_AD_TRIGGER_TIME: 20, // Seconds after start to trigger midroll ad
};

// Utility để tạo UI elements cho quảng cáo
export const AdUIUtils = {
  // Tạo container quảng cáo chính
  createAdContainer: (wasFullscreen = false, fullscreenElementId = null) => {
    const container = document.createElement("div");
    container.id = "in-stream-ad-container";
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.zIndex = "100";
    container.style.backgroundColor = "#000";

    // Lưu thông tin fullscreen để sử dụng sau
    container.dataset.wasFullscreen = wasFullscreen.toString();
    if (fullscreenElementId) {
      container.dataset.fullscreenElementId = fullscreenElementId;
    }

    return container;
  },

  // Tạo nút bỏ qua quảng cáo
  createSkipButton: () => {
    const button = document.createElement("button");
    button.textContent = "Skip Ad";
    button.style.position = "absolute";
    button.style.right = "20px";
    button.style.top = "80px";
    button.style.padding = "8px 16px";
    button.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.color = "white";
    button.style.cursor = "pointer";
    button.style.fontWeight = "bold";
    button.style.display = "none"; // Ẩn lúc đầu

    // Hiển thị nút sau thời gian delay
    setTimeout(() => {
      button.style.display = "block";
    }, AD_CONSTANTS.SKIP_AD_DELAY);

    return button;
  },

  // Tạo nhãn "Quảng cáo"
  createAdLabel: () => {
    const label = document.createElement("div");
    label.textContent = "Quảng cáo";
    label.style.position = "absolute";
    label.style.left = "20px";
    label.style.top = "80px";
    label.style.padding = "4px 8px";
    label.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    label.style.color = "white";
    label.style.borderRadius = "4px";
    label.style.fontSize = "12px";
    label.style.fontWeight = "bold";
    label.style.textTransform = "uppercase";

    return label;
  },

  // Tạo countdown timer UI
  createCountdownTimer: (totalSeconds) => {
    const countdown = document.createElement("div");
    countdown.style.position = "absolute";
    countdown.style.left = "50%";
    countdown.style.transform = "translateX(-50%)";
    countdown.style.bottom = "20px";
    countdown.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    countdown.style.color = "white";
    countdown.style.padding = "8px 16px";
    countdown.style.borderRadius = "4px";
    countdown.style.fontSize = "14px";
    countdown.textContent = `Ad ends in: ${totalSeconds}s`;

    return countdown;
  },

  // Tạo và thêm styles cho animations
  createAnimationStyles: () => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    return style;
  },

  // Tạo và config image container cho quảng cáo hình ảnh
  createImageAdContainer: () => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.backgroundColor = "#000";
    container.style.animation = "fadeIn 0.5s ease-in-out";

    // Thêm animations
    AdUIUtils.createAnimationStyles();

    return container;
  },

  // Tạo image element cho quảng cáo hình ảnh
  createAdImage: (imageUrl, fallbackImageUrl) => {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.style.maxWidth = "80%";
    image.style.maxHeight = "80%";
    image.style.objectFit = "contain";
    image.style.borderRadius = "8px";
    image.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.5)";
    image.style.animation = "pulse 3s infinite ease-in-out";

    // Xử lý lỗi nếu hình ảnh không tải được
    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackImageUrl;
    };

    return image;
  },

  // Tạo URL label cho quảng cáo có link
  createUrlLabel: () => {
    const label = document.createElement("div");
    label.textContent = "Click to learn more";
    label.style.position = "absolute";
    label.style.bottom = "50px";
    label.style.left = "0";
    label.style.right = "0";
    label.style.textAlign = "center";
    label.style.color = "white";
    label.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    label.style.padding = "8px";
    label.style.fontSize = "14px";
    label.style.borderRadius = "4px";
    label.style.width = "250px";
    label.style.margin = "0 auto";

    return label;
  }
};

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

  /**
   * Handle ad click and increase view count
   */
  const handleAdClick = useCallback(async (adId, movieId) => {
    try {
      if (adId && movieId) {
        await adMediaCountService.increaseAdMediaCount({
          adMediaId: adId,
          movieId: movieId,
        });
      }
    } catch (error) {
      console.error("Error increasing ad view count:", error);
    }
  }, []);

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
    handleAdClick,
  };
}; 