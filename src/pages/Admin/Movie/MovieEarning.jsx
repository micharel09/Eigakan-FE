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
import movieEarningService from "../../../apis/MovieEarning/movieEarning";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";

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
  const [statistics, setStatistics] = useState({
    totalEarnings: 0,
    totalViews: 0,
  });

  const fetchMovieEarnings = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true);
      const response = await movieEarningService.getMovieEarning(
        page,
        pageSize
      );

      if (response) {
        const formattedData = response.item1.map((item) => ({
          ...item,
          key: item.id,
        }));

        setMovieEarnings(formattedData);
        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: response.item2 || 0,
        });

        // Calculate total earnings and views
        calculateStatistics(formattedData);
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

  const calculateStatistics = (data) => {
    const totalEarnings = data.reduce(
      (sum, item) => sum + item.totalEarnings,
      0
    );
    const totalViews = data.reduce((sum, item) => sum + item.totalView, 0);

    setStatistics({
      totalEarnings,
      totalViews,
    });
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
                value={loading ? "-" : statistics.totalViews}
                prefix={<EyeOutlined className="text-purple-500" />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-red-500">
              <Statistic
                title="Total Earnings"
                value={loading ? "-" : formatVND(statistics.totalEarnings)}
                prefix={<DollarOutlined className="text-red-500" />}
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
