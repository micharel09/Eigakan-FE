import { useState, useEffect, useCallback } from "react";
import ScreenfullUtils from "../../utils/ScreenfullUtils";
import adMediaService from "../../apis/AdMedia/adMedia";

// Constants for ad display
export const AD_CONSTANTS = {
  SKIP_AD_DELAY_SECONDS: 5, // Number of seconds before end when skip button appears
  AD_AUTO_CLOSE_DELAY: 15000, // Time before ad auto-closes
  AD_COUNTDOWN_SECONDS: 15, // Countdown duration for ads
  FULLSCREEN_RETRY_DELAY: 500, // Delay before retrying fullscreen
  VOLUME_FADE_DELAY: 1500, // Delay for volume fade in
  MIDROLL_AD_TRIGGER_TIME: 20, // Seconds after start to trigger midroll ad
};

// Utility to create ad UI elements using DOM API and Tailwind
export const AdUIUtils = {
  // Create ad container
  createAdContainer: (wasFullscreen = false, fullscreenElementId = null) => {
    const container = document.createElement("div");
    container.id = "in-stream-ad-container";
    container.className = "absolute top-0 left-0 w-full h-full z-50 bg-black";

    // Save fullscreen info for later use
    container.dataset.wasFullscreen = wasFullscreen.toString();
    if (fullscreenElementId) {
      container.dataset.fullscreenElementId = fullscreenElementId;
    }

    return container;
  },

  // Create skip button with standardized behavior
  createSkipButton: () => {
    const button = document.createElement("button");
    button.textContent = "Skip Ad";
    button.className =
      "absolute right-5 top-20 py-2 px-4 bg-white/20 border-none rounded text-white font-bold cursor-pointer hidden skip-button";

    // Set high z-index to ensure it's above other elements
    button.style.zIndex = "9999";

    // Initially hidden - will be shown in the last few seconds
    button.style.display = "none";

    // Add hover effect
    button.onmouseover = () => {
      button.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
    };
    button.onmouseout = () => {
      button.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
    };

    return button;
  },

  // Setup skip button with standardized behavior for all ad types
  setupSkipButton: (skipButton, adContainer, onSkip) => {
    // Don't force display here - let the countdown control visibility
    // skipButton.style.display = "block";

    // Set high z-index to ensure it's above all other elements
    skipButton.style.zIndex = "9999";

    // Add pulse animation to make it more noticeable when it appears
    skipButton.style.transition = "all 0.3s ease-in-out";
    skipButton.style.transform = "scale(1)";
    skipButton.style.animation = "pulse 2s infinite ease-in-out";

    // Use addEventListener for better event handling
    skipButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Call the provided callback function
      if (typeof onSkip === "function") {
        onSkip(adContainer);
      }
    });

    // Add to container
    adContainer.appendChild(skipButton);

    return skipButton;
  },

  // Create ad label
  createAdLabel: () => {
    const label = document.createElement("div");
    label.textContent = "Advertisement";
    label.className =
      "absolute left-5 top-20 py-1 px-2 bg-black/60 text-white rounded text-xs font-bold uppercase";

    return label;
  },

  // Create countdown timer
  createCountdownTimer: (totalSeconds) => {
    const countdown = document.createElement("div");
    countdown.className =
      "absolute left-1/2 -translate-x-1/2 bottom-5 bg-black/60 text-white py-2 px-4 rounded text-sm";
    countdown.style.transform = "translateX(-50%)";
    countdown.style.zIndex = "9998"; // High z-index but below skip button
    countdown.style.fontWeight = "bold";
    countdown.style.backdropFilter = "blur(2px)";
    countdown.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";
    countdown.textContent = `Ad ends in: ${totalSeconds}s`;

    return countdown;
  },

  // Create image ad container
  createImageAdContainer: () => {
    const container = document.createElement("div");
    container.className =
      "w-full h-full flex justify-center items-center bg-black";
    container.style.animation = "fadeIn 0.5s ease-in-out";

    // Add animations if not already present
    if (!document.getElementById("ad-animations")) {
      const style = document.createElement("style");
      style.id = "ad-animations";
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
    }

    return container;
  },

  // Create ad image
  createAdImage: (imageUrl, fallbackImageUrl) => {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.className =
      "max-w-[80%] max-h-[80%] object-contain rounded-lg shadow-lg";
    image.style.animation = "pulse 3s infinite ease-in-out";

    // Handle error if image fails to load
    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackImageUrl;
    };

    return image;
  },

  // Create URL label
  createUrlLabel: () => {
    const label = document.createElement("div");
    label.textContent = "Click to learn more";
    label.className =
      "absolute bottom-12 left-0 right-0 text-center text-white bg-black/60 py-2 text-sm rounded w-64 mx-auto";

    return label;
  },

  // Handle fullscreen for ads using ScreenfullUtils
  handleFullscreen: {
    // Check if currently in fullscreen mode
    isFullscreen: () => ScreenfullUtils.isFullscreen(),

    // Request fullscreen for an element
    requestFullscreen: (element) => {
      if (element) {
        return ScreenfullUtils.requestFullscreen(element);
      }
      return Promise.resolve(false);
    },

    // Exit fullscreen
    exitFullscreen: () => ScreenfullUtils.exitFullscreen(),

    // Toggle fullscreen for an element
    toggleFullscreen: (element) => {
      if (element) {
        return ScreenfullUtils.toggleFullscreen(element);
      }
      return Promise.resolve(false);
    },
  },
};

/**
 * Custom hook to handle advertisement display for WatchPage
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAuthenticated - Whether the user is authenticated (not used directly but kept for API compatibility)
 * @param {string} options.userRole - User role to determine if ads should be shown
 * @param {string} options.movieId - ID of the movie being watched
 * @returns {Object} Ad state and control functions needed for WatchPage
 * @returns {Array} midrollAdSequence - Sequence of midroll ads to display
 * @returns {Function} shouldShowAds - Function to check if ads should be shown based on user role
 * @returns {Function} getAdSequence - Function to get a sequence of ads for midroll
 */
export const useAdDisplay = ({
  isAuthenticated = false,
  userRole = null,
  movieId = null,
}) => {
  // Only keep necessary state and logic for WatchPage
  const [midrollAdSequence, setMidrollAdSequence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if ads should be shown based on user role
  const shouldShowAds = useCallback(
    () => !userRole || userRole === "MEMBER",
    [userRole]
  );

  // Convert API data to the required ad format
  const mapApiDataToAdFormat = useCallback((apiData) => {
    console.log("API Data received:", apiData);

    // Check API data structure
    if (!apiData) {
      console.error("API data is null or undefined");
      return [];
    }

    // Check if it's an array
    const dataArray = Array.isArray(apiData)
      ? apiData
      : apiData.data && Array.isArray(apiData.data)
      ? apiData.data
      : null;

    if (!dataArray) {
      console.error("Could not find valid data array in API response", apiData);
      return [];
    }

    console.log("Processing data array:", dataArray);

    return dataArray.map((item) => {
      console.log("Processing ad item:", item);

      // Handle different data structure cases
      const adMedia = item.adMedia || item;
      const adMediaId = item.adMediaId || adMedia.id || "unknown-id";
      const content = adMedia.content || "Advertisement";
      const url = adMedia.url || "";
      const position = item.position || 0;
      const redirectUrl = adMedia.redirectUrl || "";

      // Determine ad type (video or image) based on URL
      const isVideo =
        url &&
        (url.endsWith(".mp4") ||
          url.endsWith(".webm") ||
          url.endsWith(".mov") ||
          url.includes("video") ||
          (url.includes("cloudinary") && url.includes("video")));

      return {
        id: adMediaId,
        title: content,
        // If it's a video, set the video field, otherwise set the image field
        ...(isVideo ? { video: url } : { image: url }),
        alternativeImage:
          "https://placehold.co/800x450/3A0033/FFFFFF?text=Alternative+Ad", // Fallback image for ads
        redirectUrl: redirectUrl, // Use redirectUrl from API if available
        content: content,
        slotLocation: "CENTER",
        duration: AD_CONSTANTS.AD_COUNTDOWN_SECONDS,
        isMidroll: true,
        position: position,
      };
    });
  }, []);

  // Fetch ads from API
  const fetchAdsFromApi = useCallback(async () => {
    if (!movieId) {
      console.log("No movieId provided for ad fetch");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching ads for movie ID:", movieId);
      const response = await adMediaService.getRandomAdMedia(movieId);
      console.log("API response:", response);

      // Check if response is valid
      if (!response) {
        throw new Error("Empty response from API");
      }

      // Handle case where response doesn't have success field
      if (response.success === undefined) {
        // Response might be direct data
        const formattedAds = mapApiDataToAdFormat(response);
        console.log("Formatted ads (direct):", formattedAds);
        return formattedAds;
      }

      // Handle case where response has success field
      if (response.success) {
        const formattedAds = mapApiDataToAdFormat(response.data);
        console.log("Formatted ads (success):", formattedAds);
        return formattedAds;
      } else {
        console.error(
          "API returned error:",
          response.message || "Unknown error"
        );
        return [];
      }
    } catch (err) {
      console.error("Error fetching ads:", err);
      setError(err.message || "Failed to fetch ads");
      return [];
    } finally {
      setLoading(false);
    }
  }, [movieId, mapApiDataToAdFormat]);

  // Get a sequence of ads for midroll from API
  const getAdSequence = useCallback(async () => {
    if (!movieId) {
      console.log("No movieId provided for ad fetch");
      return [];
    }

    // Get ads from API
    const ads = await fetchAdsFromApi();
    console.log("Total ads from API:", ads.length);

    // Return all ads from API
    return ads;
  }, [movieId, fetchAdsFromApi]);

  // Initialize midroll ad sequence
  useEffect(() => {
    const initializeAds = async () => {
      // Get all ads from API without limiting the number
      const ads = await getAdSequence();
      console.log("Loaded all ads from API:", ads.length, "ads");
      setMidrollAdSequence(ads);
    };

    initializeAds();
  }, [getAdSequence]);

  // Get ad positions from midrollAdSequence
  const getAdPositions = useCallback(() => {
    if (!midrollAdSequence || midrollAdSequence.length === 0) {
      // If no ads, return default position
      return [AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME];
    }

    // Get positions of all ads
    const positions = midrollAdSequence.map(
      (ad) => ad.position || AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME
    );
    console.log("Ad positions from API:", positions);
    return positions;
  }, [midrollAdSequence]);

  // Only return what WatchPage actually needs
  return {
    midrollAdSequence,
    shouldShowAds,
    getAdSequence,
    getAdPositions,
    loading,
    error,
  };
};
