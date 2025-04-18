import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin, notification, Button, Tag, Typography } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  CalendarOutlined,
  HomeOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const { Title, Text } = Typography;

const PaymentWallet = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // Parse query parameters
    const queryParams = new URLSearchParams(location.search);
    const responseCode = queryParams.get("vnp_ResponseCode");
    const transactionStatus = queryParams.get("vnp_TransactionStatus");
    const amount = queryParams.get("vnp_Amount");

    const verifyPayment = async () => {
      try {
        // Gọi API payment_return để cập nhật trạng thái giao dịch
        const queryString = location.search.substring(1); // Bỏ dấu ? ở đầu
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Gọi API để xác nhận thanh toán
        const response = await axios.get(
          `${API_URLS.WALLET_TRANSACTION}/payment_return?${queryString}`,
          { headers }
        );

        // Kiểm tra kết quả từ API
        if (response.data.success) {
          // API call thành công, nhưng cần kiểm tra trạng thái giao dịch thực tế
          const transactionStatus = response.data.data?.status || "";
          const isPaymentSuccessful =
            transactionStatus === "SUCCESS" ||
            (transactionStatus !== "FAILED" &&
              response.data.message !== "FAILED");

          setPaymentInfo({
            success: isPaymentSuccessful,
            amount: response.data.data?.amount || parseInt(amount) / 100,
            message: response.data.message || "Payment processed",
            transactionId:
              response.data.data?.paymentReferenceId ||
              queryParams.get("vnp_TransactionNo") ||
              "N/A",
            paymentTime:
              response.data.data?.createDate ||
              queryParams.get("vnp_PayDate") ||
              new Date().toLocaleString(),
            status: response.data.data?.status || "",
            responseData: response.data,
          });
        } else {
          // API call thất bại
          setPaymentInfo({
            success: false,
            message:
              response.data.message ||
              "Your payment was not successful. Please try again or contact support.",
            transactionId: queryParams.get("vnp_TransactionNo") || "N/A",
          });
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setError(error.message || "Failed to verify payment");

        // Fallback based on URL parameters if API call fails
        const vnpResponseCode = queryParams.get("vnp_ResponseCode");
        const vnpTransactionStatus = queryParams.get("vnp_TransactionStatus");

        if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
          setPaymentInfo({
            success: true,
            amount: parseInt(amount) / 100,
            message: "Payment successful (based on VNPay response)",
            transactionId: queryParams.get("vnp_TransactionNo") || "N/A",
            paymentTime:
              queryParams.get("vnp_PayDate") || new Date().toLocaleString(),
            status: "SUCCESS", // Giả định trạng thái thành công dựa trên mã VNPay
            apiError: error.message,
          });
        } else {
          setPaymentInfo({
            success: false,
            message:
              "Your payment was not successful. Please try again or contact support.",
            transactionId: queryParams.get("vnp_TransactionNo") || "N/A",
            status: "FAILED", // Đánh dấu trạng thái thất bại
            apiError: error.message,
          });
        }
      } finally {
        setLoading(false);
        // Không tự động chuyển hướng nữa, để người dùng xem thông tin và tự nhấn nút
      }
    };

    // Thực hiện xác minh thanh toán
    verifyPayment();
  }, [navigate, location]);

  const formatVND = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

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
            Your wallet has been topped up successfully.
          </Text>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Details */}
          <div className="bg-[#1f2937] rounded-xl p-4">
            <div
              className="flex items-center mb-4"
              style={{ color: "var(--eigakan-primary)" }}
            >
              <DollarOutlined className="mr-2" />
              <Text className="!text-white font-medium">Payment Details</Text>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="!text-gray-400">Amount Paid</Text>
                <Text className="!text-white">
                  đ{paymentInfo.amount?.toLocaleString()}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Reference ID</Text>
                <Text className="!text-white">{paymentInfo.transactionId}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Payment Time</Text>
                <Text className="!text-white">
                  {formatDate(paymentInfo.paymentTime)}
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

          {/* Status Details */}
          <div className="bg-[#1f2937] rounded-xl p-4">
            <div
              className="flex items-center mb-4"
              style={{ color: "var(--eigakan-primary)" }}
            >
              <WalletOutlined className="mr-2" />
              <Text className="!text-white font-medium">Status Details</Text>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="!text-gray-400">Status</Text>
                <Text className="!text-green-400 bg-green-500/20 px-2 py-0.5 rounded text-sm">
                  {paymentInfo.status || "SUCCESS"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Message</Text>
                <Text className="!text-white">{paymentInfo.message}</Text>
              </div>
              {paymentInfo.apiError && (
                <div className="flex justify-between">
                  <Text className="!text-gray-400">API Error</Text>
                  <Text className="!text-red-400">{paymentInfo.apiError}</Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8 space-x-4">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/advertiser/user-wallet")}
            style={{
              backgroundColor: "var(--eigakan-primary)",
              borderColor: "var(--eigakan-primary)",
              boxShadow: "0 4px 6px var(--ant-primary-color-outline)",
            }}
            className="text-white hover:text-white border-none hover:shadow-lg"
          >
            <WalletOutlined /> Go to Wallet
          </Button>
          <Button
            size="large"
            onClick={() => navigate("/homescreen")}
            className="bg-[#374151] text-white border-none hover:bg-[#374151]/90 hover:text-white"
          >
            <HomeOutlined /> Return to Home
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
        <Title level={2} className="!text-white text-center">
          {paymentInfo.status === "FAILED" || paymentInfo.message === "FAILED"
            ? "Payment Failed"
            : "Payment Unsuccessful"}
        </Title>
        <Text className="text-gray-300 text-center mb-6">
          {paymentInfo.message ||
            "There was an issue with your payment. Please try again."}
        </Text>

        <div className="flex flex-col w-full space-y-3">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/advertiser/user-wallet")}
            style={{
              backgroundColor: "var(--eigakan-primary)",
              borderColor: "var(--eigakan-primary)",
              boxShadow: "0 4px 6px var(--ant-primary-color-outline)",
            }}
            className="text-white hover:text-white border-none hover:shadow-lg"
          >
            Return to Wallet
          </Button>
          <Button
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate("/homescreen")}
            className="bg-[#374151] text-white border-none hover:bg-[#374151]/90 hover:text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-[#1a1f2d] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <Text className="block mt-4 text-gray-300">
            Processing your payment, please wait...
          </Text>
        </div>
      </div>
    );
  }

  if (error && !paymentInfo) {
    return (
      <div className="min-h-[calc(100vh-200px)] bg-[#1a1f2d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center mb-4">
            <CloseOutlined className="text-2xl text-white" />
          </div>
          <Title level={3} className="!text-white text-center">
            Error Processing Payment
          </Title>
          <Text className="text-red-400 text-center block mb-6">{error}</Text>
          <Button
            type="primary"
            onClick={() => navigate("/advertiser/user-wallet")}
            style={{
              backgroundColor: "var(--eigakan-primary)",
              borderColor: "var(--eigakan-primary)",
            }}
            className="text-white hover:text-white"
          >
            Return to Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4 bg-[#1a1f2d] text-white">
      {paymentInfo?.success ? renderSuccessContent() : renderFailureContent()}
    </div>
  );
};

export default PaymentWallet;
