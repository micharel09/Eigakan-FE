"use client"

import { useEffect, useState } from "react"
import {
  Avatar,
  List,
  Card,
  Tag,
  Spin,
  Typography,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  Empty,
  Skeleton,
} from "antd"
import {
  CalendarOutlined,
  FileTextOutlined,
  SearchOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import contractApi from "../../../apis/Contract/contract"
import movieService from "../../../apis/Movie/movie"

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
import { Link } from "react-router-dom"

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const ContractAdmin = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState({})
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  })
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    dateRange: null,
  })

  const fetchContracts = async (current, pageSize) => {
    try {
      const response = await contractApi.getAllContract(current, pageSize)
      return response.data.contracts || []
    } catch (error) {
      console.error("Error fetching contracts:", error)
      return []
    }
  }

  const fetchMovie = async (movieId, contractId) => {
    setItemsLoading(prev => ({ ...prev, [contractId]: true }));
    try {
      const response = await movieService.getMovieById(movieId);
      const movie = response.data;
      const posterMedia = movie.medias.find(media => media.type === "POSTER");
      return {
        ...movie,
        posterUrl: posterMedia ? posterMedia.url : null
      };
    } catch (error) {
      console.error(`Error fetching movie ${movieId}:`, error);
      return { title: "Unknown Movie", posterUrl: null };
    } finally {
      setItemsLoading(prev => ({ ...prev, [contractId]: false }));
    }
  };

  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true)
      try {
        const contractList = await fetchContracts(pagination.current, pagination.pageSize)

        // Initialize loading state for each contract
        const loadingState = {}
        contractList.forEach((contract) => {
          loadingState[contract.id] = true
        })
        setItemsLoading(loadingState)

        const enrichedContracts = await Promise.all(
          contractList.map(async (contract) => {
            const movie = await fetchMovie(contract.movieId, contract.id);
            return {
              ...contract,
              userName: contract.user?.fullName || "Unknown User",
              email: contract.user?.email || "Unknown Email",
              movieTitle: movie?.title || "Unknown Movie",
              moviePoster: movie?.posterUrl || "https://via.placeholder.com/150",
            };
          })
        );

        setContracts(enrichedContracts)
        setPagination((prev) => ({ ...prev, total: contractList.length }))
      } catch (error) {
        console.error("Error loading contracts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadContracts()
  }, [pagination.current, pagination.pageSize])

  // Filter contracts based on search, status and date range
  const filteredContracts = contracts.filter((contract) => {
    // Search filter
    const searchMatch =
      filters.search === "" ||
      contract.movieTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
      contract.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
      contract.publisherName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      contract.distributorName?.toLowerCase().includes(filters.search.toLowerCase())

    // Status filter
    const statusMatch = filters.status === "all" || contract.status.status === filters.status

    // Date range filter
    let dateMatch = true
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = new Date(contract.startDate)
      const endDate = new Date(contract.endDate)
      const filterStartDate = filters.dateRange[0].startOf("day").toDate()
      const filterEndDate = filters.dateRange[1].endOf("day").toDate()

      dateMatch =
        (startDate >= filterStartDate && startDate <= filterEndDate) ||
        (endDate >= filterStartDate && endDate <= filterEndDate) ||
        (startDate <= filterStartDate && endDate >= filterEndDate)
    }

    return searchMatch && statusMatch && dateMatch
  })

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }))
  }

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value }))
  }

  const handleDateRangeChange = (dates) => {
    setFilters((prev) => ({ ...prev, dateRange: dates }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      dateRange: null,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading contracts..." />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <Title level={2} className="mb-4">
          Contract Management
        </Title>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <Text strong>Search</Text>
              <Input
                placeholder="Search by movie, user, publisher..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Text strong>Status</Text>
              <Select className="w-full" value={filters.status} onChange={handleStatusChange}>
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="pending">Pending</Option>
                <Option value="expired">Expired</Option>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Text strong>Date Range</Text>
              <RangePicker className="w-full" value={filters.dateRange} onChange={handleDateRangeChange} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleResetFilters}>Reset Filters</Button>
            </div>
          </div>
        </Card>

        {/* Contract List */}
        {filteredContracts.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 3 }}
            dataSource={filteredContracts}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) => setPagination((prev) => ({ ...prev, current: page })),
              showSizeChanger: true,
              pageSizeOptions: ["4", "8", "12", "16"],
              onShowSizeChange: (current, size) => {
                setPagination((prev) => ({ ...prev, current: 1, pageSize: size }))
              },
            }}
            renderItem={(item) => (
              <Link key={item.id} to={`/admin/contract/${item.id}`}>
              <List.Item>
                <Card
                  hoverable
                  className="h-full shadow-sm transition-shadow duration-300 hover:shadow-md"
                  cover={
                    <div className="h-48 overflow-hidden relative">
                      {itemsLoading[item.id] ? (
                        <Skeleton.Image className="w-full h-full" active />
                      ) : (
                        <img
                          alt={item.movieTitle}
                          src={item.moviePoster || "https://via.placeholder.com/150"}
                          className="w-full h-full object-cover"
                        />
                      )}
                          <Tag 
                           
                            className="absolute top-2 right-2 font-semibold"
                          >
                            {item.status}
                          </Tag>
                        </div>
                      }
                    >
                  <Skeleton loading={itemsLoading[item.id]} active>
                    <Card.Meta
                      title={
                        <div className="flex justify-between items-center">
                          <Text strong className="truncate">
                            Contract of: {item.movieTitle}
                          </Text>
                          <Avatar src={item.user?.picture} icon={!item.user?.picture && <UserOutlined />} />
                        </div>
                      }
                      description={
                        <Space direction="vertical" className="w-full">
                          <div className="flex items-center">
                            <UserOutlined className="mr-2" />
                            <Text type="secondary">User: {item.userName} - {item.email}</Text>
                          </div>

                          <div className="flex items-center">
                            <VideoCameraOutlined className="mr-2" />
                            <Text type="secondary">Publisher: {item.publisherName || "N/A"}</Text>
                          </div>

                          <div className="flex items-center">
                            <FileTextOutlined className="mr-2" />
                            <Text type="secondary">Distributor: {item.distributorName || "N/A"}</Text>
                          </div>

                          <div className="flex items-center">
                            <CalendarOutlined className="mr-2" />
                            <Text type="secondary">
                              {formatDate(item.startDate)} - {formatDate(item.endDate)}
                            </Text>
                          </div>
                        </Space>
                      }
                    />
                  </Skeleton>
                </Card>
              </List.Item>
              </Link>
            )}
          />
        ) : (
          <Empty
            className="my-12"
            description="No contracts found matching your filters"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  )
}

export default ContractAdmin

