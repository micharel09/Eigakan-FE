"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, Typography, Statistic, Row, Col, notification } from "antd"
import {
  EyeOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserOutlined,
  PieChartOutlined,
  WalletOutlined,
} from "@ant-design/icons"
import { Helmet } from "react-helmet"
import { Link } from "react-router-dom"

import movieService from "../../../apis/Movie/movie"
import contractApi from "../../../apis/Contract/contract"
import userEarningService from "../../../apis/UserEarning/userEarning"

const { Title, Text } = Typography

// Helper function to format currency in VND
const formatVND = (value) => {
  return (value || 0).toLocaleString("vi-VN")
}

const PublisherDashboard = () => {
  const [movies, setMovies] = useState([])
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [active, setActive] = useState(0)
  const [totalSigned, setTotalSigned] = useState(0)
  const [totalEarning, setTotalEarning] = useState(0)
  const [totalContract, setTotalContract] = useState(0)

  // New states for contract status counts
  const [contractTrue, setContractTrue] = useState(0)
  const [contractFalse, setContractFalse] = useState(0)

  // User earnings states
  const [userEarnings, setUserEarnings] = useState([])
  const [finalEarnings, setFinalEarnings] = useState(0)
  const [webEarnings, setWebEarnings] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [earningsLoading, setEarningsLoading] = useState(false)

  // Data loading states
  const [contractDataLoaded, setContractDataLoaded] = useState(false)
  const [userEarningsDataLoaded, setUserEarningsDataLoaded] = useState(false)

  // Combined total revenue
  const [combinedTotalRevenue, setCombinedTotalRevenue] = useState(0)

  // Memoized function to calculate combined total
  const calculateCombinedTotal = useCallback(() => {
    const contractAmount = totalEarning || 0
    const earningsAmount = finalEarnings || 0
    const total = contractAmount + earningsAmount

    console.log("Calculating combined total:")
    console.log("Contract Revenue:", contractAmount)
    console.log("User Earnings:", earningsAmount)
    console.log("Combined Total:", total)

    setCombinedTotalRevenue(total)
  }, [totalEarning, finalEarnings])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const res = await movieService.getListMovieByLogin()
      if (res) {
        const { movies, total, activeMovie } = res
        const moviesWithKey = movies.map((m) => ({
          ...m,
          key: m.id,
        }))

        setMovies(moviesWithKey)
        setTotal(total)
        setActive(activeMovie)

        // Count movies by contract status
        const withContract = moviesWithKey.filter((movie) => movie.isContract === true).length
        const withoutContract = moviesWithKey.filter((movie) => movie.isContract === false).length

        setContractTrue(withContract)
        setContractFalse(withoutContract)
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to load movies",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const res = await contractApi.getAllContractByLogin()
      if (res) {
        const { contracts, total, totalEarning, totalSigned } = res
        setContracts(
          contracts.map((m) => ({
            ...m,
            key: m.id,
          })),
        )
        setTotalContract(total)
        setTotalSigned(totalSigned)
        setTotalEarning(totalEarning || 0)
        setContractDataLoaded(true)
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to load contracts",
      })
      setContractDataLoaded(true) // Mark as loaded even on error to prevent blocking
    } finally {
      setLoading(false)
    }
  }

  const fetchUserEarnings = async () => {
    try {
      setEarningsLoading(true)
      // Using current date values for the parameters
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1 // JavaScript months are 0-indexed
      const day = now.getDate()
      const dayOfWeek = now.getDay()

      const response = await userEarningService.getUserEarningByLogin(year, month, day, dayOfWeek)

      if (response && response.data) {
        const formattedData = response.data.userEarnings.map((item) => ({
          ...item,
          key: item.id,
        }))

        setUserEarnings(formattedData)
        setFinalEarnings(response.data.finalEarnings || 0)

        // Calculate total webEarnings from userEarnings array
        const totalWebEarnings = formattedData.reduce((sum, item) => sum + (item.webEarnings || 0), 0)
        setWebEarnings(totalWebEarnings)

        // Calculate total views from userEarnings
        const totalViewsCount = formattedData.reduce((sum, item) => sum + (item.totalView || 0), 0)
        setTotalViews(totalViewsCount)
      } else {
        setUserEarnings([])
        setFinalEarnings(0)
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
      setFinalEarnings(0)
    } finally {
      setEarningsLoading(false)
      setUserEarningsDataLoaded(true)
    }
  }

  // Initial data loading
  useEffect(() => {
    fetchMovies()
    fetchContracts()
    fetchUserEarnings()
  }, [])

  // Calculate combined total when both data sources are loaded
  useEffect(() => {
    if (contractDataLoaded && userEarningsDataLoaded) {
      calculateCombinedTotal()
    }
  }, [contractDataLoaded, userEarningsDataLoaded, calculateCombinedTotal])

  // Recalculate if either value changes after initial load
  useEffect(() => {
    if (contractDataLoaded && userEarningsDataLoaded) {
      calculateCombinedTotal()
    }
  }, [totalEarning, finalEarnings, calculateCombinedTotal, contractDataLoaded, userEarningsDataLoaded])

  return (
    <div className="p-6">
      <Helmet>
        <title>Dashboard Management</title>
      </Helmet>

      {/* Total Revenue Section */}
      <Card className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Total Revenue
            </Title>
            <Text type="secondary">Combined earnings from all sources</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} className="mb-4">
            <Card className="border-l-4 border-l-purple-600 shadow-md">
              <Statistic
                title={<span className="text-lg font-semibold">Total Revenue</span>}
                value={formatVND(combinedTotalRevenue)}
                prefix={<PieChartOutlined className="text-purple-600 text-xl" />}
                loading={loading || earningsLoading || !contractDataLoaded || !userEarningsDataLoaded}
                suffix="VND"
                valueStyle={{ color: "#722ed1", fontSize: "24px", fontWeight: "bold" }}
              />
              <div className="mt-2 text-xs text-gray-500">
                Contract Revenue ({formatVND(totalEarning)} VND) + User Earnings ({formatVND(finalEarnings)} VND)
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <Statistic
                title="Contract Revenue"
                value={formatVND(totalEarning)}
                prefix={<FileTextOutlined className="text-green-500" />}
                loading={loading || !contractDataLoaded}
                suffix="VND"
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <Statistic
                title="View Earnings Revenue (from movie without contract)"
                value={formatVND(finalEarnings)}
                prefix={<WalletOutlined className="text-blue-500" />}
                loading={earningsLoading || !userEarningsDataLoaded}
                suffix="VND"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Movie Management
            </Title>
            <Text type="secondary">Browse and manage all movies</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} lg={6}>
            <Link to="/publisher/movie" className="block">
              <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <Statistic
                  title="Total Movies"
                  value={total}
                  prefix={<EyeOutlined className="text-blue-500" />}
                  loading={loading}
                />
              </Card>
            </Link>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Active Movies"
                value={active}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                loading={loading}
              />
            </Card>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Link to="/publisher/contract" className="block">
              <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <Statistic
                  title="Movies With Contract"
                  value={contractTrue}
                  prefix={<FileTextOutlined className="text-purple-500" />}
                  loading={loading}
                />
              </Card>
            </Link>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Link to="/publisher/movie" className="block">
              <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <Statistic
                  title="Movies Without Contract"
                  value={contractFalse}
                  prefix={<FileTextOutlined className="text-orange-500" />}
                  loading={loading}
                />
              </Card>
            </Link>
          </Col>

        </Row>
      </Card>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Contract Management
            </Title>
            <Text type="secondary">Browse and manage all contracts</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} lg={6}>
            <Link to="/publisher/contract" className="block">
              <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <Statistic
                  title="Total Contracts"
                  value={totalContract}
                  prefix={<EyeOutlined className="text-blue-500" />}
                  loading={loading}
                />
              </Card>
            </Link>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Link to="/publisher/contract" className="block">
              <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <Statistic
                  title="Signed Contracts"
                  value={totalSigned}
                  prefix={<CheckCircleOutlined className="text-green-500" />}
                  loading={loading}
                />
              </Card>
            </Link>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Total Earnings"
                value={formatVND(totalEarning)}
                prefix={<DollarOutlined className="text-green-500" />}
                loading={loading}
                suffix="VND"
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              View Earnings Overview
            </Title>
            <Text type="secondary">Your earnings and performance metrics</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-yellow-500">
              <Statistic
                title="Final Earnings"
                value={formatVND(finalEarnings)}
                prefix={<DollarOutlined className="text-yellow-500" />}
                loading={earningsLoading}
                suffix="VND"
              />
            </Card>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Web Earnings (% percentage)"
                value={formatVND(webEarnings)}
                prefix={<DollarOutlined className="text-blue-500" />}
                loading={earningsLoading}
                suffix="VND"
              />
            </Card>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-purple-500">
              <Statistic
                title="Total Views"
                value={totalViews}
                prefix={<EyeOutlined className="text-purple-500" />}
                loading={earningsLoading}
              />
            </Card>
          </Col>

        </Row>
      </Card>
    </div>
  )
}

export default PublisherDashboard
