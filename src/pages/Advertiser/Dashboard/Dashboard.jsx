import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Spin,
  Empty,
  Tag,
  Tooltip,
  Button,
  message,
  Alert,
  Typography,
  Progress,
} from "antd";
import { Helmet } from "react-helmet";
import {
  PlayCircleOutlined,
  EyeOutlined,
  DollarCircleOutlined,
  RiseOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { useNavigate } from "react-router-dom";
// import adPurchaseSlotService from "../../../apis/AdPurchaseSlot/adPurchaseSlot"; // Đã hợp nhất vào adPurchaseService
import adMediaCountService from "../../../apis/AdMedia/adMediaCount";
import adMediaByLoginService from "../../../apis/AdMedia/adMediaByLogin";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// Register required ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const BATCH_SIZE = 10; // Number of media stats to fetch in parallel

const AdvertiserDashboard = () => {
  const [loading, setLoading] = useState({
    media: true,
    ads: true,
    stats: true,
    payments: true,
  });
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [cachedData, setCachedData] = useState(null);

  // Media statistics
  const [mediaData, setMediaData] = useState([]);
  const [pendingMediaCount, setPendingMediaCount] = useState(0);
  const [activeMediaCount, setActiveMediaCount] = useState(0);
  const [rejectedMediaCount, setRejectedMediaCount] = useState(0);
  const [totalMediaCount, setTotalMediaCount] = useState(0);

  // Ads statistics
  const [adsData, setAdsData] = useState([]);
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [expiredAdsCount, setExpiredAdsCount] = useState(0);
  const [pendingAdsCount, setPendingAdsCount] = useState(0);
  const [totalViewsCount, setTotalViewsCount] = useState(0);

  // Financial data
  const [recentPayments, setRecentPayments] = useState([]);

  // Chart data
  const [mediaStatusChartData, setMediaStatusChartData] = useState(null);
  const [spendingChartData, setSpendingChartData] = useState(null);

  const navigate = useNavigate();

  // Check if cached data should be used
  const shouldUseCachedData = useCallback(() => {
    if (!lastFetchTime || !cachedData) return false;
    return Date.now() - lastFetchTime < CACHE_DURATION;
  }, [lastFetchTime, cachedData]);

  // Fetch media views statistics in batches
  const fetchMediaViewsStats = async (mediaIds) => {
    const stats = {};
    let totalViewCount = 0;

    try {
      // Process in batches for better performance
      for (let i = 0; i < mediaIds.length; i += BATCH_SIZE) {
        const batch = mediaIds.slice(i, i + BATCH_SIZE);
        const promises = batch.map((id) =>
          adMediaCountService
            .getStatisticAdMediaCount(id)
            .then((response) => ({ id, data: response?.result?.data || [] }))
            .catch((error) => ({ id, error }))
        );

        const results = await Promise.all(promises);

        results.forEach(({ id, data, error }) => {
          if (error) {
            console.error(`Error fetching stats for ${id}:`, error);
            stats[id] = [];
          } else {
            stats[id] = data;
            const viewCount = data.reduce(
              (acc, stat) => acc + stat.totalViews,
              0
            );
            totalViewCount += viewCount;
          }
        });
      }

      return { stats, totalViewCount };
    } catch (error) {
      console.error("Error fetching media views stats:", error);
      throw error;
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    // Clear any existing error state
    setError(null);

    setLoading({
      media: true,
      ads: true,
      stats: true,
      payments: true,
    });

    try {
      // Fetch media and ads data in parallel
      const [mediaResponse, adsResponse] = await Promise.all([
        adMediaByLoginService.getAdMediaByLogin(1, 1000),
        adPurchaseService.getAdPurchaseItemsByLogin(),
      ]);

      // Process media data
      if (mediaResponse?.success) {
        console.log("Media data:", mediaResponse.data);
        const media = mediaResponse.data || [];
        setMediaData(media);

        // Update media statistics
        const pending = media.filter(
          (item) => item.status === "PENDING"
        ).length;
        const active = media.filter((item) => item.status === "ACTIVE").length;
        const rejected = media.filter(
          (item) => item.status === "REJECTED"
        ).length;

        setPendingMediaCount(pending);
        setActiveMediaCount(active);
        setRejectedMediaCount(rejected);
        setTotalMediaCount(media.length);

        // Prepare media status chart data
        prepareMediaStatusChartData(media);

        setLoading((prev) => ({ ...prev, media: false }));
      } else {
        console.error("Failed to fetch media data:", mediaResponse);
        setError("Failed to fetch media data");
        setLoading((prev) => ({ ...prev, media: false }));
      }

      // Process ads data
      if (adsResponse?.success) {
        console.log("Ads data:", adsResponse.data);
        const ads = adsResponse.data || [];
        setAdsData(ads);

        // Update ads statistics
        const active = ads.filter((item) => item.status === "ACTIVE").length;
        const expired = ads.filter((item) => item.status === "EXPIRED").length;
        const pending = ads.filter((item) => item.status === "PENDING").length;

        setActiveAdsCount(active);
        setExpiredAdsCount(expired);
        setPendingAdsCount(pending);

        // Calculate total views used
        const totalUsedViews = ads.reduce((sum, ad) => {
          const used = ad.viewQuantity - (ad.remainingViews || 0);
          return sum + used;
        }, 0);

        setTotalViewsCount(totalUsedViews);

        // No longer calculating total spent

        // Create recent payments data from ads
        const recentAds = [...ads]
          .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
          .slice(0, 5);

        setRecentPayments(recentAds);

        // Generate spending chart data
        generateSpendingChartData(ads);

        setLoading((prev) => ({
          ...prev,
          ads: false,
          stats: false,
          payments: false,
        }));
      } else {
        console.error("Failed to fetch ads data:", adsResponse);
        setError((prev) => prev || "Failed to fetch ads data");
        setLoading((prev) => ({
          ...prev,
          ads: false,
          stats: false,
          payments: false,
        }));
      }

      // Cache the fetched data
      setCachedData({
        mediaData: mediaResponse?.success ? mediaResponse.data : [],
        adsData: adsResponse?.success ? adsResponse.data : [],
        totalViews: totalViewsCount,
      });

      setLastFetchTime(Date.now());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
      setLoading({
        media: false,
        ads: false,
        stats: false,
        payments: false,
      });
    }
  };

  // Generate spending chart data from ads
  const generateSpendingChartData = (adsData) => {
    if (!adsData || adsData.length === 0) return;

    // Group by month
    const monthlySpending = {};

    // Ensure we have data for the last 6 months
    const today = dayjs();
    for (let i = 5; i >= 0; i--) {
      const month = today.subtract(i, "month").format("YYYY-MM");
      monthlySpending[month] = 0;
    }

    // Add actual data
    adsData.forEach((ad) => {
      const month = dayjs(ad.createdDate).format("YYYY-MM");
      if (monthlySpending[month] !== undefined) {
        monthlySpending[month] += ad.price;
      }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlySpending).sort();

    const chartData = {
      labels: sortedMonths.map((month) => dayjs(month).format("MMM YYYY")),
      datasets: [
        {
          label: "Spending (VND)",
          data: sortedMonths.map((month) => monthlySpending[month]),
          backgroundColor: "rgba(82, 196, 26, 0.6)",
          borderColor: "rgba(82, 196, 26, 1)",
          borderWidth: 1,
        },
      ],
    };

    setSpendingChartData(chartData);
  };

  // Update media status chart data function
  const prepareMediaStatusChartData = (data) => {
    if (!data || data.length === 0) return;

    const statusCounts = {
      ACTIVE: 0,
      PENDING: 0,
      REJECTED: 0,
    };

    // Count media by status
    data.forEach((item) => {
      const status = item.status?.toUpperCase() || "UNKNOWN";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    const chartData = {
      labels: ["Active", "Pending", "Rejected"],
      datasets: [
        {
          data: [
            statusCounts.ACTIVE,
            statusCounts.PENDING,
            statusCounts.REJECTED,
          ],
          backgroundColor: ["#52c41a", "#faad14", "#f5222d"],
          borderColor: ["#52c41a", "#faad14", "#f5222d"],
          borderWidth: 1,
        },
      ],
    };

    setMediaStatusChartData(chartData);
  };

  // Refresh dashboard data
  const handleRefresh = () => {
    setCachedData(null);
    setLastFetchTime(null);
    fetchDashboardData();
    message.info("Dashboard data refreshed");
  };

  // Format currency to VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  // Get status tag with appropriate color
  const getStatusTag = (status) => {
    let color, icon;

    switch (status?.toUpperCase()) {
      case "ACTIVE":
        color = "success";
        icon = <CheckCircleOutlined />;
        break;
      case "EXPIRED":
        color = "error";
        icon = <CloseCircleOutlined />;
        break;
      case "PENDING":
        color = "warning";
        icon = <ClockCircleOutlined />;
        break;
      case "REJECTED":
        color = "error";
        icon = <CloseCircleOutlined />;
        break;
      default:
        color = "default";
        icon = <ClockCircleOutlined />;
    }

    return (
      <Tag icon={icon} color={color}>
        {status}
      </Tag>
    );
  };

  // Calculate spending by status
  const calculateTotalByStatus = () => {
    if (!recentPayments || recentPayments.length === 0) return {};

    return recentPayments.reduce((acc, payment) => {
      const status = payment.status || "UNKNOWN";
      if (!acc[status]) acc[status] = 0;
      acc[status] += payment.totalPrice;
      return acc;
    }, {});
  };

  // Calculate usage percentage
  const calculateUsagePercentage = (used, total) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  // Navigate to media management
  const navigateToMediaManagement = () => {
    navigate("/advertiser/media-management");
  };

  // Navigate to ads management
  const navigateToAdsManagement = () => {
    navigate("/advertiser/ads-management");
  };

  // Recent payments columns configuration
  const paymentColumns = [
    {
      title: "Package",
      dataIndex: "adPackageName",
      key: "adPackageName",
      render: (text) => <Tag color="blue">{text || "N/A"}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "price",
      key: "price",
      render: (amount) => formatVND(amount || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Date",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date) => formatDate(date),
    },
  ];

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="advertiser-dashboard p-6">
      <Helmet>
        <title>Dashboard | EIGAKAN</title>
      </Helmet>

      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="mb-0">
          Advertiser Dashboard
        </Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={
            loading.media || loading.ads || loading.stats || loading.payments
          }
        >
          Refresh
        </Button>
      </div>

      {/* Error message if any */}
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

      {/* Key metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8} md={8}>
          <Card loading={loading.media}>
            <Statistic
              title="Total Media"
              value={totalMediaCount}
              prefix={<PictureOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <div className="mt-2">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Active: {activeMediaCount}</span>
                <span>Pending: {pendingMediaCount}</span>
                <span>Rejected: {rejectedMediaCount}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card loading={loading.ads}>
            <Statistic
              title="Active Ads"
              value={activeAdsCount}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div className="mt-2">
              <Button
                type="link"
                size="small"
                className="p-0"
                onClick={navigateToAdsManagement}
              >
                View all ads <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <Card loading={loading.stats}>
            <Statistic
              title="Total Views"
              value={totalViewsCount}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <div className="mt-2 text-xs text-gray-500">
              Across all your ad media
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts and analytics */}

      {/* Media and Payments */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center">
                <PictureOutlined className="mr-2" />
                <span>Media Status Distribution</span>
              </div>
            }
            extra={
              <Button
                type="link"
                onClick={navigateToMediaManagement}
                icon={<ArrowRightOutlined />}
              >
                View all
              </Button>
            }
            loading={loading.media}
          >
            {mediaStatusChartData ? (
              <div style={{ height: "300px" }} className="flex justify-center">
                <div style={{ width: "300px" }}>
                  <Doughnut
                    data={mediaStatusChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || "";
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce(
                                (a, b) => a + b,
                                0
                              );
                              const percentage = Math.round(
                                (value / total) * 100
                              );
                              return `${label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <Empty description="No media status data available" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center">
                <CalendarOutlined className="mr-2" />
                <span>Recent Payments</span>
              </div>
            }
            loading={loading.payments}
          >
            {recentPayments && recentPayments.length > 0 ? (
              <Table
                dataSource={recentPayments}
                columns={paymentColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No recent payment data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdvertiserDashboard;
