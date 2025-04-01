import { useState, useEffect } from "react";

/**
 * Custom hook for handling scroll-related effects
 * @param {number} threshold - The scroll threshold in pixels to trigger the effect (default: 10)
 * @param {function} callback - Optional callback function to execute when threshold is crossed
 * @returns {boolean} isScrolled - Whether the page has been scrolled past the threshold
 */
const useScrollEffect = (threshold = 10, callback = null) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const hasScrolledPastThreshold = currentScrollY > threshold;
      
      // Update scroll position
      setScrollY(currentScrollY);
      
      // Only trigger state update when threshold crossing changes
      if (hasScrolledPastThreshold !== isScrolled) {
        setIsScrolled(hasScrolledPastThreshold);
        
        // Execute callback if provided
        if (callback && typeof callback === "function") {
          callback(hasScrolledPastThreshold, currentScrollY);
        }
      }
    };

    // Add scroll listener
    window.addEventListener("scroll", handleScroll);
    
    // Trigger once to initialize
    handleScroll();
    
    // Clean up listener on unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, callback, isScrolled]);

  return { isScrolled, scrollY };
};

export default useScrollEffect; 