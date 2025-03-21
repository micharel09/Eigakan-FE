import React, { useEffect, useState, useRef } from "react";
import { Spin, Button, Typography } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  CalendarOutlined,
  GiftOutlined,
  DashboardOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import adSlotService from "../../apis/AdSlot/adslot";

const { Title, Text } = Typography;

const PaymentSuccessAdSlot = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const navigate = useNavigate();
  const apiCalled = useRef(false);

  const handleVerifyPayment = async () => {
    if (apiCalled.current) return;

    try {
      apiCalled.current = true;
      const queryString = Array.from(searchParams.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const response = await adSlotService.verifyAdPayment(queryString);
      setPaymentInfo(response);
    } catch (error) {
      setPaymentInfo({
        success: false,
        message: error.message || "Payment verification failed",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleVerifyPayment();
  }, [searchParams]);

  const handleNavigateToDashboard = () => navigate("/advertiser/dashboard");
  const handleNavigateToHome = () => navigate("/homescreen");
  const handleNavigateToPackages = () =>
    navigate("/advertiser/select-adpackage");

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
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Extract purchase data
  const purchaseData = paymentInfo?.data || {};
  const purchaseSlot = purchaseData?.adPurchaseSlots?.[0] || {};
  const adPackage = purchaseSlot?.adPackage || {};
  const adSlotTime = purchaseSlot?.adSlotTime || {};

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
            Your ad slot purchase has been completed successfully.
          </Text>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Payment Details */}
          <div className="bg-[#1f2937] rounded-xl p-4">
            <div className="flex items-center mb-4 text-[#FF009F]">
              <DollarOutlined className="mr-2" />
              <Text className="!text-white font-medium">Payment Details</Text>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="!text-gray-400">Amount Paid</Text>
                <Text className="!text-white">
                  đ{purchaseData.totalPrice?.toLocaleString()}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Reference ID</Text>
                <Text className="!text-white">
                  {purchaseData.paymentReferenceID}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Purchase Date</Text>
                <Text className="!text-white">
                  {formatDate(purchaseData.createAt)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Payment Method</Text>
                <Text className="!text-white bg-[#374151] px-2 py-0.5 rounded text-sm">
                  {purchaseData.paymentMethod}
                </Text>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-[#1f2937] rounded-xl p-4">
            <div className="flex items-center mb-4 text-[#FF009F]">
              <GiftOutlined className="mr-2" />
              <Text className="!text-white font-medium">Package Details</Text>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="!text-gray-400">Package Name</Text>
                <Text className="!text-white bg-[#FF009F] px-2 py-0.5 rounded text-sm">
                  {adPackage.packageName}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Duration</Text>
                <Text className="!text-white">
                  {adPackage.duration} month{adPackage.duration > 1 ? "s" : ""}
                </Text>
              </div>
            </div>
          </div>

          {/* Ad Slot Details */}
          <div className="bg-[#1f2937] rounded-xl p-4">
            <div className="flex items-center mb-4 text-[#FF009F]">
              <CalendarOutlined className="mr-2" />
              <Text className="!text-white font-medium">Ad Slot Details</Text>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="!text-gray-400">Start Date</Text>
                <Text className="!text-white">
                  {formatDate(purchaseSlot.startDate)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">End Date</Text>
                <Text className="!text-white">
                  {formatDate(purchaseSlot.expiredDate)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="!text-gray-400">Status</Text>
                <Text className="!text-green-400 bg-green-500/20 px-2 py-0.5 rounded text-sm">
                  {purchaseSlot.status}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8 space-x-4">
          <Button
            type="primary"
            size="large"
            icon={<DashboardOutlined />}
            onClick={handleNavigateToDashboard}
            className="bg-[#FF009F] hover:bg-[#D1007F] border-none text-white hover:text-white shadow-lg hover:shadow-[0_5px_15px_rgba(255,0,159,0.4)]"
          >
            Go to Dashboard
          </Button>
          <Button
            size="large"
            icon={<HomeOutlined />}
            onClick={handleNavigateToHome}
            className="bg-[#374151] text-white border-none hover:bg-[#374151]/90 hover:text-white"
          >
            Return to Home
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
            onClick={handleNavigateToPackages}
            className="bg-[#FF009F] hover:bg-[#D1007F] border-none text-white hover:text-white shadow-lg hover:shadow-[0_5px_15px_rgba(255,0,159,0.4)]"
          >
            Try Again
          </Button>
          <Button
            size="large"
            icon={<HomeOutlined />}
            onClick={handleNavigateToHome}
            className="bg-[#374151] text-white border-none hover:bg-[#374151]/90 hover:text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4 text-white">
      {paymentInfo?.success ? renderSuccessContent() : renderFailureContent()}
    </div>
  );
};

export default PaymentSuccessAdSlot;
