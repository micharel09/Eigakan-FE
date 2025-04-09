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
  Spin,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";
import viewPaymentPolicyService from "../../../apis/ViewPaymentPolicy/viewPaymentPolicy";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PaymentPolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);
  const [displayedPolicies, setDisplayedPolicies] = useState([]);
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

  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [activePolicyLoading, setActivePolicyLoading] = useState(false);
  const [pendingPoliciesLoading, setPendingPoliciesLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [allPoliciesLoading, setAllPoliciesLoading] = useState(false);

  // Fetch all policies
  const fetchPolicies = async (page = 1) => {
    try {
      setPoliciesLoading(true);
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
      setPoliciesLoading(false);
    }
  };

  const fetchAllPoliciesForSearch = async () => {
    try {
      setAllPoliciesLoading(true);
      const response = await viewPaymentPolicyService.getAllViewPaymentPolicies(
        1,
        1000
      );
      setAllPolicies(response.policies || []);
      setDisplayedPolicies(response.policies || []);
    } catch (error) {
      console.error("Error fetching all policies for search:", error);
      setAllPolicies([]);
      setDisplayedPolicies([]);
    } finally {
      setAllPoliciesLoading(false);
    }
  };

  // Fetch active policy
  const fetchActivePolicy = async () => {
    try {
      setActivePolicyLoading(true);
      const response =
        await viewPaymentPolicyService.getViewPaymentPolicyActive();
      if (response.success && response.data) {
        setActivePolicy(response.data);
      }
    } catch (error) {
      console.error("Error fetching active policy:", error);
    } finally {
      setActivePolicyLoading(false);
    }
  };

  // Fetch pending policies
  const fetchPendingPolicies = async () => {
    try {
      setPendingPoliciesLoading(true);
      const response =
        await viewPaymentPolicyService.getListPolicyPendingAndWaiting();
      if (response.success && response.data) {
        setPendingPolicies(response.data);
      }
    } catch (error) {
      console.error("Error fetching pending policies:", error);
    } finally {
      setPendingPoliciesLoading(false);
    }
  };

  useEffect(() => {
    // Set loading to true at component mount
    setLoading(true);

    // Create promises for all data fetching operations
    const fetchPromises = [
      fetchPolicies(1),
      fetchActivePolicy(),
      fetchPendingPolicies(),
      fetchAllPoliciesForSearch(),
    ];

    // Wait for all fetches to complete
    Promise.all(fetchPromises).finally(() => {
      setLoading(false);
    });
  }, []);

  // Handle search functionality for all policies
  useEffect(() => {
    if (searchText.trim() === "") {
      setDisplayedPolicies(allPolicies);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = allPolicies.filter((policy) => {
      return (
        policy.id.toLowerCase().includes(searchLower) ||
        dayjs(policy.effectiveDate)
          .format("DD/MM/YYYY")
          .includes(searchLower) ||
        policy.pricePerView.toString().includes(searchLower) ||
        policy.webSharePercentage.toString().includes(searchLower) ||
        (policy.status && policy.status.toLowerCase().includes(searchLower))
      );
    });
    setDisplayedPolicies(filtered);
  }, [searchText, allPolicies]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

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
      setSubmitLoading(true);
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
        fetchAllPoliciesForSearch(); // Refresh search data
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
      setSubmitLoading(false);
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
          setCancelLoading(true);
          setLoading(true);
          try {
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
              fetchAllPoliciesForSearch(); // Refresh search data
            } else {
              throw new Error(
                response.message || "Failed to cancel payment policy"
              );
            }
          } catch (error) {
            notification.error({
              message: "Error",
              description:
                error.message || "Error occurred while cancelling policy",
            });
          } finally {
            setCancelLoading(false);
            setLoading(false);
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
  ];

  // Enhanced columns for the overview with better rendering
  const enhancedColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: "15%",
      ellipsis: true,
      render: (id) => (
        <span className="font-mono text-xs text-gray-600">{id}</span>
      ),
    },
    {
      title: "Effective Date",
      dataIndex: "effectiveDate",
      key: "effectiveDate",
      width: "15%",
      render: (date) => (
        <span className="font-medium">{dayjs(date).format("DD/MM/YYYY")}</span>
      ),
    },
    {
      title: "Price Per View",
      dataIndex: "pricePerView",
      key: "pricePerView",
      width: "15%",
      render: (price) => (
        <span className="font-medium">{formatVND(price)}</span>
      ),
    },
    {
      title: "Web Share Percentage",
      dataIndex: "webSharePercentage",
      key: "webSharePercentage",
      width: "15%",
      render: (percentage) => (
        <span className="font-medium">{percentage}%</span>
      ),
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
          <Tag
            color={color}
            className="px-3 py-1 text-xs font-medium uppercase"
          >
            {text}
          </Tag>
        );
      },
    },
  ];

  // Overview table columns with only delete action
  const overviewColumns = [
    ...enhancedColumns,
    {
      title: "Actions",
      key: "actions",
      width: "10%",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleCancelPolicy(record.id)}
            disabled={
              record.status === "ACTIVE" ||
              record.status === "WAITING-FOR-INACTIVE" ||
              loading ||
              cancelLoading
            }
            loading={loading || cancelLoading}
            className="flex items-center justify-center hover:bg-[#FF009F1A] transition-colors"
          />
        </Space>
      ),
    },
  ];

  // Active Policy Card
  const ActivePolicyCard = () => {
    if (loading || activePolicyLoading) {
      return (
        <Card className="mb-6 shadow-sm rounded-lg border border-gray-100">
          <div className="flex items-center justify-center p-8">
            <Spin size="large" />
          </div>
        </Card>
      );
    }

    if (!activePolicy) {
      return (
        <Card className="mb-6 shadow-sm rounded-lg border border-gray-100">
          <div className="flex items-center justify-center p-8 py-12">
            <div className="text-center">
              <InfoCircleOutlined className="text-gray-300 text-4xl mb-2" />
              <Text type="secondary" className="block text-base">
                No active policy found
              </Text>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                className="mt-4 bg-[#FF009F] hover:bg-[#D1007F] border-none"
                style={{ backgroundColor: "#FF009F" }}
              >
                Add Policy
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card
        className="mb-6 shadow-sm rounded-lg border-l-4 border-green-500 border-t-gray-100 border-r-gray-100 border-b-gray-100"
        title={
          <div className="flex justify-between items-center">
            <div>
              <Title level={4} className="!mb-0 flex items-center">
                <span className="mr-2">Active Policy</span>
                <Tag
                  color="green"
                  className="px-3 py-1 text-xs uppercase font-medium"
                >
                  Active
                </Tag>
              </Title>
              <Text type="secondary" className="text-sm">
                Currently active payment policy
              </Text>
            </div>
            <div className="text-right">
              <Text strong className="block text-xl">
                {formatVND(activePolicy.pricePerView)}
              </Text>
              <Text type="secondary" className="text-xs">
                Price Per View
              </Text>
            </div>
          </div>
        }
        bodyStyle={{ padding: "24px" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text
              type="secondary"
              className="block text-xs uppercase mb-1 font-medium"
            >
              Effective Date
            </Text>
            <Text strong className="text-lg">
              {dayjs(activePolicy.effectiveDate).format("DD/MM/YYYY")}
            </Text>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text
              type="secondary"
              className="block text-xs uppercase mb-1 font-medium"
            >
              Price Per View
            </Text>
            <Text strong className="text-lg">
              {formatVND(activePolicy.pricePerView)}
            </Text>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text
              type="secondary"
              className="block text-xs uppercase mb-1 font-medium"
            >
              Web Share Percentage
            </Text>
            <Text strong className="text-lg">
              {activePolicy.webSharePercentage}%
            </Text>
          </div>
        </div>

        <div className="mt-6 text-right">
          <Text type="secondary" className="text-xs">
            Policy ID: <span className="font-mono">{activePolicy.id}</span>
          </Text>
        </div>
      </Card>
    );
  };

  // Pending Policies Card
  const PendingPoliciesCard = () => {
    if (loading || pendingPoliciesLoading) {
      return (
        <Card className="mb-6 shadow-sm rounded-lg border border-gray-100">
          <div className="flex items-center justify-center p-8">
            <Spin size="large" />
          </div>
        </Card>
      );
    }

    if (!pendingPolicies || pendingPolicies.length === 0) {
      return (
        <Card className="mb-6 shadow-sm rounded-lg border border-gray-100">
          <div className="flex items-center justify-center p-8 py-12">
            <div className="text-center">
              <InfoCircleOutlined className="text-gray-300 text-4xl mb-2" />
              <Text type="secondary" className="block text-base">
                No pending or waiting policies found
              </Text>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card
        className="mb-6 shadow-sm rounded-lg border-l-4 border-yellow-400 border-t-gray-100 border-r-gray-100 border-b-gray-100"
        title={
          <div>
            <Title level={4} className="!mb-0">
              Pending & Waiting Policies
            </Title>
            <Text type="secondary" className="text-sm">
              Policies that are pending or waiting to be inactive
            </Text>
          </div>
        }
        bodyStyle={{ padding: "16px" }}
      >
        <Table
          columns={overviewColumns}
          dataSource={pendingPolicies}
          rowKey="id"
          pagination={false}
          size="middle"
          loading={loading}
          className="border-separate border-spacing-0"
          rowClassName={(record) =>
            record.status === "PENDING"
              ? "bg-amber-50"
              : record.status === "WAITING-FOR-INACTIVE"
              ? "bg-blue-50"
              : ""
          }
        />
      </Card>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Helmet>
        <title>Payment Policy Management</title>
      </Helmet>

      <Card className="mb-4 shadow-sm rounded-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1 text-gray-800">
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
            loading={loading || submitLoading}
            disabled={loading || submitLoading}
          >
            Add Policy
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search policies..."
              prefix={<SearchOutlined className="text-gray-400" />}
              onChange={handleSearchChange}
              value={searchText}
              className="max-w-xs"
              onPressEnter={() => {
                // Trigger search on Enter key
                const searchLower = searchText.toLowerCase();
                const filtered = allPolicies.filter((policy) => {
                  return (
                    policy.id.toLowerCase().includes(searchLower) ||
                    dayjs(policy.effectiveDate)
                      .format("DD/MM/YYYY")
                      .includes(searchLower) ||
                    policy.pricePerView.toString().includes(searchLower) ||
                    policy.webSharePercentage
                      .toString()
                      .includes(searchLower) ||
                    (policy.status &&
                      policy.status.toLowerCase().includes(searchLower))
                  );
                });
                setDisplayedPolicies(filtered);
              }}
            />
            {searchText && (
              <Button
                icon={<CloseCircleFilled />}
                onClick={() => setSearchText("")}
                type="text"
                className="text-gray-500 hover:text-[#FF009F]"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <Tabs
          defaultActiveKey="1"
          className="custom-tabs"
          tabBarStyle={{ marginBottom: 24 }}
        >
          <TabPane tab="Overview" key="1">
            <ActivePolicyCard />
            <PendingPoliciesCard />
          </TabPane>
          <TabPane tab="All Policies" key="2">
            <div className="mb-4">
              {allPoliciesLoading ? (
                <div className="flex justify-center py-2">
                  <Spin size="small" />
                </div>
              ) : (
                <Text type="secondary">
                  {displayedPolicies.length} policies found
                  {searchText && ` for "${searchText}"`}
                </Text>
              )}
            </div>
            <Table
              columns={columns}
              dataSource={displayedPolicies}
              rowKey="id"
              loading={loading || allPoliciesLoading}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingPolicy ? "Edit Policy" : "Add New Policy"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        className="policy-form-modal"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={editingPolicy || {}}
          className="mt-4"
        >
          <Form.Item
            name="effectiveDate"
            label={<span className="font-medium">Effective Date</span>}
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
            label={<span className="font-medium">Price Per View (VND)</span>}
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
            label={
              <span className="font-medium">Web Share Percentage (%)</span>
            }
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

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || submitLoading}
              className="bg-[#FF009F] hover:bg-[#D1007F] border-none shadow-sm hover:shadow-md transition-all"
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
