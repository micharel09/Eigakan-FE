import React, { useState, useEffect, Component } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  notification,
  Card,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import NewsApi from "../../../apis/News/news";
import { Helmet } from "react-helmet";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// Error Boundary Component to catch errors in child components
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
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

const STATUS_MAP = {
  1: "Active",
  2: "Draft",
  3: "Deleted",

  Active: "Active",
  Draft: "Draft",
  Deleted: "Deleted",
};

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch news
  const fetchNews = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        notification.error({
          message: "Error",
          description: "User ID not found in local storage",
        });
        return;
      }

      const response = await NewsApi.getNewsByUserId(userId);
      if (response.success) {
        setNews(response.data || []);
        setFilteredData(response.data || []);
        setPagination({
          ...pagination,
          total: response.data.length || 0,
        });
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch news",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch news",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Filter data based on search text and status
  useEffect(() => {
    let result = [...news];

    if (searchText) {
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.content?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter((item) => {
        const itemStatus = STATUS_MAP[item.status] || item.status;
        const filterStatus = STATUS_MAP[statusFilter];
        return itemStatus === filterStatus;
      });
    }

    setFilteredData(result);
  }, [searchText, statusFilter, news]);

  // Handle form submit
  const handleSubmit = async (values) => {
    if (isUploading) {
      notification.warning({
        message: "Please wait",
        description: "Image is still uploading...",
      });
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      const formData = {
        ...values,
        userId,
        picture: values.picture || form.getFieldValue("picture"),
      };

      let response;
      if (editingId) {
        response = await NewsApi.updateNews(editingId, formData);
      } else {
        response = await NewsApi.createNews(formData);
      }

      if (!response.success) {
        throw new Error(response.message || "Operation failed");
      }

      notification.success({
        message: editingId ? "Updated Successfully" : "Created Successfully",
        description: response.message || "Operation completed successfully",
      });
      setIsModalVisible(false);
      form.resetFields();
      fetchNews();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Operation failed",
      });
    }
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingId(record.id);
    setImageUrl(record.picture || "");
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      status: record.status,
      picture: record.picture,
    });
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this news article?",
      content: "This action cannot be undone",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          const response = await NewsApi.deleteNews(id);
          if (!response.success) {
            notification.error({
              message: "Error",
              description: response.message || "Failed to delete",
            });
            return;
          }

          notification.success({
            message: "Deleted Successfully",
            description: "News article has been deleted successfully",
          });
          fetchNews();
        } catch (error) {
          notification.error({
            message: "Error",
            description: error.message || "Failed to delete",
          });
        }
      },
    });
  };

  // Handle image upload
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);

    try {
      if (!file) {
        throw new Error("No file selected");
      }

      const response = await NewsApi.uploadImage(file);

      if (!response.status) {
        throw new Error(response.message || "Upload failed");
      }

      const uploadedUrl = response.data[0].url;
      setImageUrl(uploadedUrl);

      form.setFieldsValue({
        image: [file],
        picture: uploadedUrl,
      });

      notification.success({
        message: "Upload Successful",
        description: response.message || "Image uploaded successfully",
      });
      onSuccess(response);
    } catch (error) {
      notification.error({
        message: "Upload Failed",
        description: error.message || "Failed to upload image",
      });
      onError(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle preview
  const handlePreview = (record) => {
    setPreviewData(record);
    setIsPreviewModalVisible(true);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter(null);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setImageUrl("");
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    if (isUploading) {
      notification.warning({
        message: "Please wait",
        description: "Image is still uploading...",
      });
      return;
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalVisible(false);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handlePaginationChange = (newPagination) => {
    setPagination(newPagination);
  };

  const renderTagColor = (status) => {
    const displayStatus = STATUS_MAP[status] || status;
    if (displayStatus === "Active") {
      return {
        className:
          "px-2 py-1 bg-[rgba(var(--eigakan-primary),0.1)] text-[var(--eigakan-primary)] border-[var(--eigakan-primary)]",
      };
    }

    if (displayStatus === "Draft") {
      return { color: "warning" };
    }

    return { color: "error" };
  };

  const columns = [
    {
      title: "Title & Preview",
      key: "title",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
            <img
              src={record.picture || "/default-news.jpg"}
              alt={record.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {record.title}
            </div>
            <Text type="secondary" className="text-sm truncate block">
              {record.content?.substring(0, 60)}...
            </Text>
          </div>
        </div>
      ),
      width: "50%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status) => {
        const displayStatus = STATUS_MAP[status] || status;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              displayStatus === "Active"
                ? "bg-green-100 text-green-500 border border-green-500"
                : displayStatus === "Draft"
                ? "bg-yellow-100 text-yellow-500 border border-yellow-500"
                : "bg-red-100 text-red-500 border border-red-500"
            }`}
          >
            {displayStatus}
          </span>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createDate",
      key: "createDate",
      width: "15%",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              type="text"
              onClick={() => handlePreview(record)}
              aria-label="Preview news"
            >
              <EyeOutlined className="text-[var(--eigakan-primary)]" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              onClick={() => handleEdit(record)}
              aria-label="Edit news"
            >
              <EditOutlined className="text-[var(--eigakan-primary)]" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              onClick={() => handleDelete(record.id)}
              aria-label="Delete news"
            >
              <DeleteOutlined />
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>News Management</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="mb-0">
            News Articles
          </Title>
          <Button
            type="primary"
            onClick={handleOpenCreateModal}
            className="bg-[var(--eigakan-primary)] border-[var(--eigakan-primary)]"
            aria-label="Add news"
          >
            <PlusOutlined /> Add News
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Input
            placeholder="Search by title or content..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-lg"
            allowClear
            onChange={handleSearchChange}
            value={searchText}
            aria-label="Search news"
          />
          <Select
            placeholder="Filter by status"
            className="w-full"
            allowClear
            onChange={handleStatusFilterChange}
            value={statusFilter}
            aria-label="Filter by status"
          >
            <Option value="1">Active</Option>
            <Option value="2">Draft</Option>
            <Option value="3">Deleted</Option>
          </Select>
          <Button
            onClick={handleClearFilters}
            className="md:w-fit md:ml-auto"
            aria-label="Clear filters"
          >
            <FilterOutlined className="text-[var(--eigakan-primary)]" /> Clear
            Filters
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handlePaginationChange}
          className="rounded-lg overflow-hidden"
          aria-label="News articles table"
        />
      </Card>

      {/* Add/Edit Form Modal */}
      <ErrorBoundary>
        <Modal
          title={editingId ? "Edit News" : "Add News"}
          open={isModalVisible}
          onCancel={handleCloseModal}
          footer={null}
          getContainer={false}
          centered
          bodyStyle={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="title"
              label="Title"
              rules={[
                { required: true, message: "Please input title!" },
                {
                  max: 50,
                  message: "Title cannot be longer than 50 characters!",
                },
                { min: 10, message: "Title must be at least 10 characters!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="content"
              label="Content"
              rules={[
                { required: true, message: "Please input content!" },
                { min: 50, message: "Content must be at least 50 characters!" },
                {
                  max: 5000,
                  message: "Content cannot be longer than 5000 characters!",
                },
              ]}
            >
              <TextArea rows={4} showCount maxLength={5000} />
            </Form.Item>

            <Form.Item
              name="image"
              label="Image"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e?.fileList;
              }}
              rules={[
                {
                  required: editingId ? false : true,
                  message: "Please upload an image!",
                },
              ]}
            >
              <Upload
                customRequest={handleUpload}
                showUploadList={true}
                accept="image/*"
                maxCount={1}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith("image/");
                  const isLt2M = file.size / 1024 / 1024 < 2;

                  if (!isImage) {
                    notification.error({
                      message: "Upload Failed",
                      description: "You can only upload image files!",
                    });
                    return false;
                  }

                  if (!isLt2M) {
                    notification.error({
                      message: "Upload Failed",
                      description: "Image must be smaller than 2MB!",
                    });
                    return false;
                  }

                  return true;
                }}
              >
                <Button aria-label="Upload image">
                  <UploadOutlined className="text-[var(--eigakan-primary)]" />{" "}
                  Upload Image
                </Button>
              </Upload>
            </Form.Item>

            {imageUrl && (
              <Form.Item label="Image Preview">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full max-h-40 rounded border border-gray-200"
                />
              </Form.Item>
            )}

            <Form.Item
              name="status"
              label="Status"
              initialValue="1"
              rules={[{ required: true, message: "Please select status!" }]}
            >
              <Select>
                <Option value="1">Active</Option>
                <Option value="2">Draft</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={isUploading}
                  loading={loading && editingId}
                  className="bg-[var(--eigakan-primary)] border-[var(--eigakan-primary)]"
                  aria-label={editingId ? "Update news" : "Create news"}
                >
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  onClick={handleCloseModal}
                  className="hover:border-[var(--eigakan-primary)] hover:text-[var(--eigakan-primary)]"
                  aria-label="Cancel"
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </ErrorBoundary>

      {/* Preview Modal */}
      <ErrorBoundary>
        <Modal
          title="News Preview"
          open={isPreviewModalVisible}
          onCancel={handleClosePreviewModal}
          footer={null}
          width={700}
          getContainer={false}
          centered
        >
          {previewData && (
            <div className="preview-container">
              {/* Hero Section */}
              <div className="relative h-60 w-full mb-6 rounded-lg overflow-hidden">
                <img
                  src={previewData.picture || "/default-news.jpg"}
                  alt={previewData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {previewData.title}
                  </h1>
                  <div className="flex items-center text-gray-300 text-sm">
                    <span>
                      {new Date(previewData.createDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div
                className="prose max-w-none mb-4 overflow-y-auto"
                style={{ maxHeight: "300px" }}
              >
                <p className="text-gray-600 whitespace-pre-line">
                  {previewData.content}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    STATUS_MAP[previewData.status] === "Active"
                      ? "bg-green-100 text-green-500 border border-green-500"
                      : STATUS_MAP[previewData.status] === "Draft"
                      ? "bg-yellow-100 text-yellow-500 border border-yellow-500"
                      : "bg-red-100 text-red-500 border border-red-500"
                  }`}
                >
                  {STATUS_MAP[previewData.status] || previewData.status}
                </span>
              </div>
            </div>
          )}
        </Modal>
      </ErrorBoundary>
    </div>
  );
};

export default function NewsManagementWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <NewsManagement />
    </ErrorBoundary>
  );
}
