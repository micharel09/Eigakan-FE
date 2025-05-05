"use client"

import { useState, useEffect } from "react"
import { Table, Card, Typography, notification, Input, DatePicker, Row, Col, Statistic, Tag, Select } from "antd"
import { SearchOutlined, EyeOutlined, DollarOutlined } from "@ant-design/icons"
import userEarningService from "../../../apis/UserEarning/userEarning"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const PublisherEarning = () => {
  const [userEarnings, setUserEarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [year, setYear] = useState(0)
  const [month, setMonth] = useState(0)
  const [day, setDay] = useState(0)
  const [dayOfWeek, setDayOfWeek] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [finalEarnings, setFinalEarnings] = useState(0)
  const [webEarnings, setWebEarnings] = useState(0)
  const [totalViews, setTotalViews] = useState(0)

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const daysOfWeek = [
    { value: 0, label: "All" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 7, label: "Sunday" },
  ]

  const fetchUserEarnings = async () => {
    try {
      setLoading(true)
      const response = await userEarningService.getUserEarningByLogin(year, month, day, dayOfWeek)

      if (response && response.data) {
        const formattedData = response.data.userEarnings.map((item) => ({
          ...item,
          key: item.id,
        }))

        setUserEarnings(formattedData)
        setTotalEarnings(response.data.totalEarnings || 0)
        setFinalEarnings(response.data.finalEarnings || 0)

        // Calculate total webEarnings from userEarnings array since API doesn't return it directly
        const totalWebEarnings = formattedData.reduce((sum, item) => sum + (item.webEarnings || 0), 0)
        setWebEarnings(totalWebEarnings)

        // Calculate total views from userEarnings
        const totalViewsCount = formattedData.reduce((sum, item) => sum + (item.totalView || 0), 0)
        setTotalViews(totalViewsCount)
      } else {
        setUserEarnings([])
        notification.warning({
          message: "No Data Found",
          description: "No earnings data found",
        })
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not load earnings data",
      })
      setUserEarnings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserEarnings()
  }, [year, month, day, dayOfWeek])

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const filteredData = userEarnings.filter((item) => {
    return searchText ? item.userName && item.userName.toLowerCase().includes(searchText.toLowerCase()) : true
  })

  const columns = [
    {
      title: "Start Date",
      dataIndex: "startWeek",
      key: "startWeek",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      width: "10%",
    },
    {
      title: "End Date",
      dataIndex: "endWeek",
      key: "endWeek",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      width: "10%",
    },
    {
      title: "Total Views",
      dataIndex: "totalView",
      key: "totalView",
      width: "10%",
    },
    {
      title: "Total Earnings",
      dataIndex: "totalEarnings",
      key: "totalEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "15%",
    },
    {
      title: "Web Earnings",
      dataIndex: "webEarnings",
      key: "webEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "15%",
    },
    {
      title: "Final Earnings",
      dataIndex: "finalEarnings",
      key: "finalEarnings",
      render: (earnings) => formatVND(earnings || 0),
      width: "15%",
    },
    
  ]

  return (
    <div className="p-6">
      <Helmet>
        <title>Your View Earnings</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Your View Earnings
            </Title>
            <Text type="secondary">Track your earnings from movies</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-purple-500">
              <Statistic
                title="Total Views Count"
                value={loading ? "-" : totalViews}
                prefix={<EyeOutlined className="text-purple-500" />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-red-500">
              <Statistic
                title="Total View Earnings"
                value={loading ? "-" : formatVND(totalEarnings)}
                prefix={<DollarOutlined className="text-red-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Web Earnings (% Percentage)"
                value={loading ? "-" : formatVND(webEarnings)}
                prefix={<DollarOutlined className="text-blue-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Final Earnings (Total - Web Earnings)"
                value={loading ? "-" : formatVND(finalEarnings)}
                prefix={<DollarOutlined className="text-green-500" />}
                precision={0}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={24} lg={8}>
            <Input
              placeholder="Search by username..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.id || record.key}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
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

export default PublisherEarning
