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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import NewsApi from "../../../apis/News/news";

const { Option } = Select;
const { TextArea } = Input;

const NEWS_STATUS = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  INACTIVE: "Inactive",
  DELETED: "Deleted",
};

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch news data
  const fetchNews = async (page, pageSize) => {
    setLoading(true);
    try {
      const response = await NewsApi.getNews(page, pageSize);
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
    fetchNews(pagination.current, pagination.pageSize);
  }, []);

  // Handle table change
  const handleTableChange = (newPagination, filters, sorter) => {
    fetchNews(newPagination.current, newPagination.pageSize);
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      // Lấy URL ảnh đã upload từ form
      const imageUrl = form.getFieldValue("picture");

      // Tạo news data với URL ảnh đã có
      const newsData = {
        title: values.title,
        content: values.content,
        picture: imageUrl || "", // Sử dụng URL ảnh đã upload
        status: "1",
        userId: localStorage.getItem("userId"),
      };

      let response;
      if (editingId) {
        response = await NewsApi.updateNews(editingId, newsData);
      } else {
        response = await NewsApi.createNews(newsData);
      }

      if (response?.data?.success) {
        notification.success({
          message: editingId ? "Updated Successfully" : "Created Successfully",
          description: response.data.message,
        });
        setIsModalVisible(false);
        form.resetFields();
        fetchNews(pagination.current, pagination.pageSize);
      } else {
        notification.error({
          message: "Error",
          description: response?.data?.message || "Operation failed",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || error.message,
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
            fetchNews(pagination.current, pagination.pageSize);
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
        fetchNews(pagination.current, pagination.pageSize);
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

  const handleUpload = async (options) => {
    const { file } = options;
    try {
      if (!file) {
        throw new Error("No file selected");
      }

      const response = await NewsApi.uploadImage(file);

      if (response?.data?.status) {
        form.setFieldsValue({
          image: [file],
          picture: response.data.data[0].url,
        });

        notification.success({
          message: "Upload Successful",
          description: response.data.message,
        });
      } else {
        throw new Error(response?.data?.message || "Upload failed");
      }
    } catch (error) {
      notification.error({
        message: "Upload Failed",
        description: error.message || "Failed to upload image",
      });
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "Image",
      dataIndex: "picture",
      key: "picture",
      render: (text) =>
        text ? <img src={text} alt="news" style={{ width: 50 }} /> : "No image",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingId(record.id);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Add News
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={news}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <Modal
        title={editingId ? "Edit News" : "Add News"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please input title!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: "Please input content!" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="image"
            label="Image"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              return e?.fileList;
            }}
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

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NewsManagement;
