import React, { useState, useEffect } from "react";
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
  Collapse,
  Tabs,
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
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import adPurchaseSlotService from "../../apis/AdPurchaseSlot/adPurchaseSlot";
import adMediaService from "../../apis/AdMedia/adMedia";
import adMediaCountService from "../../apis/AdMedia/adMediaCount";
import axios from "axios";
import uploadFileApi from "../../apis/Upload/upload.jsx";
import cloudinaryConfig from "../../config/cloudinary";
import WatchPagePreview from "../../components/AdPreview/WatchPagePreview";
import {
  useAdSlotManagement,
  useAdMediaManagement,
  useFileUpload,
} from "../../hooks";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;
const { TabPane } = Tabs;

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
  // Sử dụng custom hooks
  const {
    adPurchaseSlots,
    slotDetails,
    loading,
    adMediaCounts,
    pagination,
    canCreateAd,
    fetchSlotDetails,
    fetchAdPurchaseSlots,
    handlePaginationChange,
    handleShowSizeChange,
  } = useAdSlotManagement();

  const {
    selectedAdMediaDetail,
    selectedAdMediaId,
    viewStatistics,
    isAdMediaDetailModalVisible,
    isUpdateModalVisible,
    setIsAdMediaDetailModalVisible,
    setIsUpdateModalVisible,
    handleViewAdMediaDetails,
    handleUpdateAdMedia,
    createAdMedia,
    updateAdMedia,
  } = useAdMediaManagement();

  const {
    imageUrl,
    videoUrl,
    isDirectUrlModalVisible,
    setImageUrl,
    setVideoUrl,
    setIsDirectUrlModalVisible,
    handleImageUpload,
    handleVideoUpload,
    setManualVideoUrl,
    resetUpload,
  } = useFileUpload();

  // Component-specific states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedAdMedia, setSelectedAdMedia] = useState(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [directUrlForm] = Form.useForm();
  const [currentSlotLocation, setCurrentSlotLocation] = useState(null);
  const [detailLoadingMap, setDetailLoadingMap] = useState({});
  const [detailDataMap, setDetailDataMap] = useState({});
  const [activeTab, setActiveTab] = useState("form");

  const navigate = useNavigate();

  // Xử lý click button Create Ad
  const handleCreateAdClick = async (record) => {
    try {
      // Refresh slot detail trước khi cho phép tạo
      await fetchSlotDetails(record.id);

      if (!canCreateAd(record)) {
        notification.warning({
          message: "Cannot Create Ad",
          description:
            "You can only create ads for active slots without existing ads.",
        });
        return;
      }

      const slotDetail = slotDetails[record.id];
      const slotLocation = slotDetail?.adSlotTime?.adSlot?.slotLocation;
      setCurrentSlotLocation(slotLocation);
      setSelectedSlotId(record.id);
      setIsModalVisible(true);
      setActiveTab("form");
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to process request",
      });
      setCurrentSlotLocation(null);
    }
  };

  // Xử lý tạo ad media mới
  const handleCreateMedia = async (values) => {
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

    await createAdMedia(mediaData, {
      onSuccess: () => {
        setIsModalVisible(false);
        resetUpload();
        form.resetFields();
        fetchAdPurchaseSlots();
      },
    });
  };

  // Cập nhật ad media
  const handleUpdateMedia = async (values) => {
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

    await updateAdMedia(selectedAdMediaId, mediaData, {
      onSuccess: () => {
        setIsUpdateModalVisible(false);
        resetUpload();
        updateForm.resetFields();
        fetchAdPurchaseSlots();
      },
    });
  };

  // Xử lý nhập URL trực tiếp
  const handleDirectUrlSubmit = (values) => {
    const result = setManualVideoUrl(values.videoUrl);
    if (result) {
      form.setFieldsValue({ video: result });
      updateForm.setFieldsValue({ video: result });
    }
  };

  const fetchDetailData = async (id) => {
    if (!id) return;

    try {
      setDetailLoadingMap((prev) => ({ ...prev, [id]: true }));
      const data = await fetchSlotDetails(id);
      if (data) {
        setDetailDataMap((prev) => ({ ...prev, [id]: data }));
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setDetailLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const columns = [
    {
      title: "Ad Slot Details",
      key: "details",
      render: (_, record) => {
        const renderActionButton = () => {
          // Nếu đã có ad media thì hiển thị View Ad
          if (record?.adMedias?.length > 0) {
            return (
              <Button
                type="link"
                className="flex items-center p-0 m-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewAdMediaDetails(record.adMedias[0].id);
                }}
                icon={<FileImageOutlined />}
              >
                <span>View Ad</span>
              </Button>
            );
          }

          // Kiểm tra trạng thái record trước khi kiểm tra canCreateAd
          // Đảm bảo chỉ hiển thị nút Create Ad cho slot có trạng thái ACTIVE
          if (record?.status === "ACTIVE" && canCreateAd(record)) {
            return (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateAdClick(record);
                }}
                size="small"
              >
                Create Ad
              </Button>
            );
          }

          return null;
        };

        // Sử dụng slotDetail
        const slotDetail = slotDetails[record?.id];
        const viewCount = slotDetail?.adMedias?.[0]?.id
          ? adMediaCounts[slotDetail.adMedias[0].id] || 0
          : 0;

        return (
          <div className="w-full">
            <Collapse
              defaultActiveKey={[]}
              onChange={() => {
                if (record?.id && !detailDataMap[record.id]) {
                  fetchDetailData(record.id);
                }
              }}
            >
              {/* Package & Basic Info */}
              <Panel
                key="1"
                header={
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <FileTextOutlined className="text-[#FF009F]" />
                      <div>
                        <div className="font-medium">
                          {slotDetail?.adPackage?.packageName || "N/A"}
                        </div>
                        <div className="text-gray-500 text-sm">
                          Price:{" "}
                          {formatCurrency(
                            slotDetail?.adPackage?.packPrice || 0
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {((slotDetail?.adMedias || record?.adMedias)?.length ||
                        0) > 0 && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <EyeOutlined />
                          <span>{viewCount} views</span>
                        </div>
                      )}
                      <div
                        className={`status-badge status-${(
                          record?.status || "pending"
                        ).toLowerCase()}`}
                      >
                        <span className="status-icon">
                          {getIconForStatus(record?.status || "pending")}
                        </span>
                        <span className="status-text">
                          {record?.status || "Pending"}
                        </span>
                      </div>
                      {renderActionButton()}
                    </div>
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div>
                    <Collapse defaultActiveKey={[]} className="mb-4">
                      {/* Package Information */}
                      <Panel
                        key="1"
                        header={
                          <div className="flex items-center">
                            <FileTextOutlined className="mr-2 text-[#FF009F]" />
                            <span className="font-medium">
                              Package Information
                            </span>
                          </div>
                        }
                      >
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Package Name">
                            <Text strong>
                              {slotDetail?.adPackage?.packageName}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Package Price">
                            {formatCurrency(slotDetail?.adPackage?.packPrice)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Duration">
                            {slotDetail?.adPackage?.duration} month
                          </Descriptions.Item>
                          <Descriptions.Item label="Package Status">
                            <Tag
                              color={getTagColorForStatus(
                                slotDetail?.adPackage?.status
                              )}
                            >
                              {slotDetail?.adPackage?.status}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Panel>

                      {/* Slot Details */}
                      <Panel
                        key="2"
                        header={
                          <div className="flex items-center">
                            <AppstoreOutlined className="mr-2 text-blue-500" />
                            <span className="font-medium">Slot Details</span>
                          </div>
                        }
                      >
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Purchase Price">
                            {formatCurrency(slotDetail?.purchaseSlotPrice)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Slot Time Price">
                            {formatCurrency(
                              slotDetail?.adSlotTime?.slotTimePrice
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="Slot Location">
                            <Tag color="blue">
                              {slotDetail?.adSlotTime?.adSlot?.slotLocation}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Slot Price">
                            {formatCurrency(
                              slotDetail?.adSlotTime?.adSlot?.slotPrice
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="Slot Status">
                            <Tag
                              color={getTagColorForStatus(
                                slotDetail?.adSlotTime?.adSlot?.status
                              )}
                            >
                              {slotDetail?.adSlotTime?.adSlot?.status}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Panel>
                    </Collapse>
                  </div>

                  {/* Right Column */}
                  <div>
                    <Collapse defaultActiveKey={[]} className="mb-4">
                      {/* Time Information */}
                      <Panel
                        key="1"
                        header={
                          <div className="flex items-center">
                            <ClockCircleOutlined className="mr-2 text-green-500" />
                            <span className="font-medium">
                              Time Information
                            </span>
                          </div>
                        }
                      >
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Time Range">
                            {slotDetail?.adSlotTime?.adSlotTimeRange?.startTime}{" "}
                            - {slotDetail?.adSlotTime?.adSlotTimeRange?.endTime}
                          </Descriptions.Item>
                          <Descriptions.Item label="Start Date">
                            {formatDate(slotDetail?.startDate)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Expired Date">
                            {formatDate(slotDetail?.expiredDate)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Created At">
                            {formatDate(slotDetail?.createAt)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Time Range Price">
                            {formatCurrency(
                              slotDetail?.adSlotTime?.adSlotTimeRange
                                ?.slotTimeRangePrice
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="Time Range Status">
                            <Tag
                              color={getTagColorForStatus(
                                slotDetail?.adSlotTime?.adSlotTimeRange?.status
                              )}
                            >
                              {slotDetail?.adSlotTime?.adSlotTimeRange?.status}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Panel>

                      {/* Ad Media Preview if exists */}
                      {slotDetail?.adMedias?.length > 0 && (
                        <Panel
                          key="2"
                          header={
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <FileImageOutlined className="mr-2 text-purple-500" />
                                <span className="font-medium">Ad Media</span>
                              </div>
                              <div
                                className={`status-badge status-${slotDetail.adMedias[0].status.toLowerCase()}`}
                              >
                                {slotDetail.adMedias[0].status}
                              </div>
                            </div>
                          }
                        >
                          <div className="space-y-4">
                            {slotDetail.adMedias[0].image && (
                              <div>
                                <img
                                  src={slotDetail.adMedias[0].image}
                                  alt="Ad Media"
                                  className="max-w-full h-auto rounded-lg border border-gray-200"
                                  style={{ maxHeight: "150px" }}
                                />
                              </div>
                            )}
                            {slotDetail.adMedias[0].content && (
                              <div className="p-3 bg-white rounded-lg border border-gray-200">
                                {slotDetail.adMedias[0].content}
                              </div>
                            )}
                            {slotDetail.adMedias[0].reasonForRejection && (
                              <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                {slotDetail.adMedias[0].reasonForRejection}
                              </div>
                            )}
                            {slotDetail.adMedias[0].status === "REJECTED" && (
                              <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateAdMedia(
                                    slotDetail.adMedias[0].id
                                  );
                                }}
                              >
                                Update Ad Media
                              </Button>
                            )}
                          </div>
                        </Panel>
                      )}
                    </Collapse>
                  </div>
                </div>
              </Panel>
            </Collapse>
          </div>
        );
      },
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return format(date, "MMM dd, yyyy HH:mm");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
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
              rowKey={(record) => record?.id || Math.random().toString()}
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
                showTotal: (total) => `Total ${total} items`,
                onChange: handlePaginationChange,
                onShowSizeChange: handleShowSizeChange,
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
              resetUpload();
              form.resetFields();
              setActiveTab("form");
            }}
            footer={null}
            width={1020}
            style={{
              top: 20,
            }}
            bodyStyle={{
              padding: 24,
            }}
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Form" key="form">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleCreateMedia}
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
                        customRequest={handleImageUpload}
                        showUploadList={false}
                        maxCount={1}
                        accept="image/*"
                      >
                        <Button icon={<UploadOutlined />} className="mr-2">
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
                          <Button icon={<UploadOutlined />} className="mr-2">
                            Upload Video
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
                        />
                      </Input.Group>
                      <div className="mt-1 text-xs text-gray-500">
                        (Video will be uploaded to Cloudinary. Supports MP4,
                        WebM, Ogg. Maximum 100MB)
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
                          }}
                        >
                          <source src={videoUrl} type="video/mp4" />
                          <source src={videoUrl} type="video/webm" />
                          <source src={videoUrl} type="video/ogg" />
                          <source src={videoUrl} type="video/quicktime" />
                          Your browser does not support HTML video.
                        </video>
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
                          setIsModalVisible(false);
                          resetUpload();
                          form.resetFields();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="primary" htmlType="submit">
                        Create Ad Media
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="Preview" key="preview">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <Tag color="#FF009F">
                        {currentSlotLocation || "Unknown"} POSITION
                      </Tag>
                      <span className="text-gray-500 ml-2 text-sm">
                        Xem trước quảng cáo trên Watch Page
                      </span>
                    </div>
                  </div>

                  <div
                    className="h-[500px]"
                    style={{
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "8px",
                      width: "100%",
                      aspectRatio: "16/9",
                      maxHeight: "500px",
                    }}
                  >
                    <WatchPagePreview
                      slotLocation={currentSlotLocation || "CENTER"}
                      image={imageUrl}
                      video={videoUrl}
                      content={form.getFieldValue("content")}
                      url={form.getFieldValue("url")}
                    />
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <Button onClick={() => setActiveTab("form")}>
                      Quay lại form
                    </Button>
                    <Button type="primary" onClick={() => form.submit()}>
                      Tạo quảng cáo
                    </Button>
                  </div>
                </div>
              </TabPane>
            </Tabs>
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

          {/* Ad Media Details Modal */}
          <Modal
            title={
              <div className="flex items-center space-x-2">
                <FileTextOutlined />
                <span>Ad Media Details</span>
              </div>
            }
            open={isAdMediaDetailModalVisible}
            onCancel={() => setIsAdMediaDetailModalVisible(false)}
            footer={null}
            width={720}
            centered
          >
            {selectedAdMediaDetail && (
              <div className="space-y-4">
                {/* Top row - Image and basic info */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Left: Image/Video */}
                  <div className="col-span-2">
                    {/* Image display */}
                    {selectedAdMediaDetail.image &&
                      selectedAdMediaDetail.image !== "string" && (
                        <div className="rounded border border-gray-200 overflow-hidden">
                          <img
                            src={selectedAdMediaDetail.image}
                            alt="Ad Media"
                            className="w-full object-contain"
                            style={{ maxHeight: "280px" }}
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
                        <div className="rounded border border-gray-200 overflow-hidden">
                          <video
                            controls
                            className="w-full object-contain"
                            style={{ maxHeight: "280px" }}
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
                        </div>
                      )}
                  </div>

                  {/* Right: Basic info */}
                  <div className="col-span-1">
                    <Descriptions
                      column={1}
                      size="small"
                      bordered
                      className="h-full"
                      layout="vertical"
                    >
                      <Descriptions.Item label="Status">
                        <Tag
                          color={getTagColorForStatus(
                            selectedAdMediaDetail.status
                          )}
                        >
                          {selectedAdMediaDetail.status}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="View Count">
                        <div className="flex items-center gap-1">
                          <EyeOutlined />
                          <span className="font-medium">
                            {adMediaCounts[selectedAdMediaDetail.id] || 0}
                          </span>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {formatDate(selectedAdMediaDetail.createAt)}
                      </Descriptions.Item>
                      {selectedAdMediaDetail.url && (
                        <Descriptions.Item label="URL">
                          <a
                            href={selectedAdMediaDetail.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {selectedAdMediaDetail.url.length > 25
                              ? selectedAdMediaDetail.url.substring(0, 22) +
                                "..."
                              : selectedAdMediaDetail.url}
                          </a>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left column: Content */}
                  <div>
                    {/* Content section */}
                    <div className="mb-3">
                      <div className="font-medium mb-1">Content</div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm min-h-[100px]">
                        {selectedAdMediaDetail.content || "No content provided"}
                      </div>
                    </div>

                    {/* Rejection reason if applicable */}
                    {selectedAdMediaDetail.reasonForRejection && (
                      <div>
                        <div className="font-medium mb-1 text-red-500">
                          Rejection Reason
                        </div>
                        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                          {selectedAdMediaDetail.reasonForRejection}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right column: View Statistics */}
                  <div>
                    {/* View Statistics by Date */}
                    <div>
                      <div className="font-medium mb-1">View Statistics</div>
                      <div className="bg-gray-50 rounded border border-gray-200 p-2 max-h-[180px] overflow-auto">
                        {viewStatistics[selectedAdMediaDetail.id] &&
                        viewStatistics[selectedAdMediaDetail.id].length > 0 ? (
                          <Table
                            dataSource={
                              viewStatistics[selectedAdMediaDetail.id]
                            }
                            pagination={false}
                            size="small"
                            bordered
                          >
                            <Table.Column
                              title="Date"
                              dataIndex="viewDate"
                              key="viewDate"
                              render={(date) => (
                                <span>
                                  {new Date(date).toLocaleDateString()}
                                </span>
                              )}
                            />
                            <Table.Column
                              title="Views"
                              dataIndex="totalViews"
                              key="totalViews"
                              render={(views) => (
                                <Tag color="blue">{views}</Tag>
                              )}
                            />
                          </Table>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No view statistics available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* Update Ad Media Modal */}
          <Modal
            title="Update Ad Media"
            open={isUpdateModalVisible}
            onCancel={() => {
              setIsUpdateModalVisible(false);
              resetUpload();
              updateForm.resetFields();
              setActiveTab("form");
            }}
            footer={null}
            width={1020}
            style={{
              top: 20,
            }}
            bodyStyle={{
              padding: 24,
            }}
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Form" key="form">
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
                        customRequest={handleImageUpload}
                        showUploadList={false}
                        maxCount={1}
                        accept="image/*"
                      >
                        <Button icon={<UploadOutlined />} className="mr-2">
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
                          <Button icon={<UploadOutlined />} className="mr-2">
                            Upload Video
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
                            updateForm.setFieldsValue({
                              video: e.target.value,
                            });
                            setVideoUrl(e.target.value);
                          }}
                        />
                      </Input.Group>
                      <div className="mt-1 text-xs text-gray-500">
                        (Video will be uploaded to Cloudinary. Supports MP4,
                        WebM, Ogg. Maximum 100MB)
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
                          }}
                        >
                          <source src={videoUrl} type="video/mp4" />
                          <source src={videoUrl} type="video/webm" />
                          <source src={videoUrl} type="video/ogg" />
                          <source src={videoUrl} type="video/quicktime" />
                          Your browser does not support HTML video.
                        </video>
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
                          setIsUpdateModalVisible(false);
                          resetUpload();
                          updateForm.resetFields();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="primary" htmlType="submit">
                        Update Ad Media
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="Preview" key="preview">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <Tag color="#FF009F">
                        {currentSlotLocation || "Unknown"} POSITION
                      </Tag>
                      <span className="text-gray-500 ml-2 text-sm">
                        Xem trước quảng cáo trên Watch Page
                      </span>
                    </div>
                  </div>

                  <div
                    className="h-[500px]"
                    style={{
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "8px",
                      width: "100%",
                      aspectRatio: "16/9",
                      maxHeight: "500px",
                    }}
                  >
                    <WatchPagePreview
                      slotLocation={currentSlotLocation || "CENTER"}
                      image={imageUrl}
                      video={videoUrl}
                      content={updateForm.getFieldValue("content")}
                      url={updateForm.getFieldValue("url")}
                    />
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <Button onClick={() => setActiveTab("form")}>
                      Quay lại form
                    </Button>
                    <Button type="primary" onClick={() => updateForm.submit()}>
                      Cập nhật quảng cáo
                    </Button>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Modal>
        </div>
      </ConfigProvider>
    </>
  );
};

export default AdPurchaseSlotManagement;
