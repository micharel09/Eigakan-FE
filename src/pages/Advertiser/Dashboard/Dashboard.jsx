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
} from "antd";
import { Helmet } from "react-helmet";
import {
  PlayCircleOutlined,
  EyeOutlined,
  DollarCircleOutlined,
  RiseOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import adPurchaseSlotService from "../../../apis/AdPurchaseSlot/adPurchaseSlot";
import adMediaCountService from "../../../apis/AdMedia/adMediaCount";

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const BATCH_SIZE = 10; // Number of media stats to fetch in parallel

const AdvertiserDashboard = () => {
  const [loading, setLoading] = useState({
    slots: true,
    stats: true,
    payments: true,
  });
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [cachedData, setCachedData] = useState(null);
  const [adSlots, setAdSlots] = useState([]);
  const [payments, setPayments] = useState([]);
  const [viewStatistics, setViewStatistics] = useState({});
  const [totalViews, setTotalViews] = useState(0);
  const [activeAds, setActiveAds] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [spendingChartData, setSpendingChartData] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [successfulPayments, setSuccessfulPayments] = useState(0);

  const navigate = useNavigate();

  // Kiểm tra xem có nên dùng cache không
  const shouldUseCachedData = useCallback(() => {
    if (!lastFetchTime || !cachedData) return false;
    return Date.now() - lastFetchTime < CACHE_DURATION;
  }, [lastFetchTime, cachedData]);

  // Fetch ad media stats in batches using Promise.all
  const fetchAdMediaStats = async (adMediaIds) => {
    const stats = {};
    let totalViewCount = 0;

    try {
      // Chia thành các batch nhỏ để fetch song song
      for (let i = 0; i < adMediaIds.length; i += BATCH_SIZE) {
        const batch = adMediaIds.slice(i, i + BATCH_SIZE);
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
      console.error("Error fetching ad media stats:", error);
      throw error;
    }
  };

  // Fetch all data with better error handling
  const fetchDashboardData = async () => {
    // Check cache first
    if (shouldUseCachedData()) {
      const {
        slots,
        payments,
        viewStats,
        totalViews: cachedViews,
      } = cachedData;
      setAdSlots(slots);
      setPayments(payments);
      setViewStatistics(viewStats);
      setTotalViews(cachedViews);
      setActiveAds(slots.filter((slot) => slot.status === "ACTIVE").length);
      prepareChartData(Object.values(viewStats).flat());
      prepareSpendingChartData(payments);
      setLoading({ slots: false, stats: false, payments: false });
      return;
    }

    setLoading({ slots: true, stats: true, payments: true });
    setError(null);

    try {
      // Fetch slots and payments in parallel
      const [slotsResponse, paymentsResponse] = await Promise.all([
        adPurchaseSlotService.getAllAdPurchaseSlotsByUserId(),
        adPurchaseSlotService.getAllAdPurchaseTransactions(),
      ]);

      if (!slotsResponse?.success) {
        throw new Error("Failed to fetch ad slots");
      }

      const slots = slotsResponse.data || [];
      setAdSlots(slots);
      setActiveAds(slots.filter((slot) => slot.status === "ACTIVE").length);

      // Get unique adMediaIds
      const adMediaIds = [
        ...new Set(
          slots
            .filter((slot) => slot.adMedias && slot.adMedias.length > 0)
            .map((slot) => slot.adMedias[0].id)
        ),
      ];

      // Fetch stats for all media IDs
      const { stats, totalViewCount } = await fetchAdMediaStats(adMediaIds);
      setViewStatistics(stats);
      setTotalViews(totalViewCount);
      prepareChartData(Object.values(stats).flat());

      if (paymentsResponse?.success) {
        const paymentData = paymentsResponse.data || [];
        setPayments(paymentData);

        const sorted = [...paymentData].sort(
          (a, b) => new Date(b.createAt) - new Date(a.createAt)
        );
        setRecentPayments(sorted.slice(0, 5));

        const total = paymentData
          .filter((payment) => payment.status === "SUCCESS")
          .reduce((sum, payment) => sum + payment.totalPrice, 0);
        setTotalSpent(total);

        const successful = paymentData.filter(
          (payment) => payment.status === "SUCCESS"
        ).length;
        setSuccessfulPayments(successful);

        prepareSpendingChartData(paymentData);
      }

      // Update cache
      setCachedData({
        slots,
        payments: paymentsResponse.data || [],
        viewStats: stats,
        totalViews: totalViewCount,
      });
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
      message.error(
        "Failed to load some dashboard data. Please try again later."
      );
    } finally {
      setLoading({ slots: false, stats: false, payments: false });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Thêm hàm refresh data thủ công
  const handleRefresh = () => {
    setLastFetchTime(null); // Clear cache
    fetchDashboardData();
  };

  // Chuẩn bị dữ liệu cho biểu đồ views
  const prepareChartData = (statistics) => {
    if (!statistics || statistics.length === 0) {
      setChartData(null);
      return;
    }

    // Nhóm dữ liệu theo ngày
    const groupedByDate = {};
    statistics.forEach((stat) => {
      const date = new Date(stat.viewDate).toLocaleDateString();
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date] += stat.totalViews;
    });

    // Sắp xếp ngày theo thứ tự tăng dần
    const sortedDates = Object.keys(groupedByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const data = {
      labels: sortedDates,
      datasets: [
        {
          label: "Ad Views",
          data: sortedDates.map((date) => groupedByDate[date]),
          backgroundColor: "rgba(255, 0, 159, 0.2)",
          borderColor: "rgba(255, 0, 159, 1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };

    setChartData(data);
  };

  // Chuẩn bị dữ liệu cho biểu đồ chi tiêu
  const prepareSpendingChartData = (paymentsData) => {
    if (!paymentsData || paymentsData.length === 0) {
      setSpendingChartData(null);
      return;
    }

    // Nhóm dữ liệu thanh toán theo ngày
    const groupedByDate = {};
    paymentsData
      .filter((payment) => payment.status === "SUCCESS")
      .forEach((payment) => {
        const date = new Date(payment.createAt).toLocaleDateString();
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0;
        }
        groupedByDate[date] += payment.totalPrice;
      });

    // Sắp xếp ngày theo thứ tự tăng dần
    const sortedDates = Object.keys(groupedByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    // Thiết lập dữ liệu cho biểu đồ
    const data = {
      labels: sortedDates,
      datasets: [
        {
          label: "Spending (VND)",
          data: sortedDates.map((date) => groupedByDate[date]),
          backgroundColor: "rgba(24, 144, 255, 0.2)",
          borderColor: "rgba(24, 144, 255, 1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };

    setSpendingChartData(data);
  };

  // Chuẩn bị dữ liệu cho biểu đồ tròn phân bố trạng thái
  const getStatusDistributionData = () => {
    if (!adSlots || adSlots.length === 0) return null;

    const statusCounts = adSlots.reduce((acc, slot) => {
      const status = slot.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            "rgba(82, 196, 26, 0.8)", // ACTIVE - Green
            "rgba(250, 173, 20, 0.8)", // PENDING - Yellow
            "rgba(245, 34, 45, 0.8)", // EXPIRED/REJECTED - Red
            "rgba(24, 144, 255, 0.8)", // Others - Blue
          ],
          borderColor: [
            "rgba(82, 196, 26, 1)",
            "rgba(250, 173, 20, 1)",
            "rgba(245, 34, 45, 1)",
            "rgba(24, 144, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Format VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    })
      .format(amount)
      .replace("₫", "VND");
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return "Invalid date";
    }
  };

  // Lấy tag trạng thái
  const getStatusTag = (status) => {
    const statusConfig = {
      SUCCESS: {
        color: "success",
        text: "Success",
      },
      PENDING: {
        color: "warning",
        text: "Pending",
      },
      FAILED: {
        color: "error",
        text: "Failed",
      },
      EXPIRED: {
        color: "default",
        text: "Expired",
      },
      ACTIVE: {
        color: "success",
        text: "Active",
      },
      REJECTED: {
        color: "error",
        text: "Rejected",
      },
    };

    const normalizedStatus = status?.toUpperCase();
    const config = statusConfig[normalizedStatus] || {
      color: "default",
      text: status || "Unknown",
    };

    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Cột cho bảng Recent Campaigns
  const campaignColumns = [
    {
      title: "Campaign Name",
      dataIndex: "packageName",
      key: "name",
      render: (text, record) => text || record.adPackage?.packageName || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Views",
      dataIndex: "views",
      key: "views",
      render: (_, record) => {
        const adMediaId = record.adMedias?.[0]?.id;
        if (!adMediaId) return 0;

        const stats = viewStatistics[adMediaId] || [];
        return stats.reduce((acc, stat) => acc + stat.totalViews, 0);
      },
    },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      render: (_, record) =>
        formatVND(record.purchaseSlotPrice || record.adPackage?.packPrice || 0),
    },
  ];

  // Cột cho bảng Recent Payments
  const paymentColumns = [
    {
      title: "Date",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => (
        <span className="flex items-center">
          <CalendarOutlined className="mr-1 text-blue-500" />
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (amount) => (
        <span className="font-medium">{formatVND(amount)}</span>
      ),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => (
        <span className="capitalize">{method?.toLowerCase() || "N/A"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
  ];

  return (
    <div className="advertiser-dashboard p-6">
      <Helmet>
        <title>Advertiser Dashboard | EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Advertiser Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            loading={Object.values(loading).some(Boolean)}
            className="bg-white hover:bg-gray-50"
          >
            Refresh Data
          </Button>
          <Button
            type="primary"
            onClick={() => navigate("/advertiser/payment-history")}
            className="bg-[#FF009F] hover:bg-[#d1007f] border-none flex items-center"
          >
            View All Payments <ArrowRightOutlined className="ml-1" />
          </Button>
        </div>
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

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title="Active Ad Slots"
              value={activeAds}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: "#FF009F" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title="Total Ad Views"
              value={totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title="Total Payment Amount"
              value={totalSpent}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title="Successful Transactions"
              value={successfulPayments}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} className="mt-6">
        {/* Biểu đồ thống kê lượt xem theo ngày */}
        <Col xs={24} lg={12}>
          <Card title="Ad View Statistics" className="shadow-sm">
            {loading.stats ? (
              <div className="h-[300px] flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : chartData ? (
              <div className="h-[300px]">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      title: {
                        display: true,
                        text: "Daily Ad Views",
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Views: ${context.parsed.y}`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Views",
                        },
                        ticks: {
                          precision: 0,
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Date",
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <Empty description="No view data available" />
            )}
          </Card>
        </Col>

        {/* Biểu đồ chi tiêu theo thời gian */}
        <Col xs={24} lg={12}>
          <Card title="Transaction History" className="shadow-sm">
            {loading.payments ? (
              <div className="h-[300px] flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : spendingChartData ? (
              <div className="h-[300px]">
                <Line
                  data={spendingChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      title: {
                        display: true,
                        text: "Payment Amount Over Time",
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${formatVND(context.parsed.y)}`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Amount (VND)",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Date",
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <Empty description="No payment data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Second row of charts */}
      <Row gutter={[16, 16]} className="mt-6">
        {/* Top Performing Ads (biểu đồ cột) */}
        <Col xs={24} lg={16}>
          <Card title="Top Ad Slots by Views" className="shadow-sm">
            {loading.stats ? (
              <div className="h-[300px] flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : adSlots.filter((slot) => slot.adMedias?.length > 0).length >
              0 ? (
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: adSlots
                      .filter((slot) => slot.adMedias?.length > 0)
                      .sort((a, b) => {
                        const aViews = (
                          viewStatistics[a.adMedias[0].id] || []
                        ).reduce((acc, stat) => acc + stat.totalViews, 0);
                        const bViews = (
                          viewStatistics[b.adMedias[0].id] || []
                        ).reduce((acc, stat) => acc + stat.totalViews, 0);
                        return bViews - aViews;
                      })
                      .slice(0, 5)
                      .map((slot) => slot.adPackage?.packageName || "Ad"),
                    datasets: [
                      {
                        label: "Views",
                        data: adSlots
                          .filter((slot) => slot.adMedias?.length > 0)
                          .sort((a, b) => {
                            const aViews = (
                              viewStatistics[a.adMedias[0].id] || []
                            ).reduce((acc, stat) => acc + stat.totalViews, 0);
                            const bViews = (
                              viewStatistics[b.adMedias[0].id] || []
                            ).reduce((acc, stat) => acc + stat.totalViews, 0);
                            return bViews - aViews;
                          })
                          .slice(0, 5)
                          .map((slot) => {
                            const adMediaId = slot.adMedias[0].id;
                            const stats = viewStatistics[adMediaId] || [];
                            return stats.reduce(
                              (acc, stat) => acc + stat.totalViews,
                              0
                            );
                          }),
                        backgroundColor: "rgba(255, 0, 159, 0.7)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      title: {
                        display: true,
                        text: "Most Viewed Ad Slots",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Views",
                        },
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <Empty description="No ads data available" />
            )}
          </Card>
        </Col>

        {/* Status Distribution */}
        <Col xs={24} lg={8}>
          <Card title="Ad Slot Status Distribution" className="shadow-sm">
            {loading.slots ? (
              <div className="h-[300px] flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : adSlots.length > 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <Doughnut
                  data={getStatusDistributionData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || "";
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce(
                              (acc, val) => acc + val,
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
            ) : (
              <Empty description="No status data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Data Table Row */}
      <Row gutter={[16, 16]} className="mt-6">
        {/* Recent Campaigns */}
        <Col xs={24} lg={12}>
          <Card
            title="Recent Ad Slots"
            className="shadow-sm"
            extra={
              <Button
                className="text-[#FF009F] hover:text-[#D1007F] border-none"
                onClick={() => navigate("/advertiser/ad-purchase-slots")}
              >
                View All
              </Button>
            }
          >
            {loading.slots ? (
              <Spin />
            ) : (
              <Table
                columns={campaignColumns}
                dataSource={adSlots.slice(0, 5)}
                rowKey={(record) => record.id || Math.random().toString()}
                pagination={false}
              />
            )}
          </Card>
        </Col>

        {/* Recent Payments */}
        <Col xs={24} lg={12}>
          <Card
            title="Recent Transactions"
            className="shadow-sm"
            extra={
              <Button
                className="text-[#FF009F] hover:text-[#D1007F] border-none"
                onClick={() => navigate("/advertiser/payment-history")}
              >
                View All
              </Button>
            }
          >
            {loading.payments ? (
              <Spin />
            ) : recentPayments.length > 0 ? (
              <Table
                columns={paymentColumns}
                dataSource={recentPayments}
                rowKey={(record) => record.id || Math.random().toString()}
                pagination={false}
              />
            ) : (
              <Empty description="No payment records" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdvertiserDashboard;
