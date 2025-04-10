import React, { useState, useEffect } from "react";
import { Table, Card, Input, Row, Col, Statistic, Typography } from "antd";
import { SearchOutlined, DollarOutlined } from "@ant-design/icons";
import axios from "axios";
import { Helmet } from "react-helmet";
import { notification } from "antd";

const { Title, Text } = Typography;

const SubscriptionOrderManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalActiveAmount, setTotalActiveAmount] = useState(0);
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState(0);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment?page=1&pageSize=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const orderData = response.data.data.subscriptionPurchase || [];
        const total = response.data.data.total || 0;
        const totalEarnings = response.data.data.totalEarnings || 0;
        const activeCount = response.data.data.activeSubscriptionCount || 0;

        // Sử dụng dữ liệu từ API mà không cần xử lý thêm
        const formattedOrders = orderData.map((order) => ({
          ...order,
          key: order.id,
        }));

        setAllOrders(formattedOrders);
        setData(formattedOrders);
        setTotalOrders(total);
        setTotalAmount(totalEarnings);
        setActiveSubscriptionCount(activeCount);
        setPagination((prev) => ({
          ...prev,
          total: total,
        }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.success) {
        const orderData = response?.data?.data?.subscriptionPurchase ?? [];
        const total = response?.data?.data?.total ?? 0;
        const totalEarnings = response?.data?.data?.totalEarnings ?? 0;
        const activeCount = response?.data?.data?.activeSubscriptionCount ?? 0;

        // Sử dụng dữ liệu từ API mà không cần xử lý thêm
        const formattedOrders = orderData.map((order) => ({
          ...order,
          key: order.id,
        }));

        setData(formattedOrders);
        setTotalOrders(total);
        setTotalAmount(totalEarnings);
        setActiveSubscriptionCount(activeCount);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: total,
        }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      notification.error({
        message: "Error",
        description: error.message || "Could not fetch orders",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize);
    fetchAllOrders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filteredResults = allOrders.filter(
        (order) =>
          order.id?.toString().includes(searchTerm) ||
          order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.subscriptionId?.toString().includes(searchTerm)
      );
      setData(filteredResults);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filteredResults.length,
      }));
    } else {
      fetchOrders(pagination.current, pagination.pageSize);
    }
  }, [searchTerm]);

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      width: "10%",
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      width: "15%",
    },
    {
      title: "Subscription ID",
      dataIndex: "subscriptionId",
      key: "subscriptionId",
      width: "15%",
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      width: "15%",
      render: (date) => new Date(date).toLocaleDateString("en-US"),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiredDate",
      key: "expiredDate",
      width: "15%",
      render: (date) => new Date(date).toLocaleDateString("en-US"),
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: "10%",
      render: (price) => formatVND(price),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "10%",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "Active"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: "10%",
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Subscription Orders Management</title>
      </Helmet>

      <Card title="Subscription Orders" className="shadow-md">
        <div className="mb-4">
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} md={12}>
              <Card className="border-l-4 border-l-blue-500">
                <Statistic
                  title="Total Orders Amount"
                  value={loading ? "-" : formatVND(totalAmount)}
                  prefix={<DollarOutlined className="text-blue-500" />}
                  precision={0}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="border-l-4 border-l-green-500">
                <Statistic
                  title="Active Subscriptions"
                  value={loading ? "-" : activeSubscriptionCount}
                  prefix={<DollarOutlined className="text-green-500" />}
                  precision={0}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <div className="flex justify-center mb-6">
          <Input
            placeholder="Search by Transaction ID, User name, or Subscription ID..."
            prefix={<SearchOutlined className="text-gray-400" />}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[400px]"
            size="large"
          />
        </div>

        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            total: totalOrders,
            showTotal: (total) => `Total ${total} orders`,
            onChange: (page, pageSize) => {
              if (!searchTerm) {
                fetchOrders(page, pageSize);
              }
            },
            onShowSizeChange: (current, size) => {
              if (!searchTerm) {
                fetchOrders(current, size);
              }
            },
            size: "default",
            showLessItems: true,
          }}
          loading={loading}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default SubscriptionOrderManagement;
