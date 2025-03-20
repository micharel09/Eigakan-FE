import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
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
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Spin,
  notification,
  Skeleton,
  Statistic,
  Card,
  Button,
  Tooltip as AntTooltip,
} from "antd";
import {
  UserOutlined,
  PlayCircleOutlined,
  DollarOutlined,
  StarOutlined,
  ShoppingOutlined,
  RiseOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  FireOutlined,
  ReloadOutlined,
  SyncOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Kiểm tra dữ liệu cache
const getCachedData = (key) => {
  const cachedData = localStorage.getItem(key);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    // Cache hết hạn sau 5 phút
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  return null;
};

// Lưu dữ liệu vào cache
const setCachedData = (key, data) => {
  localStorage.setItem(
    key,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    })
  );
};

// Format tiền Việt Nam
const formatVND = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Thêm component StatCard với nút điều hướng
const StatCard = ({ title, value, icon, color, subTitle, linkTo }) => (
  <Card
    bordered={false}
    className={`h-full shadow-sm hover:shadow-md transition-shadow border-l-4 border-${color}-500 relative overflow-hidden`}
  >
    {/* Thêm background pattern cho card */}
    <div
      className={`absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full bg-${color}-500`}
    ></div>

    <div className="flex items-center justify-between">
      <div>
        <Statistic
          title={<span className="text-gray-500">{title}</span>}
          value={value}
          valueStyle={{ color: colorMap[color], fontSize: "24px" }}
        />
        <div className="text-xs mt-2">
          <span className="text-green-500 font-medium flex items-center gap-1">
            {subTitle}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div
          className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
    </div>

    {/* Nút điều hướng hiện đại */}
    {linkTo && (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <Link
          to={linkTo}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md bg-${color}-50 hover:bg-${color}-100 text-${color}-600 transition-all duration-300 group`}
        >
          <span className="font-medium text-sm">View Details</span>
          <div
            className={`w-6 h-6 rounded-full bg-${color}-500 flex items-center justify-center transform group-hover:translate-x-1 transition-transform duration-300`}
          >
            <ArrowRightOutlined className="text-white text-xs" />
          </div>
        </Link>
      </div>
    )}
  </Card>
);

// Màu sắc cho các thẻ thống kê
const colorMap = {
  blue: "#1890ff",
  purple: "#722ed1",
  green: "#52c41a",
  red: "#f5222d",
  orange: "#fa8c16",
  cyan: "#13c2c2",
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMovies: 0,
    totalRegistrations: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [revenueData, setRevenueData] = useState(null);
  const [movieDistribution, setMovieDistribution] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [allZero, setAllZero] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cấu hình biểu đồ - được memo hóa để tránh tạo lại
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            padding: 15,
            usePointStyle: true,
            font: {
              size: 12,
            },
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
          cornerRadius: 6,
          usePointStyle: true,
        },
        title: {
          display: false,
          text: "",
          font: {
            size: 16,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            maxTicksLimit: 5,
            callback: function (value) {
              if (this.chart.config._config.type === "line") {
                return formatVND(value).replace("₫", "").trim();
              }
              return value;
            },
          },
          grid: {
            display: true,
            color: "rgba(0, 0, 0, 0.05)",
            drawBorder: false,
          },
        },
        x: {
          ticks: {
            maxTicksLimit: 6,
            padding: 10,
          },
          grid: {
            display: false,
          },
        },
      },
      animation: {
        duration: 800, // Giảm thời gian animation
      },
      elements: {
        point: {
          radius: 3, // Kích thước điểm
          hoverRadius: 5,
          hitRadius: 8,
        },
        line: {
          tension: 0.4, // Độ cong của đường
          borderWidth: 2,
        },
        bar: {
          borderRadius: 6,
        },
      },
    }),
    []
  );

  // Xử lý dữ liệu thống kê
  const processStats = useCallback(async () => {
    try {
      // Kiểm tra cache
      const cachedStats = getCachedData("dashboard_stats");
      if (cachedStats) {
        setStats(cachedStats);
        setStatsLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Gửi các request song song để tăng tốc, thêm API contracts
      const [
        usersResponse,
        moviesResponse,
        registersResponse,
        subscriptionsResponse,
        contractsResponse, // Thêm API contracts
      ] = await Promise.all([
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/User/GetAllUser?page=0&pageSize=1000",
          { headers }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/Movie/GetListAllMovie?pageNumber=0&pageSize=1000",
          { headers }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/UserRegister/userRegister?page=0&pageSize=1000",
          { headers }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment?page=1&pageSize=1000",
          { headers }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/contracts?page=0&pageSize=1000",
          { headers }
        ),
      ]);

      const users = usersResponse.data?.users || [];
      const movies = moviesResponse.data?.movies || [];
      const registers = registersResponse.data?.users || [];
      const subscriptions =
        subscriptionsResponse.data?.data?.subscriptionPurchase || [];
      const contracts = contractsResponse.data?.contracts || []; // Lấy danh sách contracts

      const activeUsers = users.filter(
        (user) => user.status === "NORMAL"
      ).length;
      const totalRevenue = subscriptions.reduce(
        (sum, sub) => sum + (sub.totalPrice || 0),
        0
      );

      // Đếm số hợp đồng đang chờ phê duyệt
      const waitingContractsCount = contracts.filter(
        (contract) => contract.status === "WAITING_FOR_REVIEWING"
      ).length;

      const newStats = {
        totalUsers: users.length,
        totalMovies: movies.length,
        totalRegistrations: registers.length,
        totalSubscriptions: subscriptions.length,
        totalRevenue: totalRevenue,
        activeUsers: activeUsers,
        waitingContracts: waitingContractsCount, // Thêm số hợp đồng đang chờ
      };

      setStats(newStats);
      setCachedData("dashboard_stats", newStats);
    } catch (error) {
      console.error("Error getting stats:", error);
      notification.error({
        message: "Error",
        description: "Could not fetch statistics data",
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Xử lý dữ liệu biểu đồ
  const processCharts = useCallback(async () => {
    try {
      setChartsLoading(true);
      const token = localStorage.getItem("token");

      // Lấy dữ liệu từ các API cần thiết
      const [
        subscriptionsResponse,
        genresResponse,
        usersResponse,
        moviesResponse,
      ] = await Promise.all([
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment?page=1&pageSize=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/Genre?page=0&pageSize=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/User/GetAllUser?page=0&pageSize=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/Movie/GetListAllMovie?pageNumber=0&pageSize=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      // Lấy dữ liệu đơn giản từ API
      const subscriptions =
        subscriptionsResponse.data?.data?.subscriptionPurchase || [];
      const genres = genresResponse.data?.data || [];
      const users = usersResponse.data?.users || [];
      const movies = moviesResponse.data?.movies || [];

      // ===== BIỂU ĐỒ DOANH THU =====
      // Tạo dữ liệu biểu đồ doanh thu đơn giản
      const sortedSubscriptions = [...subscriptions]
        .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
        .slice(0, 6)
        .reverse();

      const labels = sortedSubscriptions.map((sub) => {
        const date = new Date(sub.createDate);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });

      const amounts = sortedSubscriptions.map((sub) => sub.amount || 0);

      // Nếu không có dữ liệu, thêm dữ liệu mẫu
      if (amounts.length === 0 || amounts.every((amount) => amount === 0)) {
        setAllZero(true);
        // Dữ liệu mẫu đơn giản
        const sampleLabels = ["1/5", "5/5", "10/5", "15/5", "20/5", "25/5"];
        const sampleAmounts = [
          500000, 1200000, 800000, 1500000, 2000000, 1800000,
        ];

        const newRevenueData = {
          labels: sampleLabels,
          datasets: [
            {
              label: "Revenue (VND)",
              data: sampleAmounts,
              fill: true,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              tension: 0.4,
            },
          ],
        };

        setRevenueData(newRevenueData);
      } else {
        setAllZero(false);
        const newRevenueData = {
          labels: labels,
          datasets: [
            {
              label: "Revenue (VND)",
              data: amounts,
              fill: true,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              tension: 0.4,
            },
          ],
        };

        setRevenueData(newRevenueData);
      }

      // ===== BIỂU ĐỒ THỂ LOẠI PHIM =====
      // Tạo dữ liệu biểu đồ phân bố thể loại phim
      const genreCounts = {};
      movies.forEach((movie) => {
        if (movie.genreNames) {
          const movieGenres = movie.genreNames.split(",").map((g) => g.trim());
          movieGenres.forEach((genre) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });

      // Sắp xếp thể loại theo số lượng phim giảm dần và lấy 6 thể loại hàng đầu
      const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      // Màu sắc đẹp cho biểu đồ
      const backgroundColors = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
      ];

      // Tạo dữ liệu cho biểu đồ Doughnut
      const newMovieDistribution = {
        labels: sortedGenres.map((g) => g[0]),
        datasets: [
          {
            data: sortedGenres.map((g) => g[1]),
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      };

      // ===== BIỂU ĐỒ NGƯỜI DÙNG MỚI =====
      // Tạo dữ liệu 6 tháng gần nhất
      const monthlyUsers = {};
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        const monthKey = `${date.getMonth() + 1}/${date
          .getFullYear()
          .toString()
          .substr(2, 2)}`;
        monthlyUsers[monthKey] = 0;
      }

      // Đếm người dùng theo tháng
      users.forEach((user) => {
        if (user.createDate) {
          const date = new Date(user.createDate);
          const monthKey = `${date.getMonth() + 1}/${date
            .getFullYear()
            .toString()
            .substr(2, 2)}`;

          if (monthlyUsers[monthKey] !== undefined) {
            monthlyUsers[monthKey]++;
          }
        }
      });

      // Tạo dữ liệu cho biểu đồ cột
      const userLabels = Object.keys(monthlyUsers);
      const userData = Object.values(monthlyUsers);

      const newUserGrowth = {
        labels: userLabels,
        datasets: [
          {
            label: "New Users",
            data: userData,
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      };

      // Cập nhật state cho tất cả biểu đồ
      setMovieDistribution(newMovieDistribution);
      setUserGrowth(newUserGrowth);
      setChartsLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu biểu đồ:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tải dữ liệu biểu đồ. Vui lòng thử lại sau.",
      });
      setChartsLoading(false);
    }
  }, []);

  // Xử lý dữ liệu hoạt động gần đây
  const processActivities = useCallback(async () => {
    try {
      // Kiểm tra cache
      const cachedActivities = getCachedData("dashboard_activities");
      if (cachedActivities) {
        // Cần chuyển đổi chuỗi thời gian trở lại thành đối tượng Date
        const activities = cachedActivities.map((activity) => ({
          ...activity,
          time: new Date(activity.time),
        }));
        setRecentActivities(activities);
        setActivitiesLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersResponse, subscriptionsResponse, moviesResponse] =
        await Promise.all([
          axios.get(
            "https://eigakan2222-001-site1.jtempurl.com/api/User/GetAllUser?page=0&pageSize=1000",
            { headers }
          ),
          axios.get(
            "https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment?page=1&pageSize=1000",
            { headers }
          ),
          axios.get(
            "https://eigakan2222-001-site1.jtempurl.com/api/Movie/GetListAllMovie?pageNumber=0&pageSize=1000",
            { headers }
          ),
        ]);

      const users = usersResponse.data?.users || [];
      const subscriptions =
        subscriptionsResponse.data?.data?.subscriptionPurchase || [];
      const movies = moviesResponse.data?.movies || [];

      // Tạo danh sách hoạt động từ dữ liệu
      const userActivities = users.map((user) => ({
        type: "user",
        title: `New User: ${user.fullName || "User"}`,
        time: new Date(user.createDate),
        data: user,
      }));

      const subscriptionActivities = subscriptions.map((sub) => ({
        type: "subscription",
        title: `New Subscription: ${
          sub.packageName || sub.subscriptionPackageId || "Subscription"
        }`,
        time: new Date(sub.createDate),
        data: sub,
      }));

      const movieActivities = movies.map((movie) => ({
        type: "movie",
        title: `New Movie: ${movie.title || "Movie"}`,
        time: new Date(movie.createDate || movie.releaseDate || Date.now()),
        data: movie,
      }));

      // Kết hợp tất cả hoạt động và sắp xếp theo thời gian
      const allActivities = [
        ...userActivities,
        ...subscriptionActivities,
        ...movieActivities,
      ]
        .filter((activity) => !isNaN(activity.time.getTime())) // Lọc các hoạt động có thời gian hợp lệ
        .sort((a, b) => b.time - a.time) // Sắp xếp giảm dần theo thời gian
        .slice(0, 20); // Giới hạn 20 hoạt động gần nhất

      setRecentActivities(allActivities);

      // Lưu vào cache (cần chuyển đổi Date thành chuỗi)
      setCachedData(
        "dashboard_activities",
        allActivities.map((activity) => ({
          ...activity,
          time: activity.time.toISOString(),
        }))
      );
    } catch (error) {
      console.error("Error fetching activities:", error);
      notification.error({
        message: "Error",
        description: "Could not fetch recent activities",
      });
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Thêm hàm handleRefresh để refresh thủ công
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setStatsLoading(true); // Add loading state for stats
    setChartsLoading(true); // Loading state for charts
    setActivitiesLoading(true); // Loading state for activities

    // Clear cache to force fetch new data
    localStorage.removeItem("dashboard_stats");
    localStorage.removeItem("dashboard_activities");

    // Call all fetch data functions
    Promise.all([processStats(), processCharts(), processActivities()])
      .then(() => {
        setRefreshing(false);
        setStatsLoading(false);
        setChartsLoading(false);
        setActivitiesLoading(false);
        notification.success({
          message: "Refresh Successful",
          description: "Dashboard data has been updated",
          duration: 2,
        });
      })
      .catch((error) => {
        console.error("Refresh error:", error);
        setRefreshing(false);
        setStatsLoading(false);
        setChartsLoading(false);
        setActivitiesLoading(false);
        notification.error({
          message: "Refresh Failed",
          description: "Could not update dashboard data",
          duration: 3,
        });
      });
  }, [processStats, processCharts, processActivities]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          processStats(),
          processCharts(),
          processActivities(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [processStats, processCharts, processActivities]);

  // Render skeleton cho biểu đồ
  const renderSkeletonChart = () => (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <Skeleton.Input style={{ width: 150, marginBottom: 16 }} active />
      <Skeleton.Input style={{ width: "100%", height: 300 }} active />
    </div>
  );

  // Render skeleton cho thẻ thống kê
  const renderSkeletonCard = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <Skeleton.Input style={{ width: 60, marginBottom: 8 }} active />
      <Skeleton.Input style={{ width: 120 }} active />
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {/* Chỉ giữ lại nút refresh */}
        <AntTooltip title="Refresh dashboard data">
          <Button
            type="primary"
            shape="circle"
            icon={refreshing ? <SyncOutlined spin /> : <ReloadOutlined />}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center"
          />
        </AntTooltip>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>{renderSkeletonCard()}</div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<UserOutlined className="text-2xl text-blue-500" />}
            color="blue"
            subTitle={`${Math.round(
              (stats.activeUsers / stats.totalUsers) * 100
            )}% active`}
            linkTo="/user"
          />
          <StatCard
            title="Total Movies"
            value={stats.totalMovies}
            icon={<PlayCircleOutlined className="text-2xl text-purple-500" />}
            color="purple"
            subTitle="Recently updated"
            linkTo="/admin/movieAdmin"
          />
          <StatCard
            title="Registrations"
            value={stats.totalRegistrations}
            icon={<FileTextOutlined className="text-2xl text-green-500" />}
            color="green"
            subTitle="Pending approval"
            linkTo="/userRegister"
          />
          <StatCard
            title="Revenue"
            value={formatVND(stats.totalRevenue)}
            icon={<DollarOutlined className="text-2xl text-red-500" />}
            color="red"
            subTitle="Total completed"
            linkTo="/admin/subscription-orders"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<StarOutlined className="text-2xl text-orange-500" />}
            color="orange"
            subTitle="Currently active"
            linkTo="/user"
          />
          <StatCard
            title="Contract Approvals"
            value={stats.waitingContracts}
            icon={<CheckCircleOutlined className="text-2xl text-cyan-500" />}
            color="cyan"
            subTitle="Waiting approval"
            linkTo="/admin/contract"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartsLoading ? (
          <>
            <div>{renderSkeletonChart()}</div>
            <div>{renderSkeletonChart()}</div>
          </>
        ) : (
          <>
            <Card
              title={
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-700 font-semibold">
                    Recent Revenue
                  </h3>
                  <Link
                    to="/admin/subscription-orders"
                    className="text-blue-500 text-sm hover:underline flex items-center"
                  >
                    View all <ArrowRightOutlined className="ml-1" />
                  </Link>
                </div>
              }
              bordered={false}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-80">
                {revenueData && (
                  <Line
                    data={revenueData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return formatVND(value).replace("₫", "").trim();
                            },
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `Revenue: ${formatVND(context.parsed.y)}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>
              {allZero && (
                <div className="text-center text-xs text-gray-500 mt-2">
                  * Sample data is shown due to no actual revenue data
                </div>
              )}
            </Card>

            <Card
              title={
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-700 font-semibold">
                    New Users by Month
                  </h3>
                  <Link
                    to="/user"
                    className="text-blue-500 text-sm hover:underline flex items-center"
                  >
                    View all <ArrowRightOutlined className="ml-1" />
                  </Link>
                </div>
              }
              bordered={false}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-80">
                {userGrowth && (
                  <Bar
                    data={userGrowth}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0, // Đảm bảo hiển thị số nguyên
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return `New Users: ${context.parsed.y}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartsLoading || activitiesLoading ? (
          <>
            <div>{renderSkeletonChart()}</div>
            <div>{renderSkeletonChart()}</div>
          </>
        ) : (
          <>
            <Card
              title={
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-700 font-semibold">
                    Movies by Genre
                  </h3>
                  <Link
                    to="/admin/genres"
                    className="text-blue-500 text-sm hover:underline flex items-center"
                  >
                    View all <ArrowRightOutlined className="ml-1" />
                  </Link>
                </div>
              }
              bordered={false}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-80 flex items-center justify-center">
                <div className="w-3/4">
                  {movieDistribution && (
                    <Doughnut
                      data={movieDistribution}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "right",
                            labels: {
                              padding: 20,
                              font: {
                                size: 12,
                              },
                              usePointStyle: true,
                              pointStyle: "circle",
                            },
                          },
                          tooltip: {
                            enabled: true,
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            titleFont: {
                              size: 14,
                              weight: "bold",
                            },
                            bodyFont: {
                              size: 13,
                            },
                            padding: 12,
                            caretSize: 6,
                            displayColors: true,
                            callbacks: {
                              label: function (context) {
                                const label = context.label || "";
                                const value = context.raw || 0;
                                const total =
                                  context.chart.data.datasets[0].data.reduce(
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
                        cutout: "60%",
                        animation: {
                          duration: 800,
                        },
                      }}
                    />
                  )}
                </div>
              </div>
            </Card>

            <Card
              title={
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-700 font-semibold">
                    Recent Activities
                  </h3>
                  <Link
                    to="/admin/contract"
                    className="text-blue-500 text-sm hover:underline flex items-center"
                  >
                    View all <ArrowRightOutlined className="ml-1" />
                  </Link>
                </div>
              }
              bordered={false}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-80 overflow-y-auto custom-scrollbar">
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start p-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            activity.type === "user"
                              ? "bg-blue-100 text-blue-500"
                              : activity.type === "subscription"
                              ? "bg-green-100 text-green-500"
                              : "bg-purple-100 text-purple-500"
                          }`}
                        >
                          {activity.type === "user" ? (
                            <UserOutlined />
                          ) : activity.type === "subscription" ? (
                            <ShoppingOutlined />
                          ) : (
                            <PlayCircleOutlined />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.time.toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                    <BellOutlined className="text-3xl mb-3 text-gray-300" />
                    No recent activities
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
