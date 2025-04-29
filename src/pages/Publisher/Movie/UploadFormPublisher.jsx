"use client";

import { useState, useEffect } from "react";
import {
  Input,
  Select,
  Button,
  Upload,
  Card,
  notification,
  Progress,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import mediaApi from "../../../apis/Media/media";

const { Option } = Select;

// Media creation function (if you need it inline)
const createMedia = async (media) => {
  // You can replace this with your actual API call
  return mediaApi.createMedia(media);
};

const UploadFormPublisher = () => {
  const [medias, setMedias] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // Calculate estimated time remaining
  useEffect(() => {
    if (uploading && startTime && progress > 0) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const totalEstimatedSeconds = (elapsedSeconds / progress) * 100;
      const remainingSeconds = totalEstimatedSeconds - elapsedSeconds;
      setEstimatedTime(Math.round(remainingSeconds));
    }
  }, [progress, startTime, uploading]);

  // Handle file upload
  const handleUpload = async (index, file) => {
    setUploading(true);
    setProgress(0);
    setCurrentUploadIndex(index);
    setStartTime(Date.now());

    try {
      if (file.type.startsWith("video/")) {
        // Upload Video to Bunny CDN
        const createResponse = await fetch(
          "https://demoapi1-efhhd3b5hrhefagu.canadacentral-01.azurewebsites.net/api/Upload/upload_VideoBunny",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: file.name }),
          }
        );

        const createData = await createResponse.json();
        if (!createResponse.ok) throw new Error("Couldn't create video");

        const videoId = createData.videoUrl;
        console.log("Video ID:", videoId);

        const xhr = new XMLHttpRequest();
        xhr.open(
          "PUT",
          `https://video.bunnycdn.com/library/384568/videos/${videoId}`,
          true
        );
        xhr.setRequestHeader(
          "AccessKey",
          "5dd7b859-f5cf-4d94-a0b71073f51a-3048-4dfd"
        );
        xhr.setRequestHeader("Content-Type", "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          setUploading(false);
          setCurrentUploadIndex(null);
          setEstimatedTime(null);

          if (xhr.status === 200) {
            const newVideoUrl = `https://iframe.mediadelivery.net/embed/384568/${videoId}`;
            updateMedia(index, "url", newVideoUrl);
            notification.success({
              message: "Upload Successful",
              description: "Your video has been uploaded successfully!",
            });
          } else {
            notification.error({
              message: "Upload Failed",
              description: "There was an error uploading your video.",
            });
          }
        };

        xhr.onerror = () => {
          setUploading(false);
          setCurrentUploadIndex(null);
          setEstimatedTime(null);
          notification.error({
            message: "Upload Error",
            description: "There was an error connecting to the server.",
          });
        };

        xhr.send(file);
      } else {
        // Handle image upload
        const reader = new FileReader();
        reader.onload = (e) => {
          updateMedia(index, "url", e.target.result);
          setUploading(false);
          setCurrentUploadIndex(null);
          setEstimatedTime(null);
          notification.success({
            message: "Upload Successful",
            description: "Your image has been uploaded successfully!",
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setUploading(false);
      setCurrentUploadIndex(null);
      setEstimatedTime(null);
      console.error(error);
      notification.error({
        message: "Upload Error",
        description: "There was an error processing your file.",
      });
    }
  };

  // Update media item
  const updateMedia = (index, field, value) => {
    const updatedMedias = [...medias];
    updatedMedias[index][field] = value;
    setMedias(updatedMedias);
  };

  // Add new media item
  const addMedia = () => {
    setMedias([...medias, { name: "", url: "", type: "", movieId: id }]);
  };

  // Remove media item
  const removeMedia = (index) => {
    const updatedMedias = [...medias];
    updatedMedias.splice(index, 1);
    setMedias(updatedMedias);
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(
      2,
      "0"
    )}`;
  };

  // Save all media
  const handleFinish = async () => {
    try {
      const mediaList = medias.filter(
        (media) => media.name && media.url && media.type && media.movieId
      );

      if (mediaList.length === 0) {
        notification.warning({
          message: "No Media to Save",
          description: "Please add at least one complete media item.",
        });
        return;
      }

      // Call API to save media
      await Promise.all(mediaList.map((media) => mediaApi.createMedia(media)));

      notification.success({
        message: "Save Successful",
        description: "All media items have been saved successfully!",
      });

      // Redirect to movie page
      navigate("/publisher/movie");
    } catch (error) {
      console.error("Error saving media:", error);
      notification.error({
        message: "Save Failed",
        description: "There was an error saving your media items.",
      });
    }
  };

  return (
    <div className="p-6 mx-auto bg-white rounded-lg shadow-lg max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Upload Video & Add Media
      </h1>

      <div className="space-y-6">
        {medias.map((media, index) => (
          <Card
            key={index}
            className="overflow-hidden shadow-sm"
            bodyStyle={{ padding: 0 }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Media Item #{index + 1}</h3>
                <Button
                  danger
                  onClick={() => removeMedia(index)}
                  icon={<DeleteOutlined />}
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Media Name
                  </label>
                  <Input
                    placeholder="Enter media name"
                    value={media.name}
                    onChange={(e) => updateMedia(index, "name", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Media Type
                  </label>
                  <Select
                    placeholder="Select media type"
                    value={media.type}
                    onChange={(value) => updateMedia(index, "type", value)}
                    style={{ width: "100%" }}
                  >
                    <Option value="FILMVIP">Film</Option>
                    <Option value="TRAILER">Trailer</Option>
                  </Select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Upload File
                </label>
                <div className="flex items-center gap-4">
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleUpload(index, file);
                      return false; // Prevent default upload behavior
                    }}
                    disabled={uploading}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      disabled={uploading && currentUploadIndex === index}
                    >
                      {uploading && currentUploadIndex === index
                        ? "Uploading..."
                        : "Select File"}
                    </Button>
                  </Upload>

                  {media.url && (
                    <span className="text-sm text-green-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      File uploaded
                    </span>
                  )}
                </div>
              </div>

              {uploading && currentUploadIndex === index && (
                <div className="mb-4 bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress
                    percent={progress}
                    status="active"
                    strokeColor={{
                      "0%": "#108ee9",
                      "100%": "#87d068",
                    }}
                  />
                  {estimatedTime !== null && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <ClockCircleOutlined className="mr-1" />
                      Estimated time remaining:{" "}
                      {formatTimeRemaining(estimatedTime)}
                    </div>
                  )}
                </div>
              )}

              {media.url && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Preview
                  </label>
                  <div className="bg-gray-100 rounded-md p-2 overflow-hidden">
                    {media.type === "FILMVIP" || media.type === "TRAILER" ? (
                      <div className="aspect-video w-full max-w-md mx-auto">
                        <iframe
                          src={media.url}
                          className="w-full h-full rounded-md"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <img
                        src={media.url || "/placeholder.svg"}
                        alt={media.name}
                        className="max-h-40 rounded-md mx-auto"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        <Button
          type="dashed"
          onClick={addMedia}
          block
          icon={<PlusOutlined />}
          disabled={uploading}
          className="h-16"
        >
          Add New Media
        </Button>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={handleFinish}
              disabled={uploading || medias.length === 0}
              icon={<SaveOutlined />}
            >
              Save All Media
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadFormPublisher;
