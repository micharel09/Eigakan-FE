import React from "react";
import { Card, Row, Col, Statistic, Table } from "antd";
import { Helmet } from "react-helmet";
import {
  PlayCircleOutlined,
  EyeOutlined,
  DollarCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";

const AdvertiserDashboard = () => {
  // Dữ liệu mẫu cho bảng
  const columns = [
    {
      title: "Campaign Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "Active"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Views",
      dataIndex: "views",
      key: "views",
    },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      render: (budget) => `${budget.toLocaleString()}đ`,
    },
  ];

  const data = [
    {
      key: "1",
      name: "Summer Campaign",
      status: "Active",
      views: 1234,
      budget: 5000000,
    },
    {
      key: "2",
      name: "Winter Sale",
      status: "Inactive",
      views: 890,
      budget: 3000000,
    },
  ];

  return (
    <div className="advertiser-dashboard">
      <Helmet>
        <title>Advertiser Dashboard | EIGAKAN</title>
      </Helmet>

      <h1 className="text-2xl font-bold mb-6">Advertiser Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={5}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: "#FF009F" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title="Total Views"
              value={1234}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title="Total Spent"
              value={9999000}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="shadow-sm">
            <Statistic
              title="Conversion Rate"
              value={8.5}
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#1890ff" }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <div className="mt-8">
        <Card
          title="Recent Campaigns"
          className="shadow-sm"
          extra={
            <button className="text-[#FF009F] hover:text-[#D1007F]">
              View All
            </button>
          }
        >
          <Table columns={columns} dataSource={data} pagination={false} />
        </Card>
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
