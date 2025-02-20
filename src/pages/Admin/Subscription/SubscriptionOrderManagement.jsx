import React, { useState, useEffect } from "react";
import { Table, Tag, Card } from "antd";
import axios from "axios";
import { Helmet } from "react-helmet";

const SubscriptionOrderManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchOrders = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://eigakan1111-001-site1.qtempurl.com/api/SubscriptionPurchasePayment?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Lấy data từ đúng cấu trúc API
        const orderData = response.data.data.subscriptionPurchase || [];

        // Thêm key cho mỗi item
        const dataWithKeys = orderData.map((item) => ({
          ...item,
          key: item.id,
        }));

        setData(dataWithKeys);
        setPagination({
          ...pagination,
          total: response.data.data.total || 0,
          current: page,
          pageSize: pageSize,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription orders:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (newPagination) => {
    fetchOrders(newPagination.current, newPagination.pageSize);
  };

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
      width: "15%",
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
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
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Subscription Orders Management</title>
      </Helmet>

      <Card title="Subscription Orders" className="shadow-md">
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
          loading={loading}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default SubscriptionOrderManagement;
