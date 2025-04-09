"use client"

import { useState, useEffect } from "react"
import {
  Breadcrumb,
  Layout,
  Image,
  Card,
  Tabs,
  Tag,
  Button,
  Spin,
  Modal,
  notification,
  Typography,
  Statistic,
  Input,
  Select,
  Form,
  Avatar,
  Row,
  Col,
  Divider,
} from "antd"
import {
  PlayCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  EditOutlined,
  EyeOutlined,
  UploadOutlined,
  CalendarOutlined,
  BarChartOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import { useParams } from "react-router-dom"
import movieService from "../../../apis/Movie/movie"
import genreService from "../../../apis/Genre/genre"
import personService from "../../../apis/Person/person"
import ProcessStatus from "../../../components/WorkFlow/MovieWorkflow"
import uploadFileApi from "../../../apis/Upload/upload"
import { extractUrl } from "../../../utils/extractUrl"
import { Link } from "react-router-dom"
import MovieCount from "../../Admin/Movie/MovieCount"

const { Content } = Layout
const { TabPane } = Tabs
const { Title, Text, Paragraph } = Typography
const hiddenStatuses = ["ACTIVE", "ACCEPTED_NEGOTIATING", "WAITING_FOR_UPLOADING", "ARCHIVED"]

const MovieDetailPublisher = () => {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ visible: false, type: "" })
  const [editMovie, setEditMovie] = useState(null)
  const [genres, setGenres] = useState([])
  const [persons, setPersons] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [videoId, setVideoId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [progress, setProgress] = useState(0)

  const { id } = useParams()

  useEffect(() => {
    fetchMovieDetails()
    fetchGenres()
    fetchPersons()
  }, [])

  const fetchMovieDetails = async () => {
    setLoading(true)
    try {
      const response = await movieService.getMovieById(id)
      setMovie(response.data)
    } catch (error) {
      notification.error({ message: "Failed to fetch movie details" })
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
      notification.error({ message: "Failed to fetch genres" })
    }
  }

  const fetchPersons = async () => {
    try {
      const response = await personService.getAllPerson()
      console.log("Persons:", response.data)
      setPersons(response.data)
    } catch (error) {
      console.error("Error fetching persons:", error)
      notification.error({ message: "Failed to fetch persons" })
    }
  }

  const handleUpdate = async () => {
    try {
      await movieService.updateMovie(id, editMovie)
      notification.success({ message: "Movie updated successfully" })
      setModal({ visible: false, type: "" })
      fetchMovieDetails()
    } catch (error) {
      notification.error({ message: "Failed to update movie" })
    }
  }

  const getMediaUrl = (type) => movie?.medias?.find((m) => m.type === type)?.url || ""

  const renderMedia = (type) => {
    const url = getMediaUrl(type)

    if (type === "DASHBOARD") {
      return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <Title level={3} className="text-gray-800 mb-1">
              Movie Dashboard
            </Title>
            <Text className="text-gray-500">Comprehensive analytics and information</Text>
          </div>

          <Row gutter={[24, 24]}>
            {/* Left Column - Movie Information */}
            <Col xs={24} lg={12}>
              <Card
                className="h-full shadow-md hover:shadow-lg transition-shadow duration-300"
                title={
                  <div className="flex items-center">
                    <div className="bg-blue-500 w-1 h-6 mr-3 rounded-full"></div>
                    <span>Movie Information</span>
                  </div>
                }
                bordered={false}
              >
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <CalendarOutlined className="text-blue-500 mr-2" />
                      <Text strong className="text-gray-700">
                        Submission Date
                      </Text>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Paragraph className="text-gray-800 m-0">{movie?.submissionDate || "Not available"}</Paragraph>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-2">
                      <CloseCircleOutlined className="text-red-500 mr-2" />
                      <Text strong className="text-gray-700">
                        Reason For Rejection
                      </Text>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Paragraph className="text-gray-800 m-0">{movie?.reasonForRejection || "No rejection"}</Paragraph>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Right Column - Statistics */}
            <Col xs={24} lg={12}>
              <Card
                className="h-full shadow-md hover:shadow-lg transition-shadow duration-300"
                title={
                  <div className="flex items-center">
                    <div className="bg-green-500 w-1 h-6 mr-3 rounded-full"></div>
                    <span>Performance Metrics</span>
                  </div>
                }
                bordered={false}
              >
                <div className="space-y-6">
                  <Row gutter={[16, 16]}>
                    <Col xs={12}>
                      <Card className="bg-blue-50 border-0">
                        <Statistic
                          title={
                            <div className="flex items-center text-blue-700">
                              <EyeOutlined className="mr-1" />
                              <span>Views</span>
                            </div>
                          }
                          value={movie?.viewCount || 0}
                          valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
                        />
                      </Card>
                    </Col>

                    <Col xs={12}>
                      <Card className="bg-green-50 border-0">
                        <Statistic
                          title={
                            <div className="flex items-center text-green-700">
                              <StarOutlined className="mr-1" />
                              <span>Rating</span>
                            </div>
                          }
                          value={movie?.userRating || 0}
                          suffix="/5"
                          valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Divider className="my-4" />

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-2 flex items-center">
                      <BarChartOutlined className="text-purple-500 mr-2" />
                      <Text strong className="text-gray-700">
                        View Statistics
                      </Text>
                    </div>
                    <MovieCount />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )
    }
    if (["Actor/Acstress"].includes(type)) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {movie?.person?.map((actor) => (
            <div key={actor.id} className="flex flex-col items-center">
              <img
                src={actor.picture || "/placeholder.svg"}
                alt={actor.name}
                className="w-32 h-48 object-cover rounded-lg"
              />
              <p className="mt-2 font-semibold">{actor.name}</p>
            </div>
          ))}
        </div>
      )
    }
    if (!url) return <p>No {type.toLowerCase()} available</p>
    if (type === "POSTER")
      return (
        <div className="flex justify-center">
          <Image width="30%" src={url || "/placeholder.svg"} alt={`Movie ${type}`} />
        </div>
      )
    if (type === "BANNER") return <Image width="100%" src={url || "/placeholder.svg"} alt={`Movie ${type}`} />
    if (type === "TRAILER") return <iframe width="100%" height="400" src={url} allowFullScreen />
    if (type === "FILMVIP" && url.includes("iframe.mediadelivery.net")) {
      return (
        <iframe
          width="100%"
          height="100%"
          style={{ minHeight: "500px", width: "100%", display: "block" }}
          src={url}
          title="VIP Film"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      )
    }
    if (["FILM", "FILMVIP"].includes(type)) {
      return (
        <video width="100%" height="400" controls>
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )
    }
  }

  const handleGetPreUrl = async () => {
    try {
      const extractLink = extractUrl(movie?.fileUrl)
      if (extractLink === null) {
        notification.error({ message: "An error occurred!" })
        return
      }

      if (!extractLink || !extractLink.userId || !extractLink.fileName) {
        throw new Error("Failed to extract userId or fileName from URL")
      }
      const response = await uploadFileApi.getPreFileUrlMovie(extractLink.userId, extractLink.fileName)
      console.log("PreUrl:", response.data)
      window.open(response.data.url, "_blank")
    } catch (error) {
      notification.error({ message: error.message || "Not found" })
      console.error("Error fetching preUrl:", error)
    }
  }

  const handleGetPreUrlTemp = async () => {
    try {
      const extractLink = extractUrl(movie?.fileUrl)
      if (extractLink === null) {
        notification.error({ message: "An error occurred!" })
        return
      }

      if (!extractLink || !extractLink.userId || !extractLink.fileName) {
        throw new Error("Failed to extract userId or fileName from URL")
      }
      const response = await uploadFileApi.getPreFileUrlTemp(extractLink.userId, extractLink.fileName)
      console.log("PreUrl:", response.data)
      window.open(response.data.url, "_blank")
    } catch (error) {
      notification.error({ message: error.message || "Not found" })
      console.error("Error fetching preUrl:", error)
    }
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        {movie?.status && <ProcessStatus movieStatus={movie.status} />}

        <Breadcrumb className="mb-6">
          <Breadcrumb.Item>Movies</Breadcrumb.Item>
          <Breadcrumb.Item>{movie?.title || "Movie Detail"}</Breadcrumb.Item>
        </Breadcrumb>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="md:w-1/4 w-full flex justify-center">
                  <Image
                    width={300}
                    src={getMediaUrl("POSTER") || "/placeholder.svg"}
                    className="rounded-lg shadow-md"
                  />
                </div>
                <div className="flex flex-col gap-4 md:w-3/4 w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                      <Title level={2} className="mb-1">
                        {movie?.title}
                      </Title>
                      <Text type="secondary" className="block mb-3">
                        {movie?.originName}
                      </Text>
                      <div className="flex flex-wrap gap-2 my-2">
                        <Tag color="blue">{movie?.releaseYear}</Tag>
                        <Tag color="green">{movie?.genreNames}</Tag>
                        <Tag color={movie?.status === "ACTIVE" ? "success" : "warning"}>{movie?.status}</Tag>
                        <Tag color={movie?.isContract === true ? "success" : "red"}>
                          {movie?.isContract ? "Contracted" : "Not Contracted"}
                        </Tag>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!getMediaUrl("TRAILER") &&
                        !getMediaUrl("FILMVIP") &&
                        movie.status === "WAITING_FOR_UPLOADING" && (
                          <Link
                            to={`/publisher/upload/${movie?.id}`}
                            className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors duration-300"
                          >
                            <UploadOutlined className="mr-2" /> Upload Content
                          </Link>
                        )}

                      <Button
                        onClick={movie?.status === "WAITING_FOR_REVIEWING" ? handleGetPreUrlTemp : handleGetPreUrl}
                        type="primary"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        View File
                      </Button>

                      {!hiddenStatuses.includes(movie?.status) && (
                        <Link key={movie.id} to={`/publisher/updateMovie/${movie.id}`}>
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                          >
                            Update
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <Paragraph className="text-gray-700 my-4">{movie?.description}</Paragraph>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {["Director", "Duration", "Nation", "Rating"].map((field, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <Text type="secondary" className="block mb-1">
                          {field}
                        </Text>
                        <Paragraph strong className="m-0">
                          {movie?.[field.toLowerCase().replace(/ /g, "")] || "N/A"}
                        </Paragraph>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <Tabs defaultActiveKey="dashboard" className="w-full">
                {["DASHBOARD", "POSTER", "BANNER", "TRAILER", "FILM", "FILMVIP", "Actor/Acstress"].map((key) => (
                  <TabPane
                    key={key.toLowerCase()}
                    tab={
                      <span className="flex items-center">
                        {key === "DASHBOARD" ? (
                          <EyeOutlined className="mr-2" />
                        ) : key === "TRAILER" ? (
                          <PlayCircleOutlined className="mr-2" />
                        ) : key === "FILM" ? (
                          <VideoCameraOutlined className="mr-2" />
                        ) : key === "FILMVIP" ? (
                          <StarOutlined className="mr-2" />
                        ) : (
                          <PictureOutlined className="mr-2" />
                        )}
                        {key}
                      </span>
                    }
                  >
                    <div className="py-4">{renderMedia(key)}</div>
                  </TabPane>
                ))}
              </Tabs>
            </Card>
          </>
        )}

        <Modal
          title="Update Movie"
          visible={modal.type === "update" && modal.visible}
          onOk={handleUpdate}
          onCancel={() => setModal({ visible: false, type: "" })}
          width={800}
          className="update-movie-modal"
        >
          <Form layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item label="Title">
                <Input
                  value={editMovie?.title}
                  onChange={(e) => setEditMovie((prev) => ({ ...prev, title: e.target.value }))}
                />
              </Form.Item>

              <Form.Item label="Origin Name">
                <Input
                  value={editMovie?.originName}
                  onChange={(e) =>
                    setEditMovie((prev) => ({
                      ...prev,
                      originName: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item label="Release Year">
                <Input
                  value={editMovie?.releaseYear}
                  onChange={(e) =>
                    setEditMovie((prev) => ({
                      ...prev,
                      releaseYear: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item label="Duration">
                <Input
                  value={editMovie?.duration}
                  onChange={(e) =>
                    setEditMovie((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item label="Director">
                <Input
                  value={editMovie?.director}
                  onChange={(e) =>
                    setEditMovie((prev) => ({
                      ...prev,
                      director: e.target.value,
                    }))
                  }
                />
              </Form.Item>

              <Form.Item label="Nation">
                <Input
                  value={editMovie?.nation}
                  onChange={(e) =>
                    setEditMovie((prev) => ({
                      ...prev,
                      nation: e.target.value,
                    }))
                  }
                />
              </Form.Item>
            </div>

            <Form.Item label="Description">
              <Input.TextArea
                value={editMovie?.description}
                onChange={(e) =>
                  setEditMovie((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
              />
            </Form.Item>

            <Form.Item label="Genres">
              <Select
                mode="multiple"
                placeholder="Select Genres"
                value={editMovie?.genres}
                onChange={(values) => setEditMovie((prev) => ({ ...prev, genres: values }))}
                className="w-full"
              >
                {genres.map((genre) => (
                  <Select.Option key={genre.id} value={genre.id}>
                    {genre.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Persons">
              <Select
                mode="multiple"
                placeholder="Select Persons"
                value={editMovie?.persons}
                onChange={(values) => setEditMovie((prev) => ({ ...prev, persons: values }))}
                className="w-full"
              >
                {persons.map((person) => (
                  <Select.Option key={person.id} value={person.id}>
                    <div className="flex items-center gap-2">
                      <Avatar src={person.picture} alt={person.name} />
                      <span>{person.name}</span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}

export default MovieDetailPublisher

