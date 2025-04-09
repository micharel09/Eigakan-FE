// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: "dn8bn2sty",
  apiKey: "555269384966273",
  apiSecret: "LswShgYp4j6w-NnuH-a_e3i4Ppw",
  uploadPreset: 'eigakan_uploads',
  unsignedUploadPreset: 'videouploadegk',
  
  getCloudinaryUrl: () => {
    return `cloudinary://${cloudinaryConfig.apiKey}:${cloudinaryConfig.apiSecret}@${cloudinaryConfig.cloudName}`;
  }
};

export default cloudinaryConfig; 