import React, { useState, useEffect, Component } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  notification,
  Card,
  Tag,
  Typography,
  Tooltip,
  Popconfirm,
  Tabs,
  Badge,
  Image,
  Empty,
  Spin,
  Row,
  Col,
  Statistic,
  Descriptions,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  ReloadOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import AdPackageService from "../../../apis/AdPackage/adpackage";
import adMediaService from "../../../apis/AdMedia/adMedia";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import { theme } from "antd";
import { Collapse, Divider } from "antd";

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// Error Boundary Component to catch errors in child components
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border rounded-md my-4 border-[var(--eigakan-primary)] bg-[rgba(255,0,159,0.05)]">
          <h2 className="text-xl mb-2 text-[var(--eigakan-primary)]">
            Something went wrong
          </h2>
          <p className="mb-4 text-[var(--eigakan-primary-hover)]">
            {this.state.error && this.state.error.toString()}
          </p>
          <button
            className="px-4 py-2 text-white rounded hover:opacity-90 bg-[var(--eigakan-primary)]"
            onClick={() => this.setState({ hasError: false })}
            aria-label="Try again"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Check if URL is a video
const isVideoUrl = (url) => {
  if (!url) return false;

  // Check common video file extensions
  const hasVideoExtension =
    url.toLowerCase().endsWith(".mp4") ||
    url.toLowerCase().endsWith(".mov") ||
    url.toLowerCase().endsWith(".webm") ||
    url.toLowerCase().endsWith(".ogg");

  // Check Cloudinary video URLs (they contain /video/upload/ in the path)
  const isCloudinaryVideo =
    url.toLowerCase().includes("cloudinary") &&
    url.toLowerCase().includes("/video/upload/");

  // Check for other video keywords in the URL
  const hasVideoKeyword = url.toLowerCase().includes("video");

  return hasVideoExtension || isCloudinaryVideo || hasVideoKeyword;
};

const AdPackageManagement = () => {
  const navigate = useNavigate();
  const [adPackages, setAdPackages] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Ad Media tab state
  const [activeTab, setActiveTab] = useState("1");
  const [adMediaList, setAdMediaList] = useState([]);
  const [adMediaLoading, setAdMediaLoading] = useState(false);
  const [totalCountLoading, setTotalCountLoading] = useState(false);
  const [adMediaSearchText, setAdMediaSearchText] = useState("");
  const [adMediaStatusFilter, setAdMediaStatusFilter] = useState(null);
  const [filteredAdMedia, setFilteredAdMedia] = useState([]);
  const [adMediaPagination, setAdMediaPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectForm] = Form.useForm();
  const [selectedAdMedia, setSelectedAdMedia] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Ad Payment History tab state
  const [adPaymentList, setAdPaymentList] = useState([]);
  const [adPaymentLoading, setAdPaymentLoading] = useState(false);
  const [adPaymentTotalLoading, setAdPaymentTotalLoading] = useState(false);
  const [adPaymentSearchText, setAdPaymentSearchText] = useState("");
  const [adPaymentStatusFilter, setAdPaymentStatusFilter] = useState(null);
  const [filteredAdPayment, setFilteredAdPayment] = useState([]);
  const [adPaymentPagination, setAdPaymentPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const { token } = theme.useToken();

  // Fetch AdPackages
  const fetchAdPackages = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    setLoading(true);
    try {
      const response = await AdPackageService.getAllAdPackages(page, pageSize);
      if (response) {
        setAdPackages(response.adPackages || []);
        setFilteredData(response.adPackages || []);
        setPagination({
          ...pagination,
          total: response.total || 0,
          current: page,
          pageSize: pageSize,
        });
      } else {
        notification.error({
          message: "Error",
          description: "Failed to fetch ad packages",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch ad packages",
      });
      console.error("Error fetching ad packages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AdMedia
  const fetchAdMedia = async (
    page = adMediaPagination.current,
    pageSize = adMediaPagination.pageSize
  ) => {
    setAdMediaLoading(true);
    try {
      // Fetch the current page data
      const response = await adMediaService.getAllAdMedia(page, pageSize);

      // Fetch a larger dataset to determine total count (only on first load or when needed)
      let totalItems = 0;
      if (page === 1 || adMediaPagination.total === 0) {
        setTotalCountLoading(true);
        try {
          const totalResponse = await adMediaService.getAllAdMedia(1, 100);
          if (totalResponse && totalResponse.success) {
            totalItems = totalResponse.data?.length || 0;
          }
        } catch (error) {
          console.error("Error fetching total count:", error);
        } finally {
          setTotalCountLoading(false);
        }
      } else {
        totalItems = adMediaPagination.total;
      }

      if (response && response.success) {
        setAdMediaList(response.data || []);
        setFilteredAdMedia(response.data || []);
        setAdMediaPagination({
          ...adMediaPagination,
          total: totalItems,
          current: page,
          pageSize: pageSize,
        });
      } else {
        notification.error({
          message: "Error",
          description: response?.message || "Failed to fetch ad media",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch ad media",
      });
      console.error("Error fetching ad media:", error);
    } finally {
      setAdMediaLoading(false);
    }
  };

  // Fetch Ad Payment History
  const fetchAdPaymentHistory = async (
    page = adPaymentPagination.current,
    pageSize = adPaymentPagination.pageSize
  ) => {
    setAdPaymentLoading(true);
    try {
      // Fetch current page data
      const response = await adPurchaseService.getAllAdPurchaseTransaction(
        page,
        pageSize
      );

      // Fetch all data for accurate total count and calculations
      setAdPaymentTotalLoading(true);
      let totalItems = 0;
      let allTransactions = [];

      try {
        const totalResponse =
          await adPurchaseService.getAllAdPurchaseTransactionTotal();
        if (totalResponse && totalResponse.success) {
          totalItems = totalResponse.total || 0;
          allTransactions = totalResponse.data || [];

          // Calculate total amount from successful transactions
          const successfulTransactions = allTransactions.filter(
            (item) => item.status === "SUCCESS"
          );
          const total = successfulTransactions.reduce(
            (sum, item) => sum + (item.totalPrice || 0),
            0
          );
          setTotalPaymentAmount(total);

          // Calculate total items and views
          let itemCount = 0;
          let viewCount = 0;

          allTransactions.forEach((transaction) => {
            if (
              transaction.adPurchaseItems &&
              transaction.adPurchaseItems.length > 0
            ) {
              itemCount += transaction.adPurchaseItems.length;

              transaction.adPurchaseItems.forEach((item) => {
                viewCount += item.viewQuantity || 0;
              });
            }
          });

          setTotalItems(itemCount);
          setTotalViews(viewCount);
        }
      } catch (error) {
        console.error("Error fetching total payment data:", error);
      } finally {
        setAdPaymentTotalLoading(false);
      }

      if (response && response.success) {
        setAdPaymentList(response.data || []);
        setFilteredAdPayment(response.data || []);
        setAdPaymentPagination({
          ...adPaymentPagination,
          total: response.total || totalItems,
          current: page,
          pageSize: pageSize,
        });
      } else {
        notification.error({
          message: "Error",
          description: response?.message || "Failed to fetch payment history",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch payment history",
      });
      console.error("Error fetching payment history:", error);
    } finally {
      setAdPaymentLoading(false);
    }
  };

  // Fetch all data when component mounts
  useEffect(() => {
    fetchAdPackages();
    fetchAdMedia();
    fetchAdPaymentHistory();
  }, []);

  // Update active tab
  useEffect(() => {
    // This effect is only for updating the active tab
    // Data is already loaded in the initial effect
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    // Refresh data when switching tabs
    if (key === "1") {
      fetchAdPackages();
    } else if (key === "2") {
      fetchAdMedia();
    } else if (key === "3") {
      fetchAdPaymentHistory();
    }
  };

  // Filter data based on search text and status
  useEffect(() => {
    let result = [...adPackages];

    if (searchText) {
      result = result.filter((item) =>
        item.packageName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredData(result);
  }, [searchText, statusFilter, adPackages]);

  // Filter AdMedia data based on search text and status
  useEffect(() => {
    let result = [...adMediaList];

    if (adMediaSearchText) {
      result = result.filter(
        (item) =>
          item.content
            ?.toLowerCase()
            .includes(adMediaSearchText.toLowerCase()) ||
          item.id?.toLowerCase().includes(adMediaSearchText.toLowerCase())
      );
    }

    if (adMediaStatusFilter) {
      result = result.filter((item) => item.status === adMediaStatusFilter);
    }

    setFilteredAdMedia(result);
  }, [adMediaSearchText, adMediaStatusFilter, adMediaList]);

  // Filter Ad Payment data based on search text and status
  useEffect(() => {
    let result = [...adPaymentList];

    if (adPaymentSearchText) {
      result = result.filter(
        (item) =>
          item.id?.toLowerCase().includes(adPaymentSearchText.toLowerCase()) ||
          item.userId?.toLowerCase().includes(adPaymentSearchText.toLowerCase())
      );
    }

    if (adPaymentStatusFilter) {
      result = result.filter((item) => item.status === adPaymentStatusFilter);
    }

    setFilteredAdPayment(result);
  }, [adPaymentSearchText, adPaymentStatusFilter, adPaymentList]);

  // Handle AdMedia search change
  const handleAdMediaSearchChange = (e) => {
    setAdMediaSearchText(e.target.value);
  };

  // Handle AdMedia status filter change
  const handleAdMediaStatusFilterChange = (value) => {
    setAdMediaStatusFilter(value);
  };

  // Handle AdMedia pagination change
  const handleAdMediaPaginationChange = (page, pageSize) => {
    fetchAdMedia(page, pageSize);
  };

  // Clear all AdMedia filters
  const handleClearAdMediaFilters = () => {
    setAdMediaSearchText("");
    setAdMediaStatusFilter(null);
    setFilteredAdMedia(adMediaList);
  };

  // Handle Ad Payment search change
  const handleAdPaymentSearchChange = (e) => {
    setAdPaymentSearchText(e.target.value);
  };

  // Handle Ad Payment status filter change
  const handleAdPaymentStatusFilterChange = (value) => {
    setAdPaymentStatusFilter(value);
  };

  // Handle Ad Payment pagination change
  const handleAdPaymentPaginationChange = (page, pageSize) => {
    fetchAdPaymentHistory(page, pageSize);
  };

  // Clear all Ad Payment filters
  const handleClearAdPaymentFilters = () => {
    setAdPaymentSearchText("");
    setAdPaymentStatusFilter(null);
    setFilteredAdPayment(adPaymentList);
  };

  // Format VND currency
  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDateTime = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      case "CANCELED":
        return <CloseCircleOutlined />;
      case "ACTIVE":
        return <CheckCircleOutlined />;
      case "EXPIRED":
        return <ClockCircleOutlined />;
      case "REJECTED":
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELED":
        return "error";
      case "ACTIVE":
        return "success";
      case "EXPIRED":
        return "default";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  // Handle approve ad media
  const handleApproveAdMedia = async (id) => {
    try {
      Modal.confirm({
        title: "Approve Ad Media",
        content: "Are you sure you want to approve this ad media?",
        okText: "Yes",
        okType: "primary",
        cancelText: "No",
        onOk: async () => {
          setApproveLoading(true);
          try {
            const response = await adMediaService.approveAdMedia({ id });
            if (response.success) {
              notification.success({
                message: "Success",
                description: "Ad media approved successfully",
              });
              fetchAdMedia(
                adMediaPagination.current,
                adMediaPagination.pageSize
              );
            } else {
              notification.error({
                message: "Error",
                description: response.message || "Failed to approve ad media",
              });
            }
          } catch (error) {
            notification.error({
              message: "Error",
              description: error.message || "Failed to approve ad media",
            });
            console.error("Error approving ad media:", error);
          } finally {
            setApproveLoading(false);
          }
        },
      });
    } catch (error) {
      console.error("Error in handleApproveAdMedia:", error);
    }
  };

  // Show reject modal
  const showRejectModal = (record) => {
    setSelectedAdMedia(record);
    rejectForm.resetFields();
    setIsRejectModalVisible(true);
  };

  // Handle reject ad media
  const handleRejectAdMedia = async (values) => {
    if (!selectedAdMedia) return;

    setRejectLoading(true);
    try {
      const response = await adMediaService.rejectAdMedia({
        id: selectedAdMedia.id,
        reasonForRejection: values.reasonForRejection,
      });

      if (response.success) {
        notification.success({
          message: "Success",
          description: "Ad media rejected successfully",
        });
        setIsRejectModalVisible(false);
        fetchAdMedia(adMediaPagination.current, adMediaPagination.pageSize);
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to reject ad media",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to reject ad media",
      });
      console.error("Error rejecting ad media:", error);
    } finally {
      setRejectLoading(false);
    }
  };

  // Cancel reject modal
  const handleCancelReject = () => {
    setIsRejectModalVisible(false);
    setSelectedAdMedia(null);
    rejectForm.resetFields();
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
      };

      let response;
      if (editingId) {
        response = await AdPackageService.updateAdPackage(editingId, formData);
      } else {
        response = await AdPackageService.createAdPackage(formData);
      }

      if (!response.success) {
        throw new Error(response.message || "Operation failed");
      }

      notification.success({
        message: "Success",
        description: editingId
          ? "Ad package updated successfully"
          : "Ad package created successfully",
      });

      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchAdPackages();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to save ad package",
      });
      console.error("Error saving ad package:", error);
    }
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      packageName: record.packageName,
      minView: record.minView,
      maxView: record.maxView,
      pricePerView: record.pricePerView,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    try {
      const response = await AdPackageService.deleteAdPackage(id);

      if (!response.success) {
        throw new Error(response.message || "Delete operation failed");
      }

      notification.success({
        message: "Success",
        description: "Ad package deleted successfully",
      });

      fetchAdPackages();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to delete ad package",
      });
      console.error("Error deleting ad package:", error);
    }
  };

  // Handle view button click
  const handleView = (record) => {
    setViewData(record);
    setIsViewModalVisible(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter(null);
    setFilteredData(adPackages);
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setIsViewModalVisible(false);
    setViewData(null);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    fetchAdPackages(page, pageSize);
  };

  // Render status tag with color
  const renderTagColor = (status) => {
    switch (status) {
      case "Active":
        return <Tag color="green">{status}</Tag>;
      case "Inactive":
        return <Tag color="red">{status}</Tag>;
      default:
        return <Tag color="blue">{status}</Tag>;
    }
  };

  // Format date for AdMedia
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  // Get status color for AdMedia
  const getAdMediaStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
        return "warning";
      case "EXPIRED":
        return "default";
      default:
        return "default";
    }
  };

  // Table columns
  const columns = [
    {
      title: "Package Name",
      dataIndex: "packageName",
      key: "packageName",
      sorter: (a, b) => a.packageName.localeCompare(b.packageName),
    },
    {
      title: "Min View",
      dataIndex: "minView",
      key: "minView",
      sorter: (a, b) => a.minView - b.minView,
    },
    {
      title: "Max View",
      dataIndex: "maxView",
      key: "maxView",
      sorter: (a, b) => a.maxView - b.maxView,
    },
    {
      title: "Price Per View",
      dataIndex: "pricePerView",
      key: "pricePerView",
      render: (price) => `$${price.toFixed(2)}`,
      sorter: (a, b) => a.pricePerView - b.pricePerView,
    },
    {
      title: "Creation Date",
      dataIndex: "createDate",
      key: "createDate",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createDate) - new Date(b.createDate),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => renderTagColor(status),
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="Edit">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            aria-label="Edit ad package"
          />
        </Tooltip>
      ),
    },
  ];

  // AdMedia table columns
  const adMediaColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: "15%",
      ellipsis: true,
      render: (id) => (
        <Tooltip title={id}>
          <span className="font-mono text-xs text-gray-600">{id}</span>
        </Tooltip>
      ),
    },
    {
      title: "Preview",
      dataIndex: "url",
      key: "url",
      width: "15%",
      render: (url) => {
        if (!url) {
          return (
            <div className="flex justify-center">
              <Tag color="default">No Media</Tag>
            </div>
          );
        }

        const isVideo = isVideoUrl(url);

        return (
          <div className="flex flex-col items-center">
            {isVideo ? (
              <div className="relative group">
                <div className="w-[120px] h-[68px] bg-black rounded overflow-hidden">
                  <video
                    className="w-full h-full object-cover"
                    src={url}
                    muted
                    preload="metadata"
                    onLoadedData={(e) => {
                      // Capture the first frame as thumbnail
                      try {
                        e.target.currentTime = 0.5; // Set to 0.5 seconds to avoid black frame
                      } catch (err) {
                        console.error("Error setting video time:", err);
                      }
                    }}
                  >
                    <source src={url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <VideoCameraOutlined className="text-white text-xl" />
                  </div>
                </div>
                <button
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 rounded"
                  onClick={() => {
                    Modal.info({
                      title: "Video Preview",
                      width: 640,
                      closable: true,
                      maskClosable: true,
                      centered: true,
                      footer: null,
                      content: (
                        <div className="flex flex-col items-center">
                          <video
                            controls
                            autoPlay
                            className="w-full max-h-[70vh] rounded"
                            src={url}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ),
                    });
                  }}
                  aria-label="Preview video"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.target.click();
                    }
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PlayCircleOutlined className="text-white text-3xl" />
                  </div>
                </button>
                <div className="text-xs mt-1 text-center text-gray-500">
                  Click to play
                </div>
              </div>
            ) : (
              <div className="relative group">
                <Image
                  src={url}
                  alt="Ad Media"
                  width={120}
                  height={68}
                  className="object-cover rounded"
                  fallback="data:image/png;base64,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"
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      width: "20%",
      render: (content) => content || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "10%",
      render: (status) => (
        <Tag color={getAdMediaStatusColor(status)}>{status || "N/A"}</Tag>
      ),
      filters: [
        { text: "Active", value: "ACTIVE" },
        { text: "Rejected", value: "REJECTED" },
        { text: "Pending", value: "PENDING" },
        { text: "Expired", value: "EXPIRED" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Created Date",
      dataIndex: "createAt",
      key: "createAt",
      width: "15%",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createAt || 0) - new Date(b.createAt || 0),
    },
    {
      title: "Approved Date",
      dataIndex: "approvedDate",
      key: "approvedDate",
      width: "15%",
      render: (date) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.approvedDate || 0) - new Date(b.approvedDate || 0),
    },
    {
      title: "Rejection Reason",
      dataIndex: "reasonForRejection",
      key: "reasonForRejection",
      width: "15%",
      render: (reason) => reason || "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      width: "10%",
      render: (_, record) => {
        // Only show actions for PENDING status
        if (record.status !== "PENDING") {
          return <Tag color="default">No actions available</Tag>;
        }

        return (
          <Space>
            <Tooltip title="Approve">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="small"
                className="bg-green-500 hover:bg-green-600 border-none"
                onClick={() => handleApproveAdMedia(record.id)}
                loading={approveLoading && selectedAdMedia?.id === record.id}
                disabled={approveLoading || rejectLoading}
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                onClick={() => showRejectModal(record)}
                loading={rejectLoading && selectedAdMedia?.id === record.id}
                disabled={approveLoading || rejectLoading}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Ad Package Management | Eigakan</title>
      </Helmet>

      <Card className="shadow-md">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="m-0">
            Ad Package Management
          </Title>
          {activeTab === "1" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              className="bg-[var(--eigakan-primary)]"
            >
              Create New Package
            </Button>
          )}
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange} className="mb-6">
          <TabPane tab="Ad Packages" key="1">
            {/* Search and filter */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Input
                placeholder="Search by package name"
                value={searchText}
                onChange={handleSearchChange}
                prefix={<SearchOutlined />}
                className="max-w-xs"
              />
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                allowClear
                className="min-w-[150px]"
              >
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
              <Button onClick={handleClearFilters} icon={<FilterOutlined />}>
                Clear Filters
              </Button>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: handlePaginationChange,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
              }}
            />
          </TabPane>

          <TabPane tab="Ad Media" key="2">
            {/* Search and filter for Ad Media */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Input
                placeholder="Search by content or ID"
                value={adMediaSearchText}
                onChange={handleAdMediaSearchChange}
                prefix={<SearchOutlined />}
                className="max-w-xs"
              />
              <Select
                placeholder="Filter by status"
                value={adMediaStatusFilter}
                onChange={handleAdMediaStatusFilterChange}
                allowClear
                className="min-w-[150px]"
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="REJECTED">Rejected</Option>
                <Option value="PENDING">Pending</Option>
                <Option value="EXPIRED">Expired</Option>
              </Select>
              <Button
                onClick={handleClearAdMediaFilters}
                icon={<FilterOutlined />}
              >
                Clear Filters
              </Button>
            </div>

            {/* Ad Media Table */}
            <Table
              columns={adMediaColumns}
              dataSource={filteredAdMedia}
              rowKey="id"
              loading={adMediaLoading}
              pagination={{
                current: adMediaPagination.current,
                pageSize: adMediaPagination.pageSize,
                total: adMediaPagination.total,
                onChange: handleAdMediaPaginationChange,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total) => (
                  <span>
                    {totalCountLoading ? (
                      <>
                        <Spin size="small" className="mr-2" />
                        Calculating total...
                      </>
                    ) : (
                      `Total ${total} items`
                    )}
                  </span>
                ),
              }}
              locale={{
                emptyText: adMediaLoading ? (
                  <Spin size="large" />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No ad media found"
                  />
                ),
              }}
            />
          </TabPane>

          <TabPane tab="Ad Payment History" key="3">
            {/* Search and filter for Ad Payment History */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Input
                placeholder="Search by ID or user ID"
                value={adPaymentSearchText}
                onChange={handleAdPaymentSearchChange}
                prefix={<SearchOutlined />}
                className="max-w-xs"
              />
              <Select
                placeholder="Filter by status"
                value={adPaymentStatusFilter}
                onChange={handleAdPaymentStatusFilterChange}
                allowClear
                className="min-w-[150px]"
              >
                <Option value="SUCCESS">Success</Option>
                <Option value="PENDING">Pending</Option>
                <Option value="CANCELED">Canceled</Option>
              </Select>
              <Button
                onClick={handleClearAdPaymentFilters}
                icon={<FilterOutlined />}
              >
                Clear Filters
              </Button>
            </div>

            {/* Statistics cards */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} md={8}>
                <Card hoverable style={{ transition: "all 0.3s ease" }}>
                  <Statistic
                    title="Total Successful Payments"
                    value={totalPaymentAmount}
                    precision={0}
                    formatter={(value) => formatVND(value)}
                    prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
                    loading={adPaymentTotalLoading}
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card hoverable style={{ transition: "all 0.3s ease" }}>
                  <Statistic
                    title="Total Ad Items"
                    value={totalItems}
                    prefix={<ShoppingOutlined style={{ color: "#1890ff" }} />}
                    loading={adPaymentTotalLoading}
                    valueStyle={{ color: "#1890ff" }}
                    suffix={totalItems > 1 ? "items" : "item"}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card hoverable style={{ transition: "all 0.3s ease" }}>
                  <Statistic
                    title="Total Ad Views Purchased"
                    value={totalViews}
                    formatter={(value) => `${value.toLocaleString()}`}
                    prefix={<EyeOutlined style={{ color: "#722ed1" }} />}
                    loading={adPaymentTotalLoading}
                    valueStyle={{ color: "#722ed1" }}
                    suffix="views"
                  />
                </Card>
              </Col>
            </Row>

            {/* Ad Payment History with Collapse */}
            <Card style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 500 }}>
                  Payment Transactions
                </Text>
                <Badge
                  status={adPaymentLoading ? "processing" : "success"}
                  text={adPaymentLoading ? "Loading..." : "Updated"}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <Collapse bordered={false} expandIconPosition="end">
                  {filteredAdPayment.map((transaction) => (
                    <Panel
                      key={transaction.id}
                      header={
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
                            gap: 16,
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <Tooltip title={transaction.id}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontFamily: "monospace",
                                }}
                              >
                                {transaction.id.substring(0, 8)}...
                                {transaction.id.substring(
                                  transaction.id.length - 4
                                )}
                              </span>
                            </Tooltip>
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>
                              {formatVND(transaction.totalPrice)}
                            </span>
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: 10, marginBottom: 2 }}
                              >
                                Payment Method
                              </Text>
                              <Tag
                                color="cyan"
                                style={{
                                  margin: 0,
                                  maxWidth: "100px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <DollarOutlined style={{ marginRight: 4 }} />
                                {transaction.paymentMethod || "VNPay"}
                              </Tag>
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: 10, marginBottom: 2 }}
                              >
                                Payment Status
                              </Text>
                              <Tag
                                icon={getStatusIcon(transaction.status)}
                                color={getStatusColor(transaction.status)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  width: "fit-content",
                                  margin: 0,
                                  maxWidth: "100px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                <span style={{ marginLeft: 4 }}>
                                  {transaction.status}
                                </span>
                              </Tag>
                            </div>
                          </div>
                          {transaction.adPurchaseItems &&
                            transaction.adPurchaseItems.length > 0 && (
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 10, marginBottom: 2 }}
                                  >
                                    Ad Item Status
                                  </Text>
                                  <Tag
                                    icon={getStatusIcon(
                                      transaction.adPurchaseItems[0].status
                                    )}
                                    color={getStatusColor(
                                      transaction.adPurchaseItems[0].status
                                    )}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      width: "fit-content",
                                      margin: 0,
                                      maxWidth: "100px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    <span style={{ marginLeft: 4 }}>
                                      {transaction.adPurchaseItems[0].status}
                                    </span>
                                  </Tag>
                                </div>
                              </div>
                            )}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{formatDateTime(transaction.createAt)}</span>
                            {transaction.adPurchaseItems &&
                              transaction.adPurchaseItems.length > 0 && (
                                <Tag
                                  color="purple"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}
                                >
                                  <ShoppingOutlined
                                    style={{ marginRight: 4 }}
                                  />
                                  {transaction.adPurchaseItems.length}{" "}
                                  {transaction.adPurchaseItems.length > 1
                                    ? "items"
                                    : "item"}
                                </Tag>
                              )}
                          </div>
                        </div>
                      }
                    >
                      <div className="p-4 bg-white">
                        {transaction.adPurchaseItems &&
                          transaction.adPurchaseItems.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <Text
                                strong
                                style={{
                                  fontSize: 16,
                                  display: "flex",
                                  alignItems: "center",
                                  marginBottom: 16,
                                }}
                              >
                                <ShoppingOutlined
                                  style={{
                                    marginRight: 8,
                                    color: token.colorPrimary,
                                  }}
                                />
                                Purchase Items (
                                {transaction.adPurchaseItems.length})
                              </Text>
                              <div
                                style={{
                                  padding: 16,
                                  backgroundColor: "white",
                                }}
                              >
                                {transaction.adPurchaseItems.map((item) => (
                                  <Card
                                    key={item.id}
                                    style={{
                                      marginBottom: 16,
                                      borderRadius: 8,
                                      cursor: "pointer",
                                      transition: "all 0.3s ease",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      ":hover": {
                                        boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
                                      },
                                    }}
                                    bodyStyle={{ padding: 0 }}
                                    onClick={() =>
                                      navigate(
                                        `/manager/ad-purchase-item/${item.id}`
                                      )
                                    }
                                    hoverable
                                  >
                                    <div
                                      style={{
                                        padding: "12px 16px",
                                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                        backgroundColor: token.colorBgLayout,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Space>
                                        <Text strong>Purchase Item</Text>
                                        <Tag
                                          icon={<EyeOutlined />}
                                          color="blue"
                                        >
                                          {item.viewQuantity} views
                                        </Tag>
                                        <Tag
                                          icon={getStatusIcon(item.status)}
                                          color={getStatusColor(item.status)}
                                        >
                                          {item.status}
                                        </Tag>
                                      </Space>
                                      <Space>
                                        <Text type="secondary">
                                          ID: {item.id.substring(0, 8)}...
                                        </Text>
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<LinkOutlined />}
                                          onClick={() =>
                                            navigate(
                                              `/manager/ad-purchase-item/${item.id}`
                                            )
                                          }
                                        >
                                          Details
                                        </Button>
                                      </Space>
                                    </div>
                                    <div style={{ padding: "0 16px 16px" }}>
                                      <Row
                                        gutter={16}
                                        style={{ marginTop: 16 }}
                                      >
                                        <Col span={12}>
                                          <Card
                                            size="small"
                                            style={{
                                              backgroundColor:
                                                token.colorBgLayout,
                                              border: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                          >
                                            <Text type="secondary">
                                              Price Per View
                                            </Text>
                                            <div
                                              style={{
                                                fontWeight: 500,
                                                fontSize: 16,
                                              }}
                                            >
                                              {formatVND(item.pricePerView)}
                                            </div>
                                          </Card>
                                        </Col>
                                        <Col span={12}>
                                          <Card
                                            size="small"
                                            style={{
                                              backgroundColor:
                                                token.colorBgLayout,
                                              border: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                          >
                                            <Text type="secondary">
                                              Total Price
                                            </Text>
                                            <div
                                              style={{
                                                fontWeight: 500,
                                                fontSize: 16,
                                              }}
                                            >
                                              {formatVND(item.price)}
                                            </div>
                                          </Card>
                                        </Col>
                                      </Row>

                                      <Descriptions
                                        column={1}
                                        size="small"
                                        bordered
                                        style={{ marginTop: 16 }}
                                      >
                                        <Descriptions.Item label="View Quantity">
                                          <Space>
                                            <EyeOutlined
                                              style={{ color: token.colorInfo }}
                                            />
                                            <Text strong>
                                              {item.viewQuantity} views
                                            </Text>
                                          </Space>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Price Per View">
                                          <Space>
                                            <DollarOutlined
                                              style={{
                                                color: token.colorSuccess,
                                              }}
                                            />
                                            <Text>
                                              {formatVND(item.pricePerView)}
                                            </Text>
                                          </Space>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Total Price">
                                          <Space>
                                            <DollarOutlined
                                              style={{
                                                color: token.colorSuccess,
                                              }}
                                            />
                                            <Text strong>
                                              {formatVND(item.price)}
                                            </Text>
                                          </Space>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Status">
                                          <Tag
                                            icon={getStatusIcon(item.status)}
                                            color={getStatusColor(item.status)}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              width: "fit-content",
                                            }}
                                          >
                                            {item.status}
                                          </Tag>
                                        </Descriptions.Item>
                                      </Descriptions>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </Panel>
                  ))}
                </Collapse>

                {filteredAdPayment.length === 0 && !adPaymentLoading && (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No transactions found"
                  />
                )}
              </div>

              <Divider style={{ margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Space>
                  <Button
                    type="primary"
                    disabled={adPaymentPagination.current === 1}
                    onClick={() =>
                      fetchAdPaymentHistory(
                        adPaymentPagination.current - 1,
                        adPaymentPagination.pageSize
                      )
                    }
                  >
                    Previous
                  </Button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "0 12px",
                    }}
                  >
                    <span style={{ color: token.colorTextSecondary }}>
                      Page {adPaymentPagination.current} of{" "}
                      {Math.ceil(
                        adPaymentPagination.total / adPaymentPagination.pageSize
                      )}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    disabled={
                      adPaymentPagination.current >=
                      Math.ceil(
                        adPaymentPagination.total / adPaymentPagination.pageSize
                      )
                    }
                    onClick={() =>
                      fetchAdPaymentHistory(
                        adPaymentPagination.current + 1,
                        adPaymentPagination.pageSize
                      )
                    }
                  >
                    Next
                  </Button>
                </Space>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingId ? "Edit Ad Package" : "Create Ad Package"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: "Active",
          }}
        >
          <Form.Item
            name="packageName"
            label="Package Name"
            rules={[{ required: true, message: "Please enter package name" }]}
          >
            <Input placeholder="Enter package name" />
          </Form.Item>

          <Form.Item
            name="minView"
            label="Minimum Views"
            rules={[
              { required: true, message: "Please enter minimum views" },
              {
                type: "number",
                min: 1,
                message: "Min views must be at least 1",
              },
            ]}
          >
            <InputNumber
              placeholder="Enter minimum views"
              className="w-full"
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="maxView"
            label="Maximum Views"
            rules={[
              { required: true, message: "Please enter maximum views" },
              {
                type: "number",
                min: 1,
                message: "Max views must be at least 1",
              },
            ]}
            dependencies={["minView"]}
          >
            <InputNumber
              placeholder="Enter maximum views"
              className="w-full"
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="pricePerView"
            label="Price Per View"
            rules={[
              { required: true, message: "Please enter price per view" },
              {
                type: "number",
                min: 0.01,
                message: "Price must be greater than 0",
              },
            ]}
          >
            <InputNumber
              placeholder="Enter price per view"
              className="w-full"
              min={0.01}
              step={0.01}
              formatter={(value) => `$ ${value}`}
              parser={(value) => value.replace(/\$\s?/g, "")}
            />
          </Form.Item>

          {editingId && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select a status" }]}
            >
              <Select>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-[var(--eigakan-primary)]"
              >
                {editingId ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Ad Package Details"
        open={isViewModalVisible}
        onCancel={handleCloseViewModal}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Close
          </Button>,
        ]}
      >
        {viewData && (
          <div className="space-y-4">
            <div>
              <Text strong>Package Name:</Text>
              <p>{viewData.packageName}</p>
            </div>
            <div>
              <Text strong>Minimum Views:</Text>
              <p>{viewData.minView}</p>
            </div>
            <div>
              <Text strong>Maximum Views:</Text>
              <p>{viewData.maxView}</p>
            </div>
            <div>
              <Text strong>Price Per View:</Text>
              <p>${viewData.pricePerView.toFixed(2)}</p>
            </div>
            <div>
              <Text strong>Creation Date:</Text>
              <p>{new Date(viewData.createDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Text strong>Status:</Text>
              <p>{renderTagColor(viewData.status)}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Ad Media Modal */}
      <Modal
        title="Reject Ad Media"
        open={isRejectModalVisible}
        onCancel={handleCancelReject}
        footer={null}
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleRejectAdMedia}
        >
          <Form.Item
            name="reasonForRejection"
            label="Reason for Rejection"
            rules={[
              {
                required: true,
                message: "Please enter a reason for rejection",
              },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Enter reason for rejection" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleCancelReject}>Cancel</Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={rejectLoading}
            >
              Reject
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default function AdPackageManagementWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdPackageManagement />
    </ErrorBoundary>
  );
}
