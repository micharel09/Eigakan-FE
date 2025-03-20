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
import { Helmet } from "react-helmet";
import axios from "axios";
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

  const [subscriptionData, setSubscriptionData] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("week");

  const [stats, setStats] = useState({
    activePackages: 0,
    totalRevenue: 0,
    totalSales: 0,
  });

  const [revenueData, setRevenueData] = useState(null);
  const [packageDistribution, setPackageDistribution] = useState(null);
  const [salesData, setSalesData] = useState(null);

  // Thêm state để lưu trữ dữ liệu adSlots
  const [adSlots, setAdSlots] = useState([]);

  // Cấu hình chung cho biểu đồ
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
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label +=
                new Intl.NumberFormat("vi-VN").format(context.parsed.y) + " đ";
            }
            return label;
          },
        },
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
          callback: function (value) {
            return new Intl.NumberFormat("vi-VN").format(value) + " đ";
          },
        },
      },
    },
  };

  // Function để chuẩn bị dữ liệu cho biểu đồ doanh thu
  const prepareRevenueData = useCallback(() => {
    // Kiểm tra dữ liệu tồn tại trước khi xử lý
    if (!purchaseHistory || purchaseHistory.length === 0) {
      // Trả về dữ liệu giả nếu không có dữ liệu thực
      return {
        labels: ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"],
        datasets: [
          {
            label: "Revenue (đ)",
            data: [0, 0, 0, 0, 0, 0, 0],
            fill: true,
            backgroundColor: "rgba(255, 0, 159, 0.1)",
            borderColor: "rgba(255, 0, 159, 0.8)",
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "rgba(255, 0, 159, 1)",
          },
        ],
      };
    }

    console.log("Đang xử lý dữ liệu doanh thu:", purchaseHistory);

    // Ghi log để debug
    console.log("Dữ liệu xử lý:", {
      purchaseHistory,
      timeRange,
    });

    // Filter data based on selected time range
    let filteredData = [];
    const today = new Date();
    let labels = [];
    let dateFormat = {};

    if (timeRange === "week") {
      // Last 7 days
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      filteredData = purchaseHistory.filter(
        (item) => new Date(item.createAt) >= lastWeek
      );

      // Generate labels for last 7 days
      dateFormat = { weekday: "short" };
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString("en-US", dateFormat));
      }
    } else if (timeRange === "month") {
      // Last 30 days - group by week
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      filteredData = purchaseHistory.filter(
        (item) => new Date(item.createAt) >= lastMonth
      );

      // Generate labels for last 4 weeks
      dateFormat = { month: "short", day: "numeric" };
      for (let i = 3; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i * 7);
        labels.push(date.toLocaleDateString("en-US", dateFormat));
      }
    } else {
      // Year - last 12 months
      const lastYear = new Date(today);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      filteredData = purchaseHistory.filter(
        (item) => new Date(item.createAt) >= lastYear
      );

      // Generate labels for last 12 months
      dateFormat = { month: "short" };
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString("en-US", dateFormat));
      }
    }

    // Prepare data - group purchases by time period and calculate revenue
    const revenueData = Array(labels.length).fill(0);

    filteredData.forEach((purchase) => {
      const purchaseDate = new Date(purchase.createAt);
      let index = 0;

      if (timeRange === "week") {
        // Group by day
        const daysFromToday = Math.floor(
          (today - purchaseDate) / (1000 * 60 * 60 * 24)
        );
        index = 6 - daysFromToday;
      } else if (timeRange === "month") {
        // Group by week
        const daysFromToday = Math.floor(
          (today - purchaseDate) / (1000 * 60 * 60 * 24)
        );
        index = 3 - Math.floor(daysFromToday / 7);
      } else {
        // Group by month
        const monthsFromToday =
          (today.getMonth() - purchaseDate.getMonth() + 12) % 12;
        index = 11 - monthsFromToday;
      }

      // Make sure index is valid
      if (index >= 0 && index < revenueData.length) {
        revenueData[index] += purchase.slotTimePrice || 0;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Revenue (đ)",
          data: revenueData,
          fill: true,
          backgroundColor: "rgba(255, 0, 159, 0.1)",
          borderColor: "rgba(255, 0, 159, 0.8)",
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "rgba(255, 0, 159, 1)",
        },
      ],
    };
  }, [purchaseHistory, timeRange]);

  // Function để chuẩn bị dữ liệu cho biểu đồ phân phối gói
  const preparePackageDistributionData = useCallback(() => {
    // Kiểm tra dữ liệu tồn tại
    if (!adSlots || adSlots.length === 0) {
      return {
        labels: ["SIDEBAR-LEFT", "HEADER", "SIDEBAR-RIGHT", "FOOTER"],
        datasets: [
          {
            data: [1, 1, 1, 1],
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(75, 192, 192, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(75, 192, 192, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    console.log("Đang xử lý dữ liệu phân phối:", adSlots);

    // Đếm số lượng mỗi loại vị trí
    const locationCounts = {};
    adSlots.forEach((slot) => {
      if (slot.slotLocation) {
        locationCounts[slot.slotLocation] =
          (locationCounts[slot.slotLocation] || 0) + 1;
      }
    });

    const labels = Object.keys(locationCounts);
    const data = Object.values(locationCounts);

    // Tạo mảng màu tương ứng với số lượng vị trí
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
  }, [adSlots]);

  // Function để chuẩn bị dữ liệu cho biểu đồ bán hàng
  const prepareSalesData = useCallback(() => {
    console.log("Đang xử lý dữ liệu bán hàng:", purchaseHistory);

    // Kiểm tra dữ liệu
    if (!purchaseHistory || purchaseHistory.length === 0) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Packages Sold",
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: "rgba(46, 184, 92, 0.6)",
            borderColor: "rgba(46, 184, 92, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    // Filter data based on selected time range
    let filteredData = [];
    const today = new Date();
    let labels = [];

    if (timeRange === "week") {
      // Last 7 days
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      filteredData = purchaseHistory.filter(
        (item) => new Date(item.createAt) >= lastWeek
      );

      // Create labels for days of week
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayMap = {};
      days.forEach((day) => {
        dayMap[day] = 0;
      });

      // Count sales for each day
      filteredData.forEach((purchase) => {
        const date = new Date(purchase.createAt);
        const day = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust to make Monday=0, Sunday=6
        dayMap[day]++;
      });

      labels = days;
      filteredData = Object.values(dayMap);
    } else if (timeRange === "month") {
      // Last 4 weeks
      labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const weeklySales = [0, 0, 0, 0];

      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 28);

      purchaseHistory
        .filter((item) => new Date(item.createAt) >= lastMonth)
        .forEach((purchase) => {
          const date = new Date(purchase.createAt);
          const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
          weeklySales[weekIndex]++;
        });

      filteredData = weeklySales;
    } else {
      // Last 12 months
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthlySales = Array(12).fill(0);

      purchaseHistory.forEach((purchase) => {
        const date = new Date(purchase.createAt);
        if (
          date.getFullYear() === today.getFullYear() ||
          (date.getFullYear() === today.getFullYear() - 1 &&
            date.getMonth() > today.getMonth())
        ) {
          const monthIndex = date.getMonth();
          monthlySales[monthIndex]++;
        }
      });

      labels = months;
      filteredData = monthlySales;
    }

    return {
      labels,
      datasets: [
        {
          label: "Packages Sold",
          data: filteredData,
          backgroundColor: "rgba(46, 184, 92, 0.6)",
          borderColor: "rgba(46, 184, 92, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [purchaseHistory, timeRange]);

  // Fetch statistics data
  const processStats = useCallback(async () => {
    setStatsLoading(true);
    setChartsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [subscriptionResponse, adSlotTimeResponse, adSlotResponse] =
        await Promise.all([
          axios.get(
            "https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPackage?page=1&pageSize=10",
            { headers }
          ),
          axios.get(
            "https://eigakan2222-001-site1.jtempurl.com/api/AdSlotTime",
            {
              headers,
            }
          ),
          axios.get("https://eigakan2222-001-site1.jtempurl.com/api/AdSlot", {
            headers,
          }),
        ]);

      const packages =
        subscriptionResponse.data?.data?.subscriptionpackage || [];
      const adSlotTimes = adSlotTimeResponse.data?.data || [];
      const adSlotsData = adSlotResponse.data?.data || [];

      setSubscriptionData(packages);
      setPurchaseHistory(adSlotTimes);
      setAdSlots(adSlotsData);

      // Tính toán thống kê
      const activePackages = packages.filter(
        (pkg) => pkg.status === "Active"
      ).length;
      const totalRevenue = adSlotTimes.reduce(
        (sum, slot) => sum + (slot.slotTimePrice || 0),
        0
      );
      const totalSales = adSlotTimes.length;

      setStats({
        activePackages,
        totalRevenue,
        totalSales,
      });

      console.log("Stats updated, processing charts next");
      return { adSlotTimes, packages, adSlotsData };
    } catch (error) {
      console.error("Error fetching stats:", error);
      notification.error({
        message: "Error",
        description: "Failed to load dashboard statistics",
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Sửa lại hàm processCharts để xử lý lỗi tốt hơn
  const processCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      console.log("Bắt đầu xử lý chart với dữ liệu:", purchaseHistory.length);

      // Đảm bảo có dữ liệu trước khi xử lý
      if (!purchaseHistory || purchaseHistory.length === 0) {
        console.log("Không có dữ liệu purchaseHistory, sử dụng dữ liệu mẫu");
        // Tạo dữ liệu mẫu cho biểu đồ
        setRevenueData({
          labels: ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"],
          datasets: [
            {
              label: "Revenue (đ)",
              data: [0, 0, 0, 0, 0, 0, 0],
              fill: true,
              backgroundColor: "rgba(255, 0, 159, 0.1)",
              borderColor: "rgba(255, 0, 159, 0.8)",
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: "rgba(255, 0, 159, 1)",
            },
          ],
        });

        setPackageDistribution({
          labels: ["SIDEBAR-LEFT", "HEADER", "SIDEBAR-RIGHT"],
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
        });

        setSalesData({
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              label: "Packages Sold",
              data: [0, 0, 0, 0, 0, 0, 0],
              backgroundColor: "rgba(46, 184, 92, 0.6)",
              borderColor: "rgba(46, 184, 92, 1)",
              borderWidth: 1,
            },
          ],
        });
      } else {
        // Sử dụng dữ liệu thực từ API
        try {
          const revData = prepareRevenueData();
          setRevenueData(revData);
          console.log("Đã xử lý dữ liệu doanh thu:", revData);
        } catch (error) {
          console.error("Lỗi khi xử lý dữ liệu doanh thu:", error);
          // Sử dụng dữ liệu mặc định nếu có lỗi
          setRevenueData({
            labels: ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"],
            datasets: [
              {
                label: "Revenue (đ)",
                data: [0, 0, 0, 0, 0, 0, 0],
                fill: true,
                backgroundColor: "rgba(255, 0, 159, 0.1)",
                borderColor: "rgba(255, 0, 159, 0.8)",
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "rgba(255, 0, 159, 1)",
              },
            ],
          });
        }

        try {
          const packageData = preparePackageDistributionData();
          setPackageDistribution(packageData);
          console.log("Đã xử lý dữ liệu phân phối:", packageData);
        } catch (error) {
          console.error("Lỗi khi xử lý dữ liệu phân phối:", error);
          // Sử dụng dữ liệu mặc định
          setPackageDistribution({
            labels: ["SIDEBAR-LEFT", "HEADER", "SIDEBAR-RIGHT"],
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
          });
        }

        try {
          const salesChartData = prepareSalesData();
          setSalesData(salesChartData);
          console.log("Đã xử lý dữ liệu bán hàng:", salesChartData);
        } catch (error) {
          console.error("Lỗi khi xử lý dữ liệu bán hàng:", error);
          // Sử dụng dữ liệu mặc định
          setSalesData({
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Packages Sold",
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: "rgba(46, 184, 92, 0.6)",
                borderColor: "rgba(46, 184, 92, 1)",
                borderWidth: 1,
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error("Lỗi tổng thể khi xử lý dữ liệu biểu đồ:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể xử lý dữ liệu biểu đồ. Vui lòng thử lại sau.",
      });
    } finally {
      setChartsLoading(false);
    }
  }, [
    timeRange,
    purchaseHistory,
    prepareRevenueData,
    preparePackageDistributionData,
    prepareSalesData,
  ]);

  // Khôi phục lại hàm handleTimeRangeChange
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  // Sửa lại cách xử lý useEffect để tránh gọi API nhiều lần
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        const data = await processStats();

        if (data) {
          await processCharts();
        }
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        notification.error({
          message: "Error",
          description: "Failed to load dashboard data. Please try again.",
        });
      } finally {
        setLoading(false);
        setChartsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Thêm useEffect để xử lý chart khi dữ liệu thay đổi
  useEffect(() => {
    if (!statsLoading && purchaseHistory.length > 0 && adSlots.length > 0) {
      processCharts();
    }
  }, [statsLoading, purchaseHistory, adSlots, timeRange]);

  // Sửa lại handleRefresh để đảm bảo nó hoạt động đúng
  const handleRefresh = async () => {
    setRefreshing(true);
    setChartsLoading(true);
    try {
      await processStats();
      await processCharts();

      notification.success({
        message: "Refresh successful",
        description: "Dashboard data has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      notification.error({
        message: "Refresh failed",
        description: "Failed to update dashboard data. Please try again.",
      });
    } finally {
      setRefreshing(false);
      setChartsLoading(false);
    }
  };

  // Sử dụng useMemo để chỉ tính toán lại khi dữ liệu thay đổi
  const memoizedRevenueData = useMemo(() => {
    return revenueData;
  }, [revenueData]);

  const memoizedDistributionData = useMemo(() => {
    return packageDistribution;
  }, [packageDistribution]);

  const memoizedSalesData = useMemo(() => {
    return salesData;
  }, [salesData]);

  // Render skeleton for chart
  const renderSkeletonChart = () => (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <Skeleton.Input style={{ width: 150, marginBottom: 16 }} active />
      <Skeleton.Input style={{ width: "100%", height: 300 }} active />
    </div>
  );

  // Render skeleton for card
  const renderSkeletonCard = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <Skeleton.Input style={{ width: 60, marginBottom: 8 }} active />
      <Skeleton.Input style={{ width: 120 }} active />
    </div>
  );

  // Sửa lại hàm format tiền tệ
  const formatCurrency = (value) => {
    return `${value.toLocaleString("vi-VN")} đ`;
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
          <Select
            defaultValue="week"
            style={{ width: 110 }}
            onChange={handleTimeRangeChange}
            disabled={loading || chartsLoading}
            size="small"
          >
            <Option value="week">Last Week</Option>
            <Option value="month">Last Month</Option>
            <Option value="year">Last Year</Option>
          </Select>

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
            title="Active Packages"
            value={stats.activePackages}
            icon={<PlaySquareOutlined style={{ color: colorMap.blue }} />}
            color="blue"
            linkTo="/manager/subscription"
          />

          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<DollarOutlined style={{ color: colorMap.green }} />}
            color="green"
            linkTo="/manager/adslot-time"
          />

          <StatCard
            title="Packages Sold"
            value={stats.totalSales}
            icon={<RiseOutlined style={{ color: colorMap.orange }} />}
            color="orange"
            linkTo="/manager/adslot-time"
          />
        </div>
      )}

      {/* Charts */}
      {!loading && !chartsLoading ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Revenue Chart */}
            <Card
              title={
                <span className="text-sm font-medium">Revenue Trends</span>
              }
              className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              bodyStyle={{ height: 280, padding: "12px" }}
              headStyle={{ padding: "8px 12px" }}
            >
              <div className="w-full h-full">
                {memoizedRevenueData && (
                  <Line
                    data={memoizedRevenueData}
                    options={{
                      ...chartOptions,
                      animation: { duration: 0 },
                    }}
                  />
                )}
              </div>
            </Card>

            {/* Package Distribution Chart */}
            <Card
              title={
                <span className="text-sm font-medium">
                  Package Distribution
                </span>
              }
              className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              bodyStyle={{ height: 280, padding: "12px" }}
              headStyle={{ padding: "8px 12px" }}
            >
              <div className="w-full h-full">
                {memoizedDistributionData && (
                  <Doughnut
                    data={memoizedDistributionData}
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

          {/* Sales Chart (Full Width) */}
          <Card
            title={<span className="text-sm font-medium">Package Sales</span>}
            className="rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            bodyStyle={{ height: 230, padding: "12px" }}
            headStyle={{ padding: "8px 12px" }}
          >
            <div className="w-full h-full">
              {memoizedSalesData && (
                <Bar
                  data={memoizedSalesData}
                  options={{
                    ...chartOptions,
                    animation: { duration: 0 },
                  }}
                />
              )}
            </div>
          </Card>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i}>{renderSkeletonChart()}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
