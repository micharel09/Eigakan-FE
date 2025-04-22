import { useState, useCallback, useEffect } from "react";

const useModal = (initialState = false, onClose = null, animationDuration = 300) => {
  const [isVisible, setIsVisible] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Function to open the modal
  const open = useCallback(() => {
    setIsVisible(true);
    setIsAnimating(true);
    
    // Clear animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  }, [animationDuration]);
  
  // Function to close the modal
  const close = useCallback(() => {
    setIsAnimating(true);
    
    // Delay hiding until animation completes
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
      
      // Execute onClose callback if provided
      if (onClose && typeof onClose === "function") {
        onClose();
      }
    }, animationDuration);
  }, [animationDuration, onClose]);
  
  // Function to toggle the modal state
  const toggle = useCallback(() => {
    isVisible ? close() : open();
  }, [isVisible, open, close]);
  
  // Effect to handle escape key for modal closing
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isVisible) {
        close();
      }
    };
    
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isVisible, close]);
  
  // Effect to handle body scroll locking when modal is open
  useEffect(() => {
    if (isVisible) {
      // Prevent scrolling on the background when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore scrolling when modal is closed
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);
  
  return {
    isVisible,
    isAnimating,
    open,
    close,
    toggle,
    animationDuration
  };
};

export default useModal;
