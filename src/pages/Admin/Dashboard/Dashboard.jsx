"use client"

import { useState, useEffect } from "react"
import { notification, Spin, Table } from "antd"
import {
  FileProtectOutlined,
  ReloadOutlined,
  EyeOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  FileOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons"
import adminDashboardService from "../../../apis/AdminDashboard/adminDashboard"
import userEarningService from "../../../apis/UserEarning/userEarning"
import movieEarningService from "../../../apis/MovieEarning/movieEarning"
import axios from "axios"
import adPurchaseService from "../../../apis/AdPurchase/adPurchaseService"

// Format currency to VND
const formatVND = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

// Stat Card Component
const StatCard = ({ title, value, icon, color, subValue, subTitle, loading, trend, onClick }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 h-full ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>

        {trend !== undefined && (
          <div
            className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${
              trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-gray-500 text-sm font-medium">{title}</div>
        {loading ? (
          <Spin size="small" />
        ) : (
          <div className="text-2xl font-bold" style={{ color }}>
            {value}
          </div>
        )}
      </div>

      {subValue !== undefined && subTitle && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{subTitle}</span>
            <span className="font-semibold">{subValue}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${typeof subValue === "number" && typeof value === "number" ? (subValue / value) * 100 : 0}%`,
                backgroundColor: color,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

// Section Header Component
const SectionHeader = ({ title, viewAllLink, onRefresh }) => (
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center">
      <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="flex items-center gap-3">
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Refresh data"
        >
          <ReloadOutlined className="text-gray-500" />
        </button>
      )}
      {viewAllLink && (
        <a
          href={viewAllLink}
          className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium flex items-center"
        >
          View All
          <ArrowUpOutlined className="ml-1 transform rotate-45" />
        </a>
      )}
    </div>
  </div>
)

const Dashboard = () => {
  // Main dashboard data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMovies: 0,
    activeMovies: 0,
    totalUserRegisters: 0,
    acceptedUserRegisters: 0,
    totalContracts: 0,
    signedContracts: 0,
  })

  // User Earnings data
  const [userEarningsLoading, setUserEarningsLoading] = useState(true)
  const [userEarningsData, setUserEarningsData] = useState({
    totalEarnings: 0,
    finalEarnings: 0,
    webEarnings: 0,
  })

  // Movie Earnings data
  const [movieEarningsLoading, setMovieEarningsLoading] = useState(true)
  const [movieEarningsData, setMovieEarningsData] = useState({
    totalViews: 0,
    totalEarnings: 0,
    totalEarningsMovieContract: 0,
  })

  const [advertiseItemLoading, setadvertiseItemLoading] = useState(true)
  const [advertiseItemData, setadvertiseItemData] = useState({
    totalConsumed: 0,
    totalPurchased: 0,
  })

  // Subscription data
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState({
    totalSubscription: 0,
    totalActiveAmount: 0,
    totalAmount: 0,
  })

  // Selected section for detailed view
  const [selectedSection, setSelectedSection] = useState(null)

  // Fetch main dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await adminDashboardService.getDashboardAdminOverall()

      if (response && response.success && response.data) {
        setDashboardData(response.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError(error.message || "Failed to fetch dashboard data")
      notification.error({
        message: "Error",
        description: "Could not fetch dashboard data. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch user earnings data
  const fetchUserEarningsData = async () => {
    try {
      setUserEarningsLoading(true)
      const response = await userEarningService.getUserEarnings(1, 10)

      if (response && response.data) {
        setUserEarningsData({
          totalEarnings: response.data.totalEarnings || 0,
          finalEarnings: response.data.finalEarning || 0,
          webEarnings: response.data.webEarnings || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching user earnings data:", error)
      notification.error({
        message: "Error",
        description: "Could not fetch user earnings data.",
      })
    } finally {
      setUserEarningsLoading(false)
    }
  }

  // Fetch movie earnings data
  const fetchMovieEarningsData = async () => {
    try {
      setMovieEarningsLoading(true)
      const response = await movieEarningService.getAllMovieEarning(1, 5)

      if (response?.success && response.data) {
        setMovieEarningsData({
          totalViews: response.data.totalView || 0,
          totalEarnings: response.data.totalEarnings || 0,
          totalEarningsMovieContract: response.data.totalEarningsMovieContract || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching movie earnings data:", error)
      notification.error({
        message: "Error",
        description: "Could not fetch movie earnings data.",
      })
    } finally {
      setMovieEarningsLoading(false)
    }
  }

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    try {
      setSubscriptionLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(
        "https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment?page=1&pageSize=5",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response?.data?.success) {
        setSubscriptionData({
          totalSubscription: response?.data?.data?.total || 0,
          totalActiveAmount: response?.data?.data?.activeSubscriptionCount || 0,
          totalAmount: response?.data?.data?.totalEarnings || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      notification.error({
        message: "Error",
        description: "Could not fetch subscription data.",
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const fetchAdvertiseItemData = async () => {
    try {
      setadvertiseItemLoading(true)
      const response = await adPurchaseService.getAllAdPurchaseItems(1, 5)

      if (response?.success && response.data) {
        setadvertiseItemData({
          totalConsumed: response.totalConsumed || 0,
          totalPurchased: response.totalPurchased || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching ad purchase data:", error)
      notification.error({
        message: "Error",
        description: "Could not fetch ad purchase data.",
      })
    } finally {
      setadvertiseItemLoading(false)
    }
  }

  // Fetch all data on component mount
  useEffect(() => {
    fetchDashboardData()
    fetchUserEarningsData()
    fetchMovieEarningsData()
    fetchSubscriptionData()
    fetchAdvertiseItemData()
  }, [])

  // Refresh all data
  const handleRefreshAll = () => {
    fetchDashboardData()
    fetchUserEarningsData()
    fetchMovieEarningsData()
    fetchSubscriptionData()
    fetchAdvertiseItemData()
    notification.success({
      message: "Refreshed",
      description: "Dashboard data has been refreshed.",
      duration: 2,
    })
  }

  // Calculate total revenue
  const totalRevenue = {
    webEarnings: userEarningsData.webEarnings || 0,
    movieContractEarnings: movieEarningsData.totalEarningsMovieContract || 0,
    adRevenue: advertiseItemData.totalConsumed || 0,
    subscriptionRevenue: subscriptionData.totalAmount || 0,
    total:
      (userEarningsData.webEarnings || 0) +
      (movieEarningsData.totalEarningsMovieContract || 0) +
      (advertiseItemData.totalConsumed || 0) +
      (subscriptionData.totalAmount || 0),
  }

  // Revenue table columns
  const revenueColumns = [
    {
      title: "Revenue Source",
      dataIndex: "source",
      key: "source",
      render: (text, record) => (
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: record.color }}></span>
          {text}
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (text) => <span className="font-medium">{formatVND(text)}</span>,
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      render: (text, record) => (
        <div className="flex items-center">
          <div className="w-24 bg-gray-100 rounded-full h-2 mr-3">
            <div className="h-2 rounded-full" style={{ width: `${text}%`, backgroundColor: record.color }}></div>
          </div>
          <span>{text.toFixed(1)}%</span>
        </div>
      ),
    },
  ]

  // Revenue table data
  const revenueData = [
    {
      key: "1",
      source: "Web Share(No Contract Movies)",
      amount: totalRevenue.webEarnings,
      percentage: totalRevenue.total ? (totalRevenue.webEarnings / totalRevenue.total) * 100 : 0,
      color: "#1890ff",
    },
    {
      key: "2",
      source: "Movie with contract",
      amount: totalRevenue.movieContractEarnings,
      percentage: totalRevenue.total ? (totalRevenue.movieContractEarnings / totalRevenue.total) * 100 : 0,
      color: "#722ed1",
    },
    {
      key: "3",
      source: "Ad Revenue",
      amount: totalRevenue.adRevenue,
      percentage: totalRevenue.total ? (totalRevenue.adRevenue / totalRevenue.total) * 100 : 0,
      color: "#f5222d",
    },
    {
      key: "4",
      source: "Subscription Revenue",
      amount: totalRevenue.subscriptionRevenue,
      percentage: totalRevenue.total ? (totalRevenue.subscriptionRevenue / totalRevenue.total) * 100 : 0,
      color: "#52c41a",
    },
    {
      key: "5",
      source: "Total Revenue",
      amount: totalRevenue.total,
      percentage: 100,
      color: "#faad14",
    },
  ]

  // If there's an error but we're not loading, show error state
  if (error && !loading) {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-500 text-xl mb-4">Error loading dashboard</div>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Custom CSS for revenue table */}
      <style jsx>{`
        .revenue-table .ant-table-thead > tr > th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .revenue-table .ant-table-tbody > tr:last-child {
          background-color: #f0f9ff;
        }

        .revenue-table .ant-table-tbody > tr:last-child td {
          font-weight: 700;
          color: #1e40af;
        }

        .revenue-table .ant-table-tbody > tr:hover > td {
          background-color: #f3f4f6;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">Dashboard</h1>
              <p className="text-gray-500">Welcome back! Here's an overview of your platform.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshAll}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading || userEarningsLoading || movieEarningsLoading || subscriptionLoading}
              >
                <ReloadOutlined
                  className={`${
                    loading || userEarningsLoading || movieEarningsLoading || subscriptionLoading ? "animate-spin" : ""
                  }`}
                />
                <span>Refresh All</span>
              </button>
            </div>
          </div>

          {/* Revenue Summary Section */}
          <div className="mb-8">
            <SectionHeader title="Revenue Summary" onRefresh={handleRefreshAll} />

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <BarChartOutlined className="mr-2 text-blue-600" />
                      Total Revenue
                    </h3>
                    <div className="text-2xl font-bold text-blue-600">{formatVND(totalRevenue.total)}</div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `#4096ff15` }}
                      >
                        <span style={{ color: "#4096ff" }}>
                          <EyeOutlined style={{ fontSize: 20 }} />
                        </span>
                      </div>

                      <div className="px-2 py-1 text-xs font-medium rounded-full flex items-center bg-green-50 text-green-600">
                        <ArrowUpOutlined />
                        <span className="ml-1">6.5%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-gray-500 text-sm font-medium">View Count Earnings</div>
                      {userEarningsLoading || movieEarningsLoading ? (
                        <Spin size="small" />
                      ) : (
                        <div className="text-2xl font-bold" style={{ color: "#4096ff" }}>
                          {formatVND(totalRevenue.webEarnings + totalRevenue.movieContractEarnings)}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Web Share<br /> (No Contract Movies)</span>
                            <span className="font-semibold">{formatVND(totalRevenue.webEarnings)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${totalRevenue.total ? (totalRevenue.webEarnings / totalRevenue.total) * 100 : 0}%`,
                                backgroundColor: "#1890ff",
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Movies <br /> with contract</span>
                            <span className="font-semibold">{formatVND(totalRevenue.movieContractEarnings)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${totalRevenue.total ? (totalRevenue.movieContractEarnings / totalRevenue.total) * 100 : 0}%`,
                                backgroundColor: "#722ed1",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                <StatCard
                  title="Ad Revenue"
                  value={formatVND(totalRevenue.adRevenue)}
                  icon={<PieChartOutlined style={{ fontSize: 20 }} />}
                  color="#f5222d"
                  loading={advertiseItemLoading}
                  trend={4}
                />

                <StatCard
                  title="Subscription Revenue"
                  value={formatVND(totalRevenue.subscriptionRevenue)}
                  icon={<CreditCardOutlined style={{ fontSize: 20 }} />}
                  color="#52c41a"
                  loading={subscriptionLoading}
                  trend={11}
                />
              </div>

              <Table
                columns={revenueColumns}
                dataSource={revenueData}
                pagination={false}
                loading={userEarningsLoading || movieEarningsLoading || advertiseItemLoading || subscriptionLoading}
                className="revenue-table"
              />
            </div>
          </div>

          {/* Platform Overview Section */}
          <div className="mb-8">
            <SectionHeader title="Platform Overview" viewAllLink="/platform-stats" onRefresh={fetchDashboardData} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={dashboardData.totalUsers.toLocaleString()}
                subValue={dashboardData.activeUsers}
                subTitle="Active Users"
                icon={<TeamOutlined style={{ fontSize: 20 }} />}
                color="#1890ff"
                loading={loading}
                trend={5}
                onClick={() => setSelectedSection("users")}
              />

              <StatCard
                title="Total Movies"
                value={dashboardData.totalMovies.toLocaleString()}
                subValue={dashboardData.activeMovies}
                subTitle="Active Movies"
                icon={<VideoCameraOutlined style={{ fontSize: 20 }} />}
                color="#722ed1"
                loading={loading}
                trend={3}
                onClick={() => setSelectedSection("movies")}
              />

              <StatCard
                title="User Registrations"
                value={dashboardData.totalUserRegisters.toLocaleString()}
                subValue={dashboardData.acceptedUserRegisters}
                subTitle="Accepted Registrations"
                icon={<FileOutlined style={{ fontSize: 20 }} />}
                color="#52c41a"
                loading={loading}
                trend={-2}
                onClick={() => setSelectedSection("registrations")}
              />

              <StatCard
                title="Contracts"
                value={dashboardData.totalContracts.toLocaleString()}
                subValue={dashboardData.signedContracts}
                subTitle="Signed Contracts"
                icon={<FileProtectOutlined style={{ fontSize: 20 }} />}
                color="#fa8c16"
                loading={loading}
                trend={8}
                onClick={() => setSelectedSection("contracts")}
              />
            </div>
          </div>

          {/* User Earnings Section */}
          <div className="mb-8">
            <SectionHeader title="User Earnings" viewAllLink="/user-earnings" onRefresh={fetchUserEarningsData} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                title="Total Earnings"
                value={formatVND(userEarningsData.totalEarnings)}
                icon={<DollarOutlined style={{ fontSize: 20 }} />}
                color="#eb2f96"
                loading={userEarningsLoading}
                trend={12}
              />

              <StatCard
                title="Website Earnings"
                value={formatVND(userEarningsData.webEarnings)}
                icon={<LineChartOutlined style={{ fontSize: 20 }} />}
                color="#f5222d"
                loading={userEarningsLoading}
                trend={7}
              />

              <StatCard
                title="Final Earnings"
                value={formatVND(userEarningsData.finalEarnings)}
                icon={<DollarOutlined style={{ fontSize: 20 }} />}
                color="#52c41a"
                loading={userEarningsLoading}
                trend={4}
              />
            </div>
          </div>

          {/* Movie Earnings Section */}
          <div className="mb-8">
            <SectionHeader title="Movie Earnings" viewAllLink="/movie-earnings" onRefresh={fetchMovieEarningsData} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                title="Total Views"
                value={movieEarningsData.totalViews.toLocaleString()}
                icon={<EyeOutlined style={{ fontSize: 20 }} />}
                color="#722ed1"
                loading={movieEarningsLoading}
                trend={15}
              />

              <StatCard
                title="Total Earnings (All Movies)"
                value={formatVND(movieEarningsData.totalEarnings)}
                icon={<DollarOutlined style={{ fontSize: 20 }} />}
                color="#f5222d"
                loading={movieEarningsLoading}
                trend={9}
              />

              <StatCard
                title="Contract Movies Earnings"
                value={formatVND(movieEarningsData.totalEarningsMovieContract)}
                icon={<FileProtectOutlined style={{ fontSize: 20 }} />}
                color="#1890ff"
                loading={movieEarningsLoading}
                trend={6}
              />
            </div>
          </div>

          {/* Subscription Orders Section */}
          <div className="mb-8">
            <SectionHeader
              title="Subscription Orders"
              viewAllLink="/subscription-orders"
              onRefresh={fetchSubscriptionData}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                title="Total Subscriptions"
                value={subscriptionData.totalSubscription.toLocaleString()}
                subValue={subscriptionData.totalActiveAmount}
                subTitle="Active Subscriptions"
                icon={<CreditCardOutlined style={{ fontSize: 20 }} />}
                color="#2f54eb"
                loading={subscriptionLoading}
                trend={3}
              />

              <StatCard
                title="Active Subscriptions"
                value={subscriptionData.totalActiveAmount.toLocaleString()}
                icon={<CheckCircleOutlined style={{ fontSize: 20 }} />}
                color="#52c41a"
                loading={subscriptionLoading}
                trend={5}
              />

              <StatCard
                title="Total Revenue"
                value={formatVND(subscriptionData.totalAmount)}
                icon={<DollarOutlined style={{ fontSize: 20 }} />}
                color="#faad14"
                loading={subscriptionLoading}
                trend={11}
              />
            </div>
          </div>

          {/* Ads Section */}
          <div className="mb-8">
            <SectionHeader title="Advertisement" viewAllLink="/ads" onRefresh={fetchAdvertiseItemData} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard
                title="Total Consumed"
                value={formatVND(advertiseItemData.totalConsumed)}
                icon={<PieChartOutlined style={{ fontSize: 20 }} />}
                color="#f5222d"
                loading={advertiseItemLoading}
                trend={7}
              />

              <StatCard
                title="Total Purchased"
                value={formatVND(advertiseItemData.totalPurchased)}
                icon={<DollarOutlined style={{ fontSize: 20 }} />}
                color="#52c41a"
                loading={advertiseItemLoading}
                trend={4}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-400 text-xs mt-12 pb-6">
            <p>© 2025 Eigakan Admin Dashboard. All rights reserved.</p>
            <p>Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
