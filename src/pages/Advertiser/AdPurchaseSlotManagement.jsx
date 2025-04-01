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
  const [isAdMediaDetailModalVisible, setIsAdMediaDetailModalVisible] =
    useState(false);
  const [selectedAdMediaDetail, setSelectedAdMediaDetail] = useState(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [updateForm] = Form.useForm();
  const [selectedAdMediaId, setSelectedAdMediaId] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [totalSlots, setTotalSlots] = useState(0);

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

  const handleCreateAdClick = (slotId) => {
    setSelectedSlotId(slotId);
    setIsModalVisible(true);
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

      setLoading(true);
      const response = await adMediaService.createAdMedia({
        ...values,
        adPurchaseSlotId: selectedSlotId,
      });

      if (response.success) {
        notification.success({
          message: "Success",
          description: "Ad media created successfully",
        });
        setIsModalVisible(false);
        setImageUrl("");
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
        setSelectedAdMediaDetail(response.data);
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
        updateForm.setFieldsValue({
          content: adMedia.content,
          image: adMedia.image,
          video: adMedia.video,
          url: adMedia.url,
        });
        setImageUrl(adMedia.image);
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

      setLoading(true);
      const response = await adMediaService.updateAdMedia(
        selectedAdMediaId,
        values
      );

      if (response.success) {
        notification.success({
          message: "Success",
          description: "Ad media updated successfully",
        });
        setIsUpdateModalVisible(false);
        setImageUrl("");
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

              {/* Hiển thị preview ảnh nếu có */}
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

              <Form.Item name="video" label="Video URL">
                <Input
                  prefix={
                    <VideoCameraOutlined className="site-form-item-icon" />
                  }
                  placeholder="https://example.com/video.mp4"
                />
              </Form.Item>

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
                      if (isUploading) {
                        notification.warning({
                          message: "Please wait",
                          description: "Image is still uploading...",
                        });
                        return;
                      }
                      setIsModalVisible(false);
                      setImageUrl("");
                      form.resetFields();
                    }}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading || isUploading}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Create Ad Media"}
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

                    {/* Video URL section if available */}
                    {selectedAdMediaDetail.video && (
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

              {/* Preview image if available */}
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

              <Form.Item name="video" label="Video URL">
                <Input
                  prefix={
                    <VideoCameraOutlined className="site-form-item-icon" />
                  }
                  placeholder="https://example.com/video.mp4"
                />
              </Form.Item>

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
                      if (isUploading) {
                        notification.warning({
                          message: "Please wait",
                          description: "Image is still uploading...",
                        });
                        return;
                      }
                      setIsUpdateModalVisible(false);
                      setImageUrl("");
                      updateForm.resetFields();
                    }}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading || isUploading}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Update Ad Media"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </ConfigProvider>
    </>
  );
};

export default AdPurchaseSlotManagement;
