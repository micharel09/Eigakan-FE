import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Spin,
  Alert,
  Typography,
  Button,
  Tooltip,
  Badge,
  Image,
  Empty,
  Modal,
  Form,
  Input,
  Upload,
  message,
  notification,
  Select,
} from "antd";
import { Helmet } from "react-helmet";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  UploadOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import adMediaByLoginService from "../../../apis/AdMedia/adMediaByLogin";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MediaManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaData, setMediaData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const fetchMediaData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API with small pageSize to get display data
      const response = await adMediaByLoginService.getAdMediaByLogin(
        currentPage,
        pageSize
      );

      // Call API with large pageSize to get total count
      const totalResponse = await adMediaByLoginService.getAdMediaByLogin(
        1,
        1000
      );

      if (response.success && totalResponse.success) {
        const allData = totalResponse.data || [];
        setMediaData(allData);
        setTotalItems(allData.length || 0);

        // Apply filters to all data
        applyFilters(allData);
      } else {
        setError(response.message || "Failed to load media data");
      }
    } catch (err) {
      console.error("Error fetching media data:", err);
      setError(err.message || "Failed to load media data");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to data
  const applyFilters = (data) => {
    let result = [...data];

    // Apply search text filter
    if (searchText) {
      result = result.filter((item) =>
        item.content?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter(
        (item) => item.status?.toUpperCase() === statusFilter
      );
    }

    setFilteredData(result);
  };

  useEffect(() => {
    fetchMediaData();
  }, []);

  // Apply filters when search text or status filter changes
  useEffect(() => {
    if (mediaData.length > 0) {
      applyFilters(mediaData);
    }
  }, [searchText, statusFilter, mediaData]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter(null);
  };

  const handleRefresh = () => {
    fetchMediaData();
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
        return "warning";
      case "INACTIVE":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return <CheckCircleOutlined />;
      case "REJECTED":
        return <CloseCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  const getMediaTypeIcon = (url) => {
    if (!url) return <PictureOutlined />;

    const isVideo =
      url.toLowerCase().endsWith(".mp4") ||
      url.toLowerCase().endsWith(".mov") ||
      url.toLowerCase().includes("video");

    return isVideo ? <VideoCameraOutlined /> : <PictureOutlined />;
  };

  const isVideoUrl = (url) => {
    if (!url) return false;

    return (
      url.toLowerCase().endsWith(".mp4") ||
      url.toLowerCase().endsWith(".mov") ||
      url.toLowerCase().includes("video")
    );
  };

  const columns = [
    {
      title: "Media",
      dataIndex: "url",
      key: "url",
      render: (url) => {
        if (!url) {
          return (
            <div className="flex justify-center">
              <Tag icon={<PictureOutlined />} color="default">
                No Media
              </Tag>
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
                  width={80}
                  height={45}
                  className="object-cover rounded"
                  fallback="data:image/png;base64,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"
                />
              </div>
            )}
          </div>
        );
      },
      width: "16%",
    },
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-xs">{text}</div>
        </Tooltip>
      ),
      width: "25%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          icon={getStatusIcon(status)}
          color={getStatusColor(status)}
          className="flex items-center w-fit"
        >
          <span className="ml-1">{status}</span>
        </Tag>
      ),
      width: "15%",
      filters: [
        { text: "Active", value: "ACTIVE" },
        { text: "Pending", value: "PENDING" },
        { text: "Rejected", value: "REJECTED" },
      ],
      onFilter: (value, record) => record.status.toUpperCase() === value,
    },
    {
      title: "Created Date",
      dataIndex: "createAt",
      key: "createAt",
      render: (text) => formatDate(text),
      width: "20%",
      sorter: (a, b) => new Date(a.createAt) - new Date(b.createAt),
    },
    {
      title: "Approved Date",
      dataIndex: "approvedDate",
      key: "approvedDate",
      render: (text) => (text ? formatDate(text) : "-"),
      width: "20%",
      sorter: (a, b) => {
        if (!a.approvedDate) return 1;
        if (!b.approvedDate) return -1;
        return new Date(a.approvedDate) - new Date(b.approvedDate);
      },
    },
    {
      title: "Rejection Reason",
      dataIndex: "reasonForRejection",
      key: "reasonForRejection",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-xs">{text || "-"}</div>
        </Tooltip>
      ),
      width: "20%",
    },
  ];

  const showModal = () => {
    form.resetFields();
    setFileList([]);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleUpload = async (options) => {
    const { onSuccess, onError, file, onProgress } = options;

    // Simulate upload progress
    onProgress({ percent: 50 });

    // In a real implementation, you would upload the file to your server
    // For now, we'll just simulate a successful upload
    setTimeout(() => {
      onSuccess("ok");
    }, 1000);
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setUploading(true);

        // Simulate API call
        setTimeout(() => {
          setUploading(false);
          setIsModalVisible(false);
          notification.success({
            message: "Media Uploaded",
            description:
              "Your media has been uploaded and is pending approval.",
          });

          // Refresh the list
          fetchMediaData();
        }, 1500);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <div className="media-management-page p-6">
      <Helmet>
        <title>Ads Management | EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">
          <VideoCameraOutlined className="mr-2" /> Ads Management
        </Title>
        <div className="flex gap-2">
          <Button
            type="primary"
            onClick={() => navigate("/advertiser/buy-adslot")}
            icon={<PlusOutlined />}
            className="bg-[#FF009F] hover:bg-[#d1007f] border-none"
          >
            New AdsMedia
          </Button>
          <Button
            onClick={handleRefresh}
            icon={<ReloadOutlined />}
            loading={loading}
            className="bg-white hover:bg-gray-50"
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-6"
          closable
        />
      )}

      <Card className="shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <Text className="text-lg font-medium">Search & Filter</Text>
          <Badge
            status={loading ? "processing" : "success"}
            text={loading ? "Loading..." : "Updated"}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
          <Input
            placeholder="Search by content..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-lg focus:border-[#FF009F] hover:border-[#FF009F]"
            style={{
              "--antd-wave-shadow-color": "#FF009F",
            }}
            allowClear
            onChange={handleSearchChange}
            value={searchText}
            aria-label="Search media"
          />
          <Select
            placeholder="Filter by status"
            className="w-full"
            allowClear
            onChange={handleStatusFilterChange}
            value={statusFilter}
            aria-label="Filter by status"
          >
            <Option value="ACTIVE">Active</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="REJECTED">Rejected</Option>
          </Select>
          <Button
            onClick={handleClearFilters}
            className="md:w-fit md:ml-auto"
            aria-label="Clear filters"
          >
            <FilterOutlined /> Clear Filters
          </Button>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Text className="text-lg font-medium">Your Ad Media</Text>
          <Badge
            status={loading ? "processing" : "success"}
            text={loading ? "Loading..." : "Updated"}
          />
        </div>

        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            showTotal: (total) => `Total ${total} items`,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
              }
            },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No ad media found"
              />
            ),
          }}
          className="media-table"
        />
      </Card>

      <Modal
        title="Upload New Ad Media"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={uploading}
            onClick={handleSubmit}
            className="bg-[#FF009F] hover:bg-[#d1007f] border-none"
          >
            Upload
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" name="upload_media_form">
          <Form.Item
            name="content"
            label="Content"
            rules={[
              { required: true, message: "Please enter content description" },
            ]}
          >
            <TextArea rows={4} placeholder="Enter content description" />
          </Form.Item>

          <Form.Item
            name="media"
            label="Media File"
            rules={[{ required: true, message: "Please upload a media file" }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MediaManagement;
