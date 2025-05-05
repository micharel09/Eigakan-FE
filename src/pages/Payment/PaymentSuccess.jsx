import React, { useEffect, useState, useRef } from "react";
import { Typography, Spin, Button, Progress, Modal } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  CalendarOutlined,
  HomeOutlined,
  CrownOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import subscriptionService from "../../apis/Subscription/subscription";
import { useAuth } from "../../hooks";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const navigate = useNavigate();
  const apiCalled = useRef(false);
  const { handleLogout } = useAuth();

  // Logout timer state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef(null);

  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const isCancelledPayment = vnpResponseCode === "24";

  useEffect(() => {
    if (isCancelledPayment) {
      setLoading(false);
      setPaymentInfo({
        success: false,
        message: "Payment was canceled by user",
      });
    } else {
      verifyPayment();
    }
  }, [searchParams]);

  // Handle automatic logout with countdown when payment is successful
  useEffect(() => {
    if (paymentInfo?.success) {
      setShowLogoutModal(true);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [paymentInfo?.success, handleLogout]);

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

  const handleManualLogout = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    handleLogout();
  };

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

        {/* Important Membership Notice */}
        <div className="mt-6 bg-[#FF009F]/10 border border-[#FF009F]/20 rounded-xl p-4">
          <div className="flex items-start">
            <InfoCircleOutlined className="text-[#FF009F] text-lg mt-0.5 mr-3" />
            <div>
              <Text className="!text-white font-medium block mb-1">
                Important: Membership Activation Required
              </Text>
              <Text className="!text-gray-300">
                You need to log out and log back in for your VIP Membership to
                take full effect. You will be automatically logged out in a few
                seconds.
              </Text>
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
          <Button
            type="default"
            size="large"
            onClick={handleManualLogout}
            style={{
              backgroundColor: "#374151",
              borderColor: "#374151",
              color: "white",
            }}
            className="hover:bg-[#4b5563] hover:border-[#4b5563] hover:text-white"
          >
            <LogoutOutlined /> Log Out Now
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFailureContent = () => (
    <div className="w-full max-w-4xl rounded-2xl overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloseOutlined className="text-3xl text-white" />
          </div>
          <Title level={2} className="!text-white m-0">
            Payment Failed
          </Title>
          <Text className="text-gray-400">{paymentInfo.message}</Text>
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

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#1a1f2d] flex items-center justify-center p-4">
      {paymentInfo?.success ? renderSuccessContent() : renderFailureContent()}

      {/* Automatic Logout Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <LogoutOutlined className="text-[#FF009F] mr-2" />
            <span>VIP Membership Activation</span>
          </div>
        }
        open={showLogoutModal}
        closable={false}
        footer={null}
        maskClosable={false}
        centered={false}
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 400,
          boxShadow: "0 0 20px rgba(255, 0, 159, 0.3)",
        }}
        className="membership-activation-modal"
      >
        <div className="py-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <motion.div
              className="absolute inset-0 rounded-lg"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(255, 0, 159, 0)",
                  "0 0 15px rgba(255, 0, 159, 0.5)",
                  "0 0 0px rgba(255, 0, 159, 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            ></motion.div>
            <div className="mb-5">
              <div className="text-center mb-3">
                <CrownOutlined className="text-3xl text-[#FF009F]" />
              </div>
              <Text className="block text-center text-base mb-1">
                Your VIP membership is now active!
              </Text>
              <Text className="block text-center text-gray-500">
                Please review your payment details above.
              </Text>
              <Text className="block text-center text-gray-500 mt-2">
                You will be automatically logged out in{" "}
                <span className="font-bold text-[#FF009F]">{countdown}</span>{" "}
                seconds to complete the activation process.
              </Text>
            </div>

            <Progress
              percent={countdown * 10}
              showInfo={false}
              strokeColor={{
                "0%": "#FF009F",
                "100%": "#FF6B9F",
              }}
              trailColor="#f0f0f0"
              className="mb-4"
            />

            <div className="rounded-lg bg-blue-50 p-3 mb-4 border border-blue-100">
              <div className="flex">
                <InfoCircleOutlined className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <Text className="text-blue-700 text-sm">
                  After logging out, please log back in to enjoy all your VIP
                  benefits.
                </Text>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="primary"
                onClick={handleManualLogout}
                style={{
                  backgroundColor: "#FF009F",
                  borderColor: "#FF009F",
                }}
                size="large"
                className="min-w-[120px]"
              >
                Log Out Now
              </Button>
            </div>
          </motion.div>
        </div>
      </Modal>
    </div>
  );
}

export default PaymentSuccess;
