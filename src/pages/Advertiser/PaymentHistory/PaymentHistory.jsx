import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Tag,
  Alert,
  Typography,
  Button,
  Badge,
  Empty,
  Tooltip,
  Statistic,
  Row,
  Col,
  Collapse,
  Divider,
  Space,
  theme,
} from "antd";
import { Helmet } from "react-helmet";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  EyeOutlined,
  ShoppingOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
import UserApi from "../../../apis/User/user";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { useToken } = theme;

const PaymentHistory = () => {
  const { token } = useToken();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [userDetails, setUserDetails] = useState({});
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  const fetchTransactions = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current page data
      const response =
        await adPurchaseService.getMyHistoryAdPurchaseTransaction(
          page,
          pageSize
        );

      // Fetch all data for accurate total calculation
      const allResponse =
        await adPurchaseService.getAllMyHistoryAdPurchaseTransaction();

      if (response.success) {
        console.log("Transaction data:", response);
        console.log("All transaction data:", allResponse);

        const transactionData = response.data || [];
        setTransactions(transactionData);
        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: allResponse.total || 0,
        });

        // Fetch user details for all transactions
        fetchAllUserDetails(transactionData);

        // Calculate total amount from ALL successful transactions
        const allSuccessfulTransactions = allResponse.data.filter(
          (item) => item.status === "SUCCESS"
        );
        const total = allSuccessfulTransactions.reduce(
          (sum, item) => sum + (item.totalPrice || 0),
          0
        );
        setTotalAmount(total);

        // Calculate total items and views
        let itemCount = 0;
        let viewCount = 0;

        allResponse.data.forEach((transaction) => {
          if (
            transaction.adPurchaseItems &&
            transaction.adPurchaseItems.length > 0
          ) {
            itemCount += transaction.adPurchaseItems.length;

            transaction.adPurchaseItems.forEach((item) => {
              viewCount += item.viewQuantity || 0;
            });
          }
        });

        setTotalItems(itemCount);
        setTotalViews(viewCount);
      } else {
        setError(response.message || "Failed to load transaction data");
      }
    } catch (err) {
      console.error("Error fetching transaction data:", err);
      setError(err.message || "Failed to load transaction data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(pagination.current, pagination.pageSize);
  }, []);

  // Fetch user details by ID
  const fetchUserDetails = async (userId) => {
    if (!userId || userDetails[userId]) return;

    try {
      const response = await UserApi.getUserDetail(userId);
      if (response && response.success && response.data) {
        setUserDetails((prev) => ({
          ...prev,
          [userId]: response.data,
        }));
      }
    } catch (error) {
      console.error(`Error fetching user details for ID ${userId}:`, error);
    }
  };

  // Fetch user details for all transactions
  const fetchAllUserDetails = async (transactionsList) => {
    if (!transactionsList || transactionsList.length === 0) return;

    setLoadingUserDetails(true);
    try {
      // Get unique user IDs
      const userIds = [
        ...new Set(transactionsList.map((transaction) => transaction.userId)),
      ];

      // Fetch user details for each unique user ID
      const promises = userIds.map((userId) => fetchUserDetails(userId));
      await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleRefresh = () => {
    fetchTransactions(pagination.current, pagination.pageSize);
  };

  const goToItemDetails = (itemId) => {
    navigate(`/advertiser/ad-purchase-item/${itemId}?from=transactions`);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELED":
        return "error";
      case "ACTIVE":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      case "CANCELED":
        return <CloseCircleOutlined />;
      case "ACTIVE":
        return <CheckCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Render transaction details including purchase items
  const renderTransactionDetails = (record) => {
    const hasItems =
      record.adPurchaseItems && record.adPurchaseItems.length > 0;

    if (!hasItems) {
      return (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            color: token.colorTextSecondary,
            backgroundColor: token.colorBgLayout,
            borderRadius: "8px",
          }}
        >
          <Empty
            description="No purchase items available for this transaction"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          padding: "16px 24px",
          backgroundColor: "white",
          borderRadius: "8px",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text
            strong
            style={{ fontSize: 16, display: "flex", alignItems: "center" }}
          >
            <ShoppingOutlined
              style={{ marginRight: 8, color: token.colorPrimary }}
            />
            Purchase Items ({record.adPurchaseItems.length})
          </Text>
        </div>

        {record.adPurchaseItems.map((item) => (
          <div
            key={item.id}
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: "8px",
              marginBottom: "16px",
              overflow: "hidden",
              backgroundColor: token.colorBgContainer,
            }}
          >
            {/* Header with Purchase Item info */}
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
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <ShoppingOutlined
                    style={{ marginRight: "8px", color: token.colorPrimary }}
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
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Tooltip title={item.id}>
                  <Text type="secondary">ID: {item.id.substring(0, 8)}...</Text>
                </Tooltip>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => goToItemDetails(item.id)}
                >
                  Details
                </Button>
              </div>
            </div>

            {/* Item details in a grid layout similar to the image */}
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* First row: View Quantity and Remaining Views */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
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
                        style={{ color: token.colorInfo, marginRight: "8px" }}
                      />
                      <Text type="secondary">View Quantity</Text>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>
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
                        style={{ color: token.colorInfo, marginRight: "8px" }}
                      />
                      <Text type="secondary">Remaining Views</Text>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>
                      {item.remainingViews} views
                    </div>
                  </div>
                </div>

                {/* Second row: Price Per View and Total Price */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
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
                      <Text type="secondary">Price Per View</Text>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>
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
                      <Text type="secondary">Total Price</Text>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>
                      {formatVND(item.price)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Custom panel header with transaction information
  const customPanelHeader = (transaction) => {
    return (
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Tooltip title={transaction.id}>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "monospace",
                  color: token.colorTextSecondary,
                }}
              >
                {transaction.id.substring(0, 8)}...
                {transaction.id.substring(transaction.id.length - 4)}
              </span>
            </Tooltip>
            {transaction.userId && userDetails[transaction.userId] ? (
              <Tooltip title={`User ID: ${transaction.userId}`}>
                <span
                  style={{
                    fontSize: 12,
                    color: token.colorPrimary,
                    marginTop: 4,
                  }}
                >
                  {userDetails[transaction.userId].fullName || "Unknown User"}
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
                {loadingUserDetails ? "Loading user..." : "Unknown User"}
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
            {transaction.paymentMethod || "VNPay"}
          </Tag>
        </div>

        {/* Date */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <CalendarOutlined
            style={{ marginRight: 6, color: token.colorTextSecondary }}
          />
          <span style={{ color: token.colorTextSecondary }}>
            {formatDate(transaction.createAt)}
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
                    goToItemDetails(transaction.adPurchaseItems[0].id);
                  }
                }}
              >
                <ShoppingOutlined style={{ marginRight: 4 }} />
                {transaction.adPurchaseItems.length}{" "}
                {transaction.adPurchaseItems.length > 1 ? "items" : "item"}
              </Tag>
            )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Helmet>
        <title>Payment History | EIGAKAN</title>
      </Helmet>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} /> Payment History
        </Title>
        <Button
          onClick={handleRefresh}
          icon={<ReloadOutlined />}
          loading={loading}
          type="primary"
          ghost
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24, borderRadius: "8px" }}
          closable
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12} lg={8}>
          <Card
            hoverable
            style={{
              borderRadius: "8px",
              height: "100%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Statistic
              title="Total Successful Payments"
              value={totalAmount}
              precision={0}
              formatter={(value) => formatVND(value)}
              prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
              loading={loading}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card
            hoverable
            style={{
              borderRadius: "8px",
              height: "100%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Statistic
              title="Total Ad Items"
              value={totalItems}
              prefix={<ShoppingOutlined style={{ color: "#1890ff" }} />}
              loading={loading}
              valueStyle={{ color: "#1890ff" }}
              suffix={totalItems > 1 ? "items" : "item"}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card
            hoverable
            style={{
              borderRadius: "8px",
              height: "100%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Statistic
              title="Total Ad Views"
              value={totalViews}
              prefix={<EyeOutlined style={{ color: "#722ed1" }} />}
              loading={loading}
              valueStyle={{ color: "#722ed1" }}
              suffix="views"
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)", borderRadius: "8px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 600 }}>
            Your Payment Transactions
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
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div className="ant-spin ant-spin-spinning">
                <span className="ant-spin-dot ant-spin-dot-spin">
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                </span>
              </div>
              <div style={{ marginTop: 16, color: token.colorTextSecondary }}>
                Loading transactions...
              </div>
            </div>
          ) : (
            <>
              <Collapse
                bordered={false}
                expandIconPosition="end"
                style={{
                  backgroundColor: "white",
                  borderRadius: "0 0 8px 8px",
                }}
              >
                {transactions.map((transaction) => (
                  <Panel
                    key={transaction.id}
                    header={customPanelHeader(transaction)}
                    style={{
                      marginBottom: 16,
                      borderRadius: "8px",
                      border: `1px solid ${token.colorBorderSecondary}`,
                      overflow: "hidden",
                    }}
                  >
                    {renderTransactionDetails(transaction)}
                  </Panel>
                ))}
              </Collapse>

              {transactions.length === 0 && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No transactions found"
                  style={{ margin: "40px 0" }}
                />
              )}
            </>
          )}
        </div>

        <Divider style={{ margin: "16px 0" }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text type="secondary">
              Showing {transactions.length} of {pagination.total} transactions
            </Text>
          </div>
          <Space>
            <Button
              type="primary"
              disabled={pagination.current === 1}
              onClick={() =>
                fetchTransactions(pagination.current - 1, pagination.pageSize)
              }
            >
              Previous
            </Button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "0 12px",
                backgroundColor: token.colorBgLayout,
                padding: "4px 12px",
                borderRadius: "4px",
              }}
            >
              <span style={{ color: token.colorTextSecondary }}>
                Page {pagination.current} of{" "}
                {Math.ceil(pagination.total / pagination.pageSize) || 1}
              </span>
            </div>
            <Button
              type="primary"
              disabled={
                pagination.current >=
                Math.ceil(pagination.total / pagination.pageSize)
              }
              onClick={() =>
                fetchTransactions(pagination.current + 1, pagination.pageSize)
              }
            >
              Next
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default PaymentHistory;
