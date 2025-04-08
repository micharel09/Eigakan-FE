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
  DatePicker,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import viewPaymentPolicyService from "../../../apis/ViewPaymentPolicy/viewPaymentPolicy";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PaymentPolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [pendingPolicies, setPendingPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
  });

  // Fetch all policies
  const fetchPolicies = async (page = 1) => {
    try {
      setLoading(true);
      const response = await viewPaymentPolicyService.getAllViewPaymentPolicies(
        page
      );
      setPolicies(response.policies || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.total || 0,
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Unable to load payment policies",
      });
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active policy
  const fetchActivePolicy = async () => {
    try {
      const response =
        await viewPaymentPolicyService.getViewPaymentPolicyActive();
      if (response.success && response.data) {
        setActivePolicy(response.data);
      }
    } catch (error) {
      console.error("Error fetching active policy:", error);
    }
  };

  // Fetch pending policies
  const fetchPendingPolicies = async () => {
    try {
      const response =
        await viewPaymentPolicyService.getListPolicyPendingAndWaiting();
      if (response.success && response.data) {
        setPendingPolicies(response.data);
      }
    } catch (error) {
      console.error("Error fetching pending policies:", error);
    }
  };

  useEffect(() => {
    fetchPolicies(1);
    fetchActivePolicy();
    fetchPendingPolicies();
  }, []);

  // Handle Modal
  const showModal = (record = null) => {
    setEditingPolicy(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        effectiveDate: dayjs(record.effectiveDate),
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingPolicy(null);
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formattedValues = {
        effectiveDate: values.effectiveDate.format("YYYY-MM-DD"),
        pricePerView: values.pricePerView,
        webSharePercentage: values.webSharePercentage,
      };

      let response;
      if (editingPolicy) {
        response = await viewPaymentPolicyService.updateViewPaymentPolicy(
          editingPolicy.id,
          formattedValues
        );
      } else {
        response = await viewPaymentPolicyService.createViewPaymentPolicy(
          formattedValues
        );
      }

      if (response.success) {
        notification.success({
          message: editingPolicy
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message || "Payment policy has been saved",
        });
        handleCancel();
        fetchPolicies();
        fetchActivePolicy();
        fetchPendingPolicies();
      } else {
        throw new Error(response.message || "Failed to save payment policy");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "Error occurred while saving payment policy",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel policy
  const handleCancelPolicy = async (id) => {
    try {
      Modal.confirm({
        title: "Are you sure you want to cancel this policy?",
        content: "This action cannot be undone",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk: async () => {
          const response = await viewPaymentPolicyService.cancelPolicy();
          if (response.success) {
            notification.success({
              message: "Cancelled Successfully",
              description:
                response.message || "Payment policy has been cancelled",
            });
            fetchPolicies();
            fetchActivePolicy();
            fetchPendingPolicies();
          } else {
            throw new Error(
              response.message || "Failed to cancel payment policy"
            );
          }
        },
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Error occurred while cancelling policy",
      });
    }
  };

  // Format currency
  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: "15%",
      ellipsis: true,
    },
    {
      title: "Effective Date",
      dataIndex: "effectiveDate",
      key: "effectiveDate",
      width: "15%",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Price Per View",
      dataIndex: "pricePerView",
      key: "pricePerView",
      width: "15%",
      render: (price) => formatVND(price),
    },
    {
      title: "Web Share Percentage",
      dataIndex: "webSharePercentage",
      key: "webSharePercentage",
      width: "15%",
      render: (percentage) => `${percentage}%`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status) => {
        let color = "";
        let text = "";
        switch (status) {
          case "ACTIVE":
            color = "green";
            text = "Active";
            break;
          case "PENDING":
            color = "gold";
            text = "Pending";
            break;
          case "WAITING-FOR-INACTIVE":
            color = "blue";
            text = "Waiting For Inactive";
            break;
          case "INACTIVE":
            color = "red";
            text = "Inactive";
            break;
          default:
            color = "default";
            text = status;
        }
        return (
          <Tag color={color} className="px-3 py-1 text-xs">
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: "10%",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            disabled={
              record.status === "ACTIVE" ||
              record.status === "WAITING-FOR-INACTIVE"
            }
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleCancelPolicy(record.id)}
            disabled={
              record.status === "ACTIVE" ||
              record.status === "WAITING-FOR-INACTIVE"
            }
          />
        </Space>
      ),
    },
  ];

  // Handle table change
  const handleTableChange = (newPagination) => {
    fetchPolicies(newPagination.current);
  };

  // Active Policy Card
  const ActivePolicyCard = () => {
    if (!activePolicy) {
      return (
        <Card className="mb-4">
          <div className="flex items-center justify-center p-4">
            <Text type="secondary">No active policy found</Text>
          </div>
        </Card>
      );
    }

    return (
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <Title level={4} className="!mb-1">
              Active Policy
            </Title>
            <Text type="secondary">Currently active payment policy</Text>
          </div>
          <Tag color="green" className="px-3 py-1 text-sm">
            ACTIVE
          </Tag>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Text strong>Effective Date:</Text>
            <div>{dayjs(activePolicy.effectiveDate).format("DD/MM/YYYY")}</div>
          </div>
          <div>
            <Text strong>Price Per View:</Text>
            <div>{formatVND(activePolicy.pricePerView)}</div>
          </div>
          <div>
            <Text strong>Web Share Percentage:</Text>
            <div>{activePolicy.webSharePercentage}%</div>
          </div>
        </div>
      </Card>
    );
  };

  // Pending Policies Card
  const PendingPoliciesCard = () => {
    if (!pendingPolicies || pendingPolicies.length === 0) {
      return (
        <Card className="mb-4">
          <div className="flex items-center justify-center p-4">
            <Text type="secondary">No pending or waiting policies found</Text>
          </div>
        </Card>
      );
    }

    return (
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={4} className="!mb-1">
              Pending & Waiting Policies
            </Title>
            <Text type="secondary">
              Policies that are pending or waiting to be inactive
            </Text>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={pendingPolicies}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div className="p-6">
      <Helmet>
        <title>Payment Policy Management</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Payment Policy Management
            </Title>
            <Text type="secondary">Manage payment policies for users</Text>
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
            Add Policy
          </Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search policies..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Tabs defaultActiveKey="1">
          <TabPane tab="Overview" key="1">
            <ActivePolicyCard />
            <PendingPoliciesCard />
          </TabPane>
          <TabPane tab="All Policies" key="2">
            <Table
              columns={columns}
              dataSource={policies}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                pageSize: 5,
              }}
              onChange={handleTableChange}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingPolicy ? "Edit Policy" : "Add New Policy"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={editingPolicy || {}}
        >
          <Form.Item
            name="effectiveDate"
            label="Effective Date"
            rules={[
              { required: true, message: "Please select effective date" },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Select effective date"
              disabledDate={(current) => {
                // Allow only dates 1, 8, 15, 22 of each month
                const day = current.date();
                return day !== 1 && day !== 8 && day !== 15 && day !== 22;
              }}
            />
          </Form.Item>

          <Form.Item
            name="pricePerView"
            label="Price Per View (VND)"
            rules={[{ required: true, message: "Please enter price per view" }]}
          >
            <InputNumber
              min={0}
              step={0.1}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="webSharePercentage"
            label="Web Share Percentage (%)"
            rules={[
              { required: true, message: "Please enter web share percentage" },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              step={1}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace("%", "")}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
              style={{
                backgroundColor: "#FF009F",
              }}
            >
              {editingPolicy ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentPolicyManagement;
