import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  notification,
  Typography,
  Tag,
  Tooltip,
  Card,
  Empty,
  ConfigProvider,
  Descriptions,
  Divider,
  Upload,
} from "antd";
import {
  PlusOutlined,
  LinkOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import adPurchaseSlotService from "../../apis/AdPurchaseSlot/adPurchaseSlot";
import adMediaService from "../../apis/AdMedia/adMedia";
import axios from "axios";
import uploadFileApi from "../../apis/Upload/upload.jsx";
import cloudinaryConfig from "../../config/cloudinary";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Custom theme with brand color
const theme = {
  token: {
    colorPrimary: "#FF009F",
    colorLink: "#FF009F",
    colorLinkHover: "#d1007f",
  },
};

const statusStyles = `
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    box-shadow: 0 2px 0 rgba(0,0,0,0.02);
  }
  
  .status-active {
    background-color: #f6ffed;
    border: 1px solid #b7eb8f;
    color: #52c41a;
  }
  
  .status-rejected {
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    color: #ff4d4f;
  }
  
  .status-pending {
    background-color: #fffbe6;
    border: 1px solid #ffe58f;
    color: #faad14;
  }
  
  .status-expired {
    background-color: #f5f5f5;
    border: 1px solid #d9d9d9;
    color: #8c8c8c;
  }
  
  .status-icon {
    margin-right: 6px;
    font-size: 12px;
    display: flex;
    align-items: center;
  }
  
  .status-text {
    text-transform: capitalize;
  }
  
  .detail-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  
  .detail-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .detail-content {
    padding: 16px;
  }
  
  .detail-section {
    margin-bottom: 20px;
  }
  
  .detail-section:last-child {
    margin-bottom: 0;
  }
  
  .detail-label {
    font-size: 13px;
    color: #8c8c8c;
    margin-bottom: 8px;
  }
  
  .detail-value {
    background-color: #fafafa;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #f0f0f0;
  }
  
  .detail-image {
    width: 100%;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #f0f0f0;
  }
  
  .rejection-box {
    background-color: #fff1f0;
    border: 1px solid #ffa39e;
    border-radius: 6px;
    padding: 12px;
    color: #cf1322;
  }
`;

const AdPurchaseSlotManagement = () => {
  const [adPurchaseSlots, setAdPurchaseSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedAdMedia, setSelectedAdMedia] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form] = Form.useForm();
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isAdMediaDetailModalVisible, setIsAdMediaDetailModalVisible] =
    useState(false);
  const [selectedAdMediaDetail, setSelectedAdMediaDetail] = useState(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [updateForm] = Form.useForm();
  const [selectedAdMediaId, setSelectedAdMediaId] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [totalSlots, setTotalSlots] = useState(0);
  const [isDirectUrlModalVisible, setIsDirectUrlModalVisible] = useState(false);
  const [directUrlForm] = Form.useForm();
  const [currentSlotLocation, setCurrentSlotLocation] = useState(null);

  const navigate = useNavigate();

  const fetchAdPurchaseSlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adPurchaseSlotService.getAdPurchaseSlotsByUserId();
      if (response.success) {
        setAdPurchaseSlots(response.data);
        setTotalSlots(response.total || response.data.length);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch ad purchase slots",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdPurchaseSlots();
  }, [fetchAdPurchaseSlots]);

  const handleCreateAdClick = async (slotId) => {
    try {
      setDetailLoading(true);
      setSelectedSlotId(slotId);

      // Fetch slot details to determine location
      const response = await adPurchaseSlotService.getAdPurchaseSlotById(
        slotId
      );
      if (response.success && response.data) {
        const slotLocation = response.data.adSlotTime?.adSlot?.slotLocation;
        setCurrentSlotLocation(slotLocation);
      } else {
        setCurrentSlotLocation(null);
      }

      setIsModalVisible(true);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch slot details",
      });
      setCurrentSlotLocation(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateMedia = async (values) => {
    try {
      if (!selectedSlotId) {
        notification.error({
          message: "Error",
          description: "No slot selected for creating ad media",
        });
        return;
      }

      // Create the media data object
      const mediaData = {
        ...values,
        adPurchaseSlotId: selectedSlotId,
      };

      // Only include video for CENTER slot location
      if (currentSlotLocation === "CENTER") {
        mediaData.video = values.video || videoUrl;
      } else {
        mediaData.video = null;
      }

      setLoading(true);
      const response = await adMediaService.createAdMedia(mediaData);

      if (response.success) {
        notification.success({
          message: "Success",
          description: "Ad media created successfully",
        });
        setIsModalVisible(false);
        setImageUrl("");
        setVideoUrl("");
        form.resetFields();
        fetchAdPurchaseSlots();
      } else {
        throw new Error(response.message || "Failed to create ad media");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to create ad media",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdMediaDetails = async (id) => {
    try {
      setDetailLoading(true);
      const response = await adMediaService.getAdMediaById(id);
      if (response.success) {
        setSelectedAdMedia(response.data);
        setIsDetailModalVisible(true);
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch ad media details",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch ad media details",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);

    try {
      if (!file) throw new Error("No file selected");

      const response = await uploadFileApi.UploadPicture(file);
      console.log("Upload response:", response);

      if (response.status === true) {
        const uploadedUrl = response.data[0].url;
        setImageUrl(uploadedUrl);
        form.setFieldsValue({ image: uploadedUrl });

        notification.success({
          message: "Upload Successful",
          description: "Image has been uploaded successfully.",
        });
        onSuccess("Ok");
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      onError({ error: err });
      notification.error({
        message: "Upload Failed",
        description:
          err.message || "An error occurred while uploading the image.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setIsVideoUploading(true);

    try {
      // Validate file type and size before uploading
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
        // Continue anyway, just a warning
      }

      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        throw new Error("File exceeds 100MB limit");
      }

      console.log("Uploading video:", file.name, file.type, file.size);

      // Show immediate notification
      notification.info({
        message: "Upload Started",
        description:
          "Video upload in progress. This process may take some time depending on the file size.",
        duration: 3,
      });

      // Using direct Cloudinary upload method
      try {
        console.log("Uploading directly to Cloudinary");
        const response = await uploadFileApi.UploadVideoToCloudinary(file);
        console.log("Cloudinary video upload result:", response);

        if (
          response.status === true &&
          response.data &&
          response.data[0] &&
          response.data[0].url
        ) {
          const uploadedUrl = response.data[0].url;
          console.log("Cloudinary video URL:", uploadedUrl);
          setVideoUrl(uploadedUrl);
          form.setFieldsValue({ video: uploadedUrl });
          updateForm.setFieldsValue({ video: uploadedUrl });

          notification.success({
            message: "Upload Successful",
            description: "Video has been uploaded successfully.",
          });
          onSuccess("Ok");
        } else {
          throw new Error("Could not retrieve video URL from response");
        }
      } catch (err) {
        console.error("Error uploading to Cloudinary:", err);

        // Display manual URL input form if upload fails
        setIsVideoUploading(false);
        setIsDirectUrlModalVisible(true);
        directUrlForm.resetFields();

        notification.error({
          message: "Upload Failed",
          description:
            "Could not upload the video. Please enter the video URL manually.",
        });

        onError({ error: err });
      }
    } catch (err) {
      console.error("Video upload error:", err);
      onError({ error: err });
      notification.error({
        message: "Upload Failed",
        description:
          err.message || "An error occurred while uploading the video.",
      });
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleDirectUrlSubmit = (values) => {
    const { videoUrl: directUrl } = values;

    if (directUrl && directUrl.trim()) {
      setVideoUrl(directUrl.trim());
      form.setFieldsValue({ video: directUrl.trim() });
      updateForm.setFieldsValue({ video: directUrl.trim() });

      setIsDirectUrlModalVisible(false);

      notification.success({
        message: "Video URL Set",
        description: "Video URL has been manually set.",
      });
    }
  };

  // Helper function to find URLs in a response object
  const findUrlInObject = (obj) => {
    // If it's a string that looks like a URL, return it
    if (typeof obj === "string" && obj.match(/^https?:\/\//)) {
      return obj;
    }

    // If it's an array, check each element
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findUrlInObject(item);
        if (found) return found;
      }
    }

    // If it's an object, check each property
    if (typeof obj === "object" && obj !== null) {
      for (const key in obj) {
        const found = findUrlInObject(obj[key]);
        if (found) return found;
      }
    }

    return null;
  };

  const handleViewDetails = async (id) => {
    try {
      setDetailLoading(true);
      const response = await adPurchaseSlotService.getAdPurchaseSlotById(id);
      if (response.success) {
        setSelectedAdMedia(response.data);
        setIsDetailModalVisible(true);
      } else {
        notification.error({
          message: "Error",
          description:
            response.message || "Failed to fetch ad purchase slot details",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "Failed to fetch ad purchase slot details",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewAdMediaDetails = async (mediaId) => {
    try {
      setDetailLoading(true);
      const response = await adMediaService.getAdMediaById(mediaId);
      if (response.success) {
        const adMediaData = response.data;

        // Fetch the slot location for this ad media
        if (adMediaData.adPurchaseSlotId) {
          const slotResponse =
            await adPurchaseSlotService.getAdPurchaseSlotById(
              adMediaData.adPurchaseSlotId
            );
          if (slotResponse.success && slotResponse.data) {
            const slotLocation =
              slotResponse.data.adSlotTime?.adSlot?.slotLocation;
            // Add slot location to the selected ad media details
            adMediaData.slotLocation = slotLocation;
          }
        }

        setSelectedAdMediaDetail(adMediaData);
        setIsAdMediaDetailModalVisible(true);
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch ad media details",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch ad media details",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateAdMedia = async (mediaId) => {
    try {
      setDetailLoading(true);
      const response = await adMediaService.getAdMediaById(mediaId);
      if (response.success) {
        const adMedia = response.data;
        setSelectedAdMediaId(mediaId);

        // Fetch the slot location for this ad media
        if (adMedia.adPurchaseSlotId) {
          const slotResponse =
            await adPurchaseSlotService.getAdPurchaseSlotById(
              adMedia.adPurchaseSlotId
            );
          if (slotResponse.success && slotResponse.data) {
            const slotLocation =
              slotResponse.data.adSlotTime?.adSlot?.slotLocation;
            setCurrentSlotLocation(slotLocation);

            // Clear video field if it exists but we're not in CENTER position
            if (slotLocation !== "CENTER" && adMedia.video) {
              adMedia.video = null;
            }
          }
        }

        updateForm.setFieldsValue({
          content: adMedia.content,
          image: adMedia.image,
          video: adMedia.video,
          url: adMedia.url,
        });
        setImageUrl(adMedia.image);
        setVideoUrl(adMedia.video || "");
        setIsUpdateModalVisible(true);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "Failed to fetch ad media details for update",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateMedia = async (values) => {
    try {
      if (!selectedAdMediaId) {
        notification.error({
          message: "Error",
          description: "No ad media selected for update",
        });
        return;
      }

      // Create the media data object
      const mediaData = {
        ...values,
      };

      // Only include video for CENTER slot location
      if (currentSlotLocation === "CENTER") {
        mediaData.video = values.video || videoUrl;
      } else {
        mediaData.video = null;
      }

      setLoading(true);
      const response = await adMediaService.updateAdMedia(
        selectedAdMediaId,
        mediaData
      );

      if (response.success) {
        notification.success({
          message: "Success",
          description: "Ad media updated successfully",
        });
        setIsUpdateModalVisible(false);
        setImageUrl("");
        setVideoUrl("");
        updateForm.resetFields();
        fetchAdPurchaseSlots();
      } else {
        throw new Error(response.message || "Failed to update ad media");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to update ad media",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Package Info",
      dataIndex: "adPackage",
      key: "packageInfo",
      render: (adPackage) => (
        <div>
          <div className="font-medium">{adPackage?.packageName}</div>
          <div className="text-gray-500 text-sm">
            Price: {formatCurrency(adPackage?.packPrice)}
          </div>
          <div className="text-gray-500 text-sm">
            Duration: {adPackage?.duration} month
          </div>
        </div>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_, record) => (
        <div>
          <div className="text-sm">
            <ClockCircleOutlined className="mr-1" />
            Start: {format(new Date(record.startDate), "MMM dd, yyyy HH:mm")}
          </div>
          <div className="text-sm">
            <ClockCircleOutlined className="mr-1" />
            End: {format(new Date(record.expiredDate), "MMM dd, yyyy HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {formatCurrency(record.purchaseSlotPrice)}
          </div>
          <div className="text-gray-500 text-sm">
            Slot: {formatCurrency(record.adSlotTime?.slotTimePrice)}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        let icon = null;

        switch (status) {
          case "ACTIVE":
            color = "success";
            icon = <CheckCircleOutlined />;
            break;
          case "EXPIRED":
            color = "default";
            icon = <ClockCircleOutlined />;
            break;
          case "PENDING":
            color = "warning";
            icon = <ClockCircleOutlined />;
            break;
          default:
            color = "error";
            icon = <CloseCircleOutlined />;
        }

        return (
          <Tag icon={icon} color={color}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Ad Media",
      key: "adMedia",
      render: (_, record) => (
        <div>
          {record.adMedias?.length > 0 ? (
            <div className="flex items-center gap-3">
              <Button
                type="link"
                className="flex items-center p-0 m-0"
                onClick={() => handleViewAdMediaDetails(record.adMedias[0].id)}
                icon={<FileImageOutlined />}
              >
                <span>View Ad</span>
              </Button>
              <div
                className={`status-badge status-${record.adMedias[0].status.toLowerCase()}`}
              >
                <span className="status-icon">
                  {getIconForStatus(record.adMedias[0].status)}
                </span>
                <span className="status-text">{record.adMedias[0].status}</span>
              </div>
            </div>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreateAdClick(record.id)}
            >
              Create Ad
            </Button>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          {record.adMedias?.length > 0 &&
            record.adMedias[0].status === "REJECTED" && (
              <Tooltip title="Update Ad Media">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleUpdateAdMedia(record.adMedias[0].id)}
                />
              </Tooltip>
            )}
        </Space>
      ),
    },
  ];

  const DetailModal = ({ adPurchaseSlot }) => (
    <Descriptions bordered column={1} size="small">
      <Descriptions.Item label="Package Name">
        {adPurchaseSlot.adPackage?.packageName}
      </Descriptions.Item>
      <Descriptions.Item label="Package Price">
        {formatCurrency(adPurchaseSlot.adPackage?.packPrice)}
      </Descriptions.Item>
      <Descriptions.Item label="Duration">
        {adPurchaseSlot.adPackage?.duration} month
      </Descriptions.Item>
      <Descriptions.Item label="Purchase Price">
        {formatCurrency(adPurchaseSlot.purchaseSlotPrice)}
      </Descriptions.Item>
      <Descriptions.Item label="Slot Time Price">
        {formatCurrency(adPurchaseSlot.adSlotTime?.slotTimePrice)}
      </Descriptions.Item>
      <Descriptions.Item label="Slot Location">
        {adPurchaseSlot.adSlotTime?.adSlot?.slotLocation}
      </Descriptions.Item>
      <Descriptions.Item label="Time Range">
        {adPurchaseSlot.adSlotTime?.adSlotTimeRange?.startTime} -{" "}
        {adPurchaseSlot.adSlotTime?.adSlotTimeRange?.endTime}
      </Descriptions.Item>
      <Descriptions.Item label="Start Date">
        {format(new Date(adPurchaseSlot.startDate), "MMM dd, yyyy HH:mm")}
      </Descriptions.Item>
      <Descriptions.Item label="Expired Date">
        {format(new Date(adPurchaseSlot.expiredDate), "MMM dd, yyyy HH:mm")}
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={adPurchaseSlot.status === "ACTIVE" ? "success" : "default"}>
          {adPurchaseSlot.status}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Created At">
        {format(new Date(adPurchaseSlot.createAt), "MMM dd, yyyy HH:mm")}
      </Descriptions.Item>
    </Descriptions>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getTagColorForStatus = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
        return "warning";
      case "EXPIRED":
        return "default";
      default:
        return "default";
    }
  };

  const getIconForStatus = (status) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircleOutlined />;
      case "REJECTED":
        return <CloseCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      case "EXPIRED":
        return <ClockCircleOutlined />;
      default:
        return null;
    }
  };

  // Initialize videoUrl in component effect when showing modals
  useEffect(() => {
    if (isUpdateModalVisible && selectedAdMediaId) {
      const videoUrlValue = updateForm.getFieldValue("video");
      if (videoUrlValue && videoUrlValue !== "string") {
        setVideoUrl(videoUrlValue);
      }
    }
  }, [isUpdateModalVisible, selectedAdMediaId, updateForm]);

  return (
    <>
      <style>{statusStyles}</style>
      <ConfigProvider theme={theme}>
        <div className="p-6">
          <Card bordered={false} className="shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <Title level={2} style={{ margin: 0, color: "#333" }}>
                Ads Management
              </Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate("/advertiser/select-adpackage")}
              >
                Purchase New Slot
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={adPurchaseSlots}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
                total: Math.min(totalSlots, pagination.pageSize * 6),
                showTotal: (total) => `Total ${total} items`,
                onChange: (page, pageSize) => {
                  setPagination({ current: page, pageSize });
                  fetchAdPurchaseSlots();
                },
                onShowSizeChange: (current, size) => {
                  setPagination({ current: 1, pageSize: size });
                  fetchAdPurchaseSlots();
                },
                size: "default",
                showLessItems: true,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No ad purchase slots found"
                  >
                    <Button
                      type="primary"
                      onClick={() => navigate("/advertiser/select-adpackage")}
                    >
                      Purchase Your First Slot
                    </Button>
                  </Empty>
                ),
              }}
              className="custom-table"
            />
          </Card>

          {/* Create Ad Media Modal */}
          <Modal
            title="Create Ad Media"
            open={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false);
              setImageUrl("");
              setVideoUrl("");
              setCurrentSlotLocation(null);
              form.resetFields();
            }}
            footer={null}
          >
            <Form form={form} layout="vertical" onFinish={handleCreateMedia}>
              <Form.Item name="content" label="Ad Content">
                <TextArea
                  placeholder="Enter your ad content or message"
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item name="image" label="Image">
                <Input.Group compact>
                  <Upload
                    customRequest={handleUpload}
                    showUploadList={false}
                    maxCount={1}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={isUploading}
                      className="mr-2"
                    >
                      Upload Image
                    </Button>
                  </Upload>
                  <Input
                    className="flex-1"
                    placeholder="Or enter image URL"
                    value={form.getFieldValue("image")}
                    onChange={(e) => {
                      form.setFieldsValue({ image: e.target.value });
                      setImageUrl(e.target.value);
                    }}
                    disabled={isUploading}
                  />
                </Input.Group>
              </Form.Item>

              {/* Display image preview if available */}
              {imageUrl && (
                <Form.Item label="Image Preview">
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-[200px] rounded border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/400x300?text=Invalid+Image";
                        notification.warning({
                          message: "Image Preview Error",
                          description:
                            "Could not load image preview. URL may be invalid.",
                        });
                      }}
                    />
                  </div>
                </Form.Item>
              )}

              {/* Only show video upload for CENTER slots */}
              {currentSlotLocation === "CENTER" && (
                <Form.Item name="video" label="Video">
                  <Input.Group compact>
                    <Upload
                      customRequest={handleVideoUpload}
                      showUploadList={false}
                      maxCount={1}
                      accept="video/*"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={isVideoUploading}
                        className="mr-2"
                      >
                        {isVideoUploading ? "Uploading..." : "Upload Video"}
                      </Button>
                    </Upload>
                    <Input
                      className="flex-1"
                      prefix={
                        <VideoCameraOutlined className="site-form-item-icon" />
                      }
                      placeholder="Or enter video URL"
                      value={form.getFieldValue("video")}
                      onChange={(e) => {
                        form.setFieldsValue({ video: e.target.value });
                        setVideoUrl(e.target.value);
                      }}
                      disabled={isVideoUploading}
                    />
                  </Input.Group>
                  <div className="mt-1 text-xs text-gray-500">
                    (Video will be uploaded to Cloudinary. Supports MP4, WebM,
                    Ogg. Maximum 100MB)
                  </div>
                </Form.Item>
              )}

              {/* Video preview if available */}
              {currentSlotLocation === "CENTER" && videoUrl && (
                <Form.Item label="Video Preview">
                  <div className="mt-2 border border-gray-200 rounded overflow-hidden">
                    <video
                      controls
                      className="max-w-full h-auto max-h-[250px]"
                      style={{ display: "block", margin: "0 auto" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        notification.warning({
                          message: "Video Preview Error",
                          description:
                            "Could not load video preview. The URL may be invalid or the format is not supported by your browser.",
                        });
                      }}
                    >
                      <source src={videoUrl} type="video/mp4" />
                      <source src={videoUrl} type="video/webm" />
                      <source src={videoUrl} type="video/ogg" />
                      <source src={videoUrl} type="video/quicktime" />
                      Your browser does not support HTML video.
                    </video>
                    <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200 flex items-center justify-between">
                      <div>
                        {videoUrl.length > 60
                          ? videoUrl.substring(0, 57) + "..."
                          : videoUrl}
                      </div>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                </Form.Item>
              )}

              <Form.Item name="url" label="Destination URL">
                <Input
                  prefix={<LinkOutlined className="site-form-item-icon" />}
                  placeholder="https://example.com"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Space className="w-full justify-end">
                  <Button
                    onClick={() => {
                      if (isUploading || isVideoUploading) {
                        notification.warning({
                          message: "Please wait",
                          description: "Media is still uploading...",
                        });
                        return;
                      }
                      setIsModalVisible(false);
                      setImageUrl("");
                      setVideoUrl("");
                      form.resetFields();
                    }}
                    disabled={isUploading || isVideoUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading || isUploading || isVideoUploading}
                    disabled={isUploading || isVideoUploading}
                  >
                    {isUploading || isVideoUploading
                      ? "Uploading..."
                      : "Create Ad Media"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Ad Media Details Modal */}
          <Modal
            title={
              <div className="flex items-center justify-between">
                <span>Ad Media Details</span>
                <div
                  className={`status-badge status-${selectedAdMediaDetail?.status.toLowerCase()}`}
                >
                  <span className="status-icon">
                    {getIconForStatus(selectedAdMediaDetail?.status)}
                  </span>
                  <span className="status-text">
                    {selectedAdMediaDetail?.status}
                  </span>
                </div>
              </div>
            }
            open={isAdMediaDetailModalVisible}
            onCancel={() => {
              setIsAdMediaDetailModalVisible(false);
              setSelectedAdMediaDetail(null);
            }}
            footer={[
              <Button
                key="close"
                onClick={() => {
                  setIsAdMediaDetailModalVisible(false);
                  setSelectedAdMediaDetail(null);
                }}
              >
                Close
              </Button>,
            ]}
            width={600}
            centered
            bodyStyle={{ padding: 0 }}
          >
            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              selectedAdMediaDetail && (
                <div className="detail-card">
                  {/* Image display */}
                  {selectedAdMediaDetail.image &&
                    selectedAdMediaDetail.image !== "string" && (
                      <div className="detail-image">
                        <img
                          src={selectedAdMediaDetail.image}
                          alt="Ad Media"
                          className="w-full object-contain"
                          style={{ maxHeight: "300px" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/600x400?text=Image+Not+Available";
                          }}
                        />
                      </div>
                    )}

                  {/* Video display */}
                  {selectedAdMediaDetail.video &&
                    selectedAdMediaDetail.video !== "string" &&
                    selectedAdMediaDetail.slotLocation === "CENTER" && (
                      <div className="detail-image">
                        <video
                          controls
                          className="w-full object-contain"
                          style={{ maxHeight: "300px" }}
                          onError={(e) => {
                            e.target.onerror = null;
                          }}
                        >
                          <source
                            src={selectedAdMediaDetail.video}
                            type="video/mp4"
                          />
                          <source
                            src={selectedAdMediaDetail.video}
                            type="video/webm"
                          />
                          <source
                            src={selectedAdMediaDetail.video}
                            type="video/ogg"
                          />
                          Your browser does not support HTML video.
                        </video>
                        <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                          <a
                            href={selectedAdMediaDetail.video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Open video in new tab
                          </a>
                        </div>
                      </div>
                    )}

                  <div className="detail-content">
                    {/* Content section */}
                    <div className="detail-section">
                      <div className="detail-label">Content</div>
                      <div className="detail-value">
                        {selectedAdMediaDetail.content || "No content provided"}
                      </div>
                    </div>

                    {/* URL section if available */}
                    {selectedAdMediaDetail.url && (
                      <div className="detail-section">
                        <div className="detail-label">Destination URL</div>
                        <div className="detail-value">
                          <a
                            href={selectedAdMediaDetail.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedAdMediaDetail.url}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Video URL section if available as text */}
                    {selectedAdMediaDetail.video &&
                      selectedAdMediaDetail.slotLocation === "CENTER" && (
                        <div className="detail-section">
                          <div className="detail-label">Video URL</div>
                          <div className="detail-value">
                            <a
                              href={selectedAdMediaDetail.video}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {selectedAdMediaDetail.video}
                            </a>
                          </div>
                        </div>
                      )}

                    {/* Created at info */}
                    <div className="detail-section">
                      <div className="detail-label">Created At</div>
                      <div className="detail-value">
                        {format(
                          new Date(selectedAdMediaDetail.createAt),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </div>
                    </div>

                    {/* Show rejection reason if applicable */}
                    {selectedAdMediaDetail.reasonForRejection && (
                      <div className="detail-section">
                        <div className="detail-label">Rejection Reason</div>
                        <div className="rejection-box">
                          {selectedAdMediaDetail.reasonForRejection}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </Modal>

          {/* Add Purchase Slot Details Modal */}
          <Modal
            title="Purchase Slot Details"
            open={isDetailModalVisible}
            onCancel={() => {
              setIsDetailModalVisible(false);
              setSelectedAdMedia(null);
            }}
            footer={[
              <Button
                key="close"
                onClick={() => {
                  setIsDetailModalVisible(false);
                  setSelectedAdMedia(null);
                }}
              >
                Close
              </Button>,
            ]}
            width={700}
            centered
          >
            {detailLoading ? (
              <div className="flex justify-center py-4">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              selectedAdMedia && (
                <DetailModal adPurchaseSlot={selectedAdMedia} />
              )
            )}
          </Modal>

          {/* Update Ad Media Modal */}
          <Modal
            title="Update Ad Media"
            open={isUpdateModalVisible}
            onCancel={() => {
              setIsUpdateModalVisible(false);
              setImageUrl("");
              setVideoUrl("");
              setCurrentSlotLocation(null);
              updateForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={updateForm}
              layout="vertical"
              onFinish={handleUpdateMedia}
            >
              <Form.Item name="content" label="Ad Content">
                <TextArea
                  placeholder="Enter your ad content or message"
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item name="image" label="Image">
                <Input.Group compact>
                  <Upload
                    customRequest={handleUpload}
                    showUploadList={false}
                    maxCount={1}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={isUploading}
                      className="mr-2"
                    >
                      Upload Image
                    </Button>
                  </Upload>
                  <Input
                    className="flex-1"
                    placeholder="Or enter image URL"
                    value={updateForm.getFieldValue("image")}
                    onChange={(e) => {
                      updateForm.setFieldsValue({ image: e.target.value });
                      setImageUrl(e.target.value);
                    }}
                    disabled={isUploading}
                  />
                </Input.Group>
              </Form.Item>

              {/* Display image preview if available */}
              {imageUrl && (
                <Form.Item label="Image Preview">
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-[200px] rounded border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/400x300?text=Invalid+Image";
                        notification.warning({
                          message: "Image Preview Error",
                          description:
                            "Could not load image preview. URL may be invalid.",
                        });
                      }}
                    />
                  </div>
                </Form.Item>
              )}

              {/* Only show video upload for CENTER slots in update form */}
              {currentSlotLocation === "CENTER" && (
                <Form.Item name="video" label="Video">
                  <Input.Group compact>
                    <Upload
                      customRequest={handleVideoUpload}
                      showUploadList={false}
                      maxCount={1}
                      accept="video/*"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={isVideoUploading}
                        className="mr-2"
                      >
                        {isVideoUploading ? "Uploading..." : "Upload Video"}
                      </Button>
                    </Upload>
                    <Input
                      className="flex-1"
                      prefix={
                        <VideoCameraOutlined className="site-form-item-icon" />
                      }
                      placeholder="Or enter video URL"
                      value={updateForm.getFieldValue("video")}
                      onChange={(e) => {
                        updateForm.setFieldsValue({ video: e.target.value });
                        setVideoUrl(e.target.value);
                      }}
                      disabled={isVideoUploading}
                    />
                  </Input.Group>
                  <div className="mt-1 text-xs text-gray-500">
                    (Video will be uploaded to Cloudinary. Supports MP4, WebM,
                    Ogg. Maximum 100MB)
                  </div>
                </Form.Item>
              )}

              {/* Video preview if available for CENTER slots */}
              {currentSlotLocation === "CENTER" && videoUrl && (
                <Form.Item label="Video Preview">
                  <div className="mt-2 border border-gray-200 rounded overflow-hidden">
                    <video
                      controls
                      className="max-w-full h-auto max-h-[250px]"
                      style={{ display: "block", margin: "0 auto" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        notification.warning({
                          message: "Video Preview Error",
                          description:
                            "Could not load video preview. The URL may be invalid or the format is not supported by your browser.",
                        });
                      }}
                    >
                      <source src={videoUrl} type="video/mp4" />
                      <source src={videoUrl} type="video/webm" />
                      <source src={videoUrl} type="video/ogg" />
                      <source src={videoUrl} type="video/quicktime" />
                      Your browser does not support HTML video.
                    </video>
                    <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200 flex items-center justify-between">
                      <div>
                        {videoUrl.length > 60
                          ? videoUrl.substring(0, 57) + "..."
                          : videoUrl}
                      </div>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                </Form.Item>
              )}

              <Form.Item name="url" label="Destination URL">
                <Input
                  prefix={<LinkOutlined className="site-form-item-icon" />}
                  placeholder="https://example.com"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Space className="w-full justify-end">
                  <Button
                    onClick={() => {
                      if (isUploading || isVideoUploading) {
                        notification.warning({
                          message: "Please wait",
                          description: "Media is still uploading...",
                        });
                        return;
                      }
                      setIsUpdateModalVisible(false);
                      setImageUrl("");
                      setVideoUrl("");
                      updateForm.resetFields();
                    }}
                    disabled={isUploading || isVideoUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading || isUploading || isVideoUploading}
                    disabled={isUploading || isVideoUploading}
                  >
                    {isUploading || isVideoUploading
                      ? "Uploading..."
                      : "Update Ad Media"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Direct URL Input Modal */}
          <Modal
            title="Enter Video URL"
            open={isDirectUrlModalVisible}
            onCancel={() => setIsDirectUrlModalVisible(false)}
            footer={null}
          >
            <Form
              form={directUrlForm}
              layout="vertical"
              onFinish={handleDirectUrlSubmit}
            >
              <Form.Item
                label="Video URL"
                name="videoUrl"
                rules={[
                  {
                    required: true,
                    message: "Please enter the video URL",
                  },
                  {
                    type: "url",
                    message: "Please enter a valid URL",
                  },
                ]}
              >
                <Input
                  prefix={<VideoCameraOutlined />}
                  placeholder="https://example.com/video.mp4"
                />
              </Form.Item>
              <Form.Item>
                <div className="flex justify-between">
                  <Button onClick={() => setIsDirectUrlModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Confirm
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </ConfigProvider>
    </>
  );
};

export default AdPurchaseSlotManagement;
