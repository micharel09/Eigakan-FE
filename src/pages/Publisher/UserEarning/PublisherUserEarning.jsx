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
  Tag,
  Select,
} from "antd";
import { SearchOutlined, DollarOutlined, EyeOutlined } from "@ant-design/icons";
import userEarningService from "../../../apis/UserEarning/userEarning";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PublisherUserEarning = () => {
  const [userEarnings, setUserEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [yearFilter, setYearFilter] = useState(0);
  const [monthFilter, setMonthFilter] = useState(0);
  const [dayFilter, setDayFilter] = useState(0);
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState(0);
  const [statistics, setStatistics] = useState({
    totalEarnings: 0,
    finalEarnings: 0,
    totalViews: 0,
  });

  const fetchUserEarnings = async () => {
    try {
      setLoading(true);
      const response = await userEarningService.getUserEarningByLogin();

      if (!response || !response.data) {
        throw new Error("No response received from server");
      }

      const { data } = response;

      if (data.total > 0 && Array.isArray(data.userEarnings)) {
        const formattedData = data.userEarnings.map((item) => ({
          ...item,
          key: item.id,
          totalEarnings: Number(item.totalEarnings || 0),
          webEarnings: Number(item.webEarnings || 0),
          finalEarnings: Number(item.finalEarnings || 0),
          totalView: Number(item.totalView || 0),
        }));

        setUserEarnings(formattedData);
        setStatistics({
          totalEarnings: Number(data.totalEarnings || 0),
          finalEarnings: Number(data.finalEarnings || 0),
          totalViews: Number(data.totalViews || data.total || 0),
        });
      } else {
        setUserEarnings([]);
        setStatistics({
          totalEarnings: 0,
          finalEarnings: 0,
          totalViews: 0,
        });

        if (data.total === 0) {
          notification.info({
            message: "No Data",
            description: "No earnings data found for the selected filters",
          });
        }
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not load earnings data",
      });
      setUserEarnings([]);
      setStatistics({
        totalEarnings: 0,
        finalEarnings: 0,
        totalViews: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEarnings();
  }, []);

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const filteredData = userEarnings.filter((item) => {
    const matchesSearch = searchText
      ? item.userName?.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const matchesDate = dateRange
      ? (dayjs(item.startWeek).isAfter(dateRange[0]) ||
          dayjs(item.startWeek).isSame(dateRange[0], "day")) &&
        (dayjs(item.endWeek).isBefore(dateRange[1]) ||
          dayjs(item.endWeek).isSame(dateRange[1], "day"))
      : true;

    const matchesYear =
      yearFilter !== 0
        ? dayjs(item.startWeek).year() === yearFilter ||
          dayjs(item.endWeek).year() === yearFilter
        : true;

    const matchesMonth =
      monthFilter !== 0
        ? dayjs(item.startWeek).month() + 1 === monthFilter ||
          dayjs(item.endWeek).month() + 1 === monthFilter
        : true;

    const matchesDay =
      dayFilter !== 0
        ? dayjs(item.startWeek).date() === dayFilter ||
          dayjs(item.endWeek).date() === dayFilter
        : true;

    const matchesDayOfWeek =
      dayOfWeekFilter !== 0
        ? dayjs(item.startWeek).day() === dayOfWeekFilter % 7 ||
          dayjs(item.endWeek).day() === dayOfWeekFilter % 7
        : true;

    return (
      matchesSearch &&
      matchesDate &&
      matchesYear &&
      matchesMonth &&
      matchesDay &&
      matchesDayOfWeek
    );
  });

  useEffect(() => {
    if (filteredData.length > 0) {
      const totalEarnings = filteredData.reduce(
        (sum, item) => sum + (item.totalEarnings || 0),
        0
      );
      const finalEarnings = filteredData.reduce(
        (sum, item) => sum + (item.finalEarnings || 0),
        0
      );
      const totalViews = filteredData.reduce(
        (sum, item) => sum + (item.totalView || 0),
        0
      );

      setStatistics({
        totalEarnings,
        finalEarnings,
        totalViews,
      });
    } else if (userEarnings.length > 0 && filteredData.length === 0) {
      setStatistics({
        totalEarnings: 0,
        finalEarnings: 0,
        totalViews: 0,
      });
    }
  }, [filteredData, userEarnings]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
      width: "10%",
    },
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
      ellipsis: true,
      width: "15%",
    },
    {
      title: "Start Week",
      dataIndex: "startWeek",
      key: "startWeek",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      width: "12%",
    },
    {
      title: "End Week",
      dataIndex: "endWeek",
      key: "endWeek",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      width: "12%",
    },
    {
      title: "Total View",
      dataIndex: "totalView",
      key: "totalView",
      width: "10%",
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: "Total Earnings",
      dataIndex: "totalEarnings",
      key: "totalEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "12%",
    },
    {
      title: "Web Earnings",
      dataIndex: "webEarnings",
      key: "webEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "12%",
    },
    {
      title: "Final Earnings",
      dataIndex: "finalEarnings",
      key: "finalEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "12%",
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) =>
        status ? (
          <Tag color="success">Paid</Tag>
        ) : (
          <Tag color="warning">Unpaid</Tag>
        ),
      width: "10%",
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Publisher Earnings</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              My Earnings
            </Title>
            <Text type="secondary">
              Track your earnings from published movies
            </Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={8}>
            <Card className="border-l-4 border-l-purple-500">
              <Statistic
                title="Total Views"
                value={loading ? "-" : statistics.totalViews}
                prefix={<EyeOutlined className="text-purple-500" />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
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
          <Col xs={24} md={8}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Final Earnings"
                value={loading ? "-" : formatVND(statistics.finalEarnings)}
                prefix={<DollarOutlined className="text-green-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={6}>
            <Select
              placeholder="Select year"
              style={{ width: "100%" }}
              value={yearFilter || 0}
              onChange={(value) => setYearFilter(value)}
            >
              <Option value={0}>All Years</Option>
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Select month"
              style={{ width: "100%" }}
              value={monthFilter || 0}
              onChange={(value) => setMonthFilter(value)}
            >
              <Option value={0}>All Months</Option>
              <Option value={1}>January</Option>
              <Option value={2}>February</Option>
              <Option value={3}>March</Option>
              <Option value={4}>April</Option>
              <Option value={5}>May</Option>
              <Option value={6}>June</Option>
              <Option value={7}>July</Option>
              <Option value={8}>August</Option>
              <Option value={9}>September</Option>
              <Option value={10}>October</Option>
              <Option value={11}>November</Option>
              <Option value={12}>December</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Select day"
              style={{ width: "100%" }}
              value={dayFilter || 0}
              onChange={(value) => setDayFilter(value)}
            >
              <Option value={0}>All Days</Option>
              {Array.from({ length: 31 }, (_, i) => (
                <Option key={i + 1} value={i + 1}>
                  {i + 1}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Select day of week"
              style={{ width: "100%" }}
              value={dayOfWeekFilter || 0}
              onChange={(value) => setDayOfWeekFilter(value)}
            >
              <Option value={0}>All Days of Week</Option>
              <Option value={1}>Monday</Option>
              <Option value={2}>Tuesday</Option>
              <Option value={3}>Wednesday</Option>
              <Option value={4}>Thursday</Option>
              <Option value={5}>Friday</Option>
              <Option value={6}>Saturday</Option>
              <Option value={7}>Sunday</Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12}>
            <Input
              placeholder="Search by user name..."
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
          pagination={{ pageSize: 5 }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default PublisherUserEarning;
