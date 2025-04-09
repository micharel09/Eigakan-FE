import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Card,
  Typography,
  notification,
  InputNumber,
  Select,
  Tag,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import subscriptionService from "../../../apis/Subscription/subscription";
import { Helmet } from "react-helmet";

const { Title, Text } = Typography;
const { Option } = Select;

const SubscriptionManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAllAmount, setTotalAllAmount] = useState(0);

  // Fetch packages
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getAllPackages();
      if (response.success) {
        const packagesData = response.data?.subscriptionpackage || [];
        setPackages(packagesData);

        // Calculate total amount of active packages
        calculateTotalAmount(packagesData);
        // Calculate total amount of all packages
        calculateTotalAllAmount(packagesData);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not fetch subscription packages",
      });
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = (data) => {
    const total = data
      .filter((pkg) => pkg.status === "Active")
      .reduce((sum, item) => sum + (item.price || 0), 0);
    setTotalAmount(total);
  };

  const calculateTotalAllAmount = (data) => {
    const total = data.reduce((sum, item) => sum + (item.price || 0), 0);
    setTotalAllAmount(total);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Handle Modal
  const showModal = (record = null) => {
    setEditingPackage(record);
    if (record) {
      form.setFieldsValue({
        ...record,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingPackage(null);
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      let response;

      if (editingPackage) {
        response = await subscriptionService.updatePackage(
          editingPackage.id,
          values
        );
      } else {
        const newPackageData = {
          ...values,
          status: "Active",
        };
        response = await subscriptionService.createPackage(newPackageData);
      }

      if (response && response.success) {
        notification.success({
          message: editingPackage
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message,
        });
        handleCancel();
        fetchPackages();
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "An error occurred while saving the package",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle patch status
  const handlePatchStatus = async (id) => {
    try {
      Modal.confirm({
        title: "Are you sure you want to change this package's status?",
        content: "This action will toggle the package status",
        okText: "Yes",
        okType: "primary",
        cancelText: "No",
        onOk: async () => {
          const response = await subscriptionService.patchStatus(id);
          if (response.success) {
            notification.success({
              message: "Status Changed Successfully",
              description: response.message,
            });
            fetchPackages();
          }
        },
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    }
  };

  // Sửa lại hàm format tiền VND
  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "packageName",
      key: "packageName",
      filterable: true,
      width: "20%",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => formatVND(price),
      width: "15%",
    },
    {
      title: "Duration (Days)",
      dataIndex: "duration",
      key: "duration",
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
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Button
            type="text"
            icon={<StopOutlined />}
            onClick={() => handlePatchStatus(record.id)}
          />
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
          <div>
            <Title level={3} className="!mb-1">
              Subscription Package Management
            </Title>
            <Text type="secondary">
              Manage subscription packages for your platform
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
            style={{
              backgroundColor: "#FF009F",
            }}
          >
            Add Package
          </Button>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12}>
            <Card>
              <Statistic
                title="Total Active Package Price"
                value={formatVND(totalAmount)}
                prefix={<DollarOutlined />}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card>
              <Statistic
                title="Total All Packages Price"
                value={formatVND(totalAllAmount)}
                prefix={<DollarOutlined />}
                precision={0}
              />
            </Card>
          </Col>
        </Row>

        <div className="mb-4">
          <Input
            placeholder="Search packages..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Table
          columns={columns}
          dataSource={
            Array.isArray(packages)
              ? packages.filter((pkg) =>
                  pkg.packageName
                    ?.toLowerCase()
                    .includes(searchText.toLowerCase())
                )
              : []
          }
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title={editingPackage ? "Edit Package" : "Add New Package"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={editingPackage || {}}
        >
          <Form.Item
            name="packageName"
            label="Package Name"
            rules={[{ required: true, message: "Please enter package name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price (VND)"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber
              min={0}
              step={1000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration (Days)"
            rules={[{ required: true, message: "Please enter duration" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
              style={{
                backgroundColor: "#FF009F",
              }}
            >
              {editingPackage ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;
