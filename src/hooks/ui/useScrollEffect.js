import { useState, useEffect } from "react";

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
