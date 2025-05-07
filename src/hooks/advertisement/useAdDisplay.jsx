import { useState, useEffect, useCallback } from "react";
import ScreenfullUtils from "../../utils/ScreenfullUtils";
import adMediaService from "../../apis/AdMedia/adMedia";

export const AD_CONSTANTS = {
  SKIP_AD_DELAY_SECONDS: 5, 
  AD_AUTO_CLOSE_DELAY: 15000, 
  AD_COUNTDOWN_SECONDS: 15,
  FULLSCREEN_RETRY_DELAY: 500,
  VOLUME_FADE_DELAY: 1500,
};

// UI
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

  createSkipButton: () => {
    const button = document.createElement("button");
    button.textContent = "Skip Ad";
    button.className =
      "absolute right-[160px] top-20 py-2 px-4 bg-white/20 hover:bg-white/30 border-none rounded text-white font-bold cursor-pointer hidden z-[9999] transition-colors duration-200 skip-button";

    // Sử dụng style.display để thực sự ẩn nút
    button.style.display = "none";

    return button;
  },

  setupSkipButton: (skipButton, adContainer, onSkip) => {
    // Đảm bảo nút skip được ẩn ban đầu
    skipButton.style.display = "none";

    // Thêm animation class cho nút skip
    skipButton.classList.add("animate-pulse");

    skipButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (typeof onSkip === "function") {
        onSkip(adContainer);
      }
    });

    adContainer.appendChild(skipButton);

    return skipButton;
  },

  createAdLabel: () => {
    const label = document.createElement("div");
    label.textContent = "Advertisement";
    label.className =
      "absolute left-5 top-20 py-1 px-2 bg-black/60 text-white rounded text-xs font-bold uppercase";

    return label;
  },

  createCountdownTimer: (totalSeconds) => {
    const countdown = document.createElement("div");
    countdown.className =
      "absolute right-5 top-20 bg-black/60 text-white py-2 px-4 rounded text-sm font-bold z-[9998] backdrop-blur-sm shadow-md";
    countdown.textContent = `Ad ends in: ${totalSeconds}s`;

    return countdown;
  },

  createImageAdContainer: () => {
    const container = document.createElement("div");
    container.className =
      "w-full h-full flex justify-center items-center bg-black opacity-0 scale-95 transition-all duration-500 ease-in-out";

    // Use setTimeout to trigger the animation with classes instead of keyframes
    setTimeout(() => {
      container.classList.remove("opacity-0", "scale-95");
      container.classList.add("opacity-100", "scale-100");
    }, 10);

    return container;
  },

  createAdImage: (imageUrl, fallbackImageUrl) => {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.className =
      "max-w-[80%] max-h-[80%] object-contain rounded-lg shadow-lg animate-pulse";

    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackImageUrl;
    };

    return image;
  },

  createUrlLabel: () => {
    const label = document.createElement("div");
    label.textContent = "Click to learn more";
    label.className =
      "absolute bottom-12 left-0 right-0 text-center text-white bg-black/60 py-2 text-sm rounded w-64 mx-auto backdrop-blur-sm";

    return label;
  },

  handleFullscreen: {
    isFullscreen: () => ScreenfullUtils.isFullscreen(),

    getFullscreenElement: () => ScreenfullUtils.getFullscreenElement(),

    requestFullscreen: (element) => {
      if (element) {
        console.log("Requesting fullscreen for element:", element);
        return ScreenfullUtils.requestFullscreen(element);
      }
      console.error("No element provided for fullscreen");
      return Promise.resolve(false);
    },

    exitFullscreen: () => ScreenfullUtils.exitFullscreen(),

    toggleFullscreen: (element) => {
      if (element) {
        return ScreenfullUtils.toggleFullscreen(element);
      }
      return Promise.resolve(false);
    },
  },
};

// Main hook
export const useAdDisplay = ({ userRole = null, movieId = null }) => {
  // State for ads
  const [midrollAdSequence, setMidrollAdSequence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine if ads should be shown based on user role
  const shouldShowAds = useCallback(
    () => !userRole || userRole === "MEMBER",
    [userRole]
  );

  const mapApiDataToAdFormat = useCallback((apiData) => {
    console.log("API Data received:", apiData);

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

    return ads;
  }, [movieId, fetchAdsFromApi]);

  useEffect(() => {
    const initializeAds = async () => {
      const ads = await getAdSequence();
      const formattedPositions = ads.map((ad) => {
        const seconds = ad.position || 0;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        if (minutes >= 60) {
          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;
          return `${hours}h:${remainingMinutes
            .toString()
            .padStart(2, "0")}m:${remainingSeconds
            .toString()
            .padStart(2, "0")}s (${seconds}s)`;
        }
        return `${minutes}m:${remainingSeconds
          .toString()
          .padStart(2, "0")}s (${seconds}s)`;
      });

      console.log(
        "Loaded all ads from API:",
        ads.length,
        "ads at positions:",
        formattedPositions
      );
      setMidrollAdSequence(ads);
    };

    initializeAds();
  }, [getAdSequence]);

  // Get ad positions from midrollAdSequence
  const getAdPositions = useCallback(() => {
    if (!midrollAdSequence || midrollAdSequence.length === 0) {
      // return empty if no ads
      return [];
    }

    const positions = midrollAdSequence.map((ad) => ad.position || 0);

    // Convert seconds to minutes:seconds or hours:minutes:seconds
    const formattedPositions = positions.map((seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h:${remainingMinutes
          .toString()
          .padStart(2, "0")}m:${remainingSeconds
          .toString()
          .padStart(2, "0")}s (${seconds}s)`;
      }
      return `${minutes}m:${remainingSeconds
        .toString()
        .padStart(2, "0")}s (${seconds}s)`;
    });

    console.log("Ad positions from API:", formattedPositions);
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
