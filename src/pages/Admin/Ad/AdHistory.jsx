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
  Collapse,
  Badge,
  theme,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ShoppingOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
import UserApi from "../../../apis/User/user";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { useToken } = theme;

const AdHistory = () => {
  const { token } = useToken();
  const navigate = useNavigate();
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
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

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

          // Calculate total refunded amount
          let refundedAmount = 0;
          allTransactions.forEach((transaction) => {
            if (
              transaction.adPurchaseItems &&
              transaction.adPurchaseItems.length > 0
            ) {
              transaction.adPurchaseItems.forEach((item) => {
                if (item.status === "REFUNDED") {
                  refundedAmount += item.price || 0;
                }
              });
            }
          });
          setTotalRefunded(refundedAmount);
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

        // Calculate total refunded amount
        let refundedAmount = 0;
        response.data.forEach((transaction) => {
          if (
            transaction.adPurchaseItems &&
            transaction.adPurchaseItems.length > 0
          ) {
            transaction.adPurchaseItems.forEach((item) => {
              if (item.status === "REFUNDED") {
                refundedAmount += item.price || 0;
              }
            });
          }
        });
        setTotalRefunded(refundedAmount);
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

  // Fetch user details for all transactions
  const fetchUserDetails = async (userIds) => {
    if (!userIds || userIds.length === 0) return;

    setLoadingUserDetails(true);
    try {
      const uniqueUserIds = [...new Set(userIds)];
      const userDetailsMap = { ...userDetails };

      for (const userId of uniqueUserIds) {
        if (!userDetailsMap[userId]) {
          try {
            const response = await UserApi.getUserDetail(userId);
            if (response && response.success && response.data) {
              userDetailsMap[userId] = response.data;
            }
          } catch (error) {
            console.error(
              `Error fetching user details for ID ${userId}:`,
              error
            );
          }
        }
      }

      setUserDetails(userDetailsMap);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Calculate total items from all transactions
  useEffect(() => {
    if (allTransactionData && allTransactionData.length > 0) {
      let itemCount = 0;
      allTransactionData.forEach((transaction) => {
        if (
          transaction.adPurchaseItems &&
          transaction.adPurchaseItems.length > 0
        ) {
          itemCount += transaction.adPurchaseItems.length;
        }
      });
      setTotalItems(itemCount);

      // Extract all user IDs for fetching user details
      const userIds = allTransactionData
        .map((transaction) => transaction.userId)
        .filter((id) => id);

      if (userIds.length > 0) {
        fetchUserDetails(userIds);
      }
    }
  }, [allTransactionData]);

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
            item.paymentMethod
              ?.toLowerCase()
              .includes(searchText.toLowerCase()) ||
            (userDetails[item.userId]?.fullName || "")
              .toLowerCase()
              .includes(searchText.toLowerCase())
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
  }, [
    searchText,
    statusFilter,
    dateRange,
    allTransactionData,
    adPaymentList,
    userDetails,
  ]);

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

  // Function to navigate to ad purchase item details
  const goToItemDetails = (itemId) => {
    navigate(`/admin/ad-purchase-item/${itemId}?from=ad-history`);
  };

  // Get status color for tags
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELED":
      case "EXPIRED":
      case "REFUNDED":
        return "error";
      default:
        return "default";
    }
  };

  // Get status icon for tags
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return <CheckCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      case "CANCELED":
      case "EXPIRED":
      case "REFUNDED":
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
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
            <Card hoverable style={{ transition: "all 0.3s ease" }}>
              <Statistic
                title="Total Purchased"
                value={totalAmount}
                precision={0}
                formatter={(value) => formatVND(value)}
                prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
                loading={totalLoading}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ transition: "all 0.3s ease" }}>
              <Statistic
                title="Total Refunded"
                value={totalRefunded}
                precision={0}
                formatter={(value) => formatVND(value)}
                prefix={<DollarOutlined style={{ color: "#faad14" }} />}
                loading={totalLoading}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ transition: "all 0.3s ease" }}>
              <Statistic
                title="Total Ad Items"
                value={totalItems}
                prefix={<ShoppingOutlined style={{ color: "#1890ff" }} />}
                loading={totalLoading}
                valueStyle={{ color: "#1890ff" }}
                suffix={totalItems > 1 ? "items" : "item"}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and filter */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder="Search by ID or user ID"
            value={searchText}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            className="max-w-xs"
            allowClear
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            allowClear
            className="min-w-[150px]"
          >
            <Option value="SUCCESS">Success</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="CANCELED">Canceled</Option>
          </Select>
          <Button onClick={handleClearFilters} icon={<FilterOutlined />}>
            Clear Filters
          </Button>
        </div>

        {/* Ad Payment History with Collapse */}
        <Card style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 500 }}>
              Payment Transactions
            </Text>
            <Badge
              status={loading ? "processing" : "success"}
              text={loading ? "Loading..." : "Updated"}
            />
          </div>

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr",
              gap: 16,
              width: "100%",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: token.colorBgLayout,
              borderRadius: "8px 8px 0 0",
              fontWeight: 600,
              marginBottom: 1,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <div>Transaction ID / User</div>
            <div>Amount</div>
            <div>Payment Method</div>
            <div>Date</div>
            <div style={{ textAlign: "center" }}>Items</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Collapse
              bordered={false}
              expandIconPosition="end"
              style={{
                backgroundColor: "white",
                borderRadius: "0 0 8px 8px",
              }}
            >
              {filteredData.map((transaction) => (
                <Panel
                  key={transaction.id}
                  header={
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr",
                        gap: 16,
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      {/* Transaction ID and User Info */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Tooltip title={transaction.id}>
                            <span
                              style={{
                                fontSize: 13,
                                fontFamily: "monospace",
                                color: token.colorTextSecondary,
                              }}
                            >
                              {transaction.id.substring(0, 8)}...
                              {transaction.id.substring(
                                transaction.id.length - 4
                              )}
                            </span>
                          </Tooltip>
                          {transaction.userId &&
                          userDetails[transaction.userId] ? (
                            <Tooltip title={`User ID: ${transaction.userId}`}>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: token.colorPrimary,
                                  marginTop: 4,
                                }}
                              >
                                {userDetails[transaction.userId].fullName ||
                                  "Unknown User"}
                              </span>
                            </Tooltip>
                          ) : (
                            <span
                              style={{
                                fontSize: 12,
                                color: token.colorTextSecondary,
                                marginTop: 4,
                              }}
                            >
                              {loadingUserDetails
                                ? "Loading user..."
                                : "Unknown User"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            color: token.colorTextHeading,
                          }}
                        >
                          {formatVND(transaction.totalPrice)}
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <Tag
                          color="cyan"
                          style={{
                            margin: 0,
                            padding: "4px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          <DollarOutlined style={{ marginRight: 4 }} />
                          {transaction.paymentMethod || "Wallet"}
                        </Tag>
                      </div>

                      {/* Date */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <CalendarOutlined
                          style={{
                            marginRight: 6,
                            color: token.colorTextSecondary,
                          }}
                        />
                        <span style={{ color: token.colorTextSecondary }}>
                          {formatDateTime(transaction.createAt)}
                        </span>
                      </div>

                      {/* Items Count */}
                      <div style={{ textAlign: "center" }}>
                        {transaction.adPurchaseItems &&
                          transaction.adPurchaseItems.length > 0 && (
                            <Tag
                              color="purple"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                cursor: "pointer",
                                borderRadius: "4px",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (transaction.adPurchaseItems.length === 1) {
                                  goToItemDetails(
                                    transaction.adPurchaseItems[0].id
                                  );
                                }
                              }}
                            >
                              <ShoppingOutlined style={{ marginRight: 4 }} />
                              {transaction.adPurchaseItems.length}{" "}
                              {transaction.adPurchaseItems.length > 1
                                ? "items"
                                : "item"}
                            </Tag>
                          )}
                      </div>
                    </div>
                  }
                >
                  <div className="p-4 bg-white">
                    {transaction.adPurchaseItems &&
                      transaction.adPurchaseItems.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <Text
                            strong
                            style={{
                              fontSize: 16,
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 16,
                            }}
                          >
                            <ShoppingOutlined
                              style={{
                                marginRight: 8,
                                color: token.colorPrimary,
                              }}
                            />
                            Purchase Items ({transaction.adPurchaseItems.length}
                            )
                          </Text>
                          <div
                            style={{
                              padding: 16,
                              backgroundColor: "white",
                            }}
                          >
                            {transaction.adPurchaseItems.map((item) => (
                              <Card
                                key={item.id}
                                style={{
                                  marginBottom: 16,
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                  ":hover": {
                                    boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
                                  },
                                }}
                                bodyStyle={{ padding: 0 }}
                                hoverable
                              >
                                <div
                                  style={{
                                    padding: "12px 16px",
                                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                    backgroundColor: token.colorBgLayout,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <ShoppingOutlined
                                        style={{
                                          marginRight: "8px",
                                          color: token.colorPrimary,
                                        }}
                                      />
                                      <Text strong>Purchase Item</Text>
                                    </div>
                                    <Tag icon={<EyeOutlined />} color="blue">
                                      {item.viewQuantity} views
                                    </Tag>
                                    <Tag
                                      icon={getStatusIcon(item.status)}
                                      color={getStatusColor(item.status)}
                                    >
                                      {item.status}
                                    </Tag>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <Text type="secondary">
                                      ID: {item.id.substring(0, 8)}...
                                    </Text>
                                    <Button
                                      type="primary"
                                      size="small"
                                      onClick={() => goToItemDetails(item.id)}
                                    >
                                      Details
                                    </Button>
                                  </div>
                                </div>
                                <div style={{ padding: "16px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "16px",
                                    }}
                                  >
                                    {/* First row: View Quantity and Remaining Views */}
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "16px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          flex: "1",
                                          minWidth: "240px",
                                          backgroundColor: token.colorBgLayout,
                                          padding: "16px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                          }}
                                        >
                                          <EyeOutlined
                                            style={{
                                              color: token.colorInfo,
                                              marginRight: "8px",
                                            }}
                                          />
                                          <Text type="secondary">
                                            View Quantity
                                          </Text>
                                        </div>
                                        <div
                                          style={{
                                            fontWeight: 500,
                                            fontSize: 16,
                                          }}
                                        >
                                          {item.viewQuantity} views
                                        </div>
                                      </div>

                                      <div
                                        style={{
                                          flex: "1",
                                          minWidth: "240px",
                                          backgroundColor: token.colorBgLayout,
                                          padding: "16px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                          }}
                                        >
                                          <EyeOutlined
                                            style={{
                                              color: token.colorInfo,
                                              marginRight: "8px",
                                            }}
                                          />
                                          <Text type="secondary">
                                            Remaining Views
                                          </Text>
                                        </div>
                                        <div
                                          style={{
                                            fontWeight: 500,
                                            fontSize: 16,
                                          }}
                                        >
                                          {item.remainingViews} views
                                        </div>
                                      </div>
                                    </div>

                                    {/* Second row: Price Per View and Total Price */}
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "16px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          flex: "1",
                                          minWidth: "240px",
                                          backgroundColor: token.colorBgLayout,
                                          padding: "16px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                          }}
                                        >
                                          <DollarOutlined
                                            style={{
                                              color: token.colorSuccess,
                                              marginRight: "8px",
                                            }}
                                          />
                                          <Text type="secondary">
                                            Price Per View
                                          </Text>
                                        </div>
                                        <div
                                          style={{
                                            fontWeight: 500,
                                            fontSize: 16,
                                          }}
                                        >
                                          {formatVND(item.pricePerView)}
                                        </div>
                                      </div>

                                      <div
                                        style={{
                                          flex: "1",
                                          minWidth: "240px",
                                          backgroundColor: token.colorBgLayout,
                                          padding: "16px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                          }}
                                        >
                                          <DollarOutlined
                                            style={{
                                              color: token.colorSuccess,
                                              marginRight: "8px",
                                            }}
                                          />
                                          <Text type="secondary">
                                            Total Price
                                          </Text>
                                        </div>
                                        <div
                                          style={{
                                            fontWeight: 500,
                                            fontSize: 16,
                                          }}
                                        >
                                          {formatVND(item.price)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </Panel>
              ))}
            </Collapse>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              padding: "0 16px",
            }}
          >
            <div>
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
                  Total {isSearching ? filteredData.length : pagination.total}{" "}
                  items
                </>
              )}
            </div>

            {!isSearching && (
              <div>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePaginationChange}
                  showSizeChanger
                  pageSizeOptions={["5", "10", "20", "50"]}
                  showTotal={(total) => `Total ${total} items`}
                />
              </div>
            )}
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default AdHistory;
