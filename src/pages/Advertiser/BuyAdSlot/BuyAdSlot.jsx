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
  Divider,
} from "antd";
import {
  UploadOutlined,
  DollarOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  CloudUploadOutlined,
  ShoppingCartOutlined,
  FileImageOutlined,
  LoadingOutlined,
  PlusOutlined,
  RightOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import adPackageService from "../../../apis/AdPackage/adpackage";
import adMediaByLoginService from "../../../apis/AdMedia/adMediaByLogin";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
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

  // State for multiple ad media items
  const [adMediaItems, setAdMediaItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

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
        const mediaResponse =
          await adMediaByLoginService.getMediaStatusExpiredByLogin();
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
        const mediaResponse =
          await adMediaByLoginService.getMediaStatusExpiredByLogin();
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

  // Check video duration
  const checkVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      // Only check if it's a video file
      if (!file.type.startsWith("video/")) {
        resolve(true);
        return;
      }

      // Create temporary URL for the video
      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement("video");

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(videoUrl);

        // Check duration (in seconds)
        if (video.duration < 15) {
          reject(new Error("Video must be at least 15 seconds long"));
        } else {
          resolve(true);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Unable to read video information"));
      };

      video.src = videoUrl;
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
        // Check if file is a video or image
        const isVideoFile = file.originFileObj.type.startsWith("video/");

        // Check video duration if it's a video file
        if (isVideoFile) {
          try {
            await checkVideoDuration(file.originFileObj);
          } catch (durationError) {
            notification.error({
              message: "Error",
              description: durationError.message,
            });
            setUploadLoading(false);
            return;
          }
        }

        // Upload to Cloudinary via API - use appropriate method based on file type
        let response;
        if (isVideoFile) {
          response = await uploadFileApi.UploadVideoToCloudinary(
            file.originFileObj
          );
        } else {
          response = await uploadFileApi.UploadPicture(file.originFileObj);
        }

        if (response && response.status && response.data && response.data[0]) {
          const cloudinaryUrl = response.data[0].url;

          setNewMediaFile({
            url: cloudinaryUrl,
          });
          setUploadPreview(cloudinaryUrl);
          setUploadLoading(false);

          notification.success({
            message: "Upload Success",
            description: `File uploaded successfully to Cloudinary.`,
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

  // Add current media to the list
  const addMediaItem = () => {
    // Validate media selection
    if (mediaType === "existing" && !selectedMediaId) {
      notification.error({
        message: "Error",
        description: "Please select an existing media.",
      });
      return false;
    }

    if (mediaType === "new" && !newMediaFile) {
      notification.error({
        message: "Error",
        description: "Please upload a new media file.",
      });
      return false;
    }

    // Validate content
    if (
      mediaType === "new" &&
      (!newMediaContent || newMediaContent.trim() === "")
    ) {
      notification.error({
        message: "Error",
        description: "Please enter a description for your media.",
      });
      return false;
    }

    if (
      mediaType === "existing" &&
      (!selectedMediaContent || selectedMediaContent.trim() === "")
    ) {
      notification.error({
        message: "Error",
        description: "The selected media must have a description.",
      });
      return false;
    }

    // Validate view quantity
    if (!viewQuantity || !currentPackage) {
      notification.error({
        message: "Error",
        description: "Please select a valid view quantity.",
      });
      return false;
    }

    // Create new media item
    const newItem = {
      id: Date.now(), // Temporary ID for UI purposes
      viewQuantity: viewQuantity,
      packageName: currentPackage?.packageName,
      pricePerView: currentPackage?.pricePerView,
      totalPrice: calculateTotalPrice(),
      mediaType: mediaType,
      mediaId: mediaType === "existing" ? selectedMediaId : null,
      content:
        mediaType === "existing" ? selectedMediaContent : newMediaContent,
      mediaUrl:
        mediaType === "existing"
          ? userMedia.find((media) => media.id === selectedMediaId)?.url
          : uploadPreview,
      newMedia:
        mediaType === "new" && newMediaFile
          ? {
              content: newMediaContent,
              url: newMediaFile.url,
            }
          : null,
    };

    // Add to list
    setAdMediaItems([...adMediaItems, newItem]);

    // Reset form for next item
    resetMediaForm();

    // Show success notification
    notification.success({
      message: "Media Added",
      description: `Added media with ${viewQuantity} views to cart.`,
    });

    return true;
  };

  // Reset media form fields
  const resetMediaForm = () => {
    setSelectedMediaId(null);
    setSelectedMediaContent("");
    setNewMediaFile(null);
    setNewMediaContent("");
    setUploadPreview(null);
  };

  // Remove media item from list
  const removeMediaItem = (itemId) => {
    setAdMediaItems(adMediaItems.filter((item) => item.id !== itemId));
  };

  // Go to next step
  const handleNextStep = () => {
    if (currentStep === 0) {
      // For step 0, we just move to step 1 (media selection)
      // No validation needed as view quantity will be selected per media item
      setCurrentStep(currentStep + 1);
      return;
    } else if (currentStep === 1) {
      // Validate that at least one media item exists
      if (adMediaItems.length === 0) {
        notification.error({
          message: "Error",
          description:
            "Please add at least one advertisement media with view quantity.",
        });
        return;
      }

      // Move to review step
      setCurrentStep(currentStep + 1);
      return;
    }

    // Default case - move to next step
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

      // Validate that we have items to purchase
      if (adMediaItems.length === 0) {
        notification.error({
          message: "Error",
          description:
            "No media items added to cart. Please add at least one item.",
        });
        setSubmitting(false);
        return;
      }

      // Create purchase data with all items
      const purchaseData = {
        adPurchaseItems: adMediaItems.map((item) => ({
          viewQuantity: item.viewQuantity,
          mediaId: item.mediaType === "existing" ? item.mediaId : null,
          content: item.content,
          newMedia:
            item.mediaType === "new" && item.newMedia ? item.newMedia : null,
        })),
      };

      const response = await adPurchaseService.createAdPurchase(purchaseData);

      if (response.success) {
        // Calculate total price of all items
        const totalPrice = adMediaItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );

        // Store purchase details for the success screen
        setPurchaseDetails({
          itemCount: adMediaItems.length,
          totalPrice: totalPrice,
          // Include first item details for backward compatibility
          viewQuantity: adMediaItems[0]?.viewQuantity,
          packageName: adMediaItems[0]?.packageName,
          pricePerView: adMediaItems[0]?.pricePerView,
          mediaType: adMediaItems[0]?.mediaType,
          mediaUrl: adMediaItems[0]?.mediaUrl,
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
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-4xl w-full border border-gray-700">
          <div className="text-center mb-6">
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
            <Row gutter={[24, 24]}>
              <Col xs={24} md={10}>
                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 h-full">
                  <h4 className="text-white font-semibold mb-4">
                    Order Details
                  </h4>

                  <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>Number of Media Items:</span>
                      <span className="font-semibold text-white">
                        {purchaseDetails.itemCount || 1}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Total Views:</span>
                      <span className="font-semibold text-white">
                        {adMediaItems
                          .reduce((sum, item) => sum + item.viewQuantity, 0)
                          .toLocaleString()}
                      </span>
                    </div>

                    <div className="h-px w-full bg-gray-600 my-3"></div>

                    <div className="flex justify-between text-lg">
                      <span>Total Amount:</span>
                      <span className="font-bold text-green-500">
                        {formatVND(purchaseDetails.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} md={14}>
                {adMediaItems.length > 0 && (
                  <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 h-full">
                    <h5 className="text-white font-semibold mb-3">
                      Purchased Media
                    </h5>
                    <div className="space-y-3 max-h-[260px] overflow-y-auto hide-scrollbar pr-2">
                      {adMediaItems.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-800 p-3 rounded-lg border border-gray-600 flex items-center"
                        >
                          <div className="w-12 h-12 mr-3 overflow-hidden rounded-md flex-shrink-0">
                            {isVideo(item.mediaUrl) ? (
                              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                <VideoCameraOutlined className="text-white" />
                              </div>
                            ) : (
                              <img
                                src={item.mediaUrl}
                                alt="Media"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-grow">
                            <p className="text-white text-sm">
                              {item.content || "No description"}
                            </p>
                            <div className="flex justify-between text-gray-400 text-xs mt-1">
                              <div>
                                <Tag
                                  color="#FF009F"
                                  className="mr-1"
                                  style={{ fontSize: "10px", padding: "0 4px" }}
                                >
                                  {item.packageName}
                                </Tag>
                                <span>
                                  {item.viewQuantity.toLocaleString()} views
                                </span>
                              </div>
                              <span className="text-green-500">
                                {formatVND(item.totalPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          )}

          <div className="flex justify-center space-x-4 mt-6">
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
            <Row
              gutter={[24, 24]}
              className="flex-nowrap overflow-auto hide-scrollbar pb-4"
            >
              <Col xs={24} lg={8} className="flex-shrink-0">
                <div>
                  <h1
                    className="text-white text-2xl font-bold mb-4"
                    style={{ color: "white !important" }}
                  >
                    Purchase Advertisement Views
                  </h1>
                  <p className="text-gray-400">
                    Select how many views you want for each advertisement media.
                    You can add multiple media items with different view
                    quantities in a single transaction.
                  </p>

                  <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 mt-6">
                    <h3 className="text-white font-bold text-lg mb-4">
                      How it works:
                    </h3>

                    <div className="space-y-3 text-gray-300">
                      <div className="flex items-start">
                        <div className="bg-[#FF009F] rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-white text-sm">1</span>
                        </div>
                        <p className="text-sm">
                          In the next step, you'll select media from your
                          library or upload new ones.
                        </p>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-[#FF009F] rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-white text-sm">2</span>
                        </div>
                        <p className="text-sm">
                          For each media, you can select a specific view
                          quantity using the slider.
                        </p>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-[#FF009F] rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-white text-sm">3</span>
                        </div>
                        <p className="text-sm">
                          The system will automatically select the appropriate
                          package based on your view quantity.
                        </p>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-[#FF009F] rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-white text-sm">4</span>
                        </div>
                        <p className="text-sm">
                          You can add multiple media items with different view
                          quantities to your cart.
                        </p>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-[#FF009F] rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-white text-sm">5</span>
                        </div>
                        <p className="text-sm">
                          Review your selections and complete payment in a
                          single transaction.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} lg={16} className="flex-shrink-0">
                <h3 className="text-white font-bold text-lg mb-4">
                  Available Packages:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-40px)] overflow-auto hide-scrollbar pr-2">
                  {adPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="border border-gray-600 rounded-lg p-4 hover:border-[#FF009F] transition-colors duration-300"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white font-medium text-lg">
                          {pkg.packageName}
                        </h4>
                        <Tag color="#FF009F" className="text-sm">
                          {pkg.status}
                        </Tag>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-gray-300">
                        <div className="flex items-center">
                          <EyeOutlined className="text-white mr-2" />
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              View Range
                            </p>
                            <span className="text-white font-medium">
                              {pkg.minView.toLocaleString()} -{" "}
                              {pkg.maxView.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <DollarOutlined className="text-white mr-2" />
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              Price Per View
                            </p>
                            <span className="text-white font-medium">
                              {formatVND(pkg.pricePerView)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <DollarOutlined className="text-white mr-2" />
                          <div>
                            <p className="text-gray-400 text-xs mb-1">
                              Example Total
                            </p>
                            <span className="text-white font-medium">
                              {formatVND(pkg.pricePerView * pkg.minView)} -{" "}
                              {formatVND(pkg.pricePerView * pkg.maxView)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>
        );

      case 1: // Media Selection
        return (
          <Card
            className="bg-gray-800 border-gray-700 shadow-lg"
            styles={{ body: { color: "white" } }}
          >
            <div className="mb-6">
              <h4
                className="text-white mb-2 font-bold text-xl"
                style={{ color: "white" }}
              >
                Select Advertisement Media
              </h4>
              <p className="text-gray-400 text-sm">
                Choose an existing media from your library or upload a new one
                for your advertisement.
              </p>
            </div>

            <Row gutter={[16, 16]}>
              {/* Left Column - Media Selection */}
              <Col xs={24} md={24} lg={14}>
                <Radio.Group
                  onChange={handleMediaTypeChange}
                  value={mediaType}
                  className="mb-4 flex"
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
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 mb-4">
                    <h5 className="text-white font-semibold mb-3">
                      Your Media Library
                    </h5>
                    <div className="max-h-[350px] overflow-y-auto pr-2 hide-scrollbar">
                      {userMedia && userMedia.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                          {userMedia.map((media) => (
                            <div
                              key={media.id}
                              className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 bg-gray-800 border ${
                                selectedMediaId === media.id
                                  ? "ring-2 ring-[#FF009F] border-[#FF009F]"
                                  : "border-gray-600 hover:border-gray-500"
                              }`}
                              onClick={() => handleMediaSelection(media.id)}
                            >
                              <div className="aspect-video relative">
                                {isVideo(media.url) ? (
                                  <div className="w-full h-full bg-gray-700 relative group">
                                    {/* Video thumbnail always visible */}
                                    <video
                                      src={media.url}
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                      poster=""
                                      onLoadedData={(e) => {
                                        // Capture the first frame as thumbnail
                                        try {
                                          e.target.currentTime = 0.5; // Set to 0.5 seconds to avoid black frame
                                        } catch (err) {
                                          console.error(
                                            "Error setting video time:",
                                            err
                                          );
                                        }
                                      }}
                                    />

                                    {/* Play button overlay always visible */}
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center pointer-events-none">
                                      <PlayCircleOutlined className="text-3xl text-white opacity-80" />
                                    </div>

                                    {/* Video preview on hover - plays the video */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <video
                                        src={media.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        preload="metadata"
                                        onMouseOver={(e) => {
                                          e.target.play();
                                        }}
                                        onMouseOut={(e) => {
                                          e.target.pause();
                                          e.target.currentTime = 0;
                                        }}
                                      />
                                    </div>
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
                                    <CheckCircleOutlined className="text-2xl text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2 bg-gray-800 text-left text-xs">
                                <div className="flex justify-between items-center">
                                  <p className="text-white truncate max-w-[70%]">
                                    {media.content || "No description"}
                                  </p>
                                  <Tag
                                    color={
                                      media.status === "ACTIVE"
                                        ? "green"
                                        : media.status === "PENDING"
                                        ? "orange"
                                        : "red"
                                    }
                                    className="ml-1 text-xs"
                                  >
                                    {media.status || "PENDING"}
                                  </Tag>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-800 rounded-lg py-8 px-4 flex flex-col items-center justify-center min-h-[200px]">
                          <PictureOutlined className="text-gray-500 text-4xl mb-3" />
                          <p className="text-gray-300 font-medium mb-1">
                            No media found in your library
                          </p>
                          <p className="text-gray-500 text-xs mb-4">
                            Try uploading a new media instead
                          </p>
                          <button
                            onClick={() =>
                              handleMediaTypeChange({
                                target: { value: "new" },
                              })
                            }
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors flex items-center"
                          >
                            <CloudUploadOutlined className="mr-2" />
                            Upload New Media
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedMediaId && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600 flex items-center">
                        <div className="w-12 h-12 mr-3 overflow-hidden rounded-md flex-shrink-0">
                          {isVideo(
                            userMedia.find(
                              (media) => media.id === selectedMediaId
                            )?.url
                          ) ? (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                              <VideoCameraOutlined className="text-white" />
                            </div>
                          ) : (
                            <img
                              src={
                                userMedia.find(
                                  (media) => media.id === selectedMediaId
                                )?.url
                              }
                              alt="Selected Media"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium mb-1">
                            Selected Media:
                          </p>
                          <p className="text-gray-300 text-sm truncate">
                            {userMedia.find(
                              (media) => media.id === selectedMediaId
                            )?.content || "No description"}
                          </p>
                        </div>
                        <Tag color="#FF009F" className="ml-2">
                          Ready to add
                        </Tag>
                      </div>
                    )}
                  </div>
                )}

                {mediaType === "new" && (
                  <div className="text-center bg-gray-700 p-6 rounded-lg border border-gray-600">
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
                      className="bg-gray-800 border-gray-600 hover:bg-gray-600 transition-colors py-6 mb-4"
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? (
                        <div className="py-6">
                          <LoadingOutlined className="text-[#FF009F] text-4xl mb-4" />
                          <p className="text-gray-300">
                            Processing your media...
                          </p>
                        </div>
                      ) : uploadPreview ? (
                        <div className="relative max-w-xs mx-auto">
                          {isVideo(uploadPreview) ? (
                            <div className="mx-auto max-h-48 flex flex-col items-center">
                              <video
                                src={uploadPreview}
                                controls
                                className="max-h-40 max-w-full object-contain mb-2"
                              />
                              <div className="flex items-center justify-center text-white bg-gray-700 px-3 py-1 rounded-md">
                                <VideoCameraOutlined className="mr-2" />
                                <span>Video Preview</span>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={uploadPreview}
                              alt="Upload Preview"
                              className="mx-auto max-h-48 object-contain"
                            />
                          )}
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
                        Media Content Description{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMediaContent}
                        onChange={(e) => setNewMediaContent(e.target.value)}
                        placeholder="Enter a description for your media"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FF009F] focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="text-gray-400 text-xs">
                      <p>Supported formats: JPG, PNG, GIF, MP4, MOV</p>
                      <p className="mt-1 text-yellow-400">
                        Note: Videos must be at least 15 seconds long
                      </p>
                    </div>
                  </div>
                )}
              </Col>

              {/* Right Column - View Quantity & Cart */}
              <Col xs={24} md={24} lg={10}>
                {/* View Quantity Selector */}
                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 mb-6">
                  <h4 className="text-white font-bold text-lg mb-4">
                    Select View Quantity
                  </h4>

                  <div className="mb-6">
                    <Slider
                      min={minView}
                      max={maxView}
                      value={viewQuantity}
                      onChange={handleViewQuantityChange}
                      tipFormatter={(value) =>
                        `${value.toLocaleString()} views`
                      }
                      className="my-4"
                      styles={{
                        track: {
                          backgroundColor: "#FF009F",
                        },
                        rail: {
                          backgroundColor: "#FF009F",
                          opacity: 0.2,
                        },
                        handle: {
                          borderColor: "#FF009F",
                          backgroundColor: "#FF009F",
                          opacity: 1,
                        },
                      }}
                    />

                    <div className="flex justify-between text-gray-400 -mt-2 mb-4">
                      <span>{minView.toLocaleString()} views</span>
                      <span>{maxView.toLocaleString()} views</span>
                    </div>
                  </div>

                  {currentPackage && (
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-white font-medium text-md">
                          {currentPackage.packageName} Package
                        </h5>
                        <Tag color="#FF009F" className="text-xs">
                          {currentPackage.status}
                        </Tag>
                      </div>

                      <div className="grid grid-cols-1 gap-3 mb-3">
                        <div className="flex items-center">
                          <EyeOutlined className="text-white mr-2 text-sm" />
                          <span className="text-white font-medium">
                            {viewQuantity.toLocaleString()} views
                          </span>
                        </div>
                        <div className="flex items-center">
                          <DollarOutlined className="text-white mr-2 text-sm" />
                          <span className="text-white font-medium">
                            {formatVND(currentPackage.pricePerView)} per view
                          </span>
                        </div>
                        <div className="flex items-center font-bold text-[#FF009F]">
                          <DollarOutlined className="mr-2 text-sm" />
                          <span>{formatVND(calculateTotalPrice())} total</span>
                        </div>
                      </div>

                      <div className="text-gray-300 text-xs mt-2">
                        <p>
                          <InfoCircleOutlined className="mr-2" />
                          This package applies for{" "}
                          {currentPackage.minView.toLocaleString()} to{" "}
                          {currentPackage.maxView.toLocaleString()} views.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Add Media Button */}
                  <div className="mt-6">
                    <button
                      onClick={addMediaItem}
                      className="w-full px-6 py-3 text-white bg-[#FF009F] rounded-md hover:bg-[#D1007F] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF009F] focus:ring-opacity-50 flex items-center justify-center"
                      disabled={
                        (mediaType === "existing" && !selectedMediaId) ||
                        (mediaType === "new" && !newMediaFile) ||
                        !viewQuantity ||
                        !currentPackage
                      }
                    >
                      <PlusOutlined className="mr-2" />
                      <span>Add This Media to Cart</span>
                    </button>
                  </div>
                </div>

                {/* Media Items List */}
                {adMediaItems.length > 0 && (
                  <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 max-h-[400px] overflow-y-auto hide-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                      <h4
                        className="text-white font-bold text-lg"
                        style={{ color: "white" }}
                      >
                        Your Media Cart ({adMediaItems.length})
                      </h4>
                      <div className="text-[#FF009F] font-bold">
                        {formatVND(
                          adMediaItems.reduce(
                            (sum, item) => sum + item.totalPrice,
                            0
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {adMediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-800 p-4 rounded-lg border border-gray-600 flex items-center"
                        >
                          <div className="w-16 h-16 mr-4 overflow-hidden rounded-md flex-shrink-0">
                            {isVideo(item.mediaUrl) ? (
                              <div className="w-full h-full bg-gray-900 relative group">
                                <video
                                  src={item.mediaUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                  poster=""
                                  onLoadedData={(e) => {
                                    // Capture the first frame as thumbnail
                                    try {
                                      e.target.currentTime = 0.5; // Set to 0.5 seconds to avoid black frame
                                    } catch (err) {
                                      console.error(
                                        "Error setting video time:",
                                        err
                                      );
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <PlayCircleOutlined className="text-lg text-white" />
                                </div>
                              </div>
                            ) : (
                              <img
                                src={item.mediaUrl}
                                alt="Media"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <p className="text-white font-medium">
                                {item.content || "No description"}
                              </p>
                              <p className="text-[#FF009F] font-bold">
                                {formatVND(item.totalPrice)}
                              </p>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm mt-1">
                              <div>
                                <Tag color="#FF009F" className="mr-2">
                                  {item.packageName}
                                </Tag>
                                <span>
                                  {item.viewQuantity.toLocaleString()} views
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeMediaItem(item.id)}
                            className="ml-2 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
                            title="Remove from cart"
                          >
                            <CloseCircleOutlined />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        );

      case 2: // Summary and Payment
        return (
          <Card
            className="bg-gray-800 border-gray-700 shadow-lg"
            styles={{ body: { color: "white" } }}
          >
            <div className="mb-6">
              <h4
                className="text-white mb-2 font-bold text-xl"
                style={{ color: "white" }}
              >
                Purchase Summary
              </h4>
              <p className="text-gray-400 text-sm">
                Review your advertisement purchase details before proceeding to
                payment.
              </p>
            </div>

            <Row gutter={[24, 24]}>
              {/* Left Column - Media Items */}
              <Col xs={24} lg={16}>
                <h5
                  className="text-white mb-4 font-bold text-lg"
                  style={{ color: "white" }}
                >
                  Media Items
                </h5>
                <div className="space-y-4 pr-2 max-h-[calc(100vh-380px)] overflow-y-auto hide-scrollbar">
                  {adMediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-700 p-4 rounded-lg border border-gray-600 flex items-center"
                    >
                      <div className="w-20 h-20 mr-4 overflow-hidden rounded-md flex-shrink-0">
                        {isVideo(item.mediaUrl) ? (
                          <div className="w-full h-full bg-gray-800 relative group">
                            <video
                              src={item.mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                              poster=""
                              onLoadedData={(e) => {
                                // Capture the first frame as thumbnail
                                try {
                                  e.target.currentTime = 0.5; // Set to 0.5 seconds to avoid black frame
                                } catch (err) {
                                  console.error(
                                    "Error setting video time:",
                                    err
                                  );
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <PlayCircleOutlined className="text-2xl text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.mediaUrl}
                            alt="Media"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between mb-2">
                          <p className="text-white font-medium">
                            {item.content || "No description"}
                          </p>
                          <p className="text-[#FF009F] font-bold">
                            {formatVND(item.totalPrice)}
                          </p>
                        </div>
                        <div className="flex flex-wrap text-gray-400 text-sm">
                          <div className="mr-4 mb-1">
                            <Tag color="#FF009F" className="mr-1">
                              {item.packageName}
                            </Tag>
                          </div>
                          <div className="mr-4 mb-1">
                            <EyeOutlined className="mr-1" />
                            {item.viewQuantity.toLocaleString()} views
                          </div>
                          <div className="mr-4 mb-1">
                            <DollarOutlined className="mr-1" />
                            {formatVND(item.pricePerView)}/view
                          </div>
                          <div className="mb-1">
                            {item.mediaType === "existing" ? (
                              <FileImageOutlined className="mr-1" />
                            ) : (
                              <CloudUploadOutlined className="mr-1" />
                            )}
                            {item.mediaType === "existing"
                              ? "Existing Media"
                              : "New Upload"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>

              {/* Right Column - Order Summary and Payment */}
              <Col xs={24} lg={8}>
                <Card
                  className="bg-gray-700 border-gray-600 mb-6 sticky top-0"
                  styles={{ body: { color: "white" } }}
                >
                  <h5
                    className="text-white mb-4 font-bold text-lg"
                    style={{ color: "white" }}
                  >
                    Order Summary
                  </h5>

                  <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>Media Items:</span>
                      <span className="font-semibold text-white">
                        {adMediaItems.length}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Total Views:</span>
                      <span className="font-semibold text-white">
                        {adMediaItems
                          .reduce((sum, item) => sum + item.viewQuantity, 0)
                          .toLocaleString()}
                      </span>
                    </div>

                    <div className="h-px w-full bg-gray-600 my-3"></div>

                    <div className="flex justify-between text-lg">
                      <span>Total Amount:</span>
                      <span className="font-bold text-[#FF009F]">
                        {formatVND(
                          adMediaItems.reduce(
                            (sum, item) => sum + item.totalPrice,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </Card>

                <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <h5
                    className="text-white font-bold text-lg mb-3"
                    style={{ color: "white" }}
                  >
                    Payment Information
                  </h5>
                  <p className="text-gray-300 flex items-start">
                    <InfoCircleOutlined className="mr-2 text-[#FF009F] mt-1 flex-shrink-0" />
                    <span>
                      You will be redirected to our secure payment gateway to
                      complete your purchase after clicking the "Proceed to
                      Payment" button below.
                    </span>
                  </p>
                </div>
              </Col>
            </Row>
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

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]">
              Purchase Advertisement Views
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Select how many views you want and provide the media to be shown
              to our users
            </p>
          </motion.div>
        </div>

        {/* Custom Steps Component */}
        <div className="mb-8">
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

        <div className="mt-6 flex justify-between">
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
              className="px-8 py-3 text-white bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] rounded-md ml-auto hover:from-[#D1007F] hover:to-[#FF4B9F] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF009F] focus:ring-opacity-50 flex items-center justify-center text-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed"
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
