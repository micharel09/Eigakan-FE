import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Card, Table, Spin, notification, Tooltip } from "antd";
import {
  PlayCircleOutlined,
  EyeOutlined,
  DollarOutlined,
  StarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Link } from "react-router-dom";

// Format tiền Việt Nam
const formatVND = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const PublisherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeMovies: 0,
    totalViews: 0,
    totalRevenue: 0,
  });
  const [recentMovies, setRecentMovies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Columns cho bảng phim
  const columns = [
    {
      title: "Movie Name",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Link
          to={`/publisher/movie/${record.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let statusText = "";
        let statusClass = "";

        switch (status) {
          case "ACTIVE":
            statusText = "Active";
            statusClass = "bg-green-100 text-green-600";
            break;
          case "WAITING_FOR_REVIEWING":
            statusText = "Pending Review";
            statusClass = "bg-yellow-100 text-yellow-600";
            break;
          case "REJECTED":
            statusText = "Rejected";
            statusClass = "bg-red-100 text-red-600";
            break;
          case "ACCEPTED_NEGOTIATING":
            statusText = "Negotiating";
            statusClass = "bg-blue-100 text-blue-600";
            break;
          case "ARCHIVED":
            statusText = "Archived";
            statusClass = "bg-gray-100 text-gray-600";
            break;
          default:
            statusText = status;
            statusClass = "bg-gray-100 text-gray-600";
        }

        return (
          <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
            {statusText}
          </span>
        );
      },
    },
    {
      title: "Views",
      dataIndex: "viewCount",
      key: "viewCount",
      render: (viewCount) => viewCount?.toLocaleString() || 0,
    },
    {
      title: "Contract Price",
      dataIndex: "contractPrice",
      key: "contractPrice",
      render: (_, record) => {
        const contract = record.contract;
        return formatVND(contract?.price || 0);
      },
    },
    {
      title: "Created Date",
      dataIndex: "medias",
      key: "createDate",
      render: (medias) => {
        // Lấy createDate từ media đầu tiên nếu có
        const createDate = medias?.[0]?.createDate;
        if (!createDate) return "N/A";
        return new Date(createDate).toLocaleDateString("en-US");
      },
    },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Gọi API phim và hợp đồng song song
      const [moviesResponse, contractsResponse] = await Promise.all([
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/Movie/GetListMovieByLogin?pageNumber=0&pageSize=1000",
          { headers }
        ),
        axios.get(
          "https://eigakan2222-001-site1.jtempurl.com/api/contracts/GetAllContractUserByLogin?page=0&pageSize=1000",
          { headers }
        ),
      ]);

      const movies = moviesResponse.data?.movies || [];
      const contracts = contractsResponse.data?.contracts || [];

      // Hợp đồng đã được ký
      const signedContracts = contracts.filter(
        (contract) => contract.status === "SIGNED"
      );

      // Tính toán thống kê
      const activeMovies = movies.filter(
        (movie) => movie.status === "ACTIVE"
      ).length;

      const totalViews = movies.reduce(
        (sum, movie) => sum + (movie.viewCount || 0),
        0
      );

      // Tính tổng doanh thu từ hợp đồng đã ký
      const totalRevenue = signedContracts.reduce(
        (sum, contract) => sum + (contract.price || 0),
        0
      );

      // Cập nhật state
      setStats({
        activeMovies,
        totalViews,
        totalRevenue,
      });

      // Lấy phim gần đây nhất để hiển thị trong bảng
      const sortedMovies = [...movies].sort(
        (a, b) =>
          new Date(b.submissionDate || 0) - new Date(a.submissionDate || 0)
      );

      // Kết hợp thông tin phim với hợp đồng
      const moviesWithContracts = sortedMovies.slice(0, 5).map((movie) => {
        const contract = contracts.find((c) => c.movie?.id === movie.id);
        return {
          key: movie.id,
          ...movie,
          contract: contract || null,
          medias: movie.medias || [],
        };
      });

      setRecentMovies(moviesWithContracts);
    } catch (error) {
      console.error("Error fetching publisher data:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch data. Please try again later.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Hàm refresh thủ công
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-4">
      <Helmet>
        <title>Publisher Dashboard | EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Publisher Dashboard</h1>
        <Tooltip title="Refresh Data">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded bg-blue-50 text-blue-500 hover:bg-blue-100"
          >
            <CalendarOutlined spin={refreshing} />
          </button>
        </Tooltip>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-sm bg-white">
              <div className="flex items-center">
                <div className="mr-4 p-3 rounded-full bg-pink-100">
                  <PlayCircleOutlined className="text-lg text-pink-500" />
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.activeMovies}</div>
                  <div className="text-gray-500">Active Movies</div>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm bg-white">
              <div className="flex items-center">
                <div className="mr-4 p-3 rounded-full bg-green-100">
                  <EyeOutlined className="text-lg text-green-500" />
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <div className="text-gray-500">Total Views</div>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm bg-white">
              <div className="flex items-center">
                <div className="mr-4 p-3 rounded-full bg-orange-100">
                  <DollarOutlined className="text-lg text-orange-500" />
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {formatVND(stats.totalRevenue)}
                  </div>
                  <div className="text-gray-500">Movie Revenue</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Movies</h2>
              <Link
                to="/publisher/movie"
                className="text-pink-500 hover:text-pink-600"
              >
                View All
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <Table
                columns={columns}
                dataSource={recentMovies}
                pagination={false}
                locale={{ emptyText: "No movie data available" }}
                className="rounded-lg overflow-hidden"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PublisherDashboard;
