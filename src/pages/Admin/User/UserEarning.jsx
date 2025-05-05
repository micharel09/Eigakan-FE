"use client"

import { useState, useEffect } from "react"
import { Table, Card, Typography, notification, Input, DatePicker, Row, Col, Statistic, Tag } from "antd"
import { SearchOutlined, DollarOutlined, EyeOutlined } from "@ant-design/icons"
import userEarningService from "../../../apis/UserEarning/userEarning"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const UserEarning = () => {
  const [userEarnings, setUserEarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [dateRange, setDateRange] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [finalEarnings, setFinalEarnings] = useState(0)
  const [webEarnings, setWebEarnings] = useState(0)

  const fetchUserEarnings = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true)
      const response = await userEarningService.getUserEarnings(page, pageSize)

      if (response) {
        const formattedData = response.data.userEarnings.map((item) => ({
          ...item,
          key: item.id,
        }))

        setUserEarnings(formattedData)
        setPagination({
          ...pagination,
          current: page,
          pageSize: pageSize,
          total: response.data.totalItems || 0,
        })

        setTotalEarnings(response.data.totalEarnings || 0)
        setFinalEarnings(response.data.finalEarning || 0)
        setWebEarnings(response.data.webEarnings || 0)
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not load user earnings data",
      })
      setUserEarnings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserEarnings(pagination.current, pagination.pageSize)
  }, [])

  const handleTableChange = (pagination) => {
    fetchUserEarnings(pagination.current, pagination.pageSize)
  }

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const filteredData = userEarnings.filter((item) => {
    const matchesSearch = searchText ? item.userName?.toLowerCase().includes(searchText.toLowerCase()) : true

    const matchesDate = dateRange
      ? (dayjs(item.startWeek).isAfter(dateRange[0]) || dayjs(item.startWeek).isSame(dateRange[0], "day")) &&
        (dayjs(item.endWeek).isBefore(dateRange[1]) || dayjs(item.endWeek).isSame(dateRange[1], "day"))
      : true

    return matchesSearch && matchesDate
  })

  const columns = [
    {
      title: "UserName",
      dataIndex: "userName",
      key: "userName",
      ellipsis: true,
      width: "15%",
      render: (fullName, record) => (
        <a href={`/user/${record.id}`} className="text-blue-400">
          {fullName}
        </a>
      ),
    },
    {
      title: "Start Week",
      dataIndex: "startWeek",
      key: "startWeek",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      width: "10%",
    },
    {
      title: "End Week",
      dataIndex: "endWeek",
      key: "endWeek",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      width: "10%",
    },
    {
      title: "Total View",
      dataIndex: "totalView",
      key: "totalView",
      width: "10%",
    },
    {
      title: "Total Earnings",
      dataIndex: "totalEarnings",
      key: "totalEarnings",
      render: (earnings) => formatVND(earnings),
      width: "10%",
    },
    {
      title: "Web Earnings",
      dataIndex: "webEarnings",
      key: "webEarnings",
      render: (earnings) => formatVND(earnings),
      width: "10%",
    },
    {
      title: "Final Earnings",
      dataIndex: "finalEarnings",
      key: "finalEarnings",
      render: (earnings) => formatVND(earnings),
      width: "10%",
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => (status ? <Tag color="success">Paid</Tag> : <Tag color="warning">Unpaid</Tag>),
      width: "10%",
    },
  ]

  return (
    <div className="p-6">
      <Helmet>
        <title>User Earnings</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              User Earnings
            </Title>
            <Text type="secondary">Manage user earnings across the platform</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={8}>
            <Card className="border-l-4 border-l-purple-500">
              <Statistic
                title="Total Earnings"
                value={loading ? "-" : formatVND(totalEarnings)}
                prefix={<EyeOutlined className="text-purple-500" />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="border-l-4 border-l-red-500">
              <Statistic
                title="Website Earnings"
                value={loading ? "-" : formatVND(webEarnings)}
                prefix={<DollarOutlined className="text-red-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Final Earnings"
                value={loading ? "-" : formatVND(finalEarnings)}
                prefix={<DollarOutlined className="text-green-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12}>
            <Input
              placeholder="Search by user name..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={12}>
            <RangePicker style={{ width: "100%" }} onChange={(dates) => setDateRange(dates)} format="DD/MM/YYYY" />
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
          expandable={{
            expandedRowRender: (record) => (
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-inner">
                <div className="flex items-center mb-4">
                  <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                  <Typography.Title level={5} className="m-0 text-blue-700">
                    Movie Earnings
                  </Typography.Title>
                </div>

                {record.movieEarnings?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {record.movieEarnings.map((movie) => (
                      <Card
                        key={movie.id}
                        className="border border-blue-200 hover:shadow-md transition-shadow duration-300"
                        size="small"
                        hoverable
                      >
                        <div className="flex items-start">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <EyeOutlined className="text-blue-500 text-lg" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-blue-800 mb-1 truncate">
                              {movie.movieName || "Movie Title"}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div>
                                <span className="text-gray-500">Period:</span>{" "}
                                <span className="font-medium">
                                  {dayjs(movie.startWeek).format("DD/MM")} - {dayjs(movie.endWeek).format("DD/MM/YYYY")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Views:</span>{" "}
                                <span className="font-medium">{movie.totalView?.toLocaleString() || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Earnings:</span>{" "}
                                <span className="font-medium text-green-600">{formatVND(movie.totalEarnings || 0)}</span>
                              </div>                    
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">No movie earnings data available</div>
                )}
              </div>
            ),
            rowExpandable: (record) => record.movieEarnings?.length > 0,
            expandRowByClick: true,
          }}
        />
      </Card>
    </div>
  )
}

export default UserEarning
