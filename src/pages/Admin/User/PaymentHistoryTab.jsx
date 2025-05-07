import React, { useState, useEffect } from "react";
import {
  Card,
  Tag,
  Typography,
  Button,
  Badge,
  Empty,
  Tooltip,
  Spin,
  Collapse,
  Divider,
  Space,
  theme,
  Progress,
  Image,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  FileImageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import UserApi from "../../../apis/User/user";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { useToken } = theme;

const PaymentHistoryTab = ({ userId }) => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [userDetails, setUserDetails] = useState({});
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "detail"
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [loadingItemDetails, setLoadingItemDetails] = useState(false);

  const fetchTransactions = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      setError(null);

      // Lấy userId từ URL
      const urlUserId = window.location.pathname.split("/").pop();

      // Gọi API để lấy tất cả giao dịch với pageSize lớn (1000)
      const allDataResponse = await axios.get(
        `https://eigakan-001-site1.ktempurl.com/api/AdPurchaseTransaction/GetAllAdPurchaseTransaction?page=1&pageSize=1000`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (allDataResponse.data.success) {
        // Lọc dữ liệu theo userId từ URL
        const allFilteredTransactions = allDataResponse.data.data.filter(
          (transaction) => transaction.userId === urlUserId
        );

        if (allFilteredTransactions.length > 0) {
          // Tính toán phân trang từ dữ liệu đã lọc
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;

          // Lấy dữ liệu cho trang hiện tại
          const paginatedTransactions = allFilteredTransactions.slice(
            startIndex,
            endIndex
          );

          // Cập nhật state
          setTransactions(paginatedTransactions);
          setPagination({
            ...pagination,
            current: page,
            pageSize: pageSize,
            total: allFilteredTransactions.length,
          });

          // Fetch user details for paginated transactions
          fetchAllUserDetails(paginatedTransactions);
        } else {
          // Nếu không có dữ liệu đã lọc, hiển thị trang trống
          setTransactions([]);
          setPagination({
            ...pagination,
            current: 1,
            pageSize: pageSize,
            total: 0,
          });
        }
      } else {
        setError(
          allDataResponse.data.message || "Failed to load transaction data"
        );
      }
    } catch (err) {
      setError(err.message || "Failed to load transaction data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTransactions(pagination.current, pagination.pageSize);
    }
  }, [userId]);

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
      // Error fetching user details
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
      // Error fetching user details
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleRefresh = () => {
    fetchTransactions(pagination.current, pagination.pageSize);
    setViewMode("list");
    setSelectedTransaction(null);
    setSelectedItemDetails(null);
  };

  const fetchItemDetails = async (itemId) => {
    setLoadingItemDetails(true);
    try {
      const response = await axios.get(
        `https://eigakan-001-site1.ktempurl.com/api/AdPurchaseItem/GetAllAdPurchaseItemsById?id=${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        // Find the item with matching ID from the response array
        const matchingItem = response.data.data.find(
          (item) => item.id === itemId
        );

        if (matchingItem) {
          setSelectedItemDetails(matchingItem);
        } else {
          // If no matching item found, use the first item as fallback
          setSelectedItemDetails(response.data.data[0] || null);
          console.warn("No exact matching item found for ID:", itemId);
        }
      } else {
        // Failed to load item details
      }
    } catch (err) {
      // Error fetching item details
    } finally {
      setLoadingItemDetails(false);
    }
  };

  const showItemDetails = (itemId) => {
    fetchItemDetails(itemId);
    setViewMode("detail");
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
      case "INACTIVE":
        return "default";
      case "REFUNDED":
        return "error";
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
                  onClick={() => showItemDetails(item.id)}
                >
                  Details
                </Button>
              </div>
            </div>

            {/* Item details in a grid layout */}
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
                    showItemDetails(transaction.adPurchaseItems[0].id);
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

  // Render item details view
  const renderItemDetails = () => {
    if (loadingItemDetails) {
      return (
        <div style={{ padding: 24, textAlign: "center", marginTop: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 20 }}>
            <Text type="secondary">
              Loading advertisement purchase details...
            </Text>
          </div>
        </div>
      );
    }

    if (!selectedItemDetails) {
      return (
        <Empty
          description="No item details available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    // Calculate views used and progress percentage
    const viewsUsed = Math.min(
      selectedItemDetails.viewQuantity,
      Math.max(
        0,
        selectedItemDetails.viewQuantity - selectedItemDetails.remainingViews
      )
    );

    const viewsUsedPercentage = Math.max(
      0,
      Math.min(
        100,
        selectedItemDetails.viewQuantity > 0
          ? (viewsUsed / selectedItemDetails.viewQuantity) * 100
          : 0
      )
    );

    return (
      <div>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setViewMode("list")}
          >
            Back to Transactions
          </Button>
        </div>

        <Card title="Item Information" style={{ marginBottom: 16 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <Text type="secondary">ID</Text>
              <div>
                <Text copyable style={{ fontFamily: "monospace" }}>
                  {selectedItemDetails.id}
                </Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Status</Text>
              <div>
                <Tag
                  icon={getStatusIcon(selectedItemDetails.status)}
                  color={getStatusColor(selectedItemDetails.status)}
                >
                  {selectedItemDetails.status}
                </Tag>
              </div>
            </div>

            <div>
              <Text type="secondary">Total Price</Text>
              <div>
                <Text strong style={{ color: token.colorSuccess }}>
                  {formatVND(selectedItemDetails.price)}
                </Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Price Per View</Text>
              <div>
                <Text strong style={{ color: token.colorPrimary }}>
                  {formatVND(selectedItemDetails.pricePerView)}
                </Text>
              </div>
            </div>

            <div>
              <Text type="secondary">Created Date</Text>
              <div>
                <Space>
                  <CalendarOutlined />
                  {formatDate(selectedItemDetails.createdDate)}
                </Space>
              </div>
            </div>

            <div>
              <Text type="secondary">Remaining Views</Text>
              <div>
                <Space>{selectedItemDetails.remainingViews}</Space>
              </div>
            </div>
          </div>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text type="secondary">Views Used</Text>
              <Text strong>
                {viewsUsed} / {selectedItemDetails.viewQuantity}
              </Text>
            </div>
            <Progress
              percent={viewsUsedPercentage}
              status={viewsUsedPercentage >= 100 ? "success" : "active"}
              strokeColor={{
                from: "#108ee9",
                to: "#87d068",
              }}
              format={(percent) => `${percent.toFixed(1)}%`}
            />
          </div>
        </Card>

        {selectedItemDetails.adMediaUrl && (
          <Card title="Advertisement Media">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              {selectedItemDetails.adMediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={selectedItemDetails.adMediaUrl}
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                  }}
                />
              ) : (
                <Image
                  src={selectedItemDetails.adMediaUrl}
                  alt="Advertisement Media"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 mt-6 shadow-sm">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Payment History
          </Title>
        </div>
        <Button
          onClick={handleRefresh}
          icon={<ReloadOutlined />}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fff2f0",
            border: "1px solid #ffccc7",
            borderRadius: "8px",
            marginBottom: 16,
          }}
        >
          <Text type="danger">{error}</Text>
        </div>
      )}

      {viewMode === "list" ? (
        <div>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: token.colorTextSecondary }}>
                Loading transactions...
              </div>
            </div>
          ) : (
            <>
              {transactions.length > 0 ? (
                <>
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
                    <div>Transaction ID</div>
                    <div>Amount</div>
                    <div>Payment Method</div>
                    <div>Date</div>
                    <div style={{ textAlign: "center" }}>Items</div>
                  </div>

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
                </>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No transactions found"
                  style={{ margin: "40px 0" }}
                />
              )}

              {/* Pagination */}
              {transactions.length > 0 &&
                pagination.total > pagination.pageSize && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "20px",
                      padding: "10px 0",
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <div>
                      <Text type="secondary">
                        Showing {transactions.length} of {pagination.total}{" "}
                        transactions
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Button
                        type="primary"
                        disabled={pagination.current === 1}
                        onClick={() =>
                          fetchTransactions(
                            pagination.current - 1,
                            pagination.pageSize
                          )
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
                          {Math.ceil(pagination.total / pagination.pageSize) ||
                            1}
                        </span>
                      </div>
                      <Button
                        type="primary"
                        disabled={
                          pagination.current >=
                          Math.ceil(pagination.total / pagination.pageSize)
                        }
                        onClick={() =>
                          fetchTransactions(
                            pagination.current + 1,
                            pagination.pageSize
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      ) : (
        renderItemDetails()
      )}
    </div>
  );
};

export default PaymentHistoryTab;
