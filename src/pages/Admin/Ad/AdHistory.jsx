import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  notification,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
} from "antd";
import { SearchOutlined, DollarOutlined } from "@ant-design/icons";
import adPurchaseTransactionService from "../../../apis/Ad/adPurchaseTransaction";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdHistory = () => {
  const [adTransactions, setAdTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchAdTransactions = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true);
      // Get all transactions data for complete pagination
      const allResponse =
        await adPurchaseTransactionService.getAllAdPurchaseTransactions();

      // Get current page data
      const response =
        await adPurchaseTransactionService.getAdPurchaseTransactions(
          page,
          pageSize
        );

      if (response.success) {
        const formattedData = response.data.map((item) => ({
          ...item,
          key: item.id,
        }));

        setAdTransactions(formattedData);
        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: allResponse.data.length || 0,
        });

        // Calculate total amount
        calculateTotalAmount(allResponse.data);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "Could not load advertisement transaction data",
      });
      setAdTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = (data) => {
    const total = data.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalAmount(total);
  };

  useEffect(() => {
    fetchAdTransactions(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (pagination) => {
    fetchAdTransactions(pagination.current, pagination.pageSize);
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      SUCCESS: "success",
      PENDING: "warning",
      CANCELED: "error",
      EXPIRED: "default",
    };
    return statusMap[status] || "default";
  };

  const filteredData = adTransactions.filter((item) => {
    const matchesSearch = searchText
      ? item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.paymentMethod?.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.paymentReferenceID &&
          item.paymentReferenceID
            .toLowerCase()
            .includes(searchText.toLowerCase()))
      : true;

    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    const matchesDate = dateRange
      ? dayjs(item.createAt).isAfter(dateRange[0]) &&
        dayjs(item.createAt).isBefore(dateRange[1])
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
      width: "15%",
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      width: "15%",
    },
    {
      title: "Total Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => formatVND(price),
      width: "15%",
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: "15%",
    },
    {
      title: "Reference ID",
      dataIndex: "paymentReferenceID",
      key: "paymentReferenceID",
      render: (id) => id || "N/A",
      width: "15%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
      width: "10%",
    },
    {
      title: "Slots",
      key: "slots",
      render: (_, record) => <span>{record.adPurchaseSlots?.length || 0}</span>,
      width: "10%",
    },
  ];

  return (
    <div className="p-6">
      <Helmet>
        <title>Advertisement Transaction History</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Advertisement Transaction History
            </Title>
            <Text type="secondary">
              Manage advertisement transactions across the platform
            </Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={24}>
            <Card>
              <Statistic
                title="Total Amount"
                value={loading ? "-" : formatVND(totalAmount)}
                prefix={<DollarOutlined />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search by ID, payment method..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder="Filter by status"
              style={{ width: "100%" }}
              onChange={(value) => setStatusFilter(value)}
              allowClear
            >
              <Option value="SUCCESS">SUCCESS</Option>
              <Option value="PENDING">PENDING</Option>
              <Option value="CANCELED">CANCELED</Option>
              <Option value="EXPIRED">EXPIRED</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: "100%" }}
              onChange={(dates) => setDateRange(dates)}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default AdHistory;
