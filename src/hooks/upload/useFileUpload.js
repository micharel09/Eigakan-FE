import { useState, useCallback } from "react";
import { notification } from "antd";
import uploadFileApi from "../../apis/Upload/upload.jsx";

const useFileUpload = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDirectUrlModalVisible, setIsDirectUrlModalVisible] = useState(false);

  const handleImageUpload = useCallback(async (options) => {
    const { file, onSuccess, onError } = options;

    try {
      setUploading(true);
      if (!file) throw new Error("No file selected");

      const response = await uploadFileApi.UploadPicture(file);

      if (response.status === true) {
        const uploadedUrl = response.data[0].url;
        setImageUrl(uploadedUrl);

        notification.success({
          message: "Upload Successful",
          description: "Image has been uploaded successfully.",
        });
        if (onSuccess) onSuccess("Ok");
        return uploadedUrl;
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (onError) onError({ error: err });
      notification.error({
        message: "Upload Failed",
        description:
          err.message || "An error occurred while uploading the image.",
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  // Upload video
  const handleVideoUpload = useCallback(async (options) => {
    const { file, onSuccess, onError } = options;

    try {
      setUploading(true);
      const validVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];

      if (!file) throw new Error("No file selected");

      if (!validVideoTypes.includes(file.type)) {
        notification.warning({
          message: "Unsupported Format",
          description: `File format ${file.type} may not be supported. Try using MP4, WebM, or Ogg.`,
        });
      }

      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File exceeds 100MB limit");
      }

      // Show immediate notification
      notification.info({
        message: "Upload Started",
        description:
          "Video upload in progress. This process may take some time depending on the file size.",
        duration: 3,
      });

      const response = await uploadFileApi.UploadVideoToCloudinary(file);

      if (
        response.status === true &&
        response.data &&
        response.data[0] &&
        response.data[0].url
      ) {
        const uploadedUrl = response.data[0].url;
        setVideoUrl(uploadedUrl);

        notification.success({
          message: "Upload Successful",
          description: "Video has been uploaded successfully.",
        });
        if (onSuccess) onSuccess("Ok");
        return uploadedUrl;
      } else {
        throw new Error("Could not retrieve video URL from response");
      }
    } catch (err) {
      console.error("Video upload error:", err);
      if (onError) onError({ error: err });
      
      setIsDirectUrlModalVisible(true);
      
      notification.error({
        message: "Upload Failed",
        description: "Could not upload the video. Please enter the video URL manually.",
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const setManualVideoUrl = useCallback((url) => {
    if (url && url.trim()) {
      setVideoUrl(url.trim());
      setIsDirectUrlModalVisible(false);
      
      notification.success({
        message: "Video URL Set",
        description: "Video URL has been manually set.",
      });
      return url.trim();
    }
    return null;
  }, []);

  // Reset state
  const resetUpload = useCallback(() => {
    setImageUrl("");
    setVideoUrl("");
  }, []);

  return {
    // States
    imageUrl,
    videoUrl,
    uploading,
    isDirectUrlModalVisible,
    
    // Setters
    setImageUrl,
    setVideoUrl,
    setIsDirectUrlModalVisible,
    
    // Functions
    handleImageUpload,
    handleVideoUpload,
    setManualVideoUrl,
    resetUpload,
  };
};

export default useFileUpload;
