import React, { useState, useEffect } from "react";
import { Table } from "antd";
import subscriptionService from "../../apis/Subscription/subscription";
import { Helmet } from "react-helmet";

const SubscriptionHistory = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await subscriptionService.getAllPurchaseHistory();
        if (response.success) {
          const subscriptionData = response.data.subscriptionPurchase || [];
          setData(subscriptionData.map((item) => ({ ...item, key: item.id })));
        }
      } catch (error) {
        console.error("Error fetching subscription history:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
      width: "20%",
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (date) => new Date(date).toLocaleDateString("en-US"),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiredDate",
      key: "expiredDate",
      render: (date) => new Date(date).toLocaleDateString("en-US"),
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => formatVND(price),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
    <div className="p-6 bg-[#0F172A] min-h-screen">
      <Helmet>
        <title>Subscription History</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          Subscription History
        </h1>

        <div className="bg-[#1E293B] rounded-lg shadow-lg overflow-hidden">
          <div
            className="
            [&_.ant-table]:bg-transparent [&_.ant-table]:text-white
            [&_.ant-table-thead>tr>th]:bg-[#0F172A] [&_.ant-table-thead>tr>th]:text-white [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[#334155]
            [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[#334155] [&_.ant-table-tbody>tr>td]:text-[#94A3B8]
            [&_.ant-table-tbody>tr:hover>td]:bg-[#2D3B4F] [&_.ant-table-tbody>tr.ant-table-row:hover>td]:bg-[#2D3B4F]
            [&_.ant-empty-description]:text-[#94A3B8]
          "
          >
            <Table
              columns={columns}
              dataSource={data}
              pagination={false}
              loading={loading}
              rowKey="id"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionHistory;
