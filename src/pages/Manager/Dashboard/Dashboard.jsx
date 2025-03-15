import React, { useState, useEffect } from "react";
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

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("week"); // 'week', 'month', 'year'
  const [recentSales, setRecentSales] = useState([]);

  // Fetch subscription data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await subscriptionService.getAllPackages(1, 100);
        if (response.success) {
          setSubscriptionData(response.data.subscriptionpackage || []);

          // In a real scenario, we'd call an API for this data
          const mockPurchaseData = generateMockPurchaseData(30);
          setPurchaseHistory(mockPurchaseData);

          // Set recent sales data (last 5 transactions)
          setRecentSales(mockPurchaseData.slice(-5).reverse());
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate mock data for purchase history
  const generateMockPurchaseData = (days) => {
    const data = [];
    const today = new Date();
    const packageNames = ["Basic Plan", "Premium Plan", "VIP Plan"];
    const userNames = [
      "John Doe",
      "Jane Smith",
      "Michael Brown",
      "Sarah Johnson",
      "Robert Williams",
    ];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const packageId = Math.floor(Math.random() * 3) + 1;
      const sales = Math.floor(Math.random() * 10) + 1;
      const revenue = (Math.floor(Math.random() * 10) + 1) * 100000;

      data.push({
        id: `ORD-${Math.floor(1000000 + Math.random() * 9000000)}`,
        date: date.toISOString().split("T")[0],
        sales: sales,
        revenue: revenue,
        packageId: packageId,
        packageName: packageNames[packageId - 1],
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        status: Math.random() > 0.2 ? "Completed" : "Pending",
      });
    }

    return data;
  };

  // Prepare revenue data for chart
  const prepareRevenueData = () => {
    let labels = [];
    let data = [];

    // Create time labels based on timeRange
    const today = new Date();
    const numDays = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 12;

    if (timeRange === "year") {
      // Data by year (months)
      for (let i = 0; i < 12; i++) {
        const month = new Date(today.getFullYear(), i, 1);
        labels.push(month.toLocaleDateString("en-US", { month: "short" }));
      }

      // Aggregate data by month
      const monthlyData = Array(12).fill(0);
      purchaseHistory.forEach((item) => {
        const month = new Date(item.date).getMonth();
        monthlyData[month] += item.revenue;
      });

      data = monthlyData;
    } else {
      // Data by day
      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
      }

      // Get data for each day
      const dailyData = Array(numDays).fill(0);
      purchaseHistory.forEach((item) => {
        const itemDate = new Date(item.date);
        const diffTime = Math.abs(today - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < numDays) {
          dailyData[numDays - diffDays - 1] += item.revenue;
        }
      });

      data = dailyData;
    }

    return {
      labels,
      datasets: [
        {
          label: "Revenue (USD)",
          data: data,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  // Prepare sales data for chart
  const prepareSalesData = () => {
    let labels = [];
    let data = [];

    const today = new Date();
    const numDays = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 12;

    if (timeRange === "year") {
      // Data by year (months)
      for (let i = 0; i < 12; i++) {
        const month = new Date(today.getFullYear(), i, 1);
        labels.push(month.toLocaleDateString("en-US", { month: "short" }));
      }

      // Aggregate data by month
      const monthlyData = Array(12).fill(0);
      purchaseHistory.forEach((item) => {
        const month = new Date(item.date).getMonth();
        monthlyData[month] += item.sales;
      });

      data = monthlyData;
    } else {
      // Data by day
      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
      }

      // Get data for each day
      const dailyData = Array(numDays).fill(0);
      purchaseHistory.forEach((item) => {
        const itemDate = new Date(item.date);
        const diffTime = Math.abs(today - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < numDays) {
          dailyData[numDays - diffDays - 1] += item.sales;
        }
      });

      data = dailyData;
    }

    return {
      labels,
      datasets: [
        {
          label: "Subscription Packages Sold",
          data: data,
          backgroundColor: "rgba(153, 102, 255, 0.6)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare package distribution data
  const preparePackageDistributionData = () => {
    const packageCounts = {};

    // Count purchases for each package
    purchaseHistory.forEach((item) => {
      const packageId = item.packageId;
      packageCounts[packageId] = (packageCounts[packageId] || 0) + item.sales;
    });

    // Package names
    const packageNames = {
      1: "Basic Plan",
      2: "Premium Plan",
      3: "VIP Plan",
    };

    const labels = Object.keys(packageCounts).map(
      (id) => packageNames[id] || `Package ${id}`
    );
    const data = Object.values(packageCounts);
    const total = data.reduce((sum, value) => sum + value, 0);

    // Thêm phần trăm vào nhãn
    const labelsWithPercentage = labels.map((label, index) => {
      const percentage = ((data[index] / total) * 100).toFixed(1);
      return `${label} (${percentage}%)`;
    });

    return {
      labels: labelsWithPercentage,
      datasets: [
        {
          data,
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
          ],
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  };

  // Calculate total revenue
  const calculateTotalRevenue = () => {
    return purchaseHistory.reduce((sum, item) => sum + item.revenue, 0);
  };

  // Calculate total packages sold
  const calculateTotalSales = () => {
    return purchaseHistory.reduce((sum, item) => sum + item.sales, 0);
  };

  // Calculate change percentage compared to previous period
  const calculateChangePercentage = (type) => {
    const today = new Date();
    const currentPeriodStart = new Date(today);

    if (timeRange === "week") {
      currentPeriodStart.setDate(today.getDate() - 7);
    } else if (timeRange === "month") {
      currentPeriodStart.setDate(today.getDate() - 30);
    } else {
      currentPeriodStart.setMonth(0); // January of current year
    }

    const previousPeriodStart = new Date(currentPeriodStart);
    if (timeRange === "week") {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    } else if (timeRange === "month") {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
    } else {
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
    }

    const currentPeriodData = purchaseHistory.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= currentPeriodStart && itemDate <= today;
    });

    const previousPeriodData = purchaseHistory.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= previousPeriodStart && itemDate < currentPeriodStart;
    });

    if (type === "revenue") {
      const currentRevenue = currentPeriodData.reduce(
        (sum, item) => sum + item.revenue,
        0
      );
      const previousRevenue = previousPeriodData.reduce(
        (sum, item) => sum + item.revenue,
        0
      );

      if (previousRevenue === 0) return 100;
      return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    } else {
      const currentSales = currentPeriodData.reduce(
        (sum, item) => sum + item.sales,
        0
      );
      const previousSales = previousPeriodData.reduce(
        (sum, item) => sum + item.sales,
        0
      );

      if (previousSales === 0) return 100;
      return ((currentSales - previousSales) / previousSales) * 100;
    }
  };

  // Common chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: "bold",
          },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold",
        },
        formatter: (value, ctx) => {
          let sum = 0;
          let dataArr = ctx.chart.data.datasets[0].data;
          dataArr.forEach((data) => {
            sum += data;
          });
          let percentage = ((value * 100) / sum).toFixed(1) + "%";
          return percentage;
        },
        display: function (context) {
          return context.dataset.data[context.dataIndex] > 0;
        },
      },
    },
  };

  // Handle time range change
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };

  // Handle refresh data
  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setPurchaseHistory(generateMockPurchaseData(30));
      setRecentSales(generateMockPurchaseData(5));
      setLoading(false);
    }, 800);
  };

  // Recent sales table columns
  const recentSalesColumns = [
    {
      title: "Order ID",
      dataIndex: "id",
      key: "id",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "userName",
      key: "userName",
      width: 150,
    },
    {
      title: "Package",
      dataIndex: "packageName",
      key: "packageName",
      width: 120,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      title: "Amount",
      dataIndex: "revenue",
      key: "revenue",
      width: 120,
      render: (revenue) => `$${(revenue / 1000).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={status === "Completed" ? "green" : "orange"}>{status}</Tag>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Helmet>
        <title>Manager Dashboard - EIGAKAN</title>
      </Helmet>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <TitleTypography level={2} className="text-gray-800 mb-0">
            Manager Dashboard
          </TitleTypography>
          <Tooltip title="Refresh Data">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefreshData}
              loading={loading}
              className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
            >
              Refresh
            </Button>
          </Tooltip>
        </div>
        <Text className="text-gray-500">
          Welcome back! Here's what's happening with your subscription packages.
        </Text>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Loading dashboard data..." />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                className="shadow-sm border-l-4 border-l-[#FF009F] transition-all duration-300 hover:shadow-md"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <span className="text-gray-600 font-medium">
                      Active Packages
                    </span>
                  }
                  value={
                    subscriptionData.filter((item) => item.status === "Active")
                      .length
                  }
                  prefix={<PlaySquareOutlined className="text-[#FF009F]" />}
                  valueStyle={{ color: "#FF009F", fontWeight: "bold" }}
                />
                <div className="mt-2 text-xs">
                  <Text type="secondary">
                    {subscriptionData.length > 0
                      ? (
                          (subscriptionData.filter(
                            (item) => item.status === "Active"
                          ).length /
                            subscriptionData.length) *
                          100
                        ).toFixed(1)
                      : 0}
                    % of total
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                className="shadow-sm border-l-4 border-l-[#faad14] transition-all duration-300 hover:shadow-md"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <span className="text-gray-600 font-medium">
                      Total Revenue
                    </span>
                  }
                  value={calculateTotalRevenue() / 1000}
                  prefix={<DollarOutlined className="text-[#faad14]" />}
                  valueStyle={{ color: "#faad14", fontWeight: "bold" }}
                  precision={2}
                  suffix="K"
                />
                <div className="mt-2 text-xs">
                  {calculateChangePercentage("revenue") >= 0 ? (
                    <Text type="success" className="flex items-center">
                      <ArrowUpOutlined className="mr-1" />{" "}
                      {Math.abs(calculateChangePercentage("revenue")).toFixed(
                        1
                      )}
                      % from previous period
                    </Text>
                  ) : (
                    <Text type="danger" className="flex items-center">
                      <ArrowDownOutlined className="mr-1" />{" "}
                      {Math.abs(calculateChangePercentage("revenue")).toFixed(
                        1
                      )}
                      % from previous period
                    </Text>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                className="shadow-sm border-l-4 border-l-[#1890ff] transition-all duration-300 hover:shadow-md"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <span className="text-gray-600 font-medium">
                      Total Packages Sold
                    </span>
                  }
                  value={calculateTotalSales()}
                  prefix={<RiseOutlined className="text-[#1890ff]" />}
                  valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
                />
                <div className="mt-2 text-xs">
                  {calculateChangePercentage("sales") >= 0 ? (
                    <Text type="success" className="flex items-center">
                      <ArrowUpOutlined className="mr-1" />{" "}
                      {Math.abs(calculateChangePercentage("sales")).toFixed(1)}%
                      from previous period
                    </Text>
                  ) : (
                    <Text type="danger" className="flex items-center">
                      <ArrowDownOutlined className="mr-1" />{" "}
                      {Math.abs(calculateChangePercentage("sales")).toFixed(1)}%
                      from previous period
                    </Text>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                hoverable
                className="shadow-sm border-l-4 border-l-[#52c41a] transition-all duration-300 hover:shadow-md"
                bodyStyle={{ padding: "16px" }}
              >
                <Statistic
                  title={
                    <span className="text-gray-600 font-medium">
                      Conversion Rate
                    </span>
                  }
                  value={75.5}
                  prefix={<StarOutlined className="text-[#52c41a]" />}
                  valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
                  suffix="%"
                />
                <div className="mt-2 text-xs">
                  <Text type="success" className="flex items-center">
                    <ArrowUpOutlined className="mr-1" /> 12.5% from previous
                    period
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Time filter */}
          <div className="mb-4 flex justify-end">
            <Select
              defaultValue="week"
              style={{ width: 150 }}
              onChange={handleTimeRangeChange}
              className="shadow-sm"
              dropdownClassName="rounded-lg shadow-lg"
            >
              <Option value="week">Last 7 days</Option>
              <Option value="month">Last 30 days</Option>
              <Option value="year">This year</Option>
            </Select>
          </div>

          {/* Charts */}
          <Row gutter={[16, 16]}>
            {/* Revenue chart */}
            <Col xs={24} lg={12} className="mb-4">
              <Card
                title={
                  <span className="text-gray-700 font-medium">
                    Revenue Over Time
                  </span>
                }
                className="shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
                style={{ height: "380px" }}
                bodyStyle={{ padding: "8px 16px" }}
                extra={
                  <Tooltip title="View detailed report">
                    <Button type="text" icon={<SearchOutlined />} />
                  </Tooltip>
                }
              >
                <Line
                  data={prepareRevenueData()}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(0, 0, 0, 0.05)",
                        },
                        ticks: {
                          callback: function (value) {
                            return `$${value / 1000}K`;
                          },
                          font: {
                            weight: "bold",
                          },
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: {
                            weight: "bold",
                          },
                        },
                      },
                    },
                  }}
                />
              </Card>
            </Col>

            {/* Sales chart */}
            <Col xs={24} lg={12} className="mb-4">
              <Card
                title={
                  <span className="text-gray-700 font-medium">
                    Packages Sold
                  </span>
                }
                className="shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
                style={{ height: "380px" }}
                bodyStyle={{ padding: "8px 16px" }}
                extra={
                  <Tooltip title="View detailed report">
                    <Button type="text" icon={<SearchOutlined />} />
                  </Tooltip>
                }
              >
                <Bar
                  data={prepareSalesData()}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(0, 0, 0, 0.05)",
                        },
                        ticks: {
                          font: {
                            weight: "bold",
                          },
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: {
                            weight: "bold",
                          },
                        },
                      },
                    },
                  }}
                />
              </Card>
            </Col>

            {/* Package distribution chart */}
            <Col xs={24} lg={12} className="mb-4">
              <Card
                title={
                  <span className="text-gray-700 font-medium">
                    Package Distribution
                  </span>
                }
                className="shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
                style={{ height: "350px" }}
                bodyStyle={{ padding: "8px 16px" }}
                extra={
                  <Tooltip title="View detailed report">
                    <Button type="text" icon={<SearchOutlined />} />
                  </Tooltip>
                }
              >
                <div className="flex items-center justify-center h-full">
                  <Doughnut
                    data={preparePackageDistributionData()}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          position: "right",
                          labels: {
                            padding: 20,
                            font: {
                              size: 12,
                            },
                            generateLabels: function (chart) {
                              const data = chart.data;
                              if (data.labels.length && data.datasets.length) {
                                return data.labels.map(function (label, i) {
                                  const meta = chart.getDatasetMeta(0);
                                  const style = meta.controller.getStyle(i);

                                  return {
                                    text: label,
                                    fillStyle: style.backgroundColor,
                                    strokeStyle: style.borderColor,
                                    lineWidth: style.borderWidth,
                                    hidden:
                                      isNaN(data.datasets[0].data[i]) ||
                                      meta.data[i].hidden,
                                    index: i,
                                  };
                                });
                              }
                              return [];
                            },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || "";
                              const value = context.formattedValue;
                              const total = context.dataset.data.reduce(
                                (a, b) => a + b,
                                0
                              );
                              const percentage = Math.round(
                                (context.raw / total) * 100
                              );
                              return `${label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                      cutout: "60%",
                      radius: "90%",
                    }}
                  />
                </div>
              </Card>
            </Col>

            {/* Package status chart */}
            <Col xs={24} lg={12} className="mb-4">
              <Card
                title={
                  <span className="text-gray-700 font-medium">
                    Package Status
                  </span>
                }
                className="shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
                style={{ height: "350px" }}
                bodyStyle={{ padding: "8px 16px" }}
                extra={
                  <Tooltip title="View detailed report">
                    <Button type="text" icon={<SearchOutlined />} />
                  </Tooltip>
                }
              >
                <div className="flex flex-col h-full">
                  <div className="mb-2">
                    <Text strong className="text-gray-700">
                      Total packages: {subscriptionData.length}
                    </Text>
                  </div>

                  <div className="flex-grow">
                    <Pie
                      data={{
                        labels: ["Active", "Inactive"],
                        datasets: [
                          {
                            data: [
                              subscriptionData.filter(
                                (item) => item.status === "Active"
                              ).length,
                              subscriptionData.filter(
                                (item) => item.status !== "Active"
                              ).length,
                            ],
                            backgroundColor: [
                              "rgba(82, 196, 26, 0.8)",
                              "rgba(245, 34, 45, 0.8)",
                            ],
                            borderColor: [
                              "rgba(82, 196, 26, 1)",
                              "rgba(245, 34, 45, 1)",
                            ],
                            borderWidth: 2,
                            hoverOffset: 15,
                          },
                        ],
                      }}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const label = context.label || "";
                                const value = context.formattedValue;
                                const total = context.dataset.data.reduce(
                                  (a, b) => a + b,
                                  0
                                );
                                const percentage = Math.round(
                                  (context.raw / total) * 100
                                );
                                return `${label}: ${value} (${percentage}%)`;
                              },
                            },
                          },
                        },
                        radius: "90%",
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Recent Sales Table */}
          <Card
            title={
              <span className="text-gray-700 font-medium">
                Recent Transactions
              </span>
            }
            className="shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 mt-4"
            bodyStyle={{ padding: "0" }}
            extra={
              <Button
                type="link"
                className="text-[#FF009F] hover:text-[#D1007F]"
              >
                View All
              </Button>
            }
          >
            <Table
              columns={recentSalesColumns.map((col) => ({
                ...col,
                className: "text-gray-700",
                render:
                  col.render ||
                  ((text) => <span className="font-medium">{text}</span>),
              }))}
              dataSource={recentSales}
              pagination={false}
              rowKey="id"
              size="middle"
              className="custom-table"
              rowClassName="hover:bg-gray-50 transition-colors duration-200"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
