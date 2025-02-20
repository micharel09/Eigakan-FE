import React, { useState, useEffect } from "react";
import { Table, Tag } from "antd";
import subscriptionService from "../../apis/Subscription/subscription";
import { Helmet } from "react-helmet";

const SubscriptionHistory = () => {
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
      const response = await subscriptionService.getAllPurchaseHistory(
        page,
        pageSize
      );

      if (response.success) {
        // Lấy data từ đúng cấu trúc API
        const subscriptionData = response.data.subscriptionPurchase || [];

        // Thêm key cho mỗi item
        const dataWithKeys = subscriptionData.map((item) => ({
          ...item,
          key: item.id,
        }));

        setData(dataWithKeys);
        setPagination({
          ...pagination,
          total: response.data.total || 0,
          current: page,
          pageSize: pageSize,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription history:", error);
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
          <Table
            columns={columns}
            dataSource={data}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} items`,
              className: "custom-pagination",
            }}
            onChange={handleTableChange}
            loading={loading}
            rowKey="id"
            className="custom-table"
          />
        </div>
      </div>

      <style jsx="true">{`
        .custom-table {
          background: #1e293b;
          color: #fff;
        }

        .custom-table .ant-table {
          background: transparent;
          color: #fff;
        }

        .custom-table .ant-table-thead > tr > th {
          background: #0f172a !important;
          color: #fff !important;
          border-bottom: 1px solid #334155;
        }

        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155;
          color: #94a3b8;
        }

        .custom-table .ant-table-tbody > tr:hover > td {
          background: #2d3b4f !important;
        }

        .custom-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #2d3b4f !important;
        }

        .custom-table .ant-empty-description {
          color: #94a3b8;
        }

        .custom-table .ant-pagination {
          color: #fff;
        }

        .custom-table .ant-pagination-item {
          background: transparent;
          border-color: #334155;
        }

        .custom-table .ant-pagination-item a {
          color: #94a3b8;
        }

        .custom-table .ant-pagination-item-active {
          background: #ff009e;
          border-color: #ff009e;
        }

        .custom-table .ant-pagination-item-active a {
          color: #fff;
        }

        .custom-table .ant-pagination-prev button,
        .custom-table .ant-pagination-next button {
          background: transparent;
          color: #94a3b8;
        }

        .custom-table .ant-select-selector {
          background: #1e293b !important;
          color: #fff !important;
          border-color: #334155 !important;
        }

        .custom-table .ant-select-arrow {
          color: #94a3b8;
        }

        .custom-table .ant-table-column-sorter {
          color: #94a3b8;
        }

        .ant-select-dropdown {
          background: #1e293b !important;
        }

        .ant-select-item {
          color: #94a3b8 !important;
        }

        .ant-select-item-option-selected {
          background: #2d3b4f !important;
        }

        .ant-select-item-option-active {
          background: #2d3b4f !important;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionHistory;
