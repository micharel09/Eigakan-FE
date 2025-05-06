import React, { useEffect, useState, useRef } from "react";
import { Typography, Spin, Button, Progress, Modal } from "antd";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  CalendarOutlined,
  HomeOutlined,
  CrownOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
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
  const location = useLocation();
  const apiCalled = useRef(false);
  const { handleLogout } = useAuth();

  // Logout timer state - changed from modal to inline notification
  const [countdown, setCountdown] = useState(30); // Extended from 10 to 30 seconds
  const countdownRef = useRef(null);
  const [showCountdown, setShowCountdown] = useState(false);
  // State to track if logout is pending
  const [logoutPending, setLogoutPending] = useState(false);
  // State for navigation block modal
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [attemptedNavigation, setAttemptedNavigation] = useState(null);

  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const isCancelledPayment = vnpResponseCode === "24";

  // Prevent navigation when logout is pending
  useEffect(() => {
    const preventNavigation = (e) => {
      if (logoutPending) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", preventNavigation);

    return () => {
      window.removeEventListener("beforeunload", preventNavigation);
    };
  }, [logoutPending]);

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
      setShowCountdown(true);
      setLogoutPending(true);

      // Start the countdown after a 3 second delay to give user time to see success screen
      setTimeout(() => {
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
      }, 3000);
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

  // Override the navigation to home to show a warning modal
  const handleNavigateToHome = () => {
    if (logoutPending) {
      setAttemptedNavigation("/homescreen");
      setShowNavigationModal(true);
    } else {
      navigate("/homescreen");
    }
  };

  const handleManualLogout = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    handleLogout();
  };

  // Custom navigation handler for any navigation attempt
  const handleAnyNavigation = (path) => {
    if (logoutPending) {
      setAttemptedNavigation(path);
      setShowNavigationModal(true);
      return false;
    }
    return true;
  };

  // Override the React Router's useNavigate function
  useEffect(() => {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function patchedPushState(...args) {
      const newPath = args[2];
      if (logoutPending && newPath !== location.pathname) {
        setAttemptedNavigation(newPath);
        setShowNavigationModal(true);
        return;
      }
      return originalPushState.apply(history, args);
    }

    function patchedReplaceState(...args) {
      const newPath = args[2];
      if (logoutPending && newPath !== location.pathname) {
        setAttemptedNavigation(newPath);
        setShowNavigationModal(true);
        return;
      }
      return originalReplaceState.apply(history, args);
    }

    history.pushState = patchedPushState;
    history.replaceState = patchedReplaceState;

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [logoutPending, location.pathname]);

  // Handle navigation links clicks
  useEffect(() => {
    const handleLinkClick = (e) => {
      if (logoutPending) {
        const link = e.target.closest("a");
        if (link) {
          const href = link.getAttribute("href");
          if (
            href &&
            !href.startsWith("javascript:") &&
            !href.startsWith("#")
          ) {
            e.preventDefault();
            setAttemptedNavigation(href);
            setShowNavigationModal(true);
          }
        }
      }
    };

    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [logoutPending]);

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

        {/* Logout notification - now appears inline instead of in a modal */}
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 bg-gradient-to-r from-[#372248] to-[#2e1e3d] border border-[#FF009F]/30 rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0">
                <div className="w-12 h-12 bg-[#FF009F]/20 rounded-full flex items-center justify-center">
                  <CrownOutlined className="text-xl text-[#FF009F]" />
                </div>
              </div>
              <div className="flex-grow">
                <Text className="!text-white font-medium text-lg block mb-1">
                  VIP Membership Activation
                </Text>
                <Text className="!text-gray-300 block mb-3">
                  To complete your membership activation, you will be
                  automatically logged out in{" "}
                  <span className="text-[#FF009F] font-bold">{countdown}</span>{" "}
                  seconds. Please log back in to enjoy all your VIP benefits.
                </Text>
                <div className="mb-4">
                  <Progress
                    percent={(countdown / 30) * 100} // Assuming 30 seconds max
                    showInfo={false}
                    strokeColor={{
                      "0%": "#FF009F",
                      "100%": "#FF6B9F",
                    }}
                    trailColor="rgba(255, 255, 255, 0.1)"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    onClick={handleManualLogout}
                    size="middle"
                    style={{
                      backgroundColor: "#FF009F",
                      borderColor: "#FF009F",
                    }}
                  >
                    <LogoutOutlined /> Log Out Now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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

      {/* Navigation Block Modal */}
      <Modal
        title={
          <div className="flex items-center text-[#FF009F]">
            <ExclamationCircleOutlined className="mr-2" />
            <span>Activation In Progress</span>
          </div>
        }
        open={showNavigationModal}
        closable={true}
        onCancel={() => setShowNavigationModal(false)}
        footer={[
          <Button key="back" onClick={() => setShowNavigationModal(false)}>
            Stay on Page
          </Button>,
          <Button
            key="logout"
            type="primary"
            onClick={handleManualLogout}
            style={{
              backgroundColor: "#FF009F",
              borderColor: "#FF009F",
            }}
          >
            Log Out Now
          </Button>,
        ]}
        centered
      >
        <div className="py-2">
          <div className="mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div className="flex">
              <InfoCircleOutlined className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <Text className="text-amber-800">
                You need to log out for your VIP membership to be activated
                properly. Please log out now or wait for automatic logout in{" "}
                {countdown} seconds.
              </Text>
            </div>
          </div>
          <Text>
            Navigating away from this page before logging out may cause issues
            with your membership activation.
          </Text>
        </div>
      </Modal>
    </div>
  );
}

export default PaymentSuccess;
