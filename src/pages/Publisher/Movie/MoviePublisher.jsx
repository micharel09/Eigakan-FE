"use client"

import { useState, useEffect } from "react"
import { Input, Select, Button, Card, Pagination, Tag, Spin } from "antd"
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons"
import { Link } from "react-router-dom"
import movieService from "../../../apis/Movie/movie"
import genreService from "../../../apis/Genre/genre"

const { Option } = Select

const MoviePublisher = () => {
  const [movies, setMovies] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [genres, setGenres] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [loading, setLoading] = useState(false)
  const pageSize = 8

  useEffect(() => {
    fetchMovies()
    fetchGenres()
  }, [])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const response = await movieService.getAllListMovies()
      console.log("Movies:", response.data)
      setMovies(response.data)
    } catch (error) {
      console.error("Error fetching movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await genreService.getGenres()
      setGenres(response.data)
    } catch (error) {
      console.error("Error fetching genres:", error)
    }
  }

  const filteredMovies = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedGenres.length === 0 || selectedGenres.some((genre) => movie.genres.includes(genre))),
  )

  const paginatedMovies = filteredMovies.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Movie List</h1>
        <Link to="/admin/createMovie">
          <Button type="primary" icon={<PlusOutlined />} size="large" className="bg-blue-500 hover:bg-blue-600">
            Create Movie
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Input
          placeholder="Search by title..."
          prefix={<SearchOutlined className="text-gray-400" />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[250px] text-lg"
          size="large"
        />
        <Select
          mode="multiple"
          style={{ minWidth: 200 }}
          placeholder="Filter by genres"
          onChange={setSelectedGenres}
          options={genres.map((genre) => ({ label: genre.name, value: genre.id }))}
          size="large"
          className="text-lg"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {paginatedMovies.map((movie) => (
            <Link key={movie.id} to={`/admin/movie/${movie.id}`}>
              <Card
                hoverable
                cover={
                  <div className="relative pt-[150%]">
                    <img
                      alt={movie.title}
                      src={movie.medias.length > 0 ? movie.medias[0].url : "/placeholder.svg"}
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      {movie.status === "ACTIVE" ? (
                        <Tag icon={<CheckCircleOutlined />} color="green">Active</Tag>
                      ) : movie.status === "WAITING_FOR_REVIEWING" ? (
                        <Tag icon={<ClockCircleOutlined />} color="orange">Waiting for Review</Tag>
                      ) : movie.status === "ACCEPTED_NEGOTIATING" ? (
                        <Tag icon={<SyncOutlined spin />} color="blue">Negotiating</Tag>
                      ) : movie.status === "REJECTED" ? (
                        <Tag icon={<CloseCircleOutlined />} color="red">Rejected</Tag>
                      ) : movie.status === "ARCHIVED" ? (
                        <Tag icon={<FolderOutlined />} color="gray">Archived</Tag>
                      ) : (
                        <Tag color="default">Unknown</Tag>
                      )}
                    </div>
                  </div>
                }
                className="rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <Card.Meta
                  title={<span className="font-semibold">{movie.title}</span>}
                  description={
                    <div>
                      <p className="text-gray-500">{movie.releaseYear}</p>
                      <div className="mt-2">{movie.genreNames}</div>
                    </div>
                  }
                />
              </Card>
            </Link>
          ))}
        </div>
      )}

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

