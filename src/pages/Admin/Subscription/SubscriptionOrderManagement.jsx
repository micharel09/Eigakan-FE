import React, { useState, useEffect } from "react";
import { Table, Tag, Card, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import { Helmet } from "react-helmet";
import UserApi from "../../../apis/User/user";

const SubscriptionOrderManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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

        const ordersWithUserDetails = await Promise.all(
          orderData.map(async (order) => {
            try {
              const userResponse = await UserApi.getUserDetail(order.userId);
              return {
                ...order,
                key: order.id,
                userName: userResponse.data.fullName || "Unknown User",
                userEmail: userResponse.data.email || "N/A",
              };
            } catch (error) {
              console.error(
                `Error fetching user details for ID ${order.userId}:`,
                error
              );
              return {
                ...order,
                key: order.id,
                userName: "Unknown User",
                userEmail: "N/A",
              };
            }
          })
        );

        setAllOrders(ordersWithUserDetails);
        setData(ordersWithUserDetails);
        setPagination((prev) => ({
          ...prev,
          total: ordersWithUserDetails.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (page = 1, pageSize = 10) => {
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

      if (response.data.success) {
        const orderData = response.data.data.subscriptionPurchase || [];

        const ordersWithUserDetails = await Promise.all(
          orderData.map(async (order) => {
            try {
              const userResponse = await UserApi.getUserDetail(order.userId);
              return {
                ...order,
                key: order.id,
                userName: userResponse.data.fullName || "Unknown User",
                userEmail: userResponse.data.email || "N/A",
              };
            } catch (error) {
              console.error(
                `Error fetching user details for ID ${order.userId}:`,
                error
              );
              return {
                ...order,
                key: order.id,
                userName: "Unknown User",
                userEmail: "N/A",
              };
            }
          })
        );

        setData(ordersWithUserDetails);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response.data.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
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
          order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.packageId?.toString().includes(searchTerm)
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
      key: "user",
      width: "20%",
      render: (record) => (
        <div>
          <div className="font-medium">{record.userName}</div>
          <div className="text-gray-500 text-sm">{record.userEmail}</div>
        </div>
      ),
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
        <div className="flex justify-center mb-6">
          <Input
            placeholder="Tìm kiếm theo ID giao dịch, tên người dùng, email hoặc ID gói..."
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
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={(newPagination) => {
            if (!searchTerm) {
              fetchOrders(newPagination.current, newPagination.pageSize);
              setPagination(newPagination);
            } else {
              setPagination(newPagination);
            }
          }}
          loading={loading}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default SubscriptionOrderManagement;
