"use client"

import { useState } from "react"
import { SearchOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons"
import { Input, Select, Switch, Button, Card, Space, Pagination,Tag } from "antd"

const movies = [
  {
    id: 1,
    title: "Fast X",
    poster: "https://res.cloudinary.com/dn8bn2sty/image/upload/v1740119573/i7s6ke9yf7ww0jxgyux3.jpg",
    language: "English",
  },
  {
    id: 1,
    title: "Fast X",
    poster: "https://res.cloudinary.com/dn8bn2sty/image/upload/v1740119573/i7s6ke9yf7ww0jxgyux3.jpg",
    language: "English",
  },
  {
    id: 1,
    title: "Fast X",
    poster: "https://res.cloudinary.com/dn8bn2sty/image/upload/v1740119573/i7s6ke9yf7ww0jxgyux3.jpg",
    language: "English",
  },
  {
    id: 1,
    title: "Fast X",
    poster: "https://res.cloudinary.com/dn8bn2sty/image/upload/v1740119573/i7s6ke9yf7ww0jxgyux3.jpg",
    language: "English",
  },
  

  // Add more movies here to test pagination
]

const languages = ["English", "Malayalam", "Hindi", "Tamil"]
const genres = ["Action", "Drama", "Comedy", "Thriller"]

const MoviePublisher = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredInfo, setFilteredInfo] = useState({})
  const [sortedInfo, setSortedInfo] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const filteredMovies = movies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const paginatedMovies = filteredMovies.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <Space>
          <Button onClick={() => setFilteredInfo({})} className="bg-white hover:bg-gray-100">
            Clear Filters
          </Button>
          <Button onClick={() => setSortedInfo({})} className="bg-white hover:bg-gray-100">
            Clear Sorters
          </Button>
        </Space>
        <Button>Create</Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Input
          placeholder="Search By Title..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[250px] shadow-sm"
        />
        <Select
          placeholder="Filter by Language"
          className="w-56 shadow-sm"
          options={languages.map((lang) => ({ label: lang, value: lang }))}
          mode="multiple"
        />
        <Select
          placeholder="Filter by Genres"
          className="w-56 shadow-sm"
          options={genres.map((genre) => ({ label: genre, value: genre }))}
          mode="multiple"
        />
      </div>

      {/* Movie Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {paginatedMovies.map((movie) => (
            <Card
              key={movie.id}
              hoverable
              className="rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 bg-white"
              cover={
                <div className="relative pt-[100%]">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                  />
                  <Tag color="green" className="absolute top-2 right-2 z-10">
                    Active
                  </Tag>
                </div>
              }
            >
              <Card.Meta
                title={<span className="font-semibold">{movie.title}</span>}
                description={<span className="text-gray-500">{movie.language}</span>}
              />
            </Card>
          ))}
        </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <Pagination
          current={currentPage}
          total={filteredMovies.length}
          pageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          showSizeChanger={false}
        />
      </div>
    </div>
  )
}

export default MoviePublisher

