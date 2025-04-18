import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Spin,
  notification,
  Slider,
  Upload,
  Radio,
  Row,
  Col,
  Empty,
  Tag,
} from "antd";
import {
  UploadOutlined,
  DollarOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  CloudUploadOutlined,
  ShoppingCartOutlined,
  FileImageOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import adPackageService from "../../../apis/AdPackage/adPackageService";
import adMediaByLoginService from "../../../apis/AdMedia/adMediaByLogin";
import adPurchaseTransactionService from "../../../apis/AdPurchaseTransaction/adPurchaseTransactionService";
import uploadFileApi from "../../../apis/Upload/upload.jsx";
import { useNavigate } from "react-router-dom";

const BuyAdSlot = () => {
  const navigate = useNavigate();

  // State for loading and data
  const [loading, setLoading] = useState(true);
  const [adPackages, setAdPackages] = useState([]);
  const [userMedia, setUserMedia] = useState([]);
  const [currentPackage, setCurrentPackage] = useState(null);

  // State for view quantity and range
  const [minView, setMinView] = useState(0);
  const [maxView, setMaxView] = useState(0);
  const [viewQuantity, setViewQuantity] = useState(0);

  // State for selected media
  const [mediaType, setMediaType] = useState("existing"); // "existing" or "new"
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [selectedMediaContent, setSelectedMediaContent] = useState("");
  const [newMediaFile, setNewMediaFile] = useState(null);
  const [newMediaContent, setNewMediaContent] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // State for current step
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState(null);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Load ad packages
        const packagesResponse = await adPackageService.getAllAdPackages();
        if (
          packagesResponse.adPackages &&
          packagesResponse.adPackages.length > 0
        ) {
          setAdPackages(packagesResponse.adPackages);

          // Find min and max views across all packages
          let min = Number.MAX_SAFE_INTEGER;
          let max = 0;

          packagesResponse.adPackages.forEach((pkg) => {
            if (pkg.minView < min) min = pkg.minView;
            if (pkg.maxView > max) max = pkg.maxView;
          });

          setMinView(min);
          setMaxView(max);
          setViewQuantity(min); // Default to min view

          // Get package for minimum view
          const initialPackage = await adPackageService.getAdPackageByQuantity(
            min
          );
          if (initialPackage.success) {
            setCurrentPackage(initialPackage.data);
          }
        }

        // Load user's existing media
        const mediaResponse = await adMediaByLoginService.getAdMediaByLogin();
        if (mediaResponse && mediaResponse.success && mediaResponse.data) {
          setUserMedia(mediaResponse.data);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        notification.error({
          message: "Error",
          description: "Failed to load necessary data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debounce timer reference
  const debounceTimerRef = useRef(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle view quantity changes with debounce
  const handleViewQuantityChange = (value) => {
    // Update the view quantity immediately for UI feedback
    setViewQuantity(value);

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to fetch the package after a delay
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const packageResponse = await adPackageService.getAdPackageByQuantity(
          value
        );
        if (packageResponse.success) {
          setCurrentPackage(packageResponse.data);
        }
      } catch (error) {
        console.error("Error fetching package for view quantity:", error);
      }
    }, 300); // 300ms delay - adjust as needed
  };

  // Handle media type selection
  const handleMediaTypeChange = async (e) => {
    const newMediaType = e.target.value;
    setMediaType(newMediaType);
    // Reset selections when changing type
    setSelectedMediaId(null);
    setNewMediaFile(null);
    setUploadPreview(null);

    // If switching to existing media, fetch the latest media from API
    if (newMediaType === "existing") {
      try {
        setLoading(true);
        const mediaResponse = await adMediaByLoginService.getAdMediaByLogin();
        if (mediaResponse && mediaResponse.success && mediaResponse.data) {
          setUserMedia(mediaResponse.data);
        }
      } catch (error) {
        console.error("Error loading media data:", error);
        notification.error({
          message: "Error",
          description: "Failed to load your media library. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle existing media selection
  const handleMediaSelection = (mediaId) => {
    const newSelectedId = mediaId === selectedMediaId ? null : mediaId;
    setSelectedMediaId(newSelectedId);

    if (newSelectedId) {
      // Find the selected media and get its content
      const selectedMedia = userMedia.find(
        (media) => media.id === newSelectedId
      );
      if (selectedMedia) {
        setSelectedMediaContent(selectedMedia.content || "");
      }
    } else {
      setSelectedMediaContent("");
    }
  };

  // Convert file to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file upload
  const handleFileUpload = async ({ file }) => {
    if (file.status === "uploading") {
      setUploadLoading(true);
      return;
    }

    if (file.status === "done") {
      try {
        // Upload to Cloudinary via API
        const response = await uploadFileApi.UploadPicture(file.originFileObj);

        if (response && response.status && response.data && response.data[0]) {
          const cloudinaryUrl = response.data[0].url;

          setNewMediaFile({
            url: cloudinaryUrl,
          });
          setUploadPreview(cloudinaryUrl);
          setUploadLoading(false);

          notification.success({
            message: "Upload Success",
            description: "File uploaded successfully to Cloudinary.",
          });
        } else {
          throw new Error("Failed to get URL from upload response");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        notification.error({
          message: "Error",
          description: "Failed to upload the file to Cloudinary.",
        });
        setUploadLoading(false);
      }
    }

    if (file.status === "error") {
      notification.error({
        message: "Upload Error",
        description: "Failed to upload file.",
      });
      setUploadLoading(false);
    }
  };

  // Go to next step
  const handleNextStep = () => {
    if (currentStep === 0) {
      // Validate view quantity selection
      if (!viewQuantity || !currentPackage) {
        notification.error({
          message: "Error",
          description: "Please select a valid view quantity.",
        });
        return;
      }
    } else if (currentStep === 1) {
      // Validate media selection
      if (mediaType === "existing" && !selectedMediaId) {
        notification.error({
          message: "Error",
          description: "Please select an existing media.",
        });
        return;
      }

      if (mediaType === "new" && !newMediaFile) {
        notification.error({
          message: "Error",
          description: "Please upload a new media file.",
        });
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  // Go to previous step
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Submit purchase
  const handleSubmitPurchase = async () => {
    try {
      setSubmitting(true);

      const purchaseData = {
        adPurchaseItems: [
          {
            viewQuantity: viewQuantity,
            mediaId: mediaType === "existing" ? selectedMediaId : null,
            content:
              mediaType === "existing" ? selectedMediaContent : newMediaContent,
            newMedia:
              mediaType === "new" && newMediaFile
                ? {
                    content: newMediaContent, // Use the text content entered by user
                    url: newMediaFile.url, // Use the Cloudinary URL
                  }
                : null,
          },
        ],
      };

      const response = await adPurchaseTransactionService.createAdPurchase(
        purchaseData
      );

      if (response.success) {
        // Store purchase details for the success screen
        setPurchaseDetails({
          viewQuantity: viewQuantity,
          packageName: currentPackage?.packageName,
          pricePerView: currentPackage?.pricePerView,
          totalPrice: calculateTotalPrice(),
          mediaType: mediaType,
          mediaUrl:
            mediaType === "existing"
              ? userMedia.find((media) => media.id === selectedMediaId)?.url
              : uploadPreview,
        });

        // Show payment success screen
        setPaymentSuccess(true);
      } else {
        notification.error({
          message: "Error",
          description:
            response.message || "Failed to process your ad purchase.",
        });
      }
    } catch (error) {
      console.error("Error submitting purchase:", error);
      notification.error({
        message: "Error",
        description: "Failed to submit your ad purchase. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format VND
  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!currentPackage) return 0;
    return viewQuantity * currentPackage.pricePerView;
  };

  // Check if file is a video
  const isVideo = (url) => {
    if (!url) return false;
    return url.toLowerCase().match(/\.(mp4|mov|avi|wmv|flv|webm)$/);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Render payment success screen
  const renderPaymentSuccess = () => {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-gray-800 p-10 rounded-lg shadow-lg max-w-2xl w-full border border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 bg-opacity-20 rounded-full mb-4">
              <CheckCircleOutlined className="text-5xl text-green-500" />
            </div>
            <h2 className="text-white text-2xl font-bold">
              Payment Successful!
            </h2>
            <p className="text-gray-400 mt-2">
              Your advertisement has been successfully placed and will be shown
              to viewers.
            </p>
          </div>

          {purchaseDetails && (
            <div className="bg-gray-700 p-6 rounded-lg mb-8 border border-gray-600">
              <h4 className="text-white font-semibold mb-4">Order Details</h4>

              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-semibold text-white">
                    {purchaseDetails.packageName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Views:</span>
                  <span className="font-semibold text-white">
                    {purchaseDetails.viewQuantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price Per View:</span>
                  <span className="font-semibold text-white">
                    {formatVND(purchaseDetails.pricePerView)}
                  </span>
                </div>
                <div className="h-px w-full bg-gray-600 my-3"></div>
                <div className="flex justify-between text-lg">
                  <span>Total:</span>
                  <span className="font-bold text-[#FF009F]">
                    {formatVND(purchaseDetails.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => (window.location.href = "/advertiser/user-wallet")}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Go to Wallet
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-[#FF009F] hover:bg-[#D6008C] text-white rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // View Selection
        return (
          <Card
            className="bg-gray-800 border-gray-700 shadow-lg"
            styles={{ body: { color: "white" } }}
          >
            <div className="mb-8">
              <h1
                className="text-white text-2xl font-bold mb-4"
                style={{ color: "white !important" }}
              >
                Select View Quantity
              </h1>
              <p className="text-gray-400">
                Adjust the slider to select how many views you want for your
                advertisement. The price per view will be determined by the
                package your selection falls into.
              </p>
            </div>

            <div className="mb-8">
              <Slider
                min={minView}
                max={maxView}
                value={viewQuantity}
                onChange={handleViewQuantityChange}
                tipFormatter={(value) => `${value} views`}
                className="my-8"
                styles={{
                  track: {
                    backgroundColor: "#FF009F",
                  },
                  rail: {
                    backgroundColor: "#374151",
                  },
                  handle: {
                    borderColor: "#FF009F",
                    backgroundColor: "#FF009F",
                    opacity: 1,
                  },
                }}
              />

              <div className="flex justify-between text-gray-400 -mt-4 mb-6">
                <span>{minView} views</span>
                <span>{maxView} views</span>
              </div>
            </div>

            {currentPackage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-700 p-6 rounded-lg border border-gray-600"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4
                    className="text-white mb-0 font-bold text-xl"
                    style={{ color: "white" }}
                  >
                    {currentPackage.packageName} Package
                  </h4>
                  <Tag color="#FF009F" className="text-sm">
                    {currentPackage.status}
                  </Tag>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col">
                    <p className="text-gray-400 text-sm mb-1">Views</p>
                    <div className="flex items-center">
                      <EyeOutlined className="text-white mr-2" />
                      <span className="text-white text-xl font-semibold">
                        {viewQuantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-gray-400 text-sm mb-1">Price Per View</p>
                    <div className="flex items-center">
                      <DollarOutlined className="text-white mr-2" />
                      <span className="text-white text-xl font-semibold">
                        {formatVND(currentPackage.pricePerView)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-gray-400 text-sm mb-1">Total Price</p>
                    <div className="flex items-center">
                      <DollarOutlined className="text-white mr-2" />
                      <span className="text-white text-xl font-semibold">
                        {formatVND(calculateTotalPrice())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-gray-300">
                  <p>
                    <InfoCircleOutlined className="mr-2" />
                    This package applies for {currentPackage.minView} to{" "}
                    {currentPackage.maxView} views.
                  </p>
                </div>
              </motion.div>
            )}
          </Card>
        );

      case 1: // Media Selection
        return (
          <Card
            className="bg-gray-800 border-gray-700 shadow-lg"
            styles={{ body: { color: "white" } }}
          >
            <div className="mb-8">
              <h4
                className="text-white mb-4 font-bold text-xl"
                style={{ color: "white" }}
              >
                Select Advertisement Media
              </h4>
              <p className="text-gray-400">
                Choose an existing media from your library or upload a new one
                for your advertisement.
              </p>
            </div>

            <Radio.Group
              onChange={handleMediaTypeChange}
              value={mediaType}
              className="mb-8 flex"
              buttonStyle="solid"
              optionType="button"
              options={[
                {
                  label: (
                    <span className="flex items-center justify-center">
                      <FileImageOutlined className="mr-2" />
                      Use Existing Media
                    </span>
                  ),
                  value: "existing",
                },
                {
                  label: (
                    <span className="flex items-center justify-center">
                      <CloudUploadOutlined className="mr-2" />
                      Upload New Media
                    </span>
                  ),
                  value: "new",
                },
              ]}
              styles={{
                button: {
                  backgroundColor: "#374151",
                  borderColor: "#4b5563",
                  color: "#d1d5db",
                },
                checked: {
                  backgroundColor: "#FF009F",
                  borderColor: "#FF009F",
                  color: "white",
                },
              }}
            />

            {mediaType === "existing" && (
              <div>
                {userMedia && userMedia.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userMedia.map((media) => (
                      <div
                        key={media.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
                          selectedMediaId === media.id
                            ? "ring-4 ring-[#FF009F]"
                            : "hover:scale-105"
                        }`}
                        onClick={() => handleMediaSelection(media.id)}
                      >
                        <div className="aspect-video relative">
                          {isVideo(media.url) ? (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <VideoCameraOutlined className="text-4xl text-white" />
                              <span className="ml-2 text-white">Video</span>
                            </div>
                          ) : (
                            <img
                              src={media.url}
                              alt={`Media ${media.id}`}
                              className="object-cover h-full w-full"
                            />
                          )}
                          {selectedMediaId === media.id && (
                            <div className="absolute inset-0 bg-[#FF009F]/20 flex items-center justify-center">
                              <CheckCircleOutlined className="text-4xl text-white" />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 p-2 bg-gray-700 text-left text-sm">
                          <p className="text-white truncate">
                            {media.content || "No description"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    description={
                      <span className="text-gray-400">
                        No media found in your library
                      </span>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="my-8"
                  />
                )}
              </div>
            )}

            {mediaType === "new" && (
              <div className="text-center">
                <Upload.Dragger
                  name="file"
                  accept="image/*,video/*"
                  showUploadList={false}
                  customRequest={({ file, onSuccess }) => {
                    setTimeout(() => {
                      onSuccess("ok");
                    }, 0);
                  }}
                  onChange={handleFileUpload}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors py-8 mb-4"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? (
                    <div className="py-8">
                      <LoadingOutlined className="text-[#FF009F] text-4xl mb-4" />
                      <p className="text-gray-300">Processing your media...</p>
                    </div>
                  ) : uploadPreview ? (
                    <div className="relative max-w-xs mx-auto">
                      <img
                        src={uploadPreview}
                        alt="Upload Preview"
                        className="mx-auto max-h-64 object-contain"
                      />
                      <p className="text-gray-300 mt-2">
                        Click to change media
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <UploadOutlined className="text-[#FF009F] text-4xl" />
                      </div>
                      <p className="text-white text-lg">
                        Click or drag image/video to this area to upload
                      </p>
                      <p className="text-gray-400 mt-2">
                        Support for a single image or video upload.
                      </p>
                    </>
                  )}
                </Upload.Dragger>

                {/* Media Content Description Field */}
                <div className="mb-4">
                  <label className="block text-white text-left mb-2">
                    Media Content Description
                  </label>
                  <input
                    type="text"
                    value={newMediaContent}
                    onChange={(e) => setNewMediaContent(e.target.value)}
                    placeholder="Enter a description for your media"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FF009F] focus:border-transparent"
                  />
                </div>

                <div className="mt-4 text-gray-400">
                  <p>Supported formats: JPG, PNG, GIF, MP4, MOV</p>
                </div>
              </div>
            )}
          </Card>
        );

      case 2: // Summary and Payment
        return (
          <Card
            className="bg-gray-800 border-gray-700 shadow-lg"
            styles={{ body: { color: "white" } }}
          >
            <div className="mb-8">
              <h4
                className="text-white mb-4 font-bold text-xl"
                style={{ color: "white" }}
              >
                Purchase Summary
              </h4>
              <p className="text-gray-400">
                Review your advertisement purchase details before proceeding to
                payment.
              </p>
            </div>

            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card
                  className="bg-gray-700 border-gray-600"
                  styles={{ body: { color: "white" } }}
                >
                  <h5
                    className="text-white mb-4 font-bold text-lg"
                    style={{ color: "white" }}
                  >
                    Package Details
                  </h5>

                  <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>Package:</span>
                      <span className="font-semibold text-white">
                        {currentPackage?.packageName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Views:</span>
                      <span className="font-semibold text-white">
                        {viewQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Per View:</span>
                      <span className="font-semibold text-white">
                        {formatVND(currentPackage?.pricePerView)}
                      </span>
                    </div>
                    <div className="h-px w-full bg-gray-600 my-3"></div>
                    <div className="flex justify-between text-lg">
                      <span>Total:</span>
                      <span className="font-bold text-[#FF009F]">
                        {formatVND(calculateTotalPrice())}
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card
                  className="bg-gray-700 border-gray-600 h-full"
                  styles={{ body: { color: "white" } }}
                >
                  <h5
                    className="text-white mb-4 font-bold text-lg"
                    style={{ color: "white" }}
                  >
                    Media Preview
                  </h5>

                  {mediaType === "existing" && selectedMediaId && (
                    <div className="text-center">
                      {isVideo(
                        userMedia.find((media) => media.id === selectedMediaId)
                          ?.url
                      ) ? (
                        <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center justify-center">
                          <VideoCameraOutlined className="text-4xl text-[#FF009F] mb-2" />
                          <p className="text-gray-300">Video media selected</p>
                        </div>
                      ) : (
                        <img
                          src={
                            userMedia.find(
                              (media) => media.id === selectedMediaId
                            )?.url
                          }
                          alt="Selected Media"
                          className="max-h-40 object-contain mx-auto"
                        />
                      )}
                      <div className="mt-4 text-left">
                        <p className="text-gray-400 mb-1">Media Description:</p>
                        <p className="text-white">
                          {selectedMediaContent || "No description provided"}
                        </p>
                      </div>
                      <p className="block text-gray-400 mt-2">
                        Selected existing media
                      </p>
                    </div>
                  )}

                  {mediaType === "new" && uploadPreview && (
                    <div className="text-center">
                      {isVideo(uploadPreview) ? (
                        <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center justify-center">
                          <VideoCameraOutlined className="text-4xl text-[#FF009F] mb-2" />
                          <p className="text-gray-300">Video media uploaded</p>
                        </div>
                      ) : (
                        <img
                          src={uploadPreview}
                          alt="Upload Preview"
                          className="max-h-40 object-contain mx-auto"
                        />
                      )}
                      <div className="mt-4 text-left">
                        <p className="text-gray-400 mb-1">Media Description:</p>
                        <p className="text-white">
                          {newMediaContent || "No description provided"}
                        </p>
                      </div>
                      <p className="block text-gray-400 mt-2">
                        Newly uploaded media
                      </p>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <div className="mt-8 bg-gray-700 p-4 rounded-lg border border-gray-600">
              <h5
                className="text-white font-bold text-lg"
                style={{ color: "white" }}
              >
                Payment Information
              </h5>
              <p className="text-gray-300">
                <InfoCircleOutlined className="mr-2 text-[#FF009F]" />
                You will be redirected to our secure payment gateway to complete
                your purchase.
              </p>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  // If payment is successful, show the success screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Helmet>
          <title>Payment Success - Eigakan</title>
        </Helmet>
        {renderPaymentSuccess()}
      </div>
    );
  }

  // Otherwise show the normal purchase flow
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Buy Ad Views - Eigakan</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]">
              Purchase Advertisement Views
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Select how many views you want and provide the media to be shown
              to our users
            </p>
          </motion.div>
        </div>

        {/* Custom Steps Component */}
        <div className="mb-12">
          <div className="relative w-full max-w-3xl mx-auto">
            {/* Progress Bar Line */}
            <div className="absolute h-0.5 bg-gray-700 w-[calc(100%-3.5rem)] top-7 left-7">
              <div
                className="h-full bg-[#FF009F] transition-all duration-300"
                style={{
                  width: `${
                    currentStep === 0 ? 0 : currentStep === 1 ? 50 : 100
                  }%`,
                }}
              ></div>
            </div>

            {/* Steps */}
            <div className="flex justify-between relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    currentStep >= 0
                      ? "bg-[#FF009F]"
                      : "bg-gray-800 border border-gray-700"
                  }`}
                >
                  <EyeOutlined className="text-white text-xl" />
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= 0 ? "text-white" : "text-gray-500"
                  }`}
                >
                  Select Views
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    currentStep >= 1
                      ? "bg-[#FF009F]"
                      : "bg-gray-800 border border-gray-700"
                  }`}
                >
                  <PictureOutlined className="text-white text-xl" />
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= 1 ? "text-white" : "text-gray-500"
                  }`}
                >
                  Choose Media
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    currentStep >= 2
                      ? "bg-[#FF009F]"
                      : "bg-gray-800 border border-gray-700"
                  }`}
                >
                  <ShoppingCartOutlined className="text-white text-xl" />
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= 2 ? "text-white" : "text-gray-500"
                  }`}
                >
                  Review & Pay
                </span>
              </div>
            </div>
          </div>
        </div>

        {renderStepContent()}

        <div className="mt-8 flex justify-between">
          {currentStep > 0 && (
            <button
              onClick={handlePrevStep}
              className="px-6 py-2 text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Back
            </button>
          )}

          {currentStep < 2 ? (
            <button
              onClick={handleNextStep}
              className="px-6 py-2 text-white bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] rounded-md ml-auto hover:from-[#D1007F] hover:to-[#FF4B9F] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF009F] focus:ring-opacity-50 flex items-center"
            >
              <span>Next</span> <ArrowRightOutlined className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmitPurchase}
              disabled={submitting}
              className="px-6 py-2 text-white bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] rounded-md ml-auto hover:from-[#D1007F] hover:to-[#FF4B9F] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF009F] focus:ring-opacity-50 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="mr-2">Processing...</span>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  <span>Proceed to Payment</span>{" "}
                  <ShoppingCartOutlined className="ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyAdSlot;
