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
} from "antd";
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
} from "@ant-design/icons";
import adPurchaseItemService from "../../../apis/AdPurchaseItem/adPurchaseItem";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PaymentHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adsData, setAdsData] = useState([]);

  const fetchAdsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adPurchaseItemService.getAdPurchaseItemsByLogin();

      if (response.success) {
        // Log the data to see what we're getting
        console.log("Ad purchase items data:", response.data);

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
    fetchAdsData();
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
                  fallback="data:image/png;base64,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"
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
      title: "Expiry Date",
      dataIndex: "expiredDate",
      key: "expiredDate",
      render: (text) => formatDate(text),
      width: "15%",
      sorter: (a, b) => new Date(a.expiredDate) - new Date(b.expiredDate),
    },
  ];

  return (
    <div className="ads-management-page p-6">
      <Helmet>
        <title>Payment History | EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">
          <FileTextOutlined className="mr-2" /> Payment History
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
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            showTotal: (total) => `Total ${total} items`,
          }}
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

export default PaymentHistory;
