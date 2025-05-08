import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Typography,
  Descriptions,
  Spin,
  Result,
  Tag,
  Breadcrumb,
  Divider,
  Row,
  Col,
  Statistic,
  Progress,
  Timeline,
  Image,
  Alert,
  Space,
  theme,
  Tabs,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CalendarOutlined,
  PictureOutlined,
  FileImageOutlined,
  UserOutlined,
  IdcardOutlined,
  MailOutlined,
  CalendarFilled,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import adPurchaseItemService from "../../../apis/AdPurchaseItem/adPurchaseItem";
import UserApi from "../../../apis/User/user";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;
const { TabPane } = Tabs;

const AdPurchaseItemDetails = () => {
  const { token } = useToken();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch user details by ID
  const fetchUserDetails = async (userId) => {
    if (!userId) return;

    try {
      setLoadingUser(true);
      const response = await UserApi.getUserDetail(userId);
      if (response && response.success && response.data) {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error(`Error fetching user details for ID ${userId}:`, error);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adPurchaseItemService.getAdPurchaseItemsById(id);

        if (response.success) {
          // Find the item with matching ID from the response array
          const matchingItem = response.data.find((item) => item.id === id);

          if (matchingItem) {
            setItemDetails(matchingItem);

            // If item has userId, fetch user details
            if (matchingItem.userId) {
              fetchUserDetails(matchingItem.userId);
            }
          } else {
            // If no matching item found, use the first item as fallback
            const item = response.data[0] || null;
            setItemDetails(item);

            // If item has userId, fetch user details
            if (item && item.userId) {
              fetchUserDetails(item.userId);
            }
            console.warn("No exact matching item found for ID:", id);
          }
        } else {
          setError(response.message || "Failed to load item details");
        }
      } catch (err) {
        console.error("Error fetching item details:", err);
        setError(err.message || "Failed to load item details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  const formatVND = (price) => {
    if (price === null || price === undefined) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELED":
      case "EXPIRED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return <CheckCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      case "CANCELED":
      case "EXPIRED":
        return <ClockCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>
          <Text type="secondary">
            Loading advertisement purchase details...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Failed to load details"
        subTitle={error}
        extra={[
          <Button
            type="primary"
            key="back"
            onClick={() => navigate("/manager/ad-package")}
            icon={<ArrowLeftOutlined />}
          >
            Back to Ad Package Management
          </Button>,
        ]}
      />
    );
  }

  if (!itemDetails) {
    return (
      <Result
        status="warning"
        title="No Details Found"
        subTitle="The requested advertisement purchase item wasn't found."
        extra={[
          <Button
            type="primary"
            key="back"
            onClick={() => navigate("/manager/ad-package")}
            icon={<ArrowLeftOutlined />}
          >
            Back to Ad Package Management
          </Button>,
        ]}
      />
    );
  }

  // Calculate views used and progress percentage
  const viewsUsed = Math.min(
    itemDetails.viewQuantity,
    Math.max(0, itemDetails.viewQuantity - itemDetails.remainingViews)
  );

  const viewsUsedPercentage = Math.max(
    0,
    Math.min(
      100,
      itemDetails.viewQuantity > 0
        ? (viewsUsed / itemDetails.viewQuantity) * 100
        : 0
    )
  );

  // Calculate consumed view fee based on views used
  const calculatedConsumedViewFee = viewsUsed * itemDetails.pricePerView;
  const consumedFeePercentage = Math.max(
    0,
    Math.min(
      100,
      itemDetails.price > 0
        ? (calculatedConsumedViewFee / itemDetails.price) * 100
        : 0
    )
  );

  // Calculate days remaining
  const currentDate = dayjs();
  const createdDate = dayjs(itemDetails.createdDate);
  const expiredDate = dayjs(itemDetails.expiredDate);

  // Ensure we have valid dates
  const totalDays = Math.max(1, expiredDate.diff(createdDate, "day"));
  const daysRemaining = Math.max(0, expiredDate.diff(currentDate, "day"));
  const daysUsed = Math.min(
    totalDays,
    Math.max(0, currentDate.diff(createdDate, "day"))
  );
  const daysProgress = Math.max(0, Math.min(100, (daysUsed / totalDays) * 100));

  // Render user profile tab
  const renderProfileTab = () => {
    if (loadingUser) {
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: 20 }}>
            <Text type="secondary">Loading user details...</Text>
          </div>
        </div>
      );
    }

    if (!userDetails) {
      return (
        <Result
          status="warning"
          title="No User Details Found"
          subTitle="The user information for this advertisement purchase item wasn't found."
        />
      );
    }

    return (
      <div style={{ padding: "24px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
          >
            <Avatar
              src={userDetails.picture}
              size={80}
              icon={!userDetails.picture && <UserOutlined />}
              style={{ marginRight: 24 }}
            />
          </div>
        </div>

        <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
          <Title level={4}>Basic Information</Title>
          <Row gutter={[48, 24]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <div>
                <Text type="secondary">Email:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>{userDetails.email}</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Text type="secondary">DOB:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>{userDetails.birthday}</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Text type="secondary">Joined date:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>{formatDate(userDetails.createDate)}</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Text type="secondary">Status:</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag
                    color={
                      userDetails.status === "NORMAL" ? "success" : "error"
                    }
                  >
                    {userDetails.status === "NORMAL"
                      ? "ACTIVE"
                      : userDetails.status}
                  </Tag>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    );
  };

  // Render ad purchase item details tab
  const renderAdPurchaseItemTab = () => {
    return (
      <div style={{ padding: "24px 0" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <ShoppingOutlined style={{ color: token.colorPrimary }} />
                  <span>Item Information</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Descriptions
                bordered
                column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              >
                <Descriptions.Item label="ID">
                  <Text copyable style={{ fontFamily: "monospace" }}>
                    {itemDetails.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag
                    icon={getStatusIcon(itemDetails.status)}
                    color={getStatusColor(itemDetails.status)}
                  >
                    {itemDetails.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ad Package">
                  <Tag color="purple">{itemDetails.adPackageName}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Price">
                  <Text strong style={{ color: token.colorSuccess }}>
                    {formatVND(itemDetails.price)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Created Date">
                  <Space>
                    <CalendarOutlined />
                    {formatDate(itemDetails.createdDate)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Price Per View">
                  <Text strong style={{ color: token.colorPrimary }}>
                    {formatVND(itemDetails.pricePerView)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Refunded Price">
                  {itemDetails.refundedPrice !== null ? (
                    <Text style={{ color: token.colorSuccess }}>
                      {formatVND(itemDetails.refundedPrice)}
                    </Text>
                  ) : (
                    <Text type="secondary">N/A</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {itemDetails.adMediaUrl && (
              <Card
                title={
                  <Space>
                    <FileImageOutlined style={{ color: token.colorInfo }} />
                    <span>Advertisement Media</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
                extra={
                  <Tag color={getStatusColor(itemDetails.adMediaStatus)}>
                    {itemDetails.adMediaStatus}
                  </Tag>
                }
              >
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  {itemDetails.adMediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video
                      src={itemDetails.adMediaUrl}
                      controls
                      style={{
                        maxWidth: "100%",
                        maxHeight: 300,
                      }}
                    />
                  ) : (
                    <Image
                      src={itemDetails.adMediaUrl}
                      alt="Advertisement Media"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 300,
                        objectFit: "contain",
                      }}
                    />
                  )}
                </div>
                <Descriptions
                  bordered
                  column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
                  size="small"
                  style={{ marginTop: 16 }}
                >
                  <Descriptions.Item label="Ad Media ID">
                    <Text copyable style={{ fontFamily: "monospace" }}>
                      {itemDetails.adMediaId}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="User Full Name">
                    <Space>
                      <UserOutlined />
                      {itemDetails.userFullName ||
                        userDetails?.fullName ||
                        "N/A"}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <EyeOutlined style={{ color: token.colorInfo }} />
                  <span>Views Statistics</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Statistic
                title="Total Views"
                value={itemDetails.viewQuantity}
                suffix="views"
                style={{ marginBottom: 16 }}
              />

              <Divider style={{ margin: "12px 0" }} />

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
                    {viewsUsed} / {itemDetails.viewQuantity}
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

                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text type="secondary">Consumed View Fee</Text>
                    <Text strong style={{ color: token.colorWarning }}>
                      {formatVND(calculatedConsumedViewFee)} /{" "}
                      {formatVND(itemDetails.price)}
                    </Text>
                  </div>
                  <Progress
                    percent={consumedFeePercentage}
                    status={consumedFeePercentage >= 100 ? "success" : "active"}
                    strokeColor={{
                      from: "#faad14",
                      to: "#fa8c16",
                    }}
                    format={(percent) => `${percent.toFixed(1)}%`}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      color: token.colorTextSecondary,
                      marginTop: 4,
                    }}
                  >
                    {viewsUsed} views × {formatVND(itemDetails.pricePerView)}
                    /view
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text type="secondary">Time Elapsed</Text>
                  <Text strong>
                    {daysUsed.toLocaleString()} / {totalDays.toLocaleString()}{" "}
                    days
                  </Text>
                </div>
                <Progress
                  percent={parseFloat(daysProgress.toFixed(2))}
                  status={daysProgress >= 100 ? "success" : "active"}
                  strokeColor={{
                    from: "#722ed1",
                    to: "#1890ff",
                  }}
                  format={(percent) => `${percent.toFixed(0)}%`}
                />
              </div>
            </Card>

            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: token.colorWarning }} />
                  <span>Timeline</span>
                </Space>
              }
            >
              <Timeline
                mode="left"
                items={[
                  {
                    label: formatDate(itemDetails.createdDate),
                    children: "Ad purchase created",
                    color: "blue",
                    dot: <ShoppingOutlined />,
                  },
                  {
                    label: formatDate(itemDetails.expiredDate),
                    children: "Expiration date",
                    color: itemDetails.status === "EXPIRED" ? "red" : "gray",
                    dot: <ClockCircleOutlined />,
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Helmet>
        <title>Ad Purchase Details | EIGAKAN</title>
      </Helmet>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Breadcrumb
            items={[
              { title: "User", href: "/manager/users" },
              { title: "User Detail" },
            ]}
            style={{ marginBottom: 8 }}
          />
        </div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/manager/ad-package")}
        >
          Back to Ad Package Management
        </Button>
      </div>

      <Card style={{ background: "#fff", marginBottom: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ marginBottom: 0, borderBottom: "none" }}
        >
          <TabPane
            tab={
              <span>
                <IdcardOutlined />
                Profile
              </span>
            }
            key="profile"
          >
            {renderProfileTab()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <ShoppingOutlined />
                Ad Purchase Item Detail
              </span>
            }
            key="adPurchaseItem"
          >
            {renderAdPurchaseItemTab()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdPurchaseItemDetails;
