import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Typography,
  Tag,
  Button,
  Divider,
  Table,
  Tooltip,
  Pagination,
  Empty,
  Badge,
  Modal,
  Form,
  InputNumber,
  notification,
} from "antd";
import { Helmet } from "react-helmet";
import {
  WalletOutlined,
  ReloadOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
  PlusCircleOutlined,
  BankOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import userWalletService from "../../../apis/UserWallet/userWallet";
import walletHistoryService from "../../../apis/UserWallet/walletHistory";
import dayjs from "dayjs";
import axios from "axios";

const { Title, Text } = Typography;

const UserWallet = () => {
  const [loading, setLoading] = useState({
    wallet: true,
    history: true,
    deposit: false,
  });
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  // States to control visibility of sensitive information
  const [showWalletId, setShowWalletId] = useState(false);
  const [showUserId, setShowUserId] = useState(false);

  // States for deposit functionality
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [depositForm] = Form.useForm();

  const fetchWalletData = async () => {
    try {
      setLoading((prev) => ({ ...prev, wallet: true }));
      setError(null);
      const data = await userWalletService.getUserWalletByLogin();
      setWalletData(data);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      setError(err.message || "Failed to load wallet data");
    } finally {
      setLoading((prev) => ({ ...prev, wallet: false }));
    }
  };

  // Fetch total number of transactions for pagination
  const fetchTotalTransactions = async () => {
    try {
      // Call API with large pageSize to get all data
      const response = await axios.get(
        "https://eigakan-001-site1.ktempurl.com/api/WalletTransaction/MyHistoryWallet?page=1&pageSize=1000&sortBy=createDate&sortDirection=desc",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data && response.data.success) {
        // Store all transactions in window object for potential use
        window.allTransactions = response.data.data || [];
        // Return total count for pagination
        return response.data.data?.length || 0;
      }
      return 0;
    } catch (err) {
      console.error("Error fetching total transactions:", err);
      return 0;
    }
  };

  const fetchTransactionHistory = async (page = 1, pageSize = 5) => {
    try {
      setLoading((prev) => ({ ...prev, history: true }));

      // First get total count and all transactions
      const totalItems = await fetchTotalTransactions();

      // Use the stored transactions to create paginated data
      if (window.allTransactions && window.allTransactions.length > 0) {
        // Calculate pagination indices for the current page
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(
          startIndex + pageSize,
          window.allTransactions.length
        );

        // Extract the slice of data for the current page
        const paginatedData = window.allTransactions.slice(
          startIndex,
          endIndex
        );

        setTransactionHistory(paginatedData);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: totalItems,
        });
      } else {
        // Fallback to direct API call if cached transactions are not available
        const response = await walletHistoryService.getWalletHistory(
          page,
          pageSize
        );

        if (response.success) {
          // Sort data by creation date in descending order (newest first)
          const sortedData = [...(response.data || [])].sort((a, b) => {
            return new Date(b.createDate) - new Date(a.createDate);
          });

          setTransactionHistory(sortedData);
          setPagination({
            current: page,
            pageSize: pageSize,
            total: totalItems, // Use the actual total count from previous API call
          });
        } else {
          console.error(
            "Failed to fetch transaction history:",
            response.message
          );
        }
      }
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      // Don't set the main error state to avoid blocking the wallet display
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchTransactionHistory(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (page, pageSize) => {
    fetchTransactionHistory(page, pageSize);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "success":
        return "success";
      case "inactive":
      case "failed":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case "DEPOSIT":
        return <ArrowUpOutlined className="text-green-500" />;
      case "WITHDRAWAL":
        return <ArrowDownOutlined className="text-red-500" />;
      case "AD_PURCHASE":
        return <ShoppingOutlined className="text-blue-500" />;
      default:
        return <CreditCardOutlined className="text-gray-500" />;
    }
  };

  const getTransactionStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircleOutlined className="text-green-500" />;
      case "FAILED":
        return <CloseCircleOutlined className="text-red-500" />;
      case "PENDING":
        return <ClockCircleOutlined className="text-yellow-500" />;
      default:
        return <ClockCircleOutlined className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  const formatAmount = (amount, type) => {
    const isNegative = type === "WITHDRAWAL" || type === "AD_PURCHASE";
    return (
      <span className={isNegative ? "text-red-500" : "text-green-500"}>
        {isNegative ? "-" : "+"}
        {amount.toLocaleString()}đ
      </span>
    );
  };

  const handleRefresh = () => {
    fetchWalletData();
    fetchTransactionHistory(pagination.current, pagination.pageSize);
  };

  // Functions to handle deposit modal
  const showDepositModal = () => {
    depositForm.resetFields();
    depositForm.setFieldsValue({ amount: 100000 });
    setIsDepositModalVisible(true);
  };

  const handleCancelDeposit = () => {
    setIsDepositModalVisible(false);
  };

  // Function to handle deposit form submission
  const handleDeposit = async (values) => {
    if (values.amount < 100000) {
      notification.error({
        message: "Invalid Amount",
        description: "Minimum deposit amount is 100,000đ",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, deposit: true }));
    try {
      const response = await walletHistoryService.depositMoney(values.amount);

      if (response.success) {
        // If successful, redirect to the payment gateway URL
        window.location.href = response.message;
        notification.success({
          message: "Deposit Initiated",
          description:
            "You will be redirected to the payment gateway to complete your deposit.",
        });
        setIsDepositModalVisible(false);
      } else {
        notification.error({
          message: "Deposit Failed",
          description: response.message || "Failed to initiate deposit",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "An error occurred while processing your deposit",
      });
      console.error("Deposit error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, deposit: false }));
    }
  };

  return (
    <div className="user-wallet-page p-6">
      <Helmet>
        <title>My Wallet | EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">
          <WalletOutlined className="mr-2" /> My Wallet
        </Title>
        <div className="flex gap-2">
          <Button
            type="primary"
            onClick={showDepositModal}
            icon={<PlusCircleOutlined />}
            loading={loading.deposit}
            className="bg-[#FF009F] hover:bg-[#d1007f] border-none"
          >
            Deposit Money
          </Button>
          <Button
            onClick={handleRefresh}
            icon={<ReloadOutlined />}
            loading={loading.wallet || loading.history}
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

      {loading.wallet ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : walletData ? (
        <div className="wallet-content">
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} md={12}>
              <Card
                hoverable
                className="shadow-sm h-full"
                title={
                  <div className="flex items-center">
                    <WalletOutlined className="mr-2 text-[#FF009F]" />
                    <span>Wallet Information</span>
                  </div>
                }
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <Text type="secondary">Wallet ID:</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          showWalletId ? (
                            <EyeOutlined />
                          ) : (
                            <EyeInvisibleOutlined />
                          )
                        }
                        onClick={() => setShowWalletId(!showWalletId)}
                        className="text-gray-500 hover:text-[#FF009F]"
                      />
                    </div>
                    <div className="font-mono bg-gray-50 p-2 rounded mt-1 text-sm break-all">
                      {showWalletId
                        ? walletData.id
                        : "••••••••••••••••••••••••••••••••"}
                    </div>
                  </div>

                  <div>
                    <Text type="secondary">Status:</Text>
                    <div className="mt-1">
                      <Tag
                        color={getStatusColor(walletData.status)}
                        className="text-sm px-3 py-1"
                      >
                        {walletData.status}
                      </Tag>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Text type="secondary">User ID:</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          showUserId ? (
                            <EyeOutlined />
                          ) : (
                            <EyeInvisibleOutlined />
                          )
                        }
                        onClick={() => setShowUserId(!showUserId)}
                        className="text-gray-500 hover:text-[#FF009F]"
                      />
                    </div>
                    <div className="font-mono bg-gray-50 p-2 rounded mt-1 text-sm break-all">
                      {showUserId
                        ? walletData.userId
                        : "••••••••••••••••••••••••••••••••"}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                hoverable
                className="shadow-sm h-full bg-gradient-to-br from-purple-50 to-pink-50"
              >
                <Statistic
                  title={<span className="text-lg">Current Balance</span>}
                  value={walletData.balance}
                  precision={0}
                  valueStyle={{ color: "#FF009F", fontSize: "2.5rem" }}
                  prefix={<DollarOutlined />}
                  suffix="đ"
                />

                <Divider />

                <div className="flex items-center mt-4">
                  <CheckCircleOutlined className="text-green-500 mr-2" />
                  <Text>
                    Your wallet is ready to use for purchasing ad slots
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Transaction History Section */}
          <div className="transaction-history mt-8">
            <Card
              title={
                <div className="flex items-center">
                  <CreditCardOutlined className="mr-2 text-[#FF009F]" />
                  <span>Transaction History</span>
                </div>
              }
              className="shadow-sm"
              extra={
                <div className="flex items-center">
                  <Badge
                    status={loading.history ? "processing" : "success"}
                    text={loading.history ? "Loading..." : "Updated"}
                    className="mr-2"
                  />
                </div>
              }
            >
              <Table
                dataSource={transactionHistory}
                rowKey="id"
                loading={loading.history}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  onChange: handleTableChange,
                  showSizeChanger: true,
                  pageSizeOptions: [5, 10, 20],
                  defaultPageSize: 5,
                  showTotal: (total) => `Total ${total} transactions`,
                }}
                className="transaction-table"
                columns={[
                  {
                    title: "Date",
                    dataIndex: "createDate",
                    key: "createDate",
                    render: (text) => formatDate(text),
                    sorter: (a, b) =>
                      new Date(a.createDate) - new Date(b.createDate),
                    width: "20%",
                  },
                  {
                    title: "Type",
                    dataIndex: "type",
                    key: "type",
                    render: (text) => (
                      <Tooltip title={text}>
                        <Tag
                          color={
                            text === "DEPOSIT"
                              ? "green"
                              : text === "AD_PURCHASE"
                              ? "blue"
                              : "volcano"
                          }
                          className="flex items-center w-fit"
                        >
                          {getTransactionTypeIcon(text)}
                          <span className="ml-1">{text.replace("_", " ")}</span>
                        </Tag>
                      </Tooltip>
                    ),
                    filters: [
                      { text: "Deposit", value: "DEPOSIT" },
                      { text: "Ad Purchase", value: "AD_PURCHASE" },
                      { text: "Withdrawal", value: "WITHDRAWAL" },
                    ],
                    onFilter: (value, record) => record.type === value,
                    width: "15%",
                  },
                  {
                    title: "Amount",
                    dataIndex: "amount",
                    key: "amount",
                    render: (text, record) => formatAmount(text, record.type),
                    sorter: (a, b) => a.amount - b.amount,
                    width: "15%",
                  },
                  {
                    title: "Payment Method",
                    dataIndex: "paymentMethod",
                    key: "paymentMethod",
                    render: (text) => <Tag>{text}</Tag>,
                    width: "15%",
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    render: (text) => (
                      <Tag
                        color={getStatusColor(text)}
                        className="flex items-center w-fit"
                      >
                        {getTransactionStatusIcon(text)}
                        <span className="ml-1">{text}</span>
                      </Tag>
                    ),
                    filters: [
                      { text: "Success", value: "SUCCESS" },
                      { text: "Failed", value: "FAILED" },
                      { text: "Pending", value: "PENDING" },
                    ],
                    onFilter: (value, record) => record.status === value,
                    width: "15%",
                  },
                  {
                    title: "Reference ID",
                    dataIndex: "paymentReferenceId",
                    key: "paymentReferenceId",
                    render: (text) => (
                      <Tooltip title={text}>
                        <span className="font-mono text-xs">
                          {text.length > 10
                            ? `${text.substring(0, 10)}...`
                            : text}
                        </span>
                      </Tooltip>
                    ),
                    width: "20%",
                  },
                ]}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No transaction history found"
                    />
                  ),
                }}
              />
            </Card>
          </div>
        </div>
      ) : (
        <Alert
          message="No Wallet Found"
          description="You don't have a wallet yet. Please contact support for assistance."
          type="info"
          showIcon
          className="mb-6"
        />
      )}

      {/* Deposit Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <BankOutlined className="mr-2 text-[#FF009F]" />
            <span>Deposit Money</span>
          </div>
        }
        open={isDepositModalVisible}
        onCancel={handleCancelDeposit}
        footer={null}
      >
        <Form
          form={depositForm}
          layout="vertical"
          onFinish={handleDeposit}
          initialValues={{ amount: 100000 }}
        >
          <div className="mb-4">
            <Alert
              message="Minimum Deposit"
              description="The minimum deposit amount is 100,000đ"
              type="info"
              showIcon
            />
          </div>

          <Form.Item
            name="amount"
            label="Deposit Amount (đ)"
            rules={[
              { required: true, message: "Please enter deposit amount" },
              {
                type: "number",
                min: 100000,
                message: "Minimum deposit amount is 100,000đ",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              min={100000}
              step={10000}
              placeholder="Enter amount"
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancelDeposit}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.deposit}
              icon={<BankOutlined />}
              className="bg-[#FF009F] hover:bg-[#d1007f] border-none"
            >
              Proceed to Payment
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserWallet;
