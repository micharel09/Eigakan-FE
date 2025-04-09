import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  notification,
  Card,
  Tooltip,
  Typography,
  InputNumber,
  DatePicker,
  Tag,
  Tabs,
  TimePicker,
  Image,
  Popconfirm,
  Spin,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  VideoCameraOutlined,
  ReloadOutlined,
  AudioMutedOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import adSlotService from "../../../apis/AdSlot/adslot";
import adMediaService from "../../../apis/AdMedia/adMedia";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const STATUS_MAP = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DELETED: "Deleted",
};

const AdSlotTimeManagement = () => {
  const [adSlotTimes, setAdSlotTimes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [adSlotTimeRanges, setAdSlotTimeRanges] = useState([]);
  const [filteredRanges, setFilteredRanges] = useState([]);
  const [isRangeModalVisible, setIsRangeModalVisible] = useState(false);
  const [rangeForm] = Form.useForm();
  const [editingRangeId, setEditingRangeId] = useState(null);
  const [searchRangeText, setSearchRangeText] = useState("");
  const [rangeStatusFilter, setRangeStatusFilter] = useState(null);
  const [rangePagination, setRangePagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState("1");
  const [adSlots, setAdSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
  const [slotForm] = Form.useForm();
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [searchSlotText, setSearchSlotText] = useState("");
  const [slotStatusFilter, setSlotStatusFilter] = useState(null);
  const [slotPagination, setSlotPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [adMedias, setAdMedias] = useState([]);
  const [filteredAdMedias, setFilteredAdMedias] = useState([]);
  const [searchAdMediaText, setSearchAdMediaText] = useState("");
  const [adMediaStatusFilter, setAdMediaStatusFilter] = useState(null);
  const [adMediaPagination, setAdMediaPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [selectedAdMediaId, setSelectedAdMediaId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewVideo, setPreviewVideo] = useState("");
  const [isVideoPreviewVisible, setIsVideoPreviewVisible] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const videoRef = useRef(null);

  const fetchAdSlotTimes = async () => {
    setLoading(true);
    try {
      const response = await adSlotService.getAllAdSlotTimes();

      if (response.success) {
        setAdSlotTimes(response.data);
        setFilteredData(response.data);
        setPagination({
          ...pagination,
          total: response.data.length,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSlotTimeRanges = async () => {
    setLoading(true);
    try {
      const response = await adSlotService.getAllAdSlotTimeRanges();

      if (response.success) {
        setAdSlotTimeRanges(response.data);
        setFilteredRanges(response.data);
        setRangePagination({
          ...rangePagination,
          total: response.data.length,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to fetch ranges",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSlots = async () => {
    setLoading(true);
    try {
      const response = await adSlotService.getAllAdSlots();

      if (response.success) {
        console.log("Fetched ad slots:", response.data);
        setAdSlots(response.data);
        setFilteredSlots(response.data);
        setSlotPagination({
          ...slotPagination,
          total: response.data.length,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to fetch slots",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdMedias = async () => {
    setLoading(true);
    try {
      const response = await adMediaService.getAllAdMedia();

      if (response.success) {
        console.log("Fetched ad media:", response.data);
        setAdMedias(response.data);

        // Không lọc mặc định, hiển thị tất cả quảng cáo
        setFilteredAdMedias(response.data);
        setAdMediaPagination({
          ...adMediaPagination,
          total: response.data.length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch ad media:", error);
      notification.error({
        message: "Error",
        description:
          error.response?.data?.message || "Failed to fetch ad media",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdSlotTimes();
    fetchAdSlotTimeRanges();
    fetchAdSlots();
    fetchAdMedias();
  }, []);

  useEffect(() => {
    // Reset video element when previewVideo changes
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.load();
      } catch (err) {
        console.error("Error resetting video element:", err);
      }
    }
  }, [previewVideo]);

  // Add new useEffect to handle autoplay when modal is opened
  useEffect(() => {
    // Autoplay video when modal is visible and video is loaded
    if (isVideoPreviewVisible && videoRef.current && previewVideo) {
      const videoElement = videoRef.current;

      // Setup event handlers for all relevant video events
      const handleCanPlay = () => {
        console.log("Video can play now");
        // Video is ready to play without buffering
        setIsVideoLoading(false);
        setIsVideoBuffering(false);

        try {
          // Reset video to beginning
          videoElement.currentTime = 0;

          // Ensure video is muted before attempting autoplay (most browsers require this)
          videoElement.muted = true;
          setIsVideoMuted(true);

          // Small delay before playing to allow UI to update
          setTimeout(() => {
            // Attempt to play the video
            const playPromise = videoElement.play();

            // Handle autoplay promise (browsers might block autoplay)
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Autoplay started successfully");
                })
                .catch((error) => {
                  console.warn("Autoplay prevented:", error);
                  // Only show notification if autoplay is blocked by browser policy
                  if (error.name !== "AbortError") {
                    notification.info({
                      message: "Autoplay Note",
                      description:
                        "Click play to start the video. You can unmute after playback begins.",
                      duration: 3,
                    });
                  }
                });
            }
          }, 100);
        } catch (err) {
          console.error("Error autoplaying video:", err);
          setIsVideoLoading(false);
        }
      };

      // Handle buffering state
      const handleWaiting = () => {
        console.log("Video is waiting for more data");
        setIsVideoBuffering(true);
      };

      // Handle when video starts playing after buffering
      const handlePlaying = () => {
        console.log("Video is playing now");
        setIsVideoBuffering(false);
      };

      // Handle errors
      const handleError = (e) => {
        console.error("Video playback error:", e);
        setIsVideoLoading(false);
        setIsVideoBuffering(false);
        notification.warning({
          message: "Video Playback Error",
          description:
            "There was an issue playing the video. Try opening it in a new tab instead.",
        });
      };

      // Add all event listeners
      videoElement.addEventListener("canplay", handleCanPlay, { once: true });
      videoElement.addEventListener("waiting", handleWaiting);
      videoElement.addEventListener("playing", handlePlaying);
      videoElement.addEventListener("error", handleError);

      // Clean up all event listeners
      return () => {
        videoElement.removeEventListener("canplay", handleCanPlay);
        videoElement.removeEventListener("waiting", handleWaiting);
        videoElement.removeEventListener("playing", handlePlaying);
        videoElement.removeEventListener("error", handleError);
      };
    }
  }, [isVideoPreviewVisible, previewVideo]);

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      let response;
      if (editingId) {
        response = await adSlotService.updateAdSlot(editingId, values);
      } else {
        const createData = {
          adSlotTimeRangeID: values.adSlotTimeRangeID,
          adSlotID: values.adSlotID,
        };
        response = await adSlotService.createAdSlotTime(createData);
      }

      if (!response.success) {
        notification.error({
          message: "Operation Failed",
          description: response.message || "Something went wrong",
        });
        return;
      }

      notification.success({
        message: editingId ? "Updated Successfully" : "Created Successfully",
        description: response.message || "Operation completed successfully",
      });
      setIsModalVisible(false);
      form.resetFields();
      fetchAdSlotTimes();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to submit",
      });
    }
  };

  const handleRangeSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const formattedData = {
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        slotTimeRangePrice: values.slotTimeRangePrice,
      };

      let response;
      if (editingRangeId) {
        response = await adSlotService.updateAdSlotTimeRange(
          editingRangeId,
          formattedData
        );
      } else {
        response = await adSlotService.createAdSlotTimeRange(formattedData);
      }

      if (!response.success) {
        notification.error({
          message: "Operation Failed",
          description: response.message || "Something went wrong",
        });
        return;
      }

      notification.success({
        message: editingRangeId
          ? "Updated Successfully"
          : "Created Successfully",
        description: response.message || "Operation completed successfully",
      });
      setIsRangeModalVisible(false);
      rangeForm.resetFields();
      fetchAdSlotTimeRanges();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to submit",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter(null);
  };

  const handleClearRangeFilters = () => {
    setSearchRangeText("");
    setRangeStatusFilter(null);
  };

  const handleClearSlotFilters = () => {
    setSearchSlotText("");
    setSlotStatusFilter(null);
  };

  const handleClearAdMediaFilters = () => {
    setSearchAdMediaText("");
    setAdMediaStatusFilter("PENDING");
  };

  const handleOpenModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOpenRangeModal = () => {
    setEditingRangeId(null);
    rangeForm.resetFields();
    setIsRangeModalVisible(true);
  };

  const handleOpenSlotModal = () => {
    setEditingSlotId(null);
    slotForm.resetFields();
    setIsSlotModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCloseRangeModal = () => {
    setIsRangeModalVisible(false);
    rangeForm.resetFields();
  };

  const handleCloseSlotModal = () => {
    setIsSlotModalVisible(false);
    slotForm.resetFields();
  };

  const handleShowPreview = (image) => {
    setPreviewImage(image);
    setIsPreviewVisible(true);
  };

  const handleClosePreview = () => {
    setIsPreviewVisible(false);
  };

  const handleShowVideoPreview = (video) => {
    console.log(`Loading video preview: ${video}`);

    // Ensure video is paused if currently playing
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Clear the video state first to force a complete remount
    setPreviewVideo("");

    // Show loading and reset buffering states
    setIsVideoLoading(true);
    setIsVideoBuffering(false);

    // Show the modal first for better perceived performance
    setIsVideoPreviewVisible(true);

    // Force muted state for autoplay to work in most browsers
    setIsVideoMuted(true);

    // Use a longer delay to ensure modal is fully rendered before loading video
    // This helps reduce the initial stutter
    setTimeout(() => {
      // Add a cache-busting parameter for non-Cloudinary URLs
      const videoUrl = video.includes("cloudinary")
        ? video
        : `${video}${video.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      setPreviewVideo(videoUrl);
    }, 250); // Increased timeout further
  };

  const handleCloseVideoPreview = () => {
    if (videoRef.current) {
      videoRef.current.pause();

      // Clear all video-related states
      try {
        // Remove all event listeners
        videoRef.current.oncanplay = null;
        videoRef.current.onwaiting = null;
        videoRef.current.onplaying = null;
        videoRef.current.onerror = null;
      } catch (err) {
        console.error("Error cleaning up video element:", err);
      }
    }

    setIsVideoPreviewVisible(false);
    setIsVideoLoading(false);
    setIsVideoBuffering(false);

    // Reset the video state when closing the modal to prevent caching issues
    setTimeout(() => {
      setPreviewVideo("");
      setIsVideoMuted(true); // Reset to muted state when closing
    }, 300);
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      setIsVideoMuted(!isVideoMuted);
      videoRef.current.muted = !isVideoMuted;
    }
  };

  const handleShowRejectModal = (id) => {
    setSelectedAdMediaId(id);
    setIsRejectModalVisible(true);
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalVisible(false);
    setRejectReason("");
    setSelectedAdMediaId(null);
  };

  const handleRejectReasonChange = (e) => {
    setRejectReason(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSearchRangeChange = (e) => {
    setSearchRangeText(e.target.value);
  };

  const handleSearchSlotChange = (e) => {
    setSearchSlotText(e.target.value);
  };

  const handleSearchAdMediaChange = (e) => {
    setSearchAdMediaText(e.target.value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleRangeStatusFilterChange = (value) => {
    setRangeStatusFilter(value);
  };

  const handleSlotStatusFilterChange = (value) => {
    setSlotStatusFilter(value);
  };

  const handleAdMediaStatusFilterChange = (value) => {
    setAdMediaStatusFilter(value);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this slot time?",
      content: "This action cannot be undone",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await adSlotService.deleteAdSlotTime(id);

          if (response.success) {
            notification.success({
              message: "Deleted Successfully",
              description: response.message || "Successfully deleted the item",
            });
            fetchAdSlotTimes();
          } else {
            notification.error({
              message: "Delete Failed",
              description: response.message || "Failed to delete the item",
            });
          }
        } catch (error) {
          notification.error({
            message: "Delete Failed",
            description: error.response?.data?.message || "Failed to delete",
          });
        }
      },
    });
  };

  const handleRangeDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this time range?",
      content: "This action cannot be undone",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await adSlotService.deleteAdSlotTimeRange(id);

          if (response.success) {
            notification.success({
              message: "Deleted Successfully",
              description:
                response.message || "Successfully deleted the time range",
            });
            fetchAdSlotTimeRanges();
          } else {
            notification.error({
              message: "Delete Failed",
              description:
                response.message || "Failed to delete the time range",
            });
          }
        } catch (error) {
          notification.error({
            message: "Delete Failed",
            description: error.response?.data?.message || "Failed to delete",
          });
        }
      },
    });
  };

  const handleSlotDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this slot location?",
      content: "This action cannot be undone",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await adSlotService.deleteAdSlot(id);

          if (response.success) {
            notification.success({
              message: "Deleted Successfully",
              description:
                response.message || "Successfully deleted the slot location",
            });
            fetchAdSlots();
          } else {
            notification.error({
              message: "Delete Failed",
              description:
                response.message || "Failed to delete the slot location",
            });
          }
        } catch (error) {
          notification.error({
            message: "Delete Failed",
            description: error.response?.data?.message || "Failed to delete",
          });
        }
      },
    });
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      slotTimePrice: record.slotTimePrice,
      status: record.status,
      adSlotTimeRangeID: record.adSlotTimeRangeID,
      adSlotID: record.adSlotID,
      isSelected: record.isSelected,
    });
    setIsModalVisible(true);
  };

  const handleRangeEdit = (record) => {
    setEditingRangeId(record.id);

    rangeForm.setFieldsValue({
      startTime: dayjs(record.startTime, "HH:mm:ss"),
      endTime: dayjs(record.endTime, "HH:mm:ss"),
      slotTimeRangePrice: record.slotTimeRangePrice,
    });

    setIsRangeModalVisible(true);
  };

  useEffect(() => {
    let result = [...adSlotTimes];

    if (searchText) {
      result = result.filter((item) =>
        item.adSlotTimeRange?.startTime
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredData(result);
  }, [adSlotTimes, searchText, statusFilter]);

  useEffect(() => {
    let result = [...adSlotTimeRanges];

    if (searchRangeText) {
      result = result.filter(
        (item) =>
          item.startTime
            .toLowerCase()
            .includes(searchRangeText.toLowerCase()) ||
          item.endTime.toLowerCase().includes(searchRangeText.toLowerCase())
      );
    }

    if (rangeStatusFilter) {
      result = result.filter((item) => item.status === rangeStatusFilter);
    }

    setFilteredRanges(result);
  }, [adSlotTimeRanges, searchRangeText, rangeStatusFilter]);

  const handleSlotSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const formattedData = {
        slotLocation: values.slotLocation,
        slotPrice: values.slotPrice,
      };

      let response;
      if (editingSlotId) {
        response = await adSlotService.updateAdSlot(
          editingSlotId,
          formattedData
        );
      } else {
        response = await adSlotService.createAdSlot(formattedData);
      }

      if (response.success) {
        notification.success({
          message: editingSlotId
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message || "Operation completed successfully",
        });
        setIsSlotModalVisible(false);
        slotForm.resetFields();
        fetchAdSlots();
      } else {
        notification.error({
          message: "Operation Failed",
          description: response.message || "Something went wrong",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to submit",
      });
    }
  };

  const handleSlotEdit = (record) => {
    setEditingSlotId(record.id);
    slotForm.setFieldsValue({
      slotLocation: record.slotLocation,
      slotPrice: record.slotPrice,
    });
    setIsSlotModalVisible(true);
  };

  useEffect(() => {
    if (!adSlots) return;

    let result = [...adSlots];

    if (searchSlotText) {
      result = result.filter((item) =>
        item.slotLocation.toLowerCase().includes(searchSlotText.toLowerCase())
      );
    }

    if (slotStatusFilter) {
      result = result.filter((item) => item.status === slotStatusFilter);
    }

    setFilteredSlots(result);
  }, [searchSlotText, slotStatusFilter, adSlots]);

  useEffect(() => {
    if (!adMedias.length) return;

    let result = [...adMedias];

    if (searchAdMediaText) {
      result = result.filter(
        (item) =>
          (item.content &&
            item.content
              .toLowerCase()
              .includes(searchAdMediaText.toLowerCase())) ||
          (item.url &&
            item.url.toLowerCase().includes(searchAdMediaText.toLowerCase()))
      );
    }

    if (adMediaStatusFilter) {
      result = result.filter((item) => item.status === adMediaStatusFilter);
    }

    setFilteredAdMedias(result);
    setAdMediaPagination({
      ...adMediaPagination,
      total: result.length,
    });
  }, [adMedias, searchAdMediaText, adMediaStatusFilter]);

  const handleApproveAdMedia = async (id) => {
    try {
      const response = await adMediaService.approveAdMedia({ id });

      if (response.success) {
        notification.success({
          message: "Approved Successfully",
          description: response.message || "Ad media has been approved",
        });
        fetchAdMedias();
      } else {
        notification.error({
          message: "Approval Failed",
          description: response.message || "Failed to approve ad media",
        });
      }
    } catch (error) {
      notification.error({
        message: "Approval Failed",
        description:
          error.response?.data?.message || "Failed to approve ad media",
      });
    }
  };

  const handleRejectAdMedia = async () => {
    try {
      if (!selectedAdMediaId || !rejectReason.trim()) {
        notification.warning({
          message: "Missing Information",
          description: "Please provide a reason for rejection",
        });
        return;
      }

      const response = await adMediaService.rejectAdMedia({
        id: selectedAdMediaId,
        reasonForRejection: rejectReason,
      });

      if (response.success) {
        notification.success({
          message: "Rejected Successfully",
          description: response.message || "Ad media has been rejected",
        });
        setIsRejectModalVisible(false);
        setRejectReason("");
        setSelectedAdMediaId(null);
        fetchAdMedias();
      } else {
        notification.error({
          message: "Rejection Failed",
          description: response.message || "Failed to reject ad media",
        });
      }
    } catch (error) {
      notification.error({
        message: "Rejection Failed",
        description:
          error.response?.data?.message || "Failed to reject ad media",
      });
    }
  };

  const columns = [
    {
      title: "Slot Location",
      dataIndex: "adSlot",
      key: "adSlot",
      render: (adSlot) => adSlot?.slotLocation || "N/A",
    },
    {
      title: "Time Range",
      key: "timeRange",
      render: (_, record) => (
        <div>
          <Text strong>
            {record.adSlotTimeRange?.startTime} -{" "}
            {record.adSlotTimeRange?.endTime}
          </Text>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "slotTimePrice",
      key: "slotTimePrice",
      render: (price) => formatVND(price),
    },
    {
      title: "Selected",
      dataIndex: "isSelected",
      key: "isSelected",
      render: (isSelected) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            isSelected
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-gray-100 text-gray-500 border border-gray-500"
          }`}
        >
          {isSelected ? "Selected" : "Not Selected"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="hover:text-pink-500"
              aria-label="Edit slot time"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              className="hover:text-red-500"
              aria-label="Delete slot time"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rangeColumns = [
    {
      title: "Time Range",
      key: "timeRange",
      render: (_, record) => (
        <div>
          <Text strong>
            {record.startTime} - {record.endTime}
          </Text>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "slotTimeRangePrice",
      key: "slotTimeRangePrice",
      render: (price) => formatVND(price),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleRangeEdit(record)}
              className="hover:text-pink-500"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleRangeDelete(record.id)}
              className="hover:text-red-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const slotColumns = [
    {
      title: "Slot Location",
      dataIndex: "slotLocation",
      key: "slotLocation",
      render: (location) => (
        <Tag color="green" className="text-xs font-medium px-3 py-1">
          {location}
        </Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "slotPrice",
      key: "slotPrice",
      render: (price) => formatVND(price),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleSlotEdit(record)}
              className="hover:text-pink-500"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleSlotDelete(record.id)}
              className="hover:text-red-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const adMediaColumns = [
    {
      title: "Preview",
      key: "preview",
      render: (_, record) => (
        <div className="flex justify-center">
          {record.image ? (
            <div
              className="cursor-pointer w-16 h-16 rounded overflow-hidden border border-gray-200"
              onClick={() => handleShowPreview(record.image)}
              role="button"
              tabIndex="0"
              aria-label="Preview ad image"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleShowPreview(record.image);
                }
              }}
            >
              <img
                src={record.image}
                alt="Ad preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/100x100?text=No+Image";
                }}
              />
            </div>
          ) : record.video ? (
            <div
              className="cursor-pointer w-16 h-16 rounded overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100"
              onClick={() => handleShowVideoPreview(record.video)}
              role="button"
              tabIndex="0"
              aria-label="Preview ad video"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleShowVideoPreview(record.video);
                }
              }}
            >
              <VideoCameraOutlined className="text-pink-500 text-2xl" />
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
              <FileImageOutlined className="text-gray-400 text-2xl" />
            </div>
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      render: (content) => (
        <div className="max-w-xs truncate">
          {content || <span className="text-gray-400 italic">No content</span>}
        </div>
      ),
    },
    {
      title: "Links",
      key: "links",
      render: (_, record) => (
        <div className="space-y-1">
          {record.url && (
            <div className="flex items-center space-x-1">
              <LinkOutlined className="text-pink-500" />
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:underline truncate max-w-[150px] inline-block"
              >
                {record.url}
              </a>
            </div>
          )}
          {record.video && (
            <div className="flex items-center space-x-1">
              <VideoCameraOutlined className="text-pink-500" />
              <a
                className="truncate max-w-[150px] text-pink-500 hover:underline cursor-pointer"
                onClick={() => handleShowVideoPreview(record.video)}
              >
                Preview video
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        let icon = null;

        switch (status) {
          case "ACTIVE":
            color = "success";
            icon = <CheckCircleOutlined />;
            break;
          case "PENDING":
            color = "warning";
            icon = <ClockCircleOutlined />;
            break;
          case "REJECTED":
            color = "error";
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = "default";
        }

        return (
          <Tag icon={icon} color={color}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Submitted At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "action",
      width: 200,
      render: (_, record) => {
        if (record.status === "PENDING") {
          return (
            <Space size="small">
              <Popconfirm
                title="Approve this ad?"
                description="Are you sure you want to approve this ad?"
                onConfirm={() => handleApproveAdMedia(record.id)}
                okText="Yes"
                cancelText="No"
                icon={<CheckCircleOutlined style={{ color: "#ff009f" }} />}
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  Approve
                </Button>
              </Popconfirm>

              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                onClick={() => handleShowRejectModal(record.id)}
              >
                Reject
              </Button>
            </Space>
          );
        } else if (record.status === "ACTIVE") {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Approved
            </Tag>
          );
        } else if (record.status === "REJECTED") {
          return (
            <Tooltip title={record.reasonForRejection || "No reason provided"}>
              <Tag color="red" icon={<CloseCircleOutlined />}>
                Rejected
              </Tag>
            </Tooltip>
          );
        } else if (record.status === "EXPIRED") {
          return (
            <Tag color="default" icon={<InfoCircleOutlined />}>
              Expired
            </Tag>
          );
        }

        return null;
      },
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <Title level={3} className="!mb-1">
              Ad Slot Time Management
            </Title>
            <Text type="secondary" className="text-sm">
              Manage all advertising slot times
            </Text>
          </div>
          {activeTab !== "4" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (activeTab === "1") {
                  handleOpenModal();
                } else if (activeTab === "2") {
                  handleOpenRangeModal();
                } else if (activeTab === "3") {
                  handleOpenSlotModal();
                }
              }}
              className="bg-pink-500 hover:bg-pink-600"
            >
              {activeTab === "1"
                ? "Add Slot Time"
                : activeTab === "2"
                ? "Add Time Range"
                : "Add Slot Location"}
            </Button>
          )}
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="mb-4 bg-white p-1 rounded-lg shadow-sm eigakan-tabs"
      >
        <TabPane
          tab={
            <span>
              <ClockCircleOutlined /> Ad Slot Times
            </span>
          }
          key="1"
        >
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by time range..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="rounded-lg hover:border-pink-500 focus:border-pink-500"
                allowClear
                onChange={handleSearchChange}
              />
              <Select
                placeholder="Filter by status"
                className="w-full hover:border-pink-500 focus:border-pink-500"
                allowClear
                onChange={handleStatusFilterChange}
                value={statusFilter}
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearFilters}
                className="md:w-fit md:ml-auto hover:text-pink-500 hover:border-pink-500"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              pagination={pagination}
              loading={loading}
              onChange={(newPagination) => setPagination(newPagination)}
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <ScheduleOutlined /> Time Ranges
            </span>
          }
          key="2"
        >
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by time..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="rounded-lg hover:border-pink-500 focus:border-pink-500"
                allowClear
                onChange={handleSearchRangeChange}
              />
              <Select
                placeholder="Filter by status"
                className="w-full hover:border-pink-500 focus:border-pink-500"
                allowClear
                onChange={handleRangeStatusFilterChange}
                value={rangeStatusFilter}
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearRangeFilters}
                className="md:w-fit md:ml-auto hover:text-pink-500 hover:border-pink-500"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card>
            <Table
              columns={rangeColumns}
              dataSource={filteredRanges}
              rowKey="id"
              pagination={rangePagination}
              loading={loading}
              onChange={(newPagination) => setRangePagination(newPagination)}
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <AppstoreOutlined /> Slot Locations
            </span>
          }
          key="3"
        >
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by location..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="rounded-lg hover:border-pink-500 focus:border-pink-500"
                allowClear
                onChange={handleSearchSlotChange}
              />
              <Select
                placeholder="Filter by status"
                className="w-full hover:border-pink-500 focus:border-pink-500"
                allowClear
                onChange={handleSlotStatusFilterChange}
                value={slotStatusFilter}
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearSlotFilters}
                className="md:w-fit md:ml-auto hover:text-pink-500 hover:border-pink-500"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card>
            <Table
              columns={slotColumns}
              dataSource={filteredSlots}
              rowKey="id"
              pagination={slotPagination}
              loading={loading}
              onChange={(newPagination) => setSlotPagination(newPagination)}
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <FileImageOutlined /> Ad Media Approval
            </span>
          }
          key="4"
        >
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by content or URL..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="rounded-lg hover:border-pink-500 focus:border-pink-500"
                allowClear
                onChange={handleSearchAdMediaChange}
                value={searchAdMediaText}
              />
              <Select
                placeholder="Filter by status"
                className="w-full hover:border-pink-500 focus:border-pink-500"
                onChange={handleAdMediaStatusFilterChange}
                value={adMediaStatusFilter}
              >
                <Option value="PENDING">Pending</Option>
                <Option value="ACTIVE">Approved</Option>
                <Option value="REJECTED">Rejected</Option>
                <Option value="EXPIRED">Expired</Option>
                <Option value={null}>All</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={handleClearAdMediaFilters}
                className="md:w-fit md:ml-auto hover:text-pink-500 hover:border-pink-500"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card>
            <Table
              columns={adMediaColumns}
              dataSource={filteredAdMedias}
              rowKey="id"
              pagination={adMediaPagination}
              loading={loading}
              onChange={(newPagination) => setAdMediaPagination(newPagination)}
              className="rounded-lg overflow-hidden"
              locale={{
                emptyText: (
                  <div className="py-8 text-center">
                    No ads found matching your filter criteria
                  </div>
                ),
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingId ? "Edit Slot Time" : "Add Slot Time"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        centered
        getContainer={false}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="adSlotTimeRangeID"
            label="Time Range"
            rules={[{ required: true, message: "Please select time range!" }]}
          >
            <Select
              placeholder="Select time range"
              className="hover:border-pink-500 focus:border-pink-500"
            >
              {adSlotTimeRanges.map((range) => (
                <Option key={range.id} value={range.id}>
                  {range.startTime} - {range.endTime}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="adSlotID"
            label="Slot Location"
            rules={[
              { required: true, message: "Please select slot location!" },
            ]}
          >
            <Select placeholder="Select slot location">
              {adSlots.map((slot) => (
                <Option key={slot.id} value={slot.id}>
                  {slot.slotLocation}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {editingId ? "Update" : "Create"}
              </Button>
              <Button onClick={handleCloseModal}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingRangeId ? "Edit Time Range" : "Add Time Range"}
        open={isRangeModalVisible}
        onCancel={handleCloseRangeModal}
        footer={null}
        centered
        getContainer={false}
      >
        <Form form={rangeForm} layout="vertical" onFinish={handleRangeSubmit}>
          <Form.Item
            name="startTime"
            label="Start Time"
            rules={[{ required: true, message: "Please select start time!" }]}
          >
            <TimePicker
              className="w-full hover:border-pink-500 focus:border-pink-500"
              format="HH:mm"
              minuteStep={15}
            />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="End Time"
            rules={[{ required: true, message: "Please select end time!" }]}
          >
            <TimePicker
              className="w-full hover:border-pink-500 focus:border-pink-500"
              format="HH:mm"
              minuteStep={15}
            />
          </Form.Item>

          <Form.Item
            name="slotTimeRangePrice"
            label="Price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber
              className="w-full hover:border-pink-500 focus:border-pink-500"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              prefix="VND"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {editingRangeId ? "Update" : "Create"}
              </Button>
              <Button onClick={handleCloseRangeModal}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSlotId ? "Edit Slot Location" : "Add Slot Location"}
        open={isSlotModalVisible}
        onCancel={handleCloseSlotModal}
        footer={null}
        centered
        getContainer={false}
      >
        <Form form={slotForm} layout="vertical" onFinish={handleSlotSubmit}>
          <Form.Item
            name="slotLocation"
            label="Slot Location"
            rules={[{ required: true, message: "Please input slot location!" }]}
          >
            <Input placeholder="e.g. SIDEBAR-LEFT, HEADER, FOOTER" />
          </Form.Item>

          <Form.Item
            name="slotPrice"
            label="Price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber
              className="w-full hover:border-pink-500 focus:border-pink-500"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              prefix="VND"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {editingSlotId ? "Update" : "Create"}
              </Button>
              <Button onClick={handleCloseSlotModal}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={isPreviewVisible}
        footer={null}
        onCancel={handleClosePreview}
        centered
        width={800}
        getContainer={false}
      >
        <img alt="Ad Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>

      <Modal
        open={isVideoPreviewVisible}
        title={
          <div className="flex justify-between items-center">
            <span>Video Preview</span>
            <Tag color="blue" className="ml-2">
              {previewVideo
                ? new URL(previewVideo).pathname.split("/").pop()
                : ""}
            </Tag>
          </div>
        }
        footer={[
          <Button key="close" onClick={handleCloseVideoPreview}>
            Close
          </Button>,
          <Button
            key="external"
            type="primary"
            href={previewVideo}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-pink-500 hover:bg-pink-600"
          >
            Open in New Tab
          </Button>,
        ]}
        onCancel={handleCloseVideoPreview}
        centered
        width={800}
        getContainer={false}
        destroyOnClose={true}
      >
        <div
          className="video-container"
          style={{ width: "100%", maxHeight: "70vh", overflow: "hidden" }}
        >
          {previewVideo && (
            <div key={`container-${previewVideo}`}>
              {isVideoLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <div className="mb-3">
                      <Spin size="large" />
                    </div>
                    <p className="text-gray-500">Chuẩn bị video...</p>
                  </div>
                </div>
              )}

              {isVideoBuffering && !isVideoLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 z-10">
                  <div className="text-center text-white p-3 rounded bg-black bg-opacity-60">
                    <div className="mb-2">
                      <Spin size="small" />
                    </div>
                    <p className="text-xs">Đang tải video...</p>
                  </div>
                </div>
              )}

              <div
                className="relative"
                style={{ display: isVideoLoading ? "none" : "block" }}
              >
                <video
                  ref={videoRef}
                  key={`video-${previewVideo}`}
                  controls
                  autoPlay={false} // Don't use HTML autoplay attribute - we'll control this via JS
                  muted={isVideoMuted}
                  preload="auto"
                  playsInline
                  crossOrigin="anonymous"
                  controlsList="nodownload"
                  disablePictureInPicture
                  style={{
                    width: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                  className="rounded shadow"
                >
                  <source
                    src={previewVideo}
                    type="video/mp4"
                    key={`mp4-${previewVideo}`}
                  />
                  <source
                    src={previewVideo}
                    type="video/webm"
                    key={`webm-${previewVideo}`}
                  />
                  <source
                    src={previewVideo}
                    type="video/ogg"
                    key={`ogg-${previewVideo}`}
                  />
                  <p className="p-3 bg-gray-100 text-center">
                    Trình duyệt của bạn không hỗ trợ video HTML5.{" "}
                    <a
                      href={previewVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:underline"
                    >
                      Nhấn vào đây
                    </a>{" "}
                    để xem video.
                  </p>
                </video>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">
                  <InfoCircleOutlined className="mr-1" /> Gặp vấn đề khi phát?
                  Hãy thử:
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      if (videoRef.current) {
                        // Reset all states
                        setIsVideoLoading(true);
                        setIsVideoBuffering(false);

                        // Pause current playback
                        videoRef.current.pause();

                        // Force reload by changing the currentSrc
                        videoRef.current.src = `${previewVideo}${
                          previewVideo.includes("?") ? "&" : "?"
                        }t=${Date.now()}`;

                        // Apply and load the new source
                        videoRef.current.load();

                        // Playback will be handled by the canplay event
                      }
                    }}
                    icon={<ReloadOutlined />}
                  >
                    Tải lại Video
                  </Button>
                  <Button
                    onClick={handleToggleMute}
                    icon={
                      isVideoMuted ? <AudioMutedOutlined /> : <SoundOutlined />
                    }
                  >
                    {isVideoMuted ? "Bật tiếng" : "Tắt tiếng"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Reject Ad Media"
        open={isRejectModalVisible}
        onCancel={handleCloseRejectModal}
        footer={[
          <Button key="back" onClick={handleCloseRejectModal}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            onClick={handleRejectAdMedia}
            disabled={!rejectReason.trim()}
          >
            Reject
          </Button>,
        ]}
        centered
        getContainer={false}
      >
        <div className="mb-4">
          <p className="mb-2">Please provide a reason for rejection:</p>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={handleRejectReasonChange}
            placeholder="The ad content violates our policy because..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdSlotTimeManagement;
