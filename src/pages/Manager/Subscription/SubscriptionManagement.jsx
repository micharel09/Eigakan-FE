import React, { useState, useEffect } from "react";
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
  Tag,
  InputNumber,
  Spin,
  Typography,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import subscriptionService from "../../../apis/Subscription/subscription";
import { Helmet } from "react-helmet";

const { Option } = Select;
const { Title, Text } = Typography;

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch subscriptions
  const fetchSubscriptions = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await subscriptionService.getAllPackages(page, pageSize);
      if (response.success) {
        setSubscriptions(response.data.subscriptionpackage || []);
        setFilteredData(response.data.subscriptionpackage || []);
        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: response.data.total || 0,
        });
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch subscriptions",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch subscriptions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(pagination.current, pagination.pageSize);
  }, []);

  // Filter data based on search text and status
  useEffect(() => {
    let result = [...subscriptions];

    if (searchText) {
      result = result.filter((item) =>
        item.packageName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredData(result);
  }, [searchText, statusFilter, subscriptions]);

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await subscriptionService.updatePackage(editingId, {
          packageName: values.packageName,
          price: values.price,
          duration: values.duration,
          status: values.status,
        });
      } else {
        await subscriptionService.createPackage({
          packageName: values.packageName,
          price: values.price,
          duration: values.duration,
          status: "Active",
        });
      }

      notification.success({
        message: editingId ? "Updated Successfully" : "Created Successfully",
        description: editingId
          ? "Package has been updated successfully"
          : "New package has been created successfully",
      });
      setIsModalVisible(false);
      form.resetFields();
      fetchSubscriptions(pagination.current, pagination.pageSize);
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
    form.setFieldsValue({
      packageName: record.packageName,
      price: record.price,
      duration: record.duration,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this package?",
      content: "This action cannot be undone",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await subscriptionService.deletePackage(id);
          notification.success({
            message: "Deleted Successfully",
            description: "Package has been deleted successfully",
          });
          fetchSubscriptions(pagination.current, pagination.pageSize);
        } catch (error) {
          notification.error({
            message: "Error",
            description: error.message || "Failed to delete",
          });
        }
      },
    });
  };

  // Format price to VND
  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "packageName",
      key: "packageName",
      width: "20%",
    },
    {
      title: "Duration (days)",
      dataIndex: "duration",
      key: "duration",
      width: "15%",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => formatVND(price),
      width: "15%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "Active"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "20%",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Subscription Package Management</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="mb-0">
            Subscription Packages
          </Title>
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
            Add Package
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Input
            placeholder="Search by package name..."
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-lg"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
          />
          <Select
            placeholder="Filter by status"
            className="w-full"
            allowClear
            onChange={(value) => setStatusFilter(value)}
            value={statusFilter}
          >
            <Option value="Active">Active</Option>
            <Option value="Inactive">Inactive</Option>
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
          onChange={(newPagination) => {
            setPagination(newPagination);
            fetchSubscriptions(newPagination.current, newPagination.pageSize);
          }}
          className="rounded-lg overflow-hidden"
        />
      </Card>

      <Modal
        title={editingId ? "Edit Package" : "Add Package"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="packageName"
            label="Package Name"
            rules={[{ required: true, message: "Please input package name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration (days)"
            rules={[{ required: true, message: "Please input duration!" }]}
          >
            <InputNumber className="w-full" min={1} />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              min={0}
            />
          </Form.Item>

          {editingId && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select status!" }]}
            >
              <Select>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-blue-500 hover:bg-blue-600"
              >
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

export default SubscriptionManagement;
