import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Spin,
  Alert,
  Typography,
  Button,
  Tooltip,
  Badge,
  Image,
  Progress,
  Empty,
  Modal,
  Space,
} from "antd";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const AdPurchaseItems = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adsData, setAdsData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchAdsData = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adPurchaseService.getAdPurchaseItemsByLogin(
        page,
        pageSize
      );

      if (response.success) {
        // Log the data to see what we're getting
        console.log("Ad purchase items data:", response);

        // Process the data to ensure video URLs are correctly identified
        const processedData = (response.data || []).map((item) => {
          // Force video detection for URLs containing video/upload
          if (item.adMediaUrl && item.adMediaUrl.includes("/video/upload/")) {
            console.log(`Found video URL: ${item.adMediaUrl}`);
            // Add a flag to force video rendering
            return { ...item, _isVideo: true };
          }
          return item;
        });

        setAdsData(processedData);
        setPagination({
          ...pagination,
          current: page,
          total: response.total || 0,
        });
      } else {
        setError(response.message || "Failed to load ads data");
      }
    } catch (err) {
      console.error("Error fetching ads data:", err);
      setError(err.message || "Failed to load ads data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdsData();
  }, []);

  const handleRefresh = () => {
    fetchAdsData(1, pagination.pageSize);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    fetchAdsData(pagination.current, pagination.pageSize);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "EXPIRED":
        return "error";
      case "PENDING":
        return "warning";
      case "INACTIVE":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return <CheckCircleOutlined />;
      case "EXPIRED":
        return <CloseCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY");
  };

  const calculateUsagePercentage = (used, total) => {
    if (!total) return 0;
    const usedViews = total - used;
    return Math.round((usedViews / total) * 100);
  };

  // Function to check if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;

    // Check common video file extensions
    const hasVideoExtension =
      url.toLowerCase().endsWith(".mp4") ||
      url.toLowerCase().endsWith(".mov") ||
      url.toLowerCase().endsWith(".webm") ||
      url.toLowerCase().endsWith(".ogg");

    // Check Cloudinary video URLs (they contain /video/upload/ in the path)
    const isCloudinaryVideo = url.toLowerCase().includes("/video/upload/");

    // Check for other video keywords in the URL
    const hasVideoKeyword = url.toLowerCase().includes("video");

    // Log for debugging
    console.log("URL check:", url, {
      hasVideoExtension,
      isCloudinaryVideo,
      hasVideoKeyword,
    });

    return hasVideoExtension || isCloudinaryVideo || hasVideoKeyword;
  };

  const handleViewDetails = (id) => {
    navigate(`/advertiser/ad-purchase-item/${id}?from=transactions`);
  };

  const columns = [
    {
      title: "Media",
      dataIndex: "adMediaUrl",
      key: "adMediaUrl",
      render: (url, record) => {
        if (!url) {
          return (
            <div className="flex justify-center">
              <Tag icon={<PictureOutlined />} color="default">
                No Media
              </Tag>
            </div>
          );
        }

        // Use the _isVideo flag if available, otherwise use the isVideoUrl function
        const isVideo = record._isVideo || isVideoUrl(url);
        console.log(`Rendering media: ${url}, isVideo: ${isVideo}`);

        return (
          <div className="flex flex-col items-center">
            {isVideo ? (
              <div className="relative group">
                <div className="w-[120px] h-[68px] bg-black rounded overflow-hidden">
                  <video
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    crossOrigin="anonymous" // Add crossOrigin for Cloudinary URLs
                    onLoadedData={(e) => {
                      // Capture the first frame as thumbnail
                      try {
                        e.target.currentTime = 0.5; // Set to 0.5 seconds to avoid black frame
                      } catch (err) {
                        console.error("Error setting video time:", err);
                      }
                    }}
                    onError={(e) => {
                      console.error("Video loading error:", e.target.error);
                    }}
                  >
                    <source
                      src={url}
                      type="video/mp4"
                      crossOrigin="anonymous"
                    />
                    Your browser does not support the video tag.
                  </video>
                  {/* Video overlay with conditional content */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <VideoCameraOutlined className="text-white text-2xl" />
                      <span className="text-white text-xs mt-1">Video</span>
                    </div>
                  </div>
                </div>
                <button
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 rounded"
                  onClick={() => {
                    Modal.info({
                      title: "Video Preview",
                      width: 640,
                      closable: true,
                      maskClosable: true,
                      centered: true,
                      footer: null,
                      content: (
                        <div className="flex flex-col items-center">
                          <video
                            controls
                            autoPlay
                            className="w-full max-h-[70vh] rounded"
                            crossOrigin="anonymous" // Add crossOrigin for Cloudinary URLs
                          >
                            <source
                              src={url}
                              type="video/mp4"
                              crossOrigin="anonymous"
                            />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ),
                    });
                  }}
                  aria-label="Preview video"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.target.click();
                    }
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PlayCircleOutlined className="text-white text-3xl" />
                  </div>
                </button>
                <div className="text-xs mt-1 text-center text-gray-500">
                  Click to play
                </div>
              </div>
            ) : (
              <div className="relative group">
                <Image
                  src={url}
                  alt="Ad Media"
                  width={120}
                  height={68}
                  className="object-cover rounded"
                  fallback="/images/image-placeholder.png"
                />
              </div>
            )}
          </div>
        );
      },
      width: "16%",
    },
    {
      title: "Package",
      dataIndex: "adPackageName",
      key: "adPackageName",
      render: (text) => <Tag color="blue">{text}</Tag>,
      width: "12%",
    },
    {
      title: "Views",
      key: "views",
      render: (_, record) => {
        const usagePercentage = calculateUsagePercentage(
          record.remainingViews,
          record.viewQuantity
        );
        const usedViews = record.viewQuantity - record.remainingViews;

        return (
          <div className="flex flex-col">
            <div className="flex justify-between mb-1">
              <Text className="text-xs font-medium">
                {usedViews}/{record.viewQuantity} views
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Progress
                percent={usagePercentage}
                size="small"
                status={usagePercentage >= 100 ? "exception" : "active"}
                strokeColor={{
                  from: "#108ee9",
                  to: "#87d068",
                }}
                format={() => null} // Hide the built-in percentage text
              />
              <span className="text-xs text-gray-500">{usagePercentage}%</span>
            </div>
          </div>
        );
      },
      width: "18%",
      sorter: (a, b) => {
        const aPercentage = calculateUsagePercentage(
          a.remainingViews,
          a.viewQuantity
        );
        const bPercentage = calculateUsagePercentage(
          b.remainingViews,
          b.viewQuantity
        );
        return aPercentage - bPercentage;
      },
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.price.toLocaleString()}đ</div>
          <div className="text-xs text-gray-500">
            {record.pricePerView}đ/view
          </div>
        </div>
      ),
      width: "12%",
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          icon={getStatusIcon(status)}
          color={getStatusColor(status)}
          className="flex items-center w-fit"
        >
          <span className="ml-1">{status}</span>
        </Tag>
      ),
      width: "12%",
      filters: [
        { text: "Active", value: "ACTIVE" },
        { text: "Expired", value: "EXPIRED" },
        { text: "Pending", value: "PENDING" },
        { text: "Inactive", value: "INACTIVE" },
      ],
      onFilter: (value, record) => record.status.toUpperCase() === value,
    },
    {
      title: "Created Date",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (text) => formatDate(text),
      width: "15%",
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record.id)}
          >
            Details
          </Button>
        </Space>
      ),
      width: "10%",
    },
  ];

  return (
    <div className="ads-management-page p-6">
      <Helmet>
        <title>Ad Purchase Items | EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">
          <FileTextOutlined className="mr-2" /> Ad Purchase Items
        </Title>
        <Button
          onClick={handleRefresh}
          icon={<ReloadOutlined />}
          loading={loading}
          className="bg-white hover:bg-gray-50"
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-6"
          closable
        />
      )}

      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Text className="text-lg font-medium">Your Ad Campaigns</Text>
          <Badge
            status={loading ? "processing" : "success"}
            text={loading ? "Loading..." : "Updated"}
          />
        </div>

        <Table
          dataSource={adsData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No ad campaigns found"
              />
            ),
          }}
          className="ads-table"
        />
      </Card>
    </div>
  );
};

export default AdPurchaseItems;
