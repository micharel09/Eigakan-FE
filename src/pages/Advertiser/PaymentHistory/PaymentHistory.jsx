import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Alert,
  Typography,
  Button,
  Badge,
  Empty,
  Tooltip,
  Statistic,
  Row,
  Col,
} from "antd";
import { Helmet } from "react-helmet";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PaymentHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchTransactions = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current page data
      const response =
        await adPurchaseService.getMyHistoryAdPurchaseTransaction(
          page,
          pageSize
        );

      // Fetch all data for accurate total calculation
      const allResponse =
        await adPurchaseService.getAllMyHistoryAdPurchaseTransaction();

      if (response.success) {
        console.log("Transaction data:", response);
        console.log("All transaction data:", allResponse);

        setTransactions(response.data || []);
        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: allResponse.total || 0,
        });

        // Calculate total amount from ALL successful transactions
        const allSuccessfulTransactions = allResponse.data.filter(
          (item) => item.status === "SUCCESS"
        );
        const total = allSuccessfulTransactions.reduce(
          (sum, item) => sum + (item.totalPrice || 0),
          0
        );
        setTotalAmount(total);
      } else {
        setError(response.message || "Failed to load transaction data");
      }
    } catch (err) {
      console.error("Error fetching transaction data:", err);
      setError(err.message || "Failed to load transaction data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (pagination) => {
    fetchTransactions(pagination.current, pagination.pageSize);
  };

  const handleRefresh = () => {
    fetchTransactions(pagination.current, pagination.pageSize);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircleOutlined />;
      case "PENDING":
        return <ClockCircleOutlined />;
      case "CANCELED":
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("MMM D, YYYY HH:mm");
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-xs font-mono">
            {text.substring(0, 8)}...{text.substring(text.length - 4)}
          </span>
        </Tooltip>
      ),
      width: "15%",
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => (
        <span className="font-medium">{formatVND(price)}</span>
      ),
      width: "15%",
      sorter: (a, b) => a.totalPrice - b.totalPrice,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => <Tag color="blue">{method}</Tag>,
      width: "15%",
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
        { text: "Success", value: "SUCCESS" },
        { text: "Pending", value: "PENDING" },
        { text: "Canceled", value: "CANCELED" },
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
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div className="payment-history-page p-6">
      <Helmet>
        <title>Payment History | EIGAKAN</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">
          <FileTextOutlined className="mr-2" /> Payment History
        </Title>
        <Button
          onClick={handleRefresh}
          icon={<ReloadOutlined />}
          loading={loading}
          className="bg-white hover:bg-gray-50"
        >
          Refresh
        </Button>
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

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Successful Payments"
              value={totalAmount}
              precision={0}
              formatter={(value) => formatVND(value)}
              prefix={<DollarOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Text className="text-lg font-medium">Your Payment Transactions</Text>
          <Badge
            status={loading ? "processing" : "success"}
            text={loading ? "Loading..." : "Updated"}
          />
        </div>

        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            pageSize: 5,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No transactions found"
              />
            ),
          }}
          className="payment-history-table"
        />
      </Card>
    </div>
  );
};

export default PaymentHistory;
