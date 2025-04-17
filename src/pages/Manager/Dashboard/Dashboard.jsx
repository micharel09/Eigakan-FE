import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Tabs,
  Statistic,
  Row,
  Col,
  Spin,
  Select,
  Typography,
  Table,
  Tag,
  Button,
  Tooltip,
  notification,
  Skeleton,
  Divider,
} from "antd";
import {
  UserOutlined,
  PlaySquareOutlined,
  DollarOutlined,
  StarOutlined,
  ShoppingOutlined,
  RiseOutlined,
  CalendarOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
  SyncOutlined,
  ArrowRightOutlined,
  BellOutlined,
  FileTextOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
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
import subscriptionService from "../../../apis/Subscription/subscription";
import NewsApi from "../../../apis/News/news";
import adPackageService from "../../../apis/AdPackage/adpackage";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

// Register Chart.js components
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

const { TabPane } = Tabs;
const { Title: TitleTypography, Text } = Typography;
const { Option } = Select;

const colorMap = {
  blue: "#1890ff",
  purple: "#722ed1",
  green: "#52c41a",
  red: "#f5222d",
  orange: "#fa8c16",
  cyan: "#13c2c2",
};

const StatCard = ({ title, value, icon, color, linkTo }) => (
  <Card
    bordered={false}
    className={`h-full shadow-sm hover:shadow-md transition-shadow border-l-4 border-${color}-500 relative overflow-hidden`}
    bodyStyle={{ padding: "16px" }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className={`text-${color}-500 text-2xl font-bold`}>{value}</p>
      </div>
      <div
        className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}
      >
        {icon}
      </div>
    </div>

    {linkTo && (
      <div className="mt-3 pt-2 border-t border-gray-100">
        <Link
          to={linkTo}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md bg-${color}-50 hover:bg-${color}-100 text-${color}-600 transition-all duration-300 group text-xs`}
        >
          <span className="font-medium">View Details</span>
          <div
            className={`w-5 h-5 rounded-full bg-${color}-500 flex items-center justify-center transform group-hover:translate-x-1 transition-transform duration-300`}
          >
            <ArrowRightOutlined className="text-white text-xs" />
          </div>
        </Link>
      </div>
    )}
  </Card>
);

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);

  // State for each data type
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [adPackageData, setAdPackageData] = useState([]);

  const [timeRange, setTimeRange] = useState("week");

  // Stats for display on cards
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalNews: 0,
    activeAdPackages: 0,
  });

  // Chart data states
  const [packageDistribution, setPackageDistribution] = useState(null);
  const [newsDistribution, setNewsDistribution] = useState(null);
  const [adPackageDistribution, setAdPackageDistribution] = useState(null);

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: "easeOutQuad",
    },
    transitions: {
      active: {
        animation: {
          duration: 300,
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11,
          },
          color: "#64748b",
        },
      },
      y: {
        grid: {
          color: "rgba(226, 232, 240, 0.5)",
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11,
          },
          color: "#64748b",
        },
      },
    },
  };

  // Table columns configuration
  const newsColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "orange"}>{status}</Tag>
      ),
    },
    {
      title: "Created Date",
      key: "createdDate",
      render: (_, record) => {
        // Try both createDate and createAt fields
        const dateValue = record.createDate || record.createAt;
        return dateValue ? new Date(dateValue).toLocaleDateString() : "N/A";
      },
    },
  ];

  // Fetch all necessary data
  const fetchAllData = useCallback(async () => {
    setStatsLoading(true);

    try {
      // Fetch subscription packages
      const subscriptionResponse = await subscriptionService.getAllPackages(
        1,
        100
      );
      console.log("Subscription response:", subscriptionResponse);
      const packages = subscriptionResponse?.data?.subscriptionpackage || [];
      setSubscriptionData(packages);

      // Fetch news - Handle different possible response structures
      const newsResponse = await NewsApi.getAllNews();
      console.log("Raw news response:", newsResponse);

      // Try different potential paths to the data
      let news = [];
      if (newsResponse?.data?.data) {
        // Structure: { success: true, data: [...], message: "..." }
        news = newsResponse.data.data;
      } else if (Array.isArray(newsResponse?.data)) {
        // Structure: { data: [...] }
        news = newsResponse.data;
      } else if (newsResponse?.data) {
        // Structure might have data directly in the response
        news = newsResponse.data;
      }

      console.log("Processed news data:", news);
      setNewsData(news);

      // Fetch ad packages
      const adPackageResponse = await adPackageService.getAllAdPackages(1, 100);
      console.log("Ad package response:", adPackageResponse);
      const adPackages = adPackageResponse?.adPackages || [];
      setAdPackageData(adPackages);

      // Calculate statistics
      const activeSubscriptions = packages.filter(
        (pkg) => pkg.status === "Active"
      ).length;
      const totalNews = news.length;
      const activeAdPackages = adPackages.filter(
        (pkg) => pkg.status === "Active"
      ).length;

      setStats({
        activeSubscriptions,
        totalNews,
        activeAdPackages,
      });

      return true;
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      notification.error({
        message: "Error",
        description: "Failed to load dashboard data. Please try again.",
      });
      return false;
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Prepare subscription package distribution data
  const preparePackageDistributionData = useCallback(() => {
    if (!subscriptionData || subscriptionData.length === 0) {
      return {
        labels: ["Basic", "Standard", "Premium"],
        datasets: [
          {
            data: [1, 1, 1],
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(54, 162, 235, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    // Count packages by name instead of status
    const packageCounts = {};

    subscriptionData.forEach((pkg) => {
      const packageName = pkg.packageName || "Unknown";
      packageCounts[packageName] = (packageCounts[packageName] || 0) + 1;
    });

    const labels = Object.keys(packageCounts);
    const data = Object.values(packageCounts);

    // Create color arrays based on the number of package types
    const backgroundColors = labels.map((_, index) => {
      const colors = [
        "rgba(255, 99, 132, 0.8)",
        "rgba(255, 206, 86, 0.8)",
        "rgba(54, 162, 235, 0.8)",
        "rgba(75, 192, 192, 0.8)",
      ];
      return colors[index % colors.length];
    });

    const borderColors = backgroundColors.map((color) =>
      color.replace("0.8", "1")
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [subscriptionData]);

  // Prepare news distribution data by status
  const prepareNewsDistributionData = useCallback(() => {
    if (!newsData || newsData.length === 0) {
      return {
        labels: ["Active", "Deleted"],
        datasets: [
          {
            data: [1, 1],
            backgroundColor: [
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
            borderColor: ["rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)"],
            borderWidth: 1,
          },
        ],
      };
    }

    console.log("Preparing news distribution from data:", newsData);

    // Count news by status
    const statusCounts = {};
    newsData.forEach((news) => {
      const status = news.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log("News status counts:", statusCounts);

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    // Create colors array based on number of statuses
    const backgroundColors = labels.map((_, index) => {
      const colors = [
        "rgba(75, 192, 192, 0.8)",
        "rgba(153, 102, 255, 0.8)",
        "rgba(255, 159, 64, 0.8)",
      ];
      return colors[index % colors.length];
    });

    const borderColors = backgroundColors.map((color) =>
      color.replace("0.8", "1")
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [newsData]);

  // Prepare ad package distribution data
  const prepareAdPackageDistributionData = useCallback(() => {
    if (!adPackageData || adPackageData.length === 0) {
      return {
        labels: ["Vip", "SuperVip", "UltraVip"],
        datasets: [
          {
            data: [1, 1, 1],
            backgroundColor: [
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
            ],
            borderColor: [
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    // Count ad packages by package name
    const packageNameCounts = {};

    adPackageData.forEach((pkg) => {
      const packageName = pkg.packageName || "Unknown";
      packageNameCounts[packageName] =
        (packageNameCounts[packageName] || 0) + 1;
    });

    const labels = Object.keys(packageNameCounts);
    const data = Object.values(packageNameCounts);

    // Create colors array
    const backgroundColors = labels.map((_, index) => {
      const colors = [
        "rgba(255, 206, 86, 0.8)",
        "rgba(75, 192, 192, 0.8)",
        "rgba(153, 102, 255, 0.8)",
        "rgba(255, 159, 64, 0.8)",
      ];
      return colors[index % colors.length];
    });

    const borderColors = backgroundColors.map((color) =>
      color.replace("0.8", "1")
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [adPackageData]);

  // Process and prepare chart data
  const processCharts = useCallback(() => {
    setChartsLoading(true);

    try {
      // Prepare all chart data
      const packageData = preparePackageDistributionData();
      setPackageDistribution(packageData);

      const newsData = prepareNewsDistributionData();
      setNewsDistribution(newsData);

      const adPackageData = prepareAdPackageDistributionData();
      setAdPackageDistribution(adPackageData);
    } catch (error) {
      console.error("Error processing chart data:", error);
      notification.error({
        message: "Error",
        description: "Failed to process dashboard charts. Please try again.",
      });
    } finally {
      setChartsLoading(false);
    }
  }, [
    preparePackageDistributionData,
    prepareNewsDistributionData,
    prepareAdPackageDistributionData,
  ]);

  // Process and prepare chart data after data is loaded
  useEffect(() => {
    if (
      subscriptionData.length > 0 ||
      newsData.length > 0 ||
      adPackageData.length > 0
    ) {
      processCharts();
    }
  }, [subscriptionData, newsData, adPackageData, processCharts]);

  // Initial data loading
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      await fetchAllData();
      setLoading(false);
    };

    initializeDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    const success = await fetchAllData();
    if (success) {
      processCharts();
      notification.success({
        message: "Refresh successful",
        description: "Dashboard data has been updated.",
      });
    }
    setRefreshing(false);
  };

  // Memoize chart data to prevent unnecessary renders
  const memoizedPackageDistribution = useMemo(
    () => packageDistribution,
    [packageDistribution]
  );

  const memoizedNewsDistribution = useMemo(
    () => newsDistribution,
    [newsDistribution]
  );

  const memoizedAdPackageDistribution = useMemo(
    () => adPackageDistribution,
    [adPackageDistribution]
  );

  // Skeleton loaders
  const renderSkeletonChart = () => (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <div className="w-[150px] h-6 mb-4 bg-gray-200 rounded relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
      </div>
      <div className="w-full h-[300px] bg-gray-200 rounded relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
      </div>
    </div>
  );

  const renderSkeletonCard = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <div className="w-[60px] h-4 mb-2 bg-gray-200 rounded relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
      </div>
      <div className="w-[120px] h-6 bg-gray-200 rounded relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
      </div>
    </div>
  );

  // Recent News Articles section
  const renderNewsTable = () => {
    // Debugging
    console.log("Rendering news table with data:", newsData);

    if (newsData.length > 0) {
      console.log("Sample news item:", newsData[0]);
      console.log("News item createDate:", newsData[0].createDate);
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        <Card
          title={
            <span className="text-sm font-medium">Recent News Articles</span>
          }
          className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
          bodyStyle={{ padding: "12px" }}
          headStyle={{ padding: "8px 12px" }}
          extra={
            <Link
              to="/manager/news"
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              View All
            </Link>
          }
        >
          {newsData && newsData.length > 0 ? (
            <Table
              dataSource={newsData.slice(0, 5)}
              rowKey="id"
              size="small"
              pagination={false}
              columns={newsColumns}
            />
          ) : (
            <div className="py-5 flex flex-col items-center">
              <p className="text-gray-500">No news articles found</p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4 space-y-4 bg-gray-50 min-h-screen overflow-x-hidden">
      <Helmet>
        <title>Manager Dashboard - EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg md:text-xl font-bold text-gray-800">
          Manager Dashboard
        </h1>

        <div className="flex items-center gap-2">
          <Tooltip title="Refresh dashboard data">
            <Button
              type="primary"
              shape="circle"
              size="small"
              icon={refreshing ? <SyncOutlined spin /> : <ReloadOutlined />}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center"
            />
          </Tooltip>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i}>{renderSkeletonCard()}</div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            title="Active Subscription Packages"
            value={stats.activeSubscriptions}
            icon={<PlaySquareOutlined style={{ color: colorMap.blue }} />}
            color="blue"
            linkTo="/manager/subscription"
          />

          <StatCard
            title="News Articles"
            value={stats.totalNews}
            icon={<FileTextOutlined style={{ color: colorMap.purple }} />}
            color="purple"
            linkTo="/manager/news"
          />

          <StatCard
            title="Active Ad Packages"
            value={stats.activeAdPackages}
            icon={<PictureOutlined style={{ color: colorMap.green }} />}
            color="green"
            linkTo="/manager/adpackage"
          />
        </div>
      )}

      {/* Charts */}
      {!loading && !chartsLoading ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Subscription Packages Distribution Chart */}
            <Card
              title={
                <span className="text-sm font-medium">
                  Subscription Package Types
                </span>
              }
              className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              bodyStyle={{ height: 280, padding: "12px" }}
              headStyle={{ padding: "8px 12px" }}
            >
              <div className="w-full h-full">
                {memoizedPackageDistribution && (
                  <Doughnut
                    data={memoizedPackageDistribution}
                    options={{
                      ...chartOptions,
                      maintainAspectRatio: false,
                      cutout: "65%",
                      animation: { duration: 0 },
                    }}
                  />
                )}
              </div>
            </Card>

            {/* News Distribution Chart */}
            <Card
              title={
                <span className="text-sm font-medium">
                  News Status Distribution
                </span>
              }
              className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              bodyStyle={{ height: 280, padding: "12px" }}
              headStyle={{ padding: "8px 12px" }}
            >
              <div className="w-full h-full">
                {memoizedNewsDistribution && (
                  <Pie
                    data={memoizedNewsDistribution}
                    options={{
                      ...chartOptions,
                      maintainAspectRatio: false,
                      animation: { duration: 0 },
                    }}
                  />
                )}
              </div>
            </Card>

            {/* Ad Packages Distribution Chart */}
            <Card
              title={
                <span className="text-sm font-medium">Ad Package Types</span>
              }
              className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              bodyStyle={{ height: 280, padding: "12px" }}
              headStyle={{ padding: "8px 12px" }}
            >
              <div className="w-full h-full">
                {memoizedAdPackageDistribution && (
                  <Doughnut
                    data={memoizedAdPackageDistribution}
                    options={{
                      ...chartOptions,
                      maintainAspectRatio: false,
                      cutout: "65%",
                      animation: { duration: 0 },
                    }}
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Recent Activity (Tables) */}
          {renderNewsTable()}
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i}>{renderSkeletonChart()}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
