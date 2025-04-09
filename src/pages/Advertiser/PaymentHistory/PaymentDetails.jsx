import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Spin,
  Button,
  Descriptions,
  Tag,
  Divider,
  notification,
  Timeline,
  Empty,
  Row,
  Col,
  ConfigProvider,
  Space,
  Tabs,
  Badge,
  Tooltip,
  Collapse,
  Input,
} from "antd";
import { Helmet } from "react-helmet";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import adPurchaseSlotService from "../../../apis/AdPurchaseSlot/adPurchaseSlot";
import adSlotService from "../../../apis/AdSlot/adslot";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

// Custom theme with brand color
const theme = {
  token: {
    colorPrimary: "#FF009F",
    colorLink: "#FF009F",
    colorLinkHover: "#d1007f",
  },
};

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adSlotDetails, setAdSlotDetails] = useState({});
  const [adSlotTimeRangeDetails, setAdSlotTimeRangeDetails] = useState({});
  const [activeTab, setActiveTab] = useState("1");

  useEffect(() => {
    if (!id) return;

    const fetchPaymentDetails = async () => {
      setLoading(true);
      try {
        const response =
          await adPurchaseSlotService.getAdPurchaseTransactionById(id);

        if (response.success) {
          setPayment(response.data);

          // Fetch additional details for each slot
          if (response.data.adPurchaseSlots?.length > 0) {
            await fetchAdditionalDetails(response.data.adPurchaseSlots);
          }
        } else {
          notification.error({
            message: "Error",
            description: response.message || "Failed to fetch payment details",
          });
          navigate("/advertiser/payment-history");
        }
      } catch (error) {
        console.error("Error fetching payment details:", error);
        notification.error({
          message: "Error",
          description: error.message || "Failed to fetch payment details",
        });
        navigate("/advertiser/payment-history");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [id, navigate]);

  const fetchAdditionalDetails = async (slots) => {
    try {
      const adSlotDetailsObj = {};
      const adSlotTimeRangeDetailsObj = {};

      for (const slot of slots) {
        if (!slot.adSlotTime) continue;

        // Fetch AdSlot details if adSlotID exists
        if (slot.adSlotTime.adSlotID) {
          try {
            const adSlotResponse = await adSlotService.getAdSlotById(
              slot.adSlotTime.adSlotID
            );
            if (adSlotResponse.success) {
              adSlotDetailsObj[slot.adSlotTime.adSlotID] = adSlotResponse.data;
            }
          } catch (error) {
            console.error(
              `Error fetching AdSlot details for ID ${slot.adSlotTime.adSlotID}:`,
              error
            );
          }
        }

        // Fetch AdSlotTimeRange details if adSlotTimeRangeID exists
        if (slot.adSlotTime.adSlotTimeRangeID) {
          try {
            const timeRangeResponse =
              await adSlotService.getAdSlotTimeRangeById(
                slot.adSlotTime.adSlotTimeRangeID
              );
            if (timeRangeResponse.success) {
              adSlotTimeRangeDetailsObj[slot.adSlotTime.adSlotTimeRangeID] =
                timeRangeResponse.data;
            }
          } catch (error) {
            console.error(
              `Error fetching AdSlotTimeRange details for ID ${slot.adSlotTime.adSlotTimeRangeID}:`,
              error
            );
          }
        }
      }

      setAdSlotDetails(adSlotDetailsObj);
      setAdSlotTimeRangeDetails(adSlotTimeRangeDetailsObj);
    } catch (error) {
      console.error("Error fetching additional details:", error);
    }
  };

  const handleBack = () => {
    navigate("/advertiser/payment-history");
  };

  const handleCopyId = (text) => {
    navigator.clipboard.writeText(text);
    notification.success({
      message: "Copied to clipboard",
      description: "Transaction ID has been copied to clipboard",
      placement: "topRight",
    });
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    })
      .format(amount)
      .replace("₫", "đ");
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      SUCCESS: {
        bgColor: "bg-green-100",
        textColor: "text-green-500",
        borderColor: "border-green-500",
      },
      ACTIVE: {
        bgColor: "bg-green-100",
        textColor: "text-green-500",
        borderColor: "border-green-500",
      },
      PENDING: {
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-500",
        borderColor: "border-yellow-500",
      },
      FAILED: {
        bgColor: "bg-red-100",
        textColor: "text-red-500",
        borderColor: "border-red-500",
      },
      EXPIRED: {
        bgColor: "bg-red-100",
        textColor: "text-red-500",
        borderColor: "border-red-500",
      },
      INACTIVE: {
        bgColor: "bg-red-100",
        textColor: "text-red-500",
        borderColor: "border-red-500",
      },
      DELETED: {
        bgColor: "bg-red-100",
        textColor: "text-red-500",
        borderColor: "border-red-500",
      },
    };

    const config = statusConfig[status] || {
      bgColor: "bg-gray-100",
      textColor: "text-gray-500",
      borderColor: "border-gray-500",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Empty description="Payment details not found" />
      </div>
    );
  }

  const renderTransactionInfo = () => (
    <Card className="shadow-sm">
      <Descriptions
        bordered
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        className="transaction-details"
      >
        <Descriptions.Item label="Transaction ID" span={2}>
          <div className="flex items-center">
            {payment.id}
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleCopyId(payment.id)}
              className="ml-2"
            />
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Total Amount">
          {formatVND(payment.totalPrice)}
        </Descriptions.Item>
        <Descriptions.Item label="Payment Method">
          <Tag color="blue">{payment.paymentMethod}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Reference ID">
          {payment.paymentReferenceID}
        </Descriptions.Item>
        <Descriptions.Item label="Transaction Date">
          {formatDate(payment.createAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {getStatusTag(payment.status)}
        </Descriptions.Item>
        {payment.refundStatus && (
          <>
            <Descriptions.Item label="Refund Status">
              {getStatusTag(payment.refundStatus)}
            </Descriptions.Item>
            <Descriptions.Item label="Refund Amount">
              {formatVND(payment.refundPrice || 0)}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Card>
  );

  const renderPurchasedSlots = () => (
    <Card className="shadow-sm">
      {payment.adPurchaseSlots?.length > 0 ? (
        <>
          {/* Package Info Section */}
          {payment.adPurchaseSlots[0]?.adPackage && (
            <Card
              className="mb-4"
              title={
                <div className="flex items-center">
                  <FileTextOutlined className="mr-2 text-[#FF009F]" />
                  <span>Package Details</span>
                </div>
              }
            >
              <Descriptions
                bordered
                column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              >
                <Descriptions.Item label="Package Name">
                  <Text strong>
                    {payment.adPurchaseSlots[0].adPackage.packageName}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Price">
                  {formatVND(payment.adPurchaseSlots[0].adPackage.packPrice)}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {payment.adPurchaseSlots[0].adPackage.duration} day(s)
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(payment.adPurchaseSlots[0].adPackage.status)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Slots Section */}
          <Collapse
            className="ad-slots-collapse"
            defaultActiveKey={[payment.adPurchaseSlots[0].id]}
          >
            {payment.adPurchaseSlots.map((slot) => (
              <Panel
                key={slot.id}
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AppstoreOutlined className="mr-2 text-[#FF009F]" />
                      <span className="font-medium">
                        Slot ID: {slot.id.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">
                        {formatVND(slot.purchaseSlotPrice)}
                      </span>
                      {getStatusTag(slot.status)}
                    </div>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  {/* Slot Purchase Details */}
                  <Col span={12}>
                    <Card
                      title={
                        <div className="flex items-center">
                          <InfoCircleOutlined className="mr-2 text-[#FF009F]" />
                          <span>Slot Purchase Details</span>
                        </div>
                      }
                      size="small"
                      className="h-full"
                    >
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Price">
                          {formatVND(slot.purchaseSlotPrice)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Start Date">
                          {formatDate(slot.startDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Expiry Date">
                          {formatDate(slot.expiredDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          {getStatusTag(slot.status)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* Location and Time Range Information */}
                  <Col span={12}>
                    <Row gutter={[16, 16]}>
                      {/* Ad Slot Location */}
                      {slot.adSlotTime?.adSlotID &&
                        adSlotDetails[slot.adSlotTime.adSlotID] && (
                          <Col span={24} className="mb-4">
                            <Card
                              type="inner"
                              title={
                                <div className="flex items-center">
                                  <EnvironmentOutlined className="mr-2 text-green-500" />
                                  <span>Location</span>
                                </div>
                              }
                              size="small"
                              bodyStyle={{ padding: "8px 12px" }}
                            >
                              <div>
                                {
                                  adSlotDetails[slot.adSlotTime.adSlotID]
                                    .slotLocation
                                }
                              </div>
                            </Card>
                          </Col>
                        )}

                      {/* Time Range */}
                      {slot.adSlotTime?.adSlotTimeRangeID &&
                        adSlotTimeRangeDetails[
                          slot.adSlotTime.adSlotTimeRangeID
                        ] && (
                          <Col span={24}>
                            <Card
                              type="inner"
                              title={
                                <div className="flex items-center">
                                  <CalendarOutlined className="mr-2 text-orange-500" />
                                  <span>Time Range</span>
                                </div>
                              }
                              size="small"
                              bodyStyle={{ padding: "8px 12px" }}
                            >
                              <div>
                                {adSlotTimeRangeDetails[
                                  slot.adSlotTime.adSlotTimeRangeID
                                ].startTime.substring(0, 5)}{" "}
                                -{" "}
                                {adSlotTimeRangeDetails[
                                  slot.adSlotTime.adSlotTimeRangeID
                                ].endTime.substring(0, 5)}
                              </div>
                            </Card>
                          </Col>
                        )}
                    </Row>
                  </Col>
                </Row>
              </Panel>
            ))}
          </Collapse>
        </>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No ad slots found"
        />
      )}
    </Card>
  );

  const renderTimeline = () => (
    <Card className="shadow-sm">
      <Timeline
        mode="left"
        items={[
          {
            color: "green",
            label: formatDate(payment.createAt),
            children: "Payment initiated",
          },
          {
            color: payment.status === "SUCCESS" ? "green" : "red",
            label: formatDate(payment.createAt),
            children: `Payment ${
              payment.status === "SUCCESS" ? "completed" : "failed"
            }`,
          },
          ...(payment.adPurchaseSlots || []).map((slot) => ({
            color: "blue",
            label: formatDate(slot.createAt),
            children: "Ad slot purchased",
          })),
          ...(payment.refundStatus
            ? [
                {
                  color: "orange",
                  label: "N/A",
                  children: `Refund ${payment.refundStatus.toLowerCase()}`,
                },
              ]
            : []),
        ]}
      />
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Payment Details | Eigakan Advertiser</title>
      </Helmet>

      <ConfigProvider theme={theme}>
        <div className="p-4">
          <Card
            className="shadow-sm"
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                    className="mr-2"
                  />
                  <div>
                    <Title level={4} className="mb-0 flex items-center">
                      <FileTextOutlined className="mr-2 text-[#FF009F]" />
                      Payment Details
                      {payment.status && (
                        <Tag
                          color={
                            payment.status === "SUCCESS" ? "success" : "error"
                          }
                          className="ml-3"
                        >
                          {payment.status}
                        </Tag>
                      )}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      Transaction ID: {payment.id.substring(0, 12)}...
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        size="small"
                        onClick={() => handleCopyId(payment.id)}
                        className="ml-1"
                      />
                    </Text>
                  </div>
                </div>
                <div>
                  <Text strong className="text-lg text-[#FF009F]">
                    {formatVND(payment.totalPrice)}
                  </Text>
                </div>
              </div>
            }
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="eigakan-tabs"
            >
              <TabPane
                tab={
                  <span>
                    <InfoCircleOutlined /> Transaction Information
                  </span>
                }
                key="1"
              >
                {renderTransactionInfo()}
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <AppstoreOutlined /> Purchased Ad Slots
                    {payment.adPurchaseSlots?.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-500 rounded-full text-xs">
                        {payment.adPurchaseSlots.length}
                      </span>
                    )}
                  </span>
                }
                key="2"
              >
                {renderPurchasedSlots()}
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <ClockCircleOutlined /> Timeline
                  </span>
                }
                key="4"
              >
                {renderTimeline()}
              </TabPane>
            </Tabs>
          </Card>
        </div>
      </ConfigProvider>
    </>
  );
};

export default PaymentDetails;
