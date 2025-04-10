import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  notification,
  Input,
  DatePicker,
  Row,
  Col,
  Statistic,
} from "antd";
import { SearchOutlined, EyeOutlined, DollarOutlined } from "@ant-design/icons";
import movieEarningService from "../../../apis/MovieEarning/MovieEarning";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const MovieEarning = () => {
  const [movieEarnings, setMovieEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [totalViews, setTotalViews] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalEarningsMovieContract, setTotalEarningsMovieContract] =
    useState(0);

  const fetchMovieEarnings = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true);
      const response = await movieEarningService.getAllMovieEarning(
        page,
        pageSize
      );

      if (response?.data?.data) {
        const formattedData = response.data.data.movieEarning.map((item) => ({
          ...item,
          key: item.id,
        }));

        setMovieEarnings(formattedData);

        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: response.data.data.totalItems || 0,
        });

        setTotalViews(response.data.data.totalView || 0);
        setTotalEarnings(response.data.data.totalEarnings || 0);
        setTotalEarningsMovieContract(
          response.data.data.totalEarningsMovieContract || 0
        );
      } else {
        // Xử lý khi không có dữ liệu hoặc response không như mong đợi
        setMovieEarnings([]);
        notification.warning({
          message: "No Data",
          description: "No movie earnings data found",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not load movie earnings data",
      });
      setMovieEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieEarnings(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (pagination) => {
    fetchMovieEarnings(pagination.current, pagination.pageSize);
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const filteredData = movieEarnings.filter((item) => {
    const matchesSearch = searchText
      ? item.movieName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.userId.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const matchesDate = dateRange
      ? (dayjs(item.startWeek).isAfter(dateRange[0]) ||
          dayjs(item.startWeek).isSame(dateRange[0], "day")) &&
        (dayjs(item.endWeek).isBefore(dateRange[1]) ||
          dayjs(item.endWeek).isSame(dateRange[1], "day"))
      : true;

    return matchesSearch && matchesDate;
  });

  const columns = [
    {
      title: "Movie Name",
      dataIndex: "movieName",
      key: "movieName",
      width: "25%",
      render: (text, record) => (
        <Link to={`/admin/movie/${record.movieId}`}>{text}</Link>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startWeek",
      key: "startWeek",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      width: "15%",
    },
    {
      title: "End Date",
      dataIndex: "endWeek",
      key: "endWeek",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      width: "15%",
    },
    {
      title: "Views",
      dataIndex: "totalView",
      key: "totalView",
      width: "15%",
    },
    {
      title: "Earnings",
      dataIndex: "totalEarnings",
      key: "totalEarnings",
      render: (earnings) => formatVND(earnings),
      width: "15%",
    },
    {
      title: "Created At",
      dataIndex: "createDate",
      key: "createDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      width: "15%",
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Movie Earnings</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Movie Earnings
            </Title>
            <Text type="secondary">
              Manage movie earnings across the platform
            </Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-purple-500">
              <Statistic
                title="Total Views"
                value={loading ? "-" : totalViews}
                prefix={<EyeOutlined className="text-purple-500" />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-red-500">
              <Statistic
                title="Total Earnings (all movies)"
                value={loading ? "-" : formatVND(totalEarnings)}
                prefix={<DollarOutlined className="text-red-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Total Earnings (movies have contract)"
                value={loading ? "-" : formatVND(totalEarningsMovieContract)}
                prefix={<DollarOutlined className="text-blue-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12}>
            <Input
              placeholder="Search by movie name..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={12}>
            <RangePicker
              style={{ width: "100%" }}
              onChange={(dates) => setDateRange(dates)}
              format="DD/MM/YYYY"
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default MovieEarning;
