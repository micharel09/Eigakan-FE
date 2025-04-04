import React, { useEffect, useState, useRef } from "react";
import { Typography, Spin, Button } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  CalendarOutlined,
  HomeOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import subscriptionService from "../../apis/Subscription/subscription";

const { Title, Text } = Typography;

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const navigate = useNavigate();
  const apiCalled = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (apiCalled.current) return;

      try {
        apiCalled.current = true;
        const queryString = Array.from(searchParams.entries())
          .map(([key, value]) => `${key}=${value}`)
          .join("&");

        const response = await subscriptionService.verifyPayment(queryString);
        setPaymentInfo(response);

        if (response.success) {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          user.subscriptionStatus = "Active";
          user.roleName = "VIP MEMBER";
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("role", "VIP MEMBER");

          window.dispatchEvent(new Event("userRoleChanged"));
        }
      } catch (error) {
        setPaymentInfo({
          success: false,
          message: error.message || "Payment verification failed",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const formatVND = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleNavigateToHome = () => navigate("/homescreen");

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-[#1a1f2d] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <Text className="block mt-4 text-gray-300">Verifying payment...</Text>
        </div>
      </div>
    );
  }

  const renderSuccessContent = () => (
    <div className="w-full max-w-4xl rounded-2xl overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckOutlined className="text-3xl text-white" />
          </div>
          <Title level={2} className="!text-white m-0">
            Payment Successful!
          </Title>
          <Text className="text-gray-400">
            Your VIP membership has been successfully activated.
          </Text>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Details */}
          <div className="bg-[#1f2937] rounded-xl p-4">
            <div
              className="flex items-center mb-4"
              style={{ color: "var(--eigakan-primary, #FF009F)" }}
            >
              <DollarOutlined className="mr-2" />
              <Text className="!text-white font-medium">Payment Details</Text>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="!text-gray-400">Amount</Text>
                <Text className="!text-white">
                  {formatVND(paymentInfo?.data?.totalPrice || 0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Transaction ID</Text>
                <Text className="!text-white">
                  {paymentInfo?.data?.id || "N/A"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Payment Method</Text>
                <Text className="!text-white bg-[#374151] px-2 py-0.5 rounded text-sm">
                  VNPay
                </Text>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-[#1f2937] rounded-xl p-4">
            <div
              className="flex items-center mb-4"
              style={{ color: "var(--eigakan-primary, #FF009F)" }}
            >
              <CrownOutlined className="mr-2" />
              <Text className="!text-white font-medium">
                Membership Details
              </Text>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="!text-gray-400">Status</Text>
                <Text className="!text-green-400 bg-green-500/20 px-2 py-0.5 rounded text-sm">
                  {paymentInfo?.data?.status || "Activated"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Membership Level</Text>
                <Text
                  className="!text-white px-2 py-0.5 rounded text-sm"
                  style={{ backgroundColor: "var(--eigakan-primary, #FF009F)" }}
                >
                  VIP MEMBER
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Expiry Date</Text>
                <Text className="!text-white">
                  {formatDate(paymentInfo?.data?.expiredDate)}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-[#1f2937] rounded-xl p-4 mt-4">
          <div
            className="flex items-center mb-4"
            style={{ color: "var(--eigakan-primary, #FF009F)" }}
          >
            <CalendarOutlined className="mr-2" />
            <Text className="!text-white font-medium">VIP Benefits</Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-2 mt-0.5">
                <CheckOutlined
                  style={{ color: "var(--eigakan-primary, #FF009F)" }}
                />
              </div>
              <Text className="!text-gray-300">Ad-free movie watching</Text>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-2 mt-0.5">
                <CheckOutlined
                  style={{ color: "var(--eigakan-primary, #FF009F)" }}
                />
              </div>
              <Text className="!text-gray-300">
                High-quality movie downloads
              </Text>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-2 mt-0.5">
                <CheckOutlined
                  style={{ color: "var(--eigakan-primary, #FF009F)" }}
                />
              </div>
              <Text className="!text-gray-300">Exclusive content access</Text>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-2 mt-0.5">
                <CheckOutlined
                  style={{ color: "var(--eigakan-primary, #FF009F)" }}
                />
              </div>
              <Text className="!text-gray-300">Priority customer support</Text>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8 space-x-4">
          <Button
            type="primary"
            size="large"
            onClick={handleNavigateToHome}
            style={{
              backgroundColor: "var(--eigakan-primary, #FF009F)",
              borderColor: "var(--eigakan-primary, #FF009F)",
              boxShadow: "0 4px 6px rgba(255, 0, 159, 0.2)",
            }}
            className="text-white hover:text-white border-none hover:shadow-lg"
          >
            <HomeOutlined /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFailureContent = () => (
    <div className="w-full max-w-md bg-[#1f2937] rounded-2xl overflow-hidden p-6">
      <div className="flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center mb-4">
          <CloseOutlined className="text-2xl text-white" />
        </div>
        <Title level={2} className="text-white text-center">
          Payment Failed
        </Title>
        <Text className="text-gray-300 text-center mb-6">
          {paymentInfo?.message ||
            "There was an issue with your payment. Please try again."}
        </Text>

        <div className="flex flex-col w-full space-y-3">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/subscribe")}
            style={{
              backgroundColor: "var(--eigakan-primary, #FF009F)",
              borderColor: "var(--eigakan-primary, #FF009F)",
              boxShadow: "0 4px 6px rgba(255, 0, 159, 0.2)",
            }}
            className="text-white hover:text-white border-none hover:shadow-lg"
          >
            Try Again
          </Button>
          <Button
            size="large"
            icon={<HomeOutlined />}
            onClick={handleNavigateToHome}
            className="bg-[#374151] text-white border-none hover:bg-[#374151]/90 hover:text-white"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#1a1f2d] flex items-center justify-center p-4 text-white">
      {paymentInfo?.success ? renderSuccessContent() : renderFailureContent()}
    </div>
  );
}

export default PaymentSuccess;
