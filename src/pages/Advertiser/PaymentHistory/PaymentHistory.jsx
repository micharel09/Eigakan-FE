import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
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
  Descriptions,
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
  DownOutlined,
  RightOutlined,
  ShoppingOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
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

        setTransactions(response.data || []);
        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: allResponse.total || 0,
        });

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

  const handleTableChange = (pagination) => {
    fetchTransactions(pagination.current, pagination.pageSize);
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
            padding: "16px 0",
            textAlign: "center",
            color: token.colorTextSecondary,
          }}
        >
          No purchase items available for this transaction
        </div>
      );
    }

    return (
      <div style={{ padding: 16, backgroundColor: "white" }}>
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
            onClick={() => goToItemDetails(item.id)}
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
              <Space>
                <Text strong>Purchase Item</Text>
                <Tag icon={<EyeOutlined />} color="blue">
                  {item.viewQuantity} views
                </Tag>
                <Tag
                  icon={getStatusIcon(item.status)}
                  color={getStatusColor(item.status)}
                >
                  {item.status}
                </Tag>
              </Space>
              <Space>
                <Text type="secondary">ID: {item.id.substring(0, 8)}...</Text>
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToItemDetails(item.id);
                  }}
                >
                  Details
                </Button>
              </Space>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: token.colorBgLayout,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Text type="secondary">Price Per View</Text>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>
                      {formatVND(item.pricePerView)}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: token.colorBgLayout,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Text type="secondary">Total Price</Text>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>
                      {formatVND(item.price)}
                    </div>
                  </Card>
                </Col>
              </Row>

              <Descriptions
                column={1}
                size="small"
                bordered
                style={{ marginTop: 16 }}
              >
                <Descriptions.Item label="View Quantity">
                  <Space>
                    <EyeOutlined style={{ color: token.colorInfo }} />
                    <Text strong>{item.viewQuantity} views</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Remaining View">
                  <Space>
                    <EyeOutlined style={{ color: token.colorInfo }} />
                    <Text strong>{item.remainingViews} views</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Price Per View">
                  <Space>
                    <DollarOutlined style={{ color: token.colorSuccess }} />
                    <Text>{formatVND(item.pricePerView)}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Total Price">
                  <Space>
                    <DollarOutlined style={{ color: token.colorSuccess }} />
                    <Text strong>{formatVND(item.price)}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Card>
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
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
          gap: 16,
          width: "100%",
          alignItems: "center",
        }}
      >
        <div>
          <Tooltip title={transaction.id}>
            <span style={{ fontSize: 12, fontFamily: "monospace" }}>
              {transaction.id.substring(0, 8)}...
              {transaction.id.substring(transaction.id.length - 4)}
            </span>
          </Tooltip>
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>
            {formatVND(transaction.totalPrice)}
          </span>
        </div>
        <div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Text type="secondary" style={{ fontSize: 10, marginBottom: 2 }}>
              Payment Method
            </Text>
            <Tag
              color="cyan"
              style={{
                margin: 0,
                maxWidth: "100px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <DollarOutlined style={{ marginRight: 4 }} />
              {transaction.paymentMethod || "VNPay"}
            </Tag>
          </div>
        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{formatDate(transaction.createAt)}</span>
          {transaction.adPurchaseItems &&
            transaction.adPurchaseItems.length > 0 && (
              <Tag
                color="purple"
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
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
          style={{ backgroundColor: "white" }}
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
          style={{ marginBottom: 24 }}
          closable
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card hoverable style={{ transition: "all 0.3s ease" }}>
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
        <Col xs={24} md={8}>
          <Card hoverable style={{ transition: "all 0.3s ease" }}>
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
      </Row>

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
            Your Payment Transactions
          </Text>
          <Badge
            status={loading ? "processing" : "success"}
            text={loading ? "Loading..." : "Updated"}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Collapse bordered={false} expandIconPosition="end">
            {transactions.map((transaction) => (
              <Panel
                key={transaction.id}
                header={customPanelHeader(transaction)}
              >
                {renderTransactionDetails(transaction)}
              </Panel>
            ))}
          </Collapse>

          {transactions.length === 0 && !loading && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No transactions found"
            />
          )}
        </div>

        <Divider style={{ margin: "16px 0" }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
              }}
            >
              <span style={{ color: token.colorTextSecondary }}>
                Page {pagination.current} of{" "}
                {Math.ceil(pagination.total / pagination.pageSize)}
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
