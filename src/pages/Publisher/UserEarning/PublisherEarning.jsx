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
import { SearchOutlined, EyeOutlined, DollarOutlined } from "@ant-design/icons";
import userEarningService from "../../../apis/UserEarning/userEarning";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PublisherEarning = () => {
  const [userEarnings, setUserEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [year, setYear] = useState(0);
  const [month, setMonth] = useState(0);
  const [day, setDay] = useState(0);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [finalEarnings, setFinalEarnings] = useState(0);
  const [webEarnings, setWebEarnings] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const daysOfWeek = [
    { value: 0, label: "All" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 7, label: "Sunday" },
  ];

  const fetchUserEarnings = async () => {
    try {
      setLoading(true);
      const response = await userEarningService.getUserEarningByLogin(
        year,
        month,
        day,
        dayOfWeek
      );

      if (response && response.data) {
        const formattedData = response.data.userEarnings.map((item) => ({
          ...item,
          key: item.id,
        }));

        setUserEarnings(formattedData);
        setTotalEarnings(response.data.totalEarnings || 0);
        setFinalEarnings(response.data.finalEarnings || 0);

        // Calculate total webEarnings from userEarnings array since API doesn't return it directly
        const totalWebEarnings = formattedData.reduce(
          (sum, item) => sum + (item.webEarnings || 0),
          0
        );
        setWebEarnings(totalWebEarnings);

        // Calculate total views from userEarnings
        const totalViewsCount = formattedData.reduce(
          (sum, item) => sum + (item.totalView || 0),
          0
        );
        setTotalViews(totalViewsCount);
      } else {
        setUserEarnings([]);
        notification.warning({
          message: "No Data Found",
          description: "No earnings data found",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not load earnings data",
      });
      setUserEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEarnings();
  }, [year, month, day, dayOfWeek]);

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const filteredData = userEarnings.filter((item) => {
    return searchText
      ? item.userName &&
          item.userName.toLowerCase().includes(searchText.toLowerCase())
      : true;
  });

  const columns = [
    {
      title: "Username",
      dataIndex: "userName",
      key: "userName",
      width: "15%",
    },
    {
      title: "Start Date",
      dataIndex: "startWeek",
      key: "startWeek",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      width: "10%",
    },
    {
      title: "End Date",
      dataIndex: "endWeek",
      key: "endWeek",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      width: "10%",
    },
    {
      title: "Total Views",
      dataIndex: "totalView",
      key: "totalView",
      width: "10%",
    },
    {
      title: "Total Earnings",
      dataIndex: "totalEarnings",
      key: "totalEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "15%",
    },
    {
      title: "Web Earnings",
      dataIndex: "webEarnings",
      key: "webEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "15%",
    },
    {
      title: "Final Earnings",
      dataIndex: "finalEarnings",
      key: "finalEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "15%",
    },
    {
      title: "Status",
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
        <title>Your Earnings</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Your Earnings
            </Title>
            <Text type="secondary">Track your earnings from movies</Text>
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
                title="Total Earnings"
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
                title="Web Earnings"
                value={loading ? "-" : formatVND(webEarnings)}
                prefix={<DollarOutlined className="text-blue-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Final Earnings"
                value={loading ? "-" : formatVND(finalEarnings)}
                prefix={<DollarOutlined className="text-green-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={24} lg={8}>
            <Input
              placeholder="Search by username..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={12} lg={4}>
            <Select
              placeholder="Select Year"
              style={{ width: "100%" }}
              onChange={(value) => setYear(value)}
              value={year}
            >
              <Option value={0}>All Years</Option>
              {years.map((year) => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={12} lg={4}>
            <Select
              placeholder="Select Month"
              style={{ width: "100%" }}
              onChange={(value) => setMonth(value)}
              value={month}
            >
              <Option value={0}>All Months</Option>
              {months.map((month) => (
                <Option key={month} value={month}>
                  Month {month}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={12} lg={4}>
            <Select
              placeholder="Select Day"
              style={{ width: "100%" }}
              onChange={(value) => setDay(value)}
              value={day}
            >
              <Option value={0}>All Days</Option>
              {days.map((day) => (
                <Option key={day} value={day}>
                  {day}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={12} lg={4}>
            <Select
              placeholder="Select Day of Week"
              style={{ width: "100%" }}
              onChange={(value) => setDayOfWeek(value)}
              value={dayOfWeek}
            >
              {daysOfWeek.map((day) => (
                <Option key={day.value} value={day.value}>
                  {day.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.id || record.key}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default PublisherEarning;
