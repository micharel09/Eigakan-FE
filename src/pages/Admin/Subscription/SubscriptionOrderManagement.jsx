"use client"

import { useState, useEffect } from "react"
import { Table, Input, Row, Col, Card, notification, Spin, Typography, Badge, Statistic } from "antd"
import { SearchOutlined, DollarOutlined, UserOutlined, CheckCircleOutlined, CalendarOutlined } from "@ant-design/icons"
import axios from "axios"
import { Helmet } from "react-helmet"

const { Title, Text } = Typography

const SubscriptionOrderManagement = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 })
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalActiveAmount, setTotalActiveAmount] = useState(0)
  const [totalSubscription, setTotalSubscription] = useState(0)

  const fetchOrders = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response?.data?.success) {
        const orderData = response?.data?.data?.subscriptionPurchase ?? []
        const total = response?.data?.data?.total ?? 0

        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: total,
        }))
        setTotalAmount(response?.data?.data?.totalEarnings ?? 0)
        setTotalActiveAmount(response?.data?.data?.activeSubscriptionCount ?? 0)
        setTotalSubscription(response?.data?.data?.total ?? 0)

        setData(orderData)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      notification.error({
        message: "Error",
        description: error.message || "Could not fetch orders",
        placement: "topRight",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize)
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filteredResults = data.filter(
        (order) =>
          order.id?.toString().includes(searchTerm) ||
          order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.subscriptionId?.toString().includes(searchTerm),
      )
      setData(filteredResults)
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filteredResults.length,
      }))
    } else {
      fetchOrders(pagination.current, pagination.pageSize)
    }
  }, [searchTerm])

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "paymentReferenceID",
      width: "10%",
      render: (id) => <Text className="font-medium">{id}</Text>,
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      width: "20%",
      render: (fullName, record) => (
        <a href={`/user/${record.userId}`} className="text-blue-400">
          {fullName}
        </a>
      ),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: "15%",
      render: (method) => <Badge color={method === "Credit Card" ? "blue" : "purple"} text={method} />,
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      width: "15%",
      render: (date) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-1 text-gray-500" />
          <span>{new Date(date).toLocaleDateString("en-US")}</span>
        </div>
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiredDate",
      key: "expiredDate",
      width: "15%",
      render: (date) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-1 text-gray-500" />
          <span>{new Date(date).toLocaleDateString("en-US")}</span>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: "10%",
      render: (price) => <Text className="font-medium text-green-600">{formatVND(price)}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "10%",
      render: (status) => (
        <Badge
          status={status === "Active" ? "success" : "error"}
          text={
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === "Active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {status}
            </span>
          }
        />
      ),
    },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Helmet>
        <title>Subscription Orders Management</title>
      </Helmet>

      <div className="mb-6">
        <Title level={2} className="mb-1">
          Subscription Orders
        </Title>
        <Text type="secondary">Manage and monitor all subscription purchases</Text>
      </div>

      <div className="mb-8">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300" bordered={false}>
              <Statistic
                title={<span className="text-gray-600 font-medium">Total Subscriptions</span>}
                value={loading ? "-" : totalSubscription}
                prefix={<UserOutlined className="text-blue-500 mr-2" />}
                precision={0}
                loading={loading}
                className="flex flex-col items-center"
              />
              <div className="mt-2 text-center text-xs text-gray-500">All-time subscription count</div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300" bordered={false}>
              <Statistic
                title={<span className="text-gray-600 font-medium">Active Subscriptions</span>}
                value={loading ? "-" : totalActiveAmount}
                prefix={<CheckCircleOutlined className="text-green-500 mr-2" />}
                precision={0}
                loading={loading}
                className="flex flex-col items-center"
              />
              <div className="mt-2 text-center text-xs text-gray-500">Currently active subscriptions</div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300" bordered={false}>
              <Statistic
                title={<span className="text-gray-600 font-medium">Total Earnings</span>}
                value={loading ? "-" : totalAmount}
                formatter={(value) => formatVND(value)}
                prefix={<DollarOutlined className="text-green-600 mr-2" />}
                precision={0}
                loading={loading}
                className="flex flex-col items-center"
              />
              <div className="mt-2 text-center text-xs text-gray-500">All-time subscription revenue</div>
            </Card>
          </Col>
        </Row>
      </div>

      <Card
        className="shadow-sm"
        bordered={false}
        title={
          <div className="flex justify-between items-center">
            <span>Subscription Orders</span>
            <Input
              placeholder="Search by ID, name, email..."
              prefix={<SearchOutlined className="text-gray-400" />}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              size="middle"
              allowClear
            />
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => fetchOrders(page, pagination.pageSize),
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Total ${total} items`,
          }}
          loading={{
            spinning: loading,
            indicator: <Spin size="large" />,
          }}
          rowKey="id"
          className="mt-4"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  )
}

export default SubscriptionOrderManagement