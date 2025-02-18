import React, { useState, useEffect } from "react";
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
  Tag,
  Card,
  Tooltip,
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import NewsApi from "../../../apis/News/news";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const NEWS_STATUS = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  INACTIVE: "Inactive",
  DELETED: "Deleted",
};

// Constants cho việc map status từ số sang text
const STATUS_MAP = {
  1: "Active",
  2: "Draft",
  3: "Deleted",

  Active: "Active",
  Draft: "Draft",
  Deleted: "Deleted",
};

const NewsManagement = () => {
  // States cho quản lý news
  const [news, setNews] = useState([]); // Lưu trữ tất cả news từ API
  const [filteredNews, setFilteredNews] = useState([]); // Lưu trữ news sau khi filter
  const [loading, setLoading] = useState(false);

  // States cho modal và form
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  // States cho filter và search
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  // New state for upload tracking
  const [isUploading, setIsUploading] = useState(false);

  // Fetch news của manager hiện tại dựa theo userId
  const fetchNews = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const response = await NewsApi.getNewsByUserId(userId);

      if (response?.data?.success) {
        setNews(response.data.data);
        setPagination({
          ...pagination,
          total: response.data.data.length,
        });
      } else {
        notification.error({
          message: "Error",
          description: response?.data?.message || "Failed to fetch news",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handle table change
  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination(newPagination);
  };

  // Effect để filter news dựa trên searchText và statusFilter
  useEffect(() => {
    if (!news) return;

    let result = [...news];

    // Filter theo text (tìm kiếm trong title và content)
    if (searchText) {
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.content?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter theo status (Active/Draft)
    if (statusFilter) {
      result = result.filter((item) => {
        const itemStatus = STATUS_MAP[item.status] || item.status;
        const filterStatus = STATUS_MAP[statusFilter];
        return itemStatus === filterStatus;
      });
    }

    setFilteredNews(result);
  }, [news, searchText, statusFilter]);

  // Xử lý submit form khi create/update news
  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
        // Nếu không upload ảnh mới, giữ lại ảnh cũ
        picture: values.picture || form.getFieldValue("picture"),
      };

      let response;
      if (editingId) {
        response = await NewsApi.updateNews(editingId, formData);
      } else {
        response = await NewsApi.createNews(formData);
      }

      if (response?.data?.success) {
        notification.success({
          message: editingId ? "Updated Successfully" : "Created Successfully",
          description: response.data.message,
        });
        setIsModalVisible(false);
        form.resetFields();
        fetchNews();
      } else {
        throw new Error(response?.data?.message || "Operation failed");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      Modal.confirm({
        title: "Are you sure you want to delete this news?",
        content: "This action cannot be undone",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk: async () => {
          const response = await NewsApi.deleteNews(id);

          if (response?.data?.success) {
            notification.success({
              message: "Deleted Successfully",
              description: response.data.message,
            });
            fetchNews();
          } else {
            notification.error({
              message: "Delete Failed",
              description: response?.data?.message,
            });
          }
        },
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || error.message,
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (id) => {
    try {
      const response = await NewsApi.changeNewsStatus(id);
      if (response?.data?.success) {
        notification.success({
          message: "Status Updated",
          description: response.data.message,
        });
        fetchNews();
      } else {
        notification.error({
          message: "Status Update Failed",
          description: response?.data?.message,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || error.message,
      });
    }
  };

  // Xử lý upload ảnh
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);

    try {
      // Validate file trước khi upload
      if (!file) throw new Error("No file selected");

      const response = await NewsApi.uploadImage(file);

      if (response?.data?.status) {
        // Set URL ảnh vào form sau khi upload thành công
        form.setFieldsValue({
          image: [file],
          picture: response.data.data[0].url,
        });

        notification.success({
          message: "Upload Successful",
          description: response.data.message,
        });
        onSuccess(response.data);
      } else {
        throw new Error(response?.data?.message || "Upload failed");
      }
    } catch (error) {
      notification.error({
        message: "Upload Failed",
        description: error.message || "Failed to upload image",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Thêm hàm xử lý preview
  const handlePreview = (record) => {
    setPreviewData(record);
    setIsPreviewVisible(true);
  };

  // Thêm debounce cho search
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  // Sửa lại phần xử lý khi click edit để set initial values
  const handleEdit = (record) => {
    setEditingId(record.id);
    // Set initial values với cả picture và image
    form.setFieldsValue({
      ...record,
      image: record.picture
        ? [
            {
              uid: "-1",
              name: "image.png",
              status: "done",
              url: record.picture,
            },
          ]
        : [],
    });
    setIsModalVisible(true);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header Section - Thu gọn padding */}
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <Title level={3} className="!mb-1">
              News Management
            </Title>
            <Text type="secondary" className="text-sm">
              Manage all your news articles in one place
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Add News
          </Button>
        </div>
      </Card>

      {/* Filters Section - Thu gọn padding và spacing */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Search by title or content..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-lg"
            allowClear
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Select
            placeholder="Filter by status"
            className="w-full"
            allowClear
            onChange={handleStatusFilterChange}
            value={statusFilter}
          >
            <Option value="1">Active</Option>
            <Option value="2">Draft</Option>
            <Option value="3">Deleted</Option>
          </Select>
          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setSearchText("");
              setStatusFilter(null);
            }}
            className="md:w-fit md:ml-auto"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Table Section - Điều chỉnh columns và spacing */}
      <Card>
        <Table
          columns={[
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
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              width: 100,
              render: (status) => {
                const displayStatus = STATUS_MAP[status] || status;
                return (
                  <Tag
                    color={
                      displayStatus === "Active"
                        ? "success"
                        : displayStatus === "Draft"
                        ? "warning"
                        : "error"
                    }
                    className="px-2 py-0.5 text-xs rounded-full"
                  >
                    {displayStatus}
                  </Tag>
                );
              },
            },
            {
              title: "Created",
              dataIndex: "createDate",
              key: "createDate",
              width: 120,
              render: (date) => (
                <Text type="secondary" className="text-sm">
                  {new Date(date).toLocaleDateString()}
                </Text>
              ),
            },
            {
              title: "Actions",
              key: "action",
              width: 120,
              render: (_, record) => (
                <Space size="small">
                  <Tooltip title="Preview">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(record)}
                      className="hover:text-blue-500"
                    />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                      className="hover:text-blue-500"
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(record.id)}
                      className="hover:text-gray-500"
                    />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
          dataSource={filteredNews}
          rowKey="id"
          pagination={{
            ...pagination,
            total: filteredNews.length,
            pageSize: 8, // Giảm số items mỗi trang
            showSizeChanger: false, // Ẩn option thay đổi pageSize
          }}
          loading={loading}
          onChange={handleTableChange}
          className="rounded-lg overflow-hidden"
          size="middle" // Giảm kích thước row
        />
      </Card>

      <Modal
        title={editingId ? "Edit News" : "Add News"}
        open={isModalVisible}
        onCancel={() => {
          if (isUploading) {
            notification.warning({
              message: "Please wait",
              description: "Image is still uploading...",
            });
            return;
          }
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
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
            <Input.TextArea rows={4} showCount maxLength={5000} />
          </Form.Item>

          <Form.Item
            name="image"
            label="Image"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              return e?.fileList;
            }}
            rules={[{ required: true, message: "Please upload an image!" }]}
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
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="1">
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
                loading={loading}
              >
                {isUploading ? "Uploading..." : editingId ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  if (isUploading) {
                    notification.warning({
                      message: "Please wait",
                      description: "Image is still uploading...",
                    });
                    return;
                  }
                  setIsModalVisible(false);
                  form.resetFields();
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="News Preview"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        width={800}
        footer={null}
      >
        {previewData && (
          <div className="preview-container">
            {/* Hero Section */}
            <div className="relative h-[300px] w-full mb-6">
              <img
                src={previewData.picture || "/default-news.jpg"}
                alt={previewData.title}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {previewData.title}
                </h1>
                <div className="flex items-center text-gray-300 text-sm">
                  <span>
                    {new Date(previewData.createDate).toLocaleDateString()}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{previewData.userName || "Admin"}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-line">
                {previewData.content}
              </p>
            </div>

            {/* Status Badge */}
            <div className="mt-6">
              <Tag
                color={
                  STATUS_MAP[previewData.status] === "Active"
                    ? "green"
                    : STATUS_MAP[previewData.status] === "Draft"
                    ? "gold"
                    : "red"
                }
              >
                {STATUS_MAP[previewData.status] || previewData.status}
              </Tag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NewsManagement;
