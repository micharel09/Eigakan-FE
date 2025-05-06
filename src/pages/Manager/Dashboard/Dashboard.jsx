"use client"

import { useState, useEffect } from "react"
import { notification, Spin } from "antd"
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  CreditCardOutlined,
  PieChartOutlined,
} from "@ant-design/icons"
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
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 h-full ${
        onClick ? "cursor-pointer" : ""
      }`}
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

const ManagerDashboard = () => {
  // Advertisement data
  const [advertiseItemLoading, setAdvertiseItemLoading] = useState(true)
  const [advertiseItemData, setAdvertiseItemData] = useState({
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

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    try {
      setSubscriptionLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(
        "https://eigakan-001-site1.ktempurl.com/api/SubscriptionPurchasePayment?page=1&pageSize=5",
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

  // Fetch advertisement data
  const fetchAdvertiseItemData = async () => {
    try {
      setAdvertiseItemLoading(true)
      const response = await adPurchaseService.getAllAdPurchaseItems(1, 5)

      if (response?.success && response.data) {
        setAdvertiseItemData({
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
      setAdvertiseItemLoading(false)
    }
  }

  // Fetch all data on component mount
  useEffect(() => {
    fetchSubscriptionData()
    fetchAdvertiseItemData()
  }, [])

  // Refresh all data
  const handleRefreshAll = () => {
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
    adRevenue: advertiseItemData.totalConsumed || 0,
    subscriptionRevenue: subscriptionData.totalAmount || 0,
    total: (advertiseItemData.totalConsumed || 0) + (subscriptionData.totalAmount || 0),
  }

  return (
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
              disabled={advertiseItemLoading || subscriptionLoading}
            >
              <ReloadOutlined className={`${advertiseItemLoading || subscriptionLoading ? "animate-spin" : ""}`} />
              <span>Refresh All</span>
            </button>
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
          <p>© 2025 Eigakan Manager Dashboard. All rights reserved.</p>
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard
