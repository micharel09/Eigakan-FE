// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
  uploadPreset: 'eigakan_uploads',
  unsignedUploadPreset: 'videouploadegk',
  
  // Environment variables from .env file
  // On development, these come from the .env file
  // On production, these should be set in the hosting environment
  getCloudinaryUrl: () => {
    return `cloudinary://${import.meta.env.VITE_CLOUDINARY_API_KEY}:${import.meta.env.VITE_CLOUDINARY_API_SECRET}@${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}`;
  }
};

export default cloudinaryConfig; 