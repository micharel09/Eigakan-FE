import { useState, useEffect, useCallback } from "react";
import ScreenfullUtils from "../utils/ScreenfullUtils";
import adMediaService from "../apis/AdMedia/adMedia";

// Constants for ad display
export const AD_CONSTANTS = {
  SKIP_AD_DELAY: 5000, // Time before skip button appears
  AD_AUTO_CLOSE_DELAY: 15000, // Time before ad auto-closes
  AD_COUNTDOWN_SECONDS: 15, // Countdown duration for ads
  FULLSCREEN_RETRY_DELAY: 500, // Delay before retrying fullscreen
  VOLUME_FADE_DELAY: 1500, // Delay for volume fade in
  MIDROLL_AD_TRIGGER_TIME: 20, // Seconds after start to trigger midroll ad
};

// Sample test ads - moved outside the hook for better separation of concerns
const TEST_ADS = [
  {
    id: "ad-1",
    title: "Test Advertisement 1",
    image:
      "https://placehold.co/800x450/FF009F/FFFFFF?text=Test+Advertisement+1",
    alternativeImage:
      "https://placehold.co/800x450/3A0033/FFFFFF?text=Alternative+Ad+1",
    redirectUrl: "https://example.com/ad1",
    content: "This is test advertisement 1 for Eigakan",
    slotLocation: "CENTER",
    duration: 15,
    isMidroll: true,
  },
  {
    id: "ad-2",
    title: "Test Advertisement 2",
    image: "https://placehold.co/800x450/FF4DB8/000000?text=Test+Ad+2",
    alternativeImage:
      "https://placehold.co/800x450/3A0033/FFFFFF?text=Alternative+Ad+2",
    redirectUrl: "https://example.com/ad2",
    content: "This is test advertisement 2 for Eigakan",
    slotLocation: "CENTER",
    duration: 12,
    isMidroll: true,
  },
  {
    id: "ad-3",
    title: "Video Advertisement",
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    redirectUrl: "https://example.com/video-ad",
    content: "This is a video advertisement for testing",
    slotLocation: "CENTER",
    duration: 10,
    isMidroll: true,
  },
  {
    id: "midroll-1",
    title: "Midroll Only Ad 1",
    image: "https://placehold.co/800x450/3A0033/FF4DB8?text=Midroll+Only+1",
    alternativeImage:
      "https://placehold.co/800x450/FF009F/FFFFFF?text=Alternative+Midroll",
    redirectUrl: "https://example.com/midroll1",
    content: "This is a midroll-only advertisement",
    slotLocation: "CENTER",
    duration: 10,
    isMidroll: true,
  },
];

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

    // Show button after delay
    setTimeout(() => {
      button.style.display = "block";
    }, AD_CONSTANTS.SKIP_AD_DELAY);

    return button;
  },

  // Setup skip button with standardized behavior for all ad types
  setupSkipButton: (skipButton, adContainer, onSkip) => {
    // Ensure button is visible
    skipButton.style.display = "block";

    // Set high z-index to ensure it's above all other elements
    skipButton.style.zIndex = "9999";

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
  // Chỉ giữ lại state và logic cần thiết cho WatchPage
  const [midrollAdSequence, setMidrollAdSequence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if ads should be shown based on user role
  const shouldShowAds = useCallback(
    () => !userRole || userRole === "MEMBER",
    [userRole]
  );

  // Chuyển đổi dữ liệu từ API sang định dạng cần thiết cho quảng cáo
  const mapApiDataToAdFormat = useCallback((apiData) => {
    console.log("API Data received:", apiData);

    // Kiểm tra cấu trúc dữ liệu API
    if (!apiData) {
      console.error("API data is null or undefined");
      return [];
    }

    // Kiểm tra xem có phải là mảng không
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

      // Xử lý trường hợp cấu trúc dữ liệu khác nhau
      const adMedia = item.adMedia || item;
      const adMediaId = item.adMediaId || adMedia.id || "unknown-id";
      const content = adMedia.content || "Advertisement";
      const url = adMedia.url || "";
      const position = item.position || 0;

      return {
        id: adMediaId,
        title: content,
        image: url,
        alternativeImage:
          "https://placehold.co/800x450/3A0033/FFFFFF?text=Alternative+Ad",
        redirectUrl: "", // Không có URL chuyển hướng từ API
        content: content,
        slotLocation: "CENTER",
        duration: 15,
        isMidroll: true,
        position: position,
      };
    });
  }, []);

  // Lấy quảng cáo từ API
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

      // Kiểm tra response có hợp lệ không
      if (!response) {
        throw new Error("Empty response from API");
      }

      // Xử lý trường hợp response không có success field
      if (response.success === undefined) {
        // Có thể response trực tiếp là dữ liệu
        const formattedAds = mapApiDataToAdFormat(response);
        console.log("Formatted ads (direct):", formattedAds);
        return formattedAds;
      }

      // Xử lý trường hợp response có success field
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

  // Get a sequence of ads for midroll - sử dụng API thay vì dữ liệu test
  const getAdSequence = useCallback(async () => {
    // Nếu không có movieId, sử dụng dữ liệu test
    if (!movieId) {
      const availableAds = [...TEST_ADS].filter((ad) => ad.isMidroll);
      const selectedAds = [];

      // Lấy tất cả quảng cáo test
      for (let i = 0; i < availableAds.length; i++) {
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        selectedAds.push(availableAds[randomIndex]);
        availableAds.splice(randomIndex, 1);
      }

      return selectedAds;
    }

    // Sử dụng API để lấy quảng cáo
    const ads = await fetchAdsFromApi();
    console.log("Total ads from API:", ads.length);

    // Trả về tất cả quảng cáo từ API, không giới hạn số lượng
    return ads;
  }, [movieId, fetchAdsFromApi]);

  // Initialize midroll ad sequence
  useEffect(() => {
    const initializeAds = async () => {
      // Lấy tất cả quảng cáo từ API (không giới hạn số lượng)
      const ads = await getAdSequence(); // Không truyền tham số để lấy tất cả quảng cáo
      console.log("Loaded all ads from API:", ads.length, "ads");
      setMidrollAdSequence(ads);
    };

    initializeAds();
  }, [getAdSequence]);

  // Lấy vị trí quảng cáo từ midrollAdSequence
  const getAdPositions = useCallback(() => {
    if (!midrollAdSequence || midrollAdSequence.length === 0) {
      // Nếu không có quảng cáo, trả về vị trí mặc định
      return [AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME];
    }

    // Lấy vị trí của tất cả quảng cáo
    const positions = midrollAdSequence.map(
      (ad) => ad.position || AD_CONSTANTS.MIDROLL_AD_TRIGGER_TIME
    );
    console.log("Ad positions from API:", positions);
    return positions;
  }, [midrollAdSequence]);

  // Chỉ trả về những gì WatchPage thực sự cần
  return {
    midrollAdSequence,
    shouldShowAds,
    getAdSequence,
    getAdPositions,
    loading,
    error,
  };
};
