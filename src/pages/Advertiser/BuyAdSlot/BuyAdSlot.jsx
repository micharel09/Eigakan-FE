import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Spin,
  notification,
  Result,
  Tag,
  Tooltip,
  Divider,
  Badge,
} from "antd";
import adSlotService from "../../../apis/AdSlot/adslot";
import { Helmet } from "react-helmet";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  FireOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  EyeOutlined,
  AppstoreOutlined,
  LayoutOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const BuyAdSlot = () => {
  const [adSlots, setAdSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  useEffect(() => {
    // Lấy packageId từ query params
    const searchParams = new URLSearchParams(location.search);
    const packageId = searchParams.get("packageId");

    if (!packageId) {
      // Nếu không có packageId, chuyển hướng về trang chọn gói
      navigate("/advertiser/select-adpackage");
      return;
    }

    setSelectedPackageId(packageId);

    fetchAdSlotTimes();
  }, [location, navigate]);

  const fetchAdSlotTimes = async () => {
    try {
      setLoading(true);
      const response = await adSlotService.getAllAdSlotTimes();
      console.log("Response from API:", response);

      if (response.success) {
        // Lọc ra các AdSlotTime có isSelected = false
        const availableSlotTimes =
          response.data?.filter((slot) => !slot.isSelected) || [];

        console.log("Available slot times:", availableSlotTimes);
        setAdSlots(availableSlotTimes);
      } else {
        notification.error({
          message: "Error",
          description: "Could not load AdSlotTime information.",
        });
      }
    } catch (error) {
      console.error("Error fetching AdSlotTimes:", error);
      notification.error({
        message: "Error",
        description:
          error.message || "Error occurred while fetching AdSlotTimes",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSlotSelection = (slotId) => {
    setSelectedSlots((prevSelected) => {
      // If already selected, remove it from selection
      if (prevSelected.includes(slotId)) {
        return prevSelected.filter((id) => id !== slotId);
      }
      // If not selected and fewer than 2 slots are selected, add it
      else if (prevSelected.length < 2) {
        return [...prevSelected, slotId];
      }
      // If already 2 slots selected, show notification and don't change
      else {
        notification.info({
          message: "Selection Limit",
          description: "You can select up to 2 ad slots at a time.",
        });
        return prevSelected;
      }
    });
  };

  const handlePurchase = async () => {
    if (purchasing || selectedSlots.length === 0) return;

    try {
      setPurchasing(true);

      // Prepare data for API request with multiple slots
      const requestData = {
        orders: selectedSlots.map((slotId) => ({
          adSlotTimeId: slotId,
          adPackageId: selectedPackageId,
          startDate: new Date().toISOString(),
        })),
        redirectUrl: `${window.location.origin}/payment-success-adslot`,
      };

      // Call API to purchase AdSlots
      const response = await adSlotService.createAdPurchaseTransaction(
        requestData
      );

      if (response.success) {
        // Handle success scenarios as before
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
          return;
        } else if (response.message && response.message.startsWith("http")) {
          window.location.href = response.message;
          return;
        } else {
          notification.success({
            message: "Success",
            description: "Ad purchase request has been sent",
          });
        }
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to create payment",
        });
      }

      await fetchAdSlotTimes();
      // Clear selections after purchase
      setSelectedSlots([]);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "An error occurred during payment",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Get icon based on popularity
  const getPopularityIcon = (popularity) => {
    switch (popularity) {
      case "High":
        return <FireOutlined className="text-orange-500" />;
      case "Premium":
        return <TrophyOutlined className="text-yellow-400" />;
      default:
        return <LineChartOutlined className="text-[#FF6B9F]" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (adSlots.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Result
          status="info"
          title="No Available AdSlots"
          subTitle="There are currently no available AdSlots. Please check back later."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Buy AdSlot - Eigakan</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]">
              Boost Your Brand Visibility
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Select premium advertising spots to showcase your content to
              thousands of movie enthusiasts
            </p>
          </motion.div>

          <div className="flex justify-center mt-8 mb-12 space-x-8">
            <div className="flex items-center text-gray-300">
              <EyeOutlined className="text-[#FF009F] mr-2" />
              <span>High Visibility</span>
            </div>
            <div className="flex items-center text-gray-300">
              <ThunderboltOutlined className="text-[#FF009F] mr-2" />
              <span>Instant Activation</span>
            </div>
            <div className="flex items-center text-gray-300">
              <RocketOutlined className="text-[#FF009F] mr-2" />
              <span>Premium Placement</span>
            </div>
          </div>
        </div>

        {selectedSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 left-6 z-50 flex justify-center"
          >
            <div className="bg-gray-800 rounded-lg shadow-xl p-4 flex items-center justify-between max-w-2xl w-full border border-[#FF009F]/30">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-3">
                  <ShoppingCartOutlined className="text-[#FF009F] text-lg" />
                </div>
                <div>
                  <span className="text-white font-medium">
                    {selectedSlots.length}{" "}
                    {selectedSlots.length === 1 ? "slot" : "slots"} selected
                  </span>
                  <p className="text-gray-400 text-sm">
                    {selectedSlots.length < 2
                      ? "You can select up to 2 slots"
                      : "Maximum selection reached"}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePurchase}
                disabled={purchasing || selectedSlots.length === 0}
                className="bg-[#FF009F] hover:bg-[#D1007F] text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
              >
                {purchasing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <ShoppingCartOutlined />
                    Checkout ({selectedSlots.length})
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        <div className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              Available Ad Positions
            </h2>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#FF009F] mr-2"></div>
                <span className="text-sm text-gray-300">Premium</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm text-gray-300">High Demand</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span className="text-sm text-gray-300">Standard</span>
              </div>
            </div>
          </div>

          {/* Ad Slot Categories */}
          <div className="grid grid-cols-1 gap-8">
            {/* Header Section */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <EnvironmentOutlined className="text-white" />
                </span>
                Header Positions
              </h3>
              <p className="text-gray-400 mb-6">
                Premium spots at the top of our pages with maximum visibility
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adSlots
                  .filter((slot) =>
                    slot.adSlot?.slotLocation?.toLowerCase().includes("header")
                  )
                  .map((adSlot) => (
                    <div
                      key={adSlot.id}
                      className={`
                        group h-full transform transition-all duration-200 hover:translate-y-[-8px] hover:scale-[1.01] hover:z-10 relative
                        ${
                          selectedSlots.includes(adSlot.id)
                            ? "ring-2 ring-[#FF009F] ring-offset-2 ring-offset-gray-900"
                            : ""
                        }
                      `}
                    >
                      <div
                        className={`
                          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          ${
                            adSlot.recommended
                              ? "bg-gradient-to-r from-[#FF009F]/20 to-[#FF6B9F]/20 blur-xl"
                              : "bg-[#FF009F]/10 blur-xl"
                          }
                          ${
                            selectedSlots.includes(adSlot.id)
                              ? "opacity-100 !blur-md"
                              : ""
                          }
                        `}
                      ></div>

                      <Card
                        className={`
                          h-full rounded-2xl overflow-hidden border-0 shadow-lg transition-all duration-200 ease-out
                          ${
                            adSlot.recommended
                              ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 group-hover:shadow-[0_10px_40px_-15px_rgba(255,0,159,0.3)]"
                              : "bg-gray-800 group-hover:shadow-[0_10px_30px_-15px_rgba(255,0,159,0.2)]"
                          }
                          ${
                            selectedSlots.includes(adSlot.id)
                              ? "shadow-[0_0_15px_rgba(255,0,159,0.4)]"
                              : ""
                          }
                        `}
                        bodyStyle={{ padding: 0 }}
                      >
                        {selectedSlots.includes(adSlot.id) && (
                          <div className="absolute top-0 left-0 bg-[#FF009F] text-white px-4 py-1 rounded-br-lg font-medium text-sm z-10">
                            SELECTED
                          </div>
                        )}

                        {adSlot.recommended && (
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white px-4 py-1 rounded-bl-lg font-medium text-sm z-10">
                            RECOMMENDED
                          </div>
                        )}

                        <div className="p-1">
                          <div
                            className={`
                              rounded-t-xl p-6 transition-all duration-200 ease-out
                              ${
                                adSlot.recommended
                                  ? "bg-gradient-to-r from-[#FF009F]/20 to-[#FF6B9F]/20 border-b border-[#FF009F]/30 group-hover:from-[#FF009F]/30 group-hover:to-[#FF6B9F]/30"
                                  : "bg-gray-800/50 border-b border-gray-700 group-hover:bg-gray-800/70"
                              }
                            `}
                          >
                            <div className="flex justify-between items-start">
                              <h2 className="text-2xl font-bold text-white transition-colors duration-200 ease-out group-hover:text-[#FF009F]">
                                {adSlot.adSlot?.slotLocation}
                              </h2>
                              <Badge
                                count={adSlot.adSlot?.popularity}
                                style={{
                                  backgroundColor:
                                    adSlot.adSlot?.popularity === "Premium"
                                      ? "#FF009F"
                                      : adSlot.adSlot?.popularity === "High"
                                      ? "#ff9500"
                                      : "#FF6B9F",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              />
                            </div>

                            <div className="mt-4 flex justify-between items-end">
                              <div>
                                <p className="text-gray-400 text-sm">Price</p>
                                <div className="flex items-baseline">
                                  <span className="text-4xl font-extrabold text-white transition-colors duration-200 ease-out group-hover:text-[#FF009F]">
                                    {
                                      formatVND(adSlot.slotTimePrice).split(
                                        "₫"
                                      )[0]
                                    }
                                  </span>
                                  <span className="text-xl text-gray-300 ml-1 transition-colors duration-200 ease-out group-hover:text-[#FF009F]/70">
                                    ₫
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center bg-white/10 px-3 py-1 rounded-full transition-all duration-200 ease-out group-hover:bg-white/15 group-hover:scale-105">
                                <ClockCircleOutlined className="text-[#FF009F] mr-2" />
                                <span className="text-gray-300 text-sm">
                                  {adSlot.adSlotTimeRange?.startTime} -{" "}
                                  {adSlot.adSlotTimeRange?.endTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <ul className="space-y-4 mb-6">
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <ClockCircleOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Time: {adSlot.adSlotTimeRange?.startTime} -{" "}
                                  {adSlot.adSlotTimeRange?.endTime}
                                </span>
                              </li>
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <EnvironmentOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Location: {adSlot.adSlot?.slotLocation}
                                </span>
                              </li>
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <DollarOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Price: {formatVND(adSlot.slotTimePrice)}
                                </span>
                              </li>
                            </ul>

                            <Divider className="border-gray-700 my-6 transition-colors duration-200 ease-out group-hover:border-gray-600" />

                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center">
                                <InfoCircleOutlined className="text-gray-400 mr-2 transition-colors duration-200 ease-out group-hover:text-gray-300" />
                                <span className="text-gray-400 text-sm transition-colors duration-200 ease-out group-hover:text-gray-300">
                                  Approval required
                                </span>
                              </div>
                              <div className="px-2 py-1 rounded-full text-[#FF009F] bg-[#FF009F]/10 border border-[#FF009F] text-sm font-medium transition-all duration-200 ease-out group-hover:opacity-90">
                                Available Now
                              </div>
                            </div>

                            <button
                              onClick={() => toggleSlotSelection(adSlot.id)}
                              className={`
                                w-full h-12 flex items-center justify-center gap-2 text-base font-semibold rounded-lg
                                transition-all duration-200 ease-out transform
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${
                                  selectedSlots.includes(adSlot.id)
                                    ? "bg-gray-700 text-white border-2 border-[#FF009F] hover:bg-gray-600"
                                    : adSlot.recommended
                                    ? "bg-[#FF009F] hover:bg-[#D1007F] group-hover:shadow-[0_5px_15px_rgba(255,0,159,0.4)] text-white border-0"
                                    : "bg-[#FF009F] hover:bg-[#D1007F] group-hover:shadow-[0_5px_15px_rgba(255,0,159,0.3)] text-white border-0"
                                }
                                group-hover:translate-y-[-2px]
                              `}
                            >
                              {selectedSlots.includes(adSlot.id) ? (
                                <>
                                  <CheckCircleOutlined className="text-lg" />
                                  Selected
                                </>
                              ) : (
                                <>
                                  <ShoppingCartOutlined className="text-lg" />
                                  Select Slot
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <LayoutOutlined className="text-white" />
                </span>
                Sidebar Positions
              </h3>
              <p className="text-gray-400 mb-6">
                Highly visible positions on the sides of our content pages
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adSlots
                  .filter((slot) =>
                    slot.adSlot?.slotLocation?.toLowerCase().includes("sidebar")
                  )
                  .map((adSlot) => (
                    <div
                      key={adSlot.id}
                      className={`
                        group h-full transform transition-all duration-200 hover:translate-y-[-8px] hover:scale-[1.01] hover:z-10 relative
                        ${
                          selectedSlots.includes(adSlot.id)
                            ? "ring-2 ring-[#FF009F] ring-offset-2 ring-offset-gray-900"
                            : ""
                        }
                      `}
                    >
                      <div
                        className={`
                          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          ${
                            adSlot.recommended
                              ? "bg-gradient-to-r from-[#FF009F]/20 to-[#FF6B9F]/20 blur-xl"
                              : "bg-[#FF009F]/10 blur-xl"
                          }
                          ${
                            selectedSlots.includes(adSlot.id)
                              ? "opacity-100 !blur-md"
                              : ""
                          }
                        `}
                      ></div>

                      <Card
                        className={`
                          h-full rounded-2xl overflow-hidden border-0 shadow-lg transition-all duration-200 ease-out
                          ${
                            adSlot.recommended
                              ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 group-hover:shadow-[0_10px_40px_-15px_rgba(255,0,159,0.3)]"
                              : "bg-gray-800 group-hover:shadow-[0_10px_30px_-15px_rgba(255,0,159,0.2)]"
                          }
                          ${
                            selectedSlots.includes(adSlot.id)
                              ? "shadow-[0_0_15px_rgba(255,0,159,0.4)]"
                              : ""
                          }
                        `}
                        bodyStyle={{ padding: 0 }}
                      >
                        {selectedSlots.includes(adSlot.id) && (
                          <div className="absolute top-0 left-0 bg-[#FF009F] text-white px-4 py-1 rounded-br-lg font-medium text-sm z-10">
                            SELECTED
                          </div>
                        )}

                        {adSlot.recommended && (
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white px-4 py-1 rounded-bl-lg font-medium text-sm z-10">
                            RECOMMENDED
                          </div>
                        )}

                        <div className="p-1">
                          <div
                            className={`
                              rounded-t-xl p-6 transition-all duration-200 ease-out
                              ${
                                adSlot.recommended
                                  ? "bg-gradient-to-r from-[#FF009F]/20 to-[#FF6B9F]/20 border-b border-[#FF009F]/30 group-hover:from-[#FF009F]/30 group-hover:to-[#FF6B9F]/30"
                                  : "bg-gray-800/50 border-b border-gray-700 group-hover:bg-gray-800/70"
                              }
                            `}
                          >
                            <div className="flex justify-between items-start">
                              <h2 className="text-2xl font-bold text-white transition-colors duration-200 ease-out group-hover:text-[#FF009F]">
                                {adSlot.adSlot?.slotLocation}
                              </h2>
                              <Badge
                                count={adSlot.adSlot?.popularity}
                                style={{
                                  backgroundColor:
                                    adSlot.adSlot?.popularity === "Premium"
                                      ? "#FF009F"
                                      : adSlot.adSlot?.popularity === "High"
                                      ? "#ff9500"
                                      : "#FF6B9F",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              />
                            </div>

                            <div className="mt-4 flex justify-between items-end">
                              <div>
                                <p className="text-gray-400 text-sm">Price</p>
                                <div className="flex items-baseline">
                                  <span className="text-4xl font-extrabold text-white transition-colors duration-200 ease-out group-hover:text-[#FF009F]">
                                    {
                                      formatVND(adSlot.slotTimePrice).split(
                                        "₫"
                                      )[0]
                                    }
                                  </span>
                                  <span className="text-xl text-gray-300 ml-1 transition-colors duration-200 ease-out group-hover:text-[#FF009F]/70">
                                    ₫
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center bg-white/10 px-3 py-1 rounded-full transition-all duration-200 ease-out group-hover:bg-white/15 group-hover:scale-105">
                                <ClockCircleOutlined className="text-[#FF009F] mr-2" />
                                <span className="text-gray-300 text-sm">
                                  {adSlot.adSlotTimeRange?.startTime} -{" "}
                                  {adSlot.adSlotTimeRange?.endTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <ul className="space-y-4 mb-6">
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <ClockCircleOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Time: {adSlot.adSlotTimeRange?.startTime} -{" "}
                                  {adSlot.adSlotTimeRange?.endTime}
                                </span>
                              </li>
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <EnvironmentOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Location: {adSlot.adSlot?.slotLocation}
                                </span>
                              </li>
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <DollarOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Price: {formatVND(adSlot.slotTimePrice)}
                                </span>
                              </li>
                            </ul>

                            <Divider className="border-gray-700 my-6 transition-colors duration-200 ease-out group-hover:border-gray-600" />

                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center">
                                <InfoCircleOutlined className="text-gray-400 mr-2 transition-colors duration-200 ease-out group-hover:text-gray-300" />
                                <span className="text-gray-400 text-sm transition-colors duration-200 ease-out group-hover:text-gray-300">
                                  Approval required
                                </span>
                              </div>
                              <div className="px-2 py-1 rounded-full text-[#FF009F] bg-[#FF009F]/10 border border-[#FF009F] text-sm font-medium transition-all duration-200 ease-out group-hover:opacity-90">
                                Available Now
                              </div>
                            </div>

                            <button
                              onClick={() => toggleSlotSelection(adSlot.id)}
                              className={`
                                w-full h-12 flex items-center justify-center gap-2 text-base font-semibold rounded-lg
                                transition-all duration-200 ease-out transform
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${
                                  selectedSlots.includes(adSlot.id)
                                    ? "bg-gray-700 text-white border-2 border-[#FF009F] hover:bg-gray-600"
                                    : adSlot.recommended
                                    ? "bg-[#FF009F] hover:bg-[#D1007F] group-hover:shadow-[0_5px_15px_rgba(255,0,159,0.4)] text-white border-0"
                                    : "bg-[#FF009F] hover:bg-[#D1007F] group-hover:shadow-[0_5px_15px_rgba(255,0,159,0.3)] text-white border-0"
                                }
                                group-hover:translate-y-[-2px]
                              `}
                            >
                              {selectedSlots.includes(adSlot.id) ? (
                                <>
                                  <CheckCircleOutlined className="text-lg" />
                                  Selected
                                </>
                              ) : (
                                <>
                                  <ShoppingCartOutlined className="text-lg" />
                                  Select Slot
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
              </div>
            </div>

            {/* Other Positions Section */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <AppstoreOutlined className="text-white" />
                </span>
                Other Positions
              </h3>
              <p className="text-gray-400 mb-6">
                Strategic placements throughout our platform
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adSlots
                  .filter(
                    (slot) =>
                      !slot.adSlot?.slotLocation
                        ?.toLowerCase()
                        .includes("header") &&
                      !slot.adSlot?.slotLocation
                        ?.toLowerCase()
                        .includes("sidebar")
                  )
                  .map((adSlot) => (
                    <div
                      key={adSlot.id}
                      className={`
                        group h-full transform transition-all duration-200 hover:translate-y-[-8px] hover:scale-[1.01] hover:z-10 relative
                        ${
                          selectedSlots.includes(adSlot.id)
                            ? "ring-2 ring-[#FF009F] ring-offset-2 ring-offset-gray-900"
                            : ""
                        }
                      `}
                    >
                      <div
                        className={`
                          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          ${
                            adSlot.recommended
                              ? "bg-gradient-to-r from-[#FF009F]/20 to-[#FF6B9F]/20 blur-xl"
                              : "bg-[#FF009F]/10 blur-xl"
                          }
                          ${
                            selectedSlots.includes(adSlot.id)
                              ? "opacity-100 !blur-md"
                              : ""
                          }
                        `}
                      ></div>

                      <Card
                        className={`
                          h-full rounded-2xl overflow-hidden border-0 shadow-lg transition-all duration-200 ease-out
                          ${
                            adSlot.recommended
                              ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 group-hover:shadow-[0_10px_40px_-15px_rgba(255,0,159,0.3)]"
                              : "bg-gray-800 group-hover:shadow-[0_10px_30px_-15px_rgba(255,0,159,0.2)]"
                          }
                          ${
                            selectedSlots.includes(adSlot.id)
                              ? "shadow-[0_0_15px_rgba(255,0,159,0.4)]"
                              : ""
                          }
                        `}
                        bodyStyle={{ padding: 0 }}
                      >
                        {selectedSlots.includes(adSlot.id) && (
                          <div className="absolute top-0 left-0 bg-[#FF009F] text-white px-4 py-1 rounded-br-lg font-medium text-sm z-10">
                            SELECTED
                          </div>
                        )}

                        {adSlot.recommended && (
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white px-4 py-1 rounded-bl-lg font-medium text-sm z-10">
                            RECOMMENDED
                          </div>
                        )}

                        <div className="p-1">
                          <div
                            className={`
                              rounded-t-xl p-6 transition-all duration-200 ease-out
                              ${
                                adSlot.recommended
                                  ? "bg-gradient-to-r from-[#FF009F]/20 to-[#FF6B9F]/20 border-b border-[#FF009F]/30 group-hover:from-[#FF009F]/30 group-hover:to-[#FF6B9F]/30"
                                  : "bg-gray-800/50 border-b border-gray-700 group-hover:bg-gray-800/70"
                              }
                            `}
                          >
                            <div className="flex justify-between items-start">
                              <h2 className="text-2xl font-bold text-white transition-colors duration-200 ease-out group-hover:text-[#FF009F]">
                                {adSlot.adSlot?.slotLocation}
                              </h2>
                              <Badge
                                count={adSlot.adSlot?.popularity}
                                style={{
                                  backgroundColor:
                                    adSlot.adSlot?.popularity === "Premium"
                                      ? "#FF009F"
                                      : adSlot.adSlot?.popularity === "High"
                                      ? "#ff9500"
                                      : "#FF6B9F",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              />
                            </div>

                            <div className="mt-4 flex justify-between items-end">
                              <div>
                                <p className="text-gray-400 text-sm">Price</p>
                                <div className="flex items-baseline">
                                  <span className="text-4xl font-extrabold text-white transition-colors duration-200 ease-out group-hover:text-[#FF009F]">
                                    {
                                      formatVND(adSlot.slotTimePrice).split(
                                        "₫"
                                      )[0]
                                    }
                                  </span>
                                  <span className="text-xl text-gray-300 ml-1 transition-colors duration-200 ease-out group-hover:text-[#FF009F]/70">
                                    ₫
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center bg-white/10 px-3 py-1 rounded-full transition-all duration-200 ease-out group-hover:bg-white/15 group-hover:scale-105">
                                <ClockCircleOutlined className="text-[#FF009F] mr-2" />
                                <span className="text-gray-300 text-sm">
                                  {adSlot.adSlotTimeRange?.startTime} -{" "}
                                  {adSlot.adSlotTimeRange?.endTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <ul className="space-y-4 mb-6">
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <ClockCircleOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Time: {adSlot.adSlotTimeRange?.startTime} -{" "}
                                  {adSlot.adSlotTimeRange?.endTime}
                                </span>
                              </li>
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <EnvironmentOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Location: {adSlot.adSlot?.slotLocation}
                                </span>
                              </li>
                              <li className="flex items-center text-gray-300 transition-colors duration-200 ease-out group-hover:text-white">
                                <div className="w-8 h-8 rounded-full bg-[#FF009F]/10 flex items-center justify-center mr-3 transition-all duration-200 ease-out group-hover:bg-[#FF009F]/20 group-hover:scale-110 transform">
                                  <DollarOutlined className="text-[#FF009F]" />
                                </div>
                                <span>
                                  Price: {formatVND(adSlot.slotTimePrice)}
                                </span>
                              </li>
                            </ul>

                            <Divider className="border-gray-700 my-6 transition-colors duration-200 ease-out group-hover:border-gray-600" />

                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center">
                                <InfoCircleOutlined className="text-gray-400 mr-2 transition-colors duration-200 ease-out group-hover:text-gray-300" />
                                <span className="text-gray-400 text-sm transition-colors duration-200 ease-out group-hover:text-gray-300">
                                  Approval required
                                </span>
                              </div>
                              <div className="px-2 py-1 rounded-full text-[#FF009F] bg-[#FF009F]/10 border border-[#FF009F] text-sm font-medium transition-all duration-200 ease-out group-hover:opacity-90">
                                Available Now
                              </div>
                            </div>

                            <button
                              onClick={() => toggleSlotSelection(adSlot.id)}
                              className={`
                                w-full h-12 flex items-center justify-center gap-2 text-base font-semibold rounded-lg
                                transition-all duration-200 ease-out transform
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${
                                  selectedSlots.includes(adSlot.id)
                                    ? "bg-gray-700 text-white border-2 border-[#FF009F] hover:bg-gray-600"
                                    : adSlot.recommended
                                    ? "bg-[#FF009F] hover:bg-[#D1007F] group-hover:shadow-[0_5px_15px_rgba(255,0,159,0.4)] text-white border-0"
                                    : "bg-[#FF009F] hover:bg-[#D1007F] group-hover:shadow-[0_5px_15px_rgba(255,0,159,0.3)] text-white border-0"
                                }
                                group-hover:translate-y-[-2px]
                              `}
                            >
                              {selectedSlots.includes(adSlot.id) ? (
                                <>
                                  <CheckCircleOutlined className="text-lg" />
                                  Selected
                                </>
                              ) : (
                                <>
                                  <ShoppingCartOutlined className="text-lg" />
                                  Select Slot
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gray-800/50 rounded-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            Why Advertise with Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-4 mt-1">
                <EyeOutlined className="text-[#FF009F]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  High Visibility
                </h3>
                <p className="text-gray-400">
                  Your ads will be seen by thousands of movie enthusiasts daily.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-4 mt-1">
                <RocketOutlined className="text-[#FF009F]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Premium Placement
                </h3>
                <p className="text-gray-400">
                  Strategic ad positions for maximum engagement and conversion.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-4 mt-1">
                <ThunderboltOutlined className="text-[#FF009F]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Quick Activation
                </h3>
                <p className="text-gray-400">
                  Fast approval process to get your ads live in no time.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-[#FF009F]/20 flex items-center justify-center mr-4 mt-1">
                <LineChartOutlined className="text-[#FF009F]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Performance Tracking
                </h3>
                <p className="text-gray-400">
                  Detailed analytics to measure your ad's performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-400">
          <p className="text-sm">
            * All advertising packages require approval before display
          </p>
          <p className="text-sm">* Prices include VAT</p>
        </div>
      </div>
    </div>
  );
};

export default BuyAdSlot;
