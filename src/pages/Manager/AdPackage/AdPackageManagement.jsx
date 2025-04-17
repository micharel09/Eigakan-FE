import React, { useState, useEffect, Component } from "react";
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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import AdPackageService from "../../../apis/AdPackage/adpackage";
import { Helmet } from "react-helmet";

const { Option } = Select;
const { Title, Text } = Typography;

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

const AdPackageManagement = () => {
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

  useEffect(() => {
    fetchAdPackages();
  }, []);

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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            className="bg-[var(--eigakan-primary)]"
          >
            Create New Package
          </Button>
        </div>

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
