import screenfull from 'screenfull';

/**
 * Utility class for handling fullscreen functionality using screenfull.js
 */
const ScreenfullUtils = {
  /**
   * Check if fullscreen is currently active
   * @returns {boolean} True if fullscreen is active
   */
  isFullscreen: () => {
    return screenfull.isEnabled && screenfull.isFullscreen;
  },

  /**
   * Get the current fullscreen element
   * @returns {HTMLElement|null} The element that is currently in fullscreen, or null
   */
  getFullscreenElement: () => {
    if (!screenfull.isEnabled) return null;
    return screenfull.element;
  },

  /**
   * Exit fullscreen mode
   * @returns {Promise} Promise that resolves when fullscreen is exited
   */
  exitFullscreen: () => {
    if (!screenfull.isEnabled || !screenfull.isFullscreen) return Promise.resolve();
    return screenfull.exit();
  },

  /**
   * Request fullscreen for an element
   * @param {HTMLElement} element - The element to make fullscreen
   * @returns {Promise} Promise that resolves when fullscreen is entered
   */
  requestFullscreen: (element) => {
    if (!screenfull.isEnabled || !element) return Promise.resolve(false);
    
    try {
      return screenfull.request(element).then(() => true).catch(error => {
        console.error('Error entering fullscreen:', error);
        return false;
      });
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
      return Promise.resolve(false);
    }
  },

  /**
   * Toggle fullscreen for an element
   * @param {HTMLElement} element - The element to toggle fullscreen
   * @returns {Promise} Promise that resolves when fullscreen state is toggled
   */
  toggleFullscreen: (element) => {
    if (!screenfull.isEnabled) return Promise.resolve(false);
    
    try {
      return screenfull.toggle(element).then(() => true).catch(error => {
        console.error('Error toggling fullscreen:', error);
        return false;
      });
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      return Promise.resolve(false);
    }
  },

  /**
   * Add a listener for fullscreen change events
   * @param {Function} callback - Function to call when fullscreen state changes
   * @returns {Function} Function to remove the listener
   */
  onFullscreenChange: (callback) => {
    if (!screenfull.isEnabled) return () => {};
    
    const handler = () => {
      callback(screenfull.isFullscreen, screenfull.element);
    };
    
    screenfull.on('change', handler);
    return () => screenfull.off('change', handler);
  },

  /**
   * Add a listener for fullscreen error events
   * @param {Function} callback - Function to call when fullscreen error occurs
   * @returns {Function} Function to remove the listener
   */
  onFullscreenError: (callback) => {
    if (!screenfull.isEnabled) return () => {};
    
    screenfull.on('error', callback);
    return () => screenfull.off('error', callback);
  }
};

export default ScreenfullUtils;
