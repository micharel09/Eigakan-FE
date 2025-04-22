import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  notification,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
  Button,
  Tooltip,
  Spin,
  Empty,
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";

import { Helmet } from "react-helmet";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdHistory = () => {
  const [adPaymentList, setAdPaymentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLoading, setTotalLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [filteredData, setFilteredData] = useState([]);

  const fetchAdTransactions = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);

      // Fetch current page data
      const response = await adPurchaseService.getAllAdPurchaseTransaction(
        page,
        pageSize
      );

      // Fetch all data for accurate total count and calculations
      setTotalLoading(true);
      let totalItems = 0;
      let allTransactions = [];

      try {
        const totalResponse =
          await adPurchaseService.getAllAdPurchaseTransactionTotal();
        if (totalResponse && totalResponse.success) {
          totalItems = totalResponse.total || 0;
          allTransactions = totalResponse.data || [];

          // Calculate total amount from successful transactions
          const successfulTransactions = allTransactions.filter(
            (item) => item.status === "SUCCESS"
          );
          const total = successfulTransactions.reduce(
            (sum, item) => sum + (item.totalPrice || 0),
            0
          );
          setTotalAmount(total);
        }
      } catch (error) {
        console.error("Error fetching total payment data:", error);
      } finally {
        setTotalLoading(false);
      }

      if (response && response.success) {
        // Sort data by createAt in descending order (newest first)
        const sortedData = [...(response.data || [])];
        sortedData.sort((a, b) => new Date(b.createAt) - new Date(a.createAt));

        setAdPaymentList(sortedData);
        setFilteredData(sortedData);
        setPagination({
          ...pagination,
          total: response.total || totalItems,
          current: page,
          pageSize: pageSize,
        });
      } else {
        notification.error({
          message: "Error",
          description: response?.message || "Failed to fetch payment history",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch payment history",
      });
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdTransactions(pagination.current, pagination.pageSize);
  }, []);

  // Fetch all data for search and filtering
  const [allTransactionData, setAllTransactionData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchAllTransactionsData = async () => {
    try {
      setTotalLoading(true);
      const response =
        await adPurchaseService.getAllAdPurchaseTransactionTotal();
      if (response && response.success) {
        setAllTransactionData(response.data || []);

        // Calculate total amount from successful transactions
        const successfulTransactions = response.data.filter(
          (item) => item.status === "SUCCESS"
        );
        const total = successfulTransactions.reduce(
          (sum, item) => sum + (item.totalPrice || 0),
          0
        );
        setTotalAmount(total);
      }
    } catch (error) {
      console.error("Error fetching all transaction data:", error);
    } finally {
      setTotalLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactionsData();
  }, []);

  // Filter data based on search text, status filter and date range
  useEffect(() => {
    // If we're searching or filtering, use all data
    if (
      searchText ||
      statusFilter ||
      (dateRange && dateRange[0] && dateRange[1])
    ) {
      setIsSearching(true);
      let result = [...allTransactionData];

      if (searchText) {
        result = result.filter(
          (item) =>
            item.id?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.userId?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.paymentMethod?.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      if (statusFilter) {
        result = result.filter((item) => item.status === statusFilter);
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        result = result.filter(
          (item) =>
            dayjs(item.createAt).isAfter(dateRange[0]) &&
            dayjs(item.createAt).isBefore(dateRange[1].add(1, "day"))
        );
      }

      setFilteredData(result);
      // Update pagination for search results
      setPagination({
        ...pagination,
        current: 1,
        total: result.length,
      });
    } else {
      // If not searching or filtering, use paginated data from API
      setIsSearching(false);
      setFilteredData(adPaymentList);
    }
  }, [searchText, statusFilter, dateRange, allTransactionData, adPaymentList]);

  // Handle pagination change - separate from table change
  const handlePaginationChange = (page, pageSize) => {
    fetchAdTransactions(page, pageSize);
  };

  // This function handles all table changes including filters and sorting
  const handleTableChange = () => {
    // We're only handling filters and sorting here
    // Pagination is handled separately by handlePaginationChange
    // This prevents conflicts in pagination handling
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter(null);
    setDateRange(null);
    setIsSearching(false);
    setFilteredData(adPaymentList);
    // Reset to first page after clearing filters
    fetchAdTransactions(1, pagination.pageSize);
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDateTime = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      width: "15%",
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-xs font-mono">
            {text.substring(0, 8)}...{text.substring(text.length - 4)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      width: "15%",
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-xs font-mono">
            {text.substring(0, 8)}...{text.substring(text.length - 4)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: "15%",
      render: (price) => (
        <span className="font-medium">{formatVND(price)}</span>
      ),
      sorter: (a, b) => a.totalPrice - b.totalPrice,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: "15%",
      render: (method) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status) => {
        let color = "default";
        let icon = null;

        switch (status?.toUpperCase()) {
          case "SUCCESS":
            color = "success";
            icon = <CheckCircleOutlined />;
            break;
          case "PENDING":
            color = "warning";
            icon = <ClockCircleOutlined />;
            break;
          case "CANCELED":
            color = "error";
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = "default";
            icon = <ClockCircleOutlined />;
        }

        return (
          <Tag icon={icon} color={color} className="flex items-center w-fit">
            <span className="ml-1">{status}</span>
          </Tag>
        );
      },
      filters: [
        { text: "Success", value: "SUCCESS" },
        { text: "Pending", value: "PENDING" },
        { text: "Canceled", value: "CANCELED" },
      ],
      onFilter: (value, record) => record.status.toUpperCase() === value,
    },
    {
      title: "Created Date",
      dataIndex: "createAt",
      key: "createAt",
      width: "20%",
      render: (text) => formatDateTime(text),
      sorter: (a, b) => new Date(a.createAt) - new Date(b.createAt),
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Advertisement Transaction History</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Advertisement Transaction History
            </Title>
            <Text type="secondary">
              Manage advertisement transactions across the platform
            </Text>
          </div>
        </div>

        {/* Total amount cards */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={8}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Total Successful Payments"
                value={totalAmount}
                precision={0}
                formatter={(value) => formatVND(value)}
                prefix={<DollarOutlined className="text-green-500" />}
                loading={totalLoading}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Total Transactions"
                value={pagination.total}
                prefix={<EyeOutlined className="text-blue-500" />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and filter */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={6}>
            <Input
              placeholder="Search by ID or user ID"
              value={searchText}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="SUCCESS">Success</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="CANCELED">Canceled</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: "100%" }}
              onChange={handleDateRangeChange}
              value={dateRange}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              onClick={handleClearFilters}
              icon={<FilterOutlined />}
              style={{ width: "100%" }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: isSearching ? filteredData.length : pagination.total,
            onChange: handlePaginationChange,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total) => (
              <span>
                {totalLoading ? (
                  <>
                    <Spin size="small" className="mr-2" />
                    Calculating total...
                  </>
                ) : (
                  <>
                    {isSearching && (
                      <Tag color="blue" className="mr-2">
                        Search results
                      </Tag>
                    )}
                    Total {total} items
                  </>
                )}
              </span>
            ),
          }}
          locale={{
            emptyText: loading ? (
              <Spin size="large" />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No payment history found"
              />
            ),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default AdHistory;
