import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Button,
  Spin,
  Input,
  Select,
  DatePicker,
  Space,
  Empty,
  notification,
  Tooltip,
  ConfigProvider,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CalendarOutlined,
  ReloadOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import adPurchaseSlotService from "../../../apis/AdPurchaseSlot/adPurchaseSlot";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Custom theme with brand color
const theme = {
  token: {
    colorPrimary: "#FF009F",
    colorLink: "#FF009F",
  },
};

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const navigate = useNavigate();

  const fetchAllPayments = useCallback(async () => {
    try {
      const response =
        await adPurchaseSlotService.getAllAdPurchaseTransactions();
      if (response.success) {
        const allData = response.data || [];
        setAllPayments(allData);

        setPagination((prev) => ({
          ...prev,
          total: allData.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching all payments:", error);
    }
  }, []);

  const fetchPayments = useCallback(async (page = 1, pageSize = 5) => {
    setLoading(true);
    try {
      const response = await adPurchaseSlotService.getAdPurchaseTransactions(
        page,
        pageSize
      );
      if (response.success) {
        setPayments(response.data || []);
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch payment history",
        });
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch payment history",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPayments();
    fetchPayments(pagination.current, pagination.pageSize);
  }, [
    fetchAllPayments,
    fetchPayments,
    pagination.current,
    pagination.pageSize,
  ]);

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
    }));
    fetchPayments(newPagination.current, newPagination.pageSize);
  };

  const handleViewDetails = (id) => {
    navigate(`/advertiser/payment-details/${id}`);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    applyFilters(value, statusFilter, dateRange);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    applyFilters(searchText, value, dateRange);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    applyFilters(searchText, statusFilter, dates);
  };

  const handleReset = () => {
    setSearchText("");
    setStatusFilter(null);
    setDateRange(null);
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
    fetchPayments(1, pagination.pageSize);
  };

  const applyFilters = (search, status, dates) => {
    let filteredData = [...allPayments];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        (payment) =>
          payment.id.toLowerCase().includes(searchLower) ||
          (payment.paymentReferenceID &&
            payment.paymentReferenceID.toLowerCase().includes(searchLower)) ||
          payment.totalPrice.toString().includes(searchLower)
      );
    }

    if (status) {
      filteredData = filteredData.filter(
        (payment) => payment.status.toUpperCase() === status.toUpperCase()
      );
    }

    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].startOf("day").valueOf();
      const endDate = dates[1].endOf("day").valueOf();

      filteredData = filteredData.filter((payment) => {
        const paymentDate = new Date(payment.createAt).getTime();
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    const startIndex = 0;
    const endIndex = Math.min(pagination.pageSize, filteredData.length);
    setPayments(filteredData.slice(startIndex, endIndex));

    setPagination({
      ...pagination,
      current: 1,
      total: filteredData.length,
    });
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    })
      .format(amount)
      .replace("₫", "VND");
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      SUCCESS: {
        color: "success",
        text: "Success",
      },
      PENDING: {
        color: "warning",
        text: "Pending",
      },
      FAILED: {
        color: "error",
        text: "Failed",
      },
      EXPIRED: {
        color: "default",
        text: "Expired",
      },
    };

    const normalizedStatus = status?.toUpperCase();
    const config = statusConfig[normalizedStatus] || {
      color: "default",
      text: status || "Unknown",
    };

    return (
      <Tag
        color={config.color}
        className="text-xs font-medium px-2 py-0.5 rounded"
      >
        {config.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <Tooltip title={id}>
          <span className="text-gray-700 font-medium">
            {id.substring(0, 8)}...
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Date",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => (
        <span className="text-gray-600">
          <CalendarOutlined className="mr-1 text-blue-500" />
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (amount) => (
        <span className="text-gray-800 font-medium">
          <DollarOutlined className="mr-1 text-green-500" />
          {formatVND(amount)}
        </span>
      ),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => (
        <span className="text-gray-600 capitalize">
          {method?.toLowerCase() || "N/A"}
        </span>
      ),
    },
    {
      title: "Reference ID",
      dataIndex: "paymentReferenceID",
      key: "paymentReferenceID",
      render: (refId) => (
        <span className="text-gray-600">{refId || "N/A"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetails(record.id)}
          className="bg-[#FF009F] hover:bg-[#d1007f] border-none shadow-sm"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Payment History | Eigakan Advertiser</title>
      </Helmet>

      <ConfigProvider theme={theme}>
        <div className="p-4">
          <Card className="shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-medium mb-0 flex items-center">
                <DollarOutlined className="mr-2 text-[#FF009F]" />
                Payment History
              </h1>

              <div className="flex space-x-2">
                <Input
                  placeholder="Search by ID or amount"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="w-64"
                  allowClear
                />

                <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="w-40"
                  allowClear
                  suffixIcon={<FilterOutlined className="text-gray-400" />}
                >
                  <Option value="SUCCESS">Success</Option>
                  <Option value="PENDING">Pending</Option>
                  <Option value="FAILED">Failed</Option>
                </Select>

                <RangePicker
                  onChange={handleDateRangeChange}
                  value={dateRange}
                  className="w-64"
                  format="YYYY-MM-DD"
                />

                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  className="hover:text-[#FF009F] hover:border-[#FF009F]"
                >
                  Reset
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spin size="large" />
              </div>
            ) : payments.length > 0 ? (
              <Table
                columns={columns}
                dataSource={payments}
                rowKey="id"
                pagination={pagination}
                onChange={handleTableChange}
                className="border border-gray-200 rounded-md"
                scroll={{ x: 1000 }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No payment records found"
                className="py-12"
              />
            )}
          </Card>
        </div>
      </ConfigProvider>
    </>
  );
};

export default PaymentHistory;
