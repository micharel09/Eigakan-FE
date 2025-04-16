import { useState, useEffect, useCallback } from "react";
import adMediaService from "../apis/AdMedia/adMedia";
import adPurchaseSlotService from "../apis/AdPurchaseSlot/adPurchaseSlot";
import adMediaCountService from "../apis/AdMedia/adMediaCount";
import ReactDOM from "react-dom";
import React from "react";

// Constants for ad display
export const AD_CONSTANTS = {
  SKIP_AD_DELAY: 5000, // Time before skip button appears
  AD_AUTO_CLOSE_DELAY: 15000, // Time before ad auto-closes
  AD_COUNTDOWN_SECONDS: 15, // Countdown duration for ads
  FULLSCREEN_RETRY_DELAY: 500, // Delay before retrying fullscreen
  VOLUME_FADE_DELAY: 1500, // Delay for volume fade in
  MIDROLL_AD_TRIGGER_TIME: 20, // Seconds after start to trigger midroll ad
};

// AdUI Components using Tailwind classes instead of inline styles
export const AdComponents = {
  // Ad Container component
  AdContainer: ({ wasFullscreen, fullscreenElementId, children }) => (
    <div
      id="in-stream-ad-container"
      className="absolute top-0 left-0 w-full h-full z-50 bg-black"
      data-was-fullscreen={wasFullscreen}
      data-fullscreen-element-id={fullscreenElementId || ""}
    >
      {children}
    </div>
  ),

  // Skip Button component
  SkipButton: ({ onClick }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(
        () => setVisible(true),
        AD_CONSTANTS.SKIP_AD_DELAY
      );
      return () => clearTimeout(timer);
    }, []);

    return (
      <button
        onClick={onClick}
        className={`absolute right-5 top-20 py-2 px-4 bg-white/20 border-none rounded text-white font-bold cursor-pointer transition-opacity ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        Skip Ad
      </button>
    );
  },

  // Ad Label component
  AdLabel: () => (
    <div className="absolute left-5 top-20 py-1 px-2 bg-black/60 text-white rounded text-xs font-bold uppercase">
      Advertisement
    </div>
  ),

  // Countdown Timer component
  CountdownTimer: ({ currentTime }) => (
    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-5 bg-black/60 text-white py-2 px-4 rounded text-sm">
      {`Ad ends in: ${currentTime}s`}
    </div>
  ),

  // Image Ad Container
  ImageAdContainer: ({ children }) => (
    <div className="w-full h-full flex justify-center items-center bg-black animate-fadeIn">
      {children}
    </div>
  ),

  // Ad Image component
  AdImage: ({ src, fallbackSrc }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const handleError = () =>
      imageSrc !== fallbackSrc && setImageSrc(fallbackSrc);

    return (
      <img
        src={imageSrc}
        className="max-w-[80%] max-h-[80%] object-contain rounded-lg shadow-lg animate-pulse"
        onError={handleError}
        alt="Advertisement"
      />
    );
  },

  // URL Label component
  UrlLabel: () => (
    <div className="absolute bottom-12 left-0 right-0 text-center text-white bg-black/60 py-2 text-sm rounded w-64 mx-auto">
      Click to learn more
    </div>
  ),

  // Video Ad component
  VideoAd: ({ src, onEnded }) => (
    <video
      className="w-full h-full object-contain bg-black"
      autoPlay
      playsInline
      onEnded={onEnded}
    >
      <source src={src} type="video/mp4" />
    </video>
  ),

  // Ad Content Text
  ContentText: ({ content }) => (
    <div className="absolute bottom-24 left-0 w-full text-center text-white text-lg py-2 px-4 bg-black/50">
      {content}
    </div>
  ),
};

// Utility to create ad UI elements using React components and Tailwind
export const AdUIUtils = {
  // Create ad container with React component
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

  // Create skip button
  createSkipButton: () => {
    const button = document.createElement("button");
    button.textContent = "Skip Ad";
    button.className =
      "absolute right-5 top-20 py-2 px-4 bg-white/20 border-none rounded text-white font-bold cursor-pointer hidden";

    // Show button after delay
    setTimeout(() => {
      button.style.display = "block";
    }, AD_CONSTANTS.SKIP_AD_DELAY);

    return button;
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

  // Create animation styles
  createAnimationStyles: () => {
    // Note: With Tailwind we would use existing animations or define custom ones in tailwind.config.js
    // This is kept for backward compatibility
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

  // Create image ad container
  createImageAdContainer: () => {
    const container = document.createElement("div");
    container.className =
      "w-full h-full flex justify-center items-center bg-black";
    container.style.animation = "fadeIn 0.5s ease-in-out";

    // Add animations
    AdUIUtils.createAnimationStyles();

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
};

// Helper function to render React components to DOM element
const renderToElement = (Component, props) => {
  const containerElement = document.createElement("div");
  ReactDOM.render(React.createElement(Component, props), containerElement);
  return containerElement.firstChild;
};

/**
 * Custom hook to handle advertisement display
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAuthenticated - Whether the user is authenticated
 * @param {string} options.userRole - User role
 * @returns {Object} Ad state and control functions
 */
export const useAdDisplay = ({ isAuthenticated = false, userRole = null }) => {
  const [adMedia, setAdMedia] = useState([]);
  const [centerAd, setCenterAd] = useState(null);
  const [showCenterAd, setShowCenterAd] = useState(true);

  const testAds = [
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
      isPreroll: true,
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
      isPreroll: true,
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
      isPreroll: true,
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

  const getRandomAd = useCallback((type = "any") => {
    let availableAds = testAds;
    if (type === "preroll") availableAds = testAds.filter((ad) => ad.isPreroll);
    else if (type === "midroll")
      availableAds = testAds.filter((ad) => ad.isMidroll || ad.isPreroll);
    return availableAds[Math.floor(Math.random() * availableAds.length)];
  }, []);

  const getAdSequence = useCallback((count = 2, type = "midroll") => {
    const availableAds =
      type === "midroll"
        ? testAds.filter((ad) => ad.isMidroll || ad.isPreroll)
        : testAds.filter((ad) => ad.isPreroll);

    const selectedAds = [];
    const actualCount = Math.min(count, availableAds.length);

    for (let i = 0; i < actualCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableAds.length);
      selectedAds.push(availableAds[randomIndex]);
      availableAds.splice(randomIndex, 1);
    }

    return selectedAds;
  }, []);

  const [midrollAdSequence, setMidrollAdSequence] = useState([]);

  const shouldShowAds = useCallback(
    () => !userRole || userRole === "MEMBER",
    [userRole]
  );

  const processAdMedia = useCallback(
    async (ad) => {
      if (!ad?.adPurchaseSlotId) return;

      try {
        const adSlotId = ad.adPurchaseSlotId;
        const adSlotDetails = isAuthenticated
          ? await adPurchaseSlotService.getAdPurchaseSlotById(adSlotId)
          : await adPurchaseSlotService.getPublicAdPurchaseSlotById(adSlotId);

        if (!adSlotDetails.success || !adSlotDetails.data) return;

        const slotLocation = adSlotDetails.data.adSlotTime.adSlot.slotLocation;
        if (!ad.image && !ad.video && !ad.content) return;

        // Only process center ads
        if (slotLocation === "CENTER") {
          const enhancedAd = { ...ad, slotLocation };
          setCenterAd(enhancedAd);
          setShowCenterAd(true);
        }
      } catch (error) {
        console.error("Failed to process ad media:", error);
      }
    },
    [isAuthenticated]
  );

  const fetchAdMedia = useCallback(async () => {
    if (!shouldShowAds()) return;

    try {
      const response = await adMediaService.getActiveAdMedia();
      if (response.success && response.data?.length > 0) {
        setAdMedia(response.data);

        // Process only center ads
        const centerAds = response.data.filter(
          (ad) =>
            ad.adPurchaseSlot?.adSlotTime?.adSlot?.slotLocation === "CENTER"
        );

        for (const ad of centerAds) {
          await processAdMedia(ad);
        }
      }
    } catch (error) {
      console.error("Failed to fetch ad media:", error);
    }
  }, [shouldShowAds, processAdMedia]);

  useEffect(() => {
    setMidrollAdSequence(getAdSequence(2, "midroll"));
  }, [getAdSequence]);

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

  useEffect(() => {
    if (!centerAd) {
      setCenterAd(getRandomAd("preroll"));
    }
  }, [getRandomAd, centerAd]);

  return {
    adMedia,
    centerAd,
    showCenterAd,
    setShowCenterAd,
    fetchAdMedia,
    shouldShowAds,
    handleAdClick,
    midrollAdSequence,
    getRandomAd,
    getAdSequence,
    AdComponents,
  };
};
