"use client"

import { useState, useEffect } from "react"
import { Form, Input, InputNumber, Select, Button, Upload, Tabs, Card, Avatar, notification, Checkbox } from "antd"
import { UploadOutlined, PlusOutlined, InboxOutlined, LoadingOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import genreService from "../../../apis/Genre/genre"
import personService from "../../../apis/Person/person"
import uploadFileApi from "../../../apis/Upload/upload"
import movieApi from "../../../apis/Movie/movie"
import { extractUrl } from "../../../utils/extractUrl"

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs
const { Dragger } = Upload

const UpdateMoviePublisher = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams()
  const [genres, setGenres] = useState([])
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [activeTab, setActiveTab] = useState("1")
  const [medias, setMedias] = useState([])
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [moviePersons, setMoviePersons] = useState([])

  useEffect(() => {
    fetchGenres()
    fetchPersons()
    if (id) {
      fetchMovieDetails()
    }
  }, [id])

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
      setPersons(response.data)
    } catch (error) {
      console.error("Error fetching persons:", error)
      notification.error({ message: "Failed to fetch persons" })
    }
  }

  const fetchMovieDetails = async () => {
    setFetchingData(true)
    try {
      const response = await movieApi.getMovieById(id)
      const movieData = response.data

      // Extract genre IDs from genreNames string
      const genreIds = await extractGenreIdsFromNames(movieData.genreNames)

      // Set form values
      form.setFieldsValue({
        title: movieData.title,
        originName: movieData.originName,
        description: movieData.description,
        releaseYear: movieData.releaseYear,
        duration: movieData.duration,
        nation: movieData.nation,
        director: movieData.director,
        isContract: movieData.isContract,
        genres: genreIds,
        persons: movieData.person.map((p) => p.id),
      })

      // Set file URL
      setFileUrl(movieData.fileUrl || "")

      // Set medias
      setMedias(movieData.medias || [])

      // Set persons
      setMoviePersons(movieData.person || [])
    } catch (error) {
      console.error("Error fetching movie details:", error)
      notification.error({ message: "Failed to fetch movie details" })
    } finally {
      setFetchingData(false)
    }
  }

  // Helper function to extract genre IDs from comma-separated genre names
  const extractGenreIdsFromNames = async (genreNamesString) => {
    if (!genreNamesString) return []

    const genreNames = genreNamesString.split(", ")
    const matchedGenres = genres.filter((genre) => genreNames.some((name) => name.trim() === genre.name))

    return matchedGenres.map((genre) => genre.id)
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const movieData = {
        id,
        ...values,
        medias: medias.filter((media) => media.name && media.url && media.type),
        fileUrl,
      }

      await movieApi.updateMovie(id, movieData)
      notification.success({ message: "Movie updated successfully" })
      navigate("/publisher/movie")
    } catch (error) {
      console.error("Error updating movie:", error)
      notification.error({ message: "Failed to update movie" })
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = (errorInfo) => {
    console.log("Form validation failed:", errorInfo)
    notification.error({ message: "Please fill out all required fields" })
  }

  const addMedia = () => {
    setMedias([...medias, { name: "", url: "", type: "" }])
  }

  const handleMediaChange = (index, field, value) => {
    const updatedMedias = [...medias]
    updatedMedias[index][field] = value
    setMedias(updatedMedias)
  }

  const handleUpload = async (index, file) => {
    try {
      const url = await uploadFileApi.UploadPicture(file)
      handleMediaChange(index, "url", url.data[0].url)
    } catch (error) {
      console.error("Error uploading file:", error)
      notification.error({ message: "Failed to upload file" })
    }
    return false
  }

  const handleUploadFile = async (info) => {
    const selectedFile = info.file
    setUploading(true)

    try {
      const response = await uploadFileApi.UploadFileTemp(selectedFile)
      const uploadedUrl = response.data[0].url

      setFile(selectedFile)
      setFileUrl(uploadedUrl)
      notification.success({ message: "File uploaded successfully" })
    } catch (error) {
      console.error("Error uploading file:", error)
      notification.error({ message: "Failed to upload file" })
    } finally {
      setUploading(false)
    }
  }

  const handleGetPreUrlTemp = async () => {
    try {
      const extractLink = extractUrl(fileUrl)
      console.log("Extracted link:", extractLink)

      if (!extractLink || !extractLink.userId || !extractLink.fileName) {
        throw new Error("Failed to extract userId or fileName from URL")
      }
      const response = await uploadFileApi.getPreFileUrlTemp(extractLink.userId, extractLink.fileName)
      console.log("PreUrl:", response.data)
      window.open(response.data.url, "_blank")
    } catch (error) {
      console.error("Error fetching preUrl:", error)
    }
  }

  const removeMedia = (index) => {
    const updatedMedias = [...medias]
    updatedMedias.splice(index, 1)
    setMedias(updatedMedias)
  }

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingOutlined style={{ fontSize: 48 }} />
        <span className="ml-4 text-xl">Loading movie data...</span>
      </div>
    )
  }

  return (
    <div className="p-6 mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Update Movie</h1>
      <Form form={form} onFinish={onFinish} onFinishFailed={onFinishFailed} layout="vertical">
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <TabPane tab="Basic Info" key="1">
            <Card className="p-4 shadow-md">
              <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please input the title!" }]}>
                <Input />
              </Form.Item>

              <Form.Item
                name="originName"
                label="Origin Name"
                rules={[{ required: true, message: "Please input the origin name!" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                name="releaseYear"
                label="Release Year"
                rules={[{ required: true, message: "Please input the release year!" }]}
                normalize={(value) => value?.toString()}
              >
                <InputNumber className="w-full" />
              </Form.Item>

              <Form.Item
                name="duration"
                label="Duration (minutes)"
                rules={[{ required: true, message: "Please input the duration!" }]}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>

              <Form.Item name="nation" label="Nation" rules={[{ required: true, message: "Please input the nation!" }]}>
                <Input />
              </Form.Item>

              <Form.Item
                name="director"
                label="Director"
                rules={[{ required: true, message: "Please input the director!" }]}
              >
                <Input />
              </Form.Item>
            </Card>
          </TabPane>

          <TabPane tab="Eigakan policy movie" key="2">
            <Card className="p-4 shadow-md">
              <p>By submitting your movie, you agree to the following policy:</p>
              <p>
                If you do not check the box, we will pay you based on the number of views your video receives. If you
                check the box, we will create a contract and contact you for further details.
              </p>

              <Form.Item name="isContract" valuePropName="checked">
                <Checkbox>I agree to create a contract and be contacted</Checkbox>
              </Form.Item>
              <h2 className="text-red-600">*If not just press next button to continue update your movie*</h2>
            </Card>
          </TabPane>

          <TabPane tab="Genres" key="3">
            <Card className="p-4 shadow-md">
              <Form.Item
                name="genres"
                label="Genres"
                rules={[{ required: true, message: "Please select at least one genre!" }]}
              >
                <Select mode="multiple" placeholder="Select genres">
                  {genres.map((g) => (
                    <Option key={g.id} value={g.id}>
                      {g.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </TabPane>

          <TabPane tab="Persons" key="4">
            <Card className="p-4 shadow-md">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Current Cast</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moviePersons.map((person) => (
                    <Card key={person.id} size="small" className="flex items-center">
                      <div className="flex items-center gap-3">
                        <Avatar src={person.picture} size={64} />
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.job}</p>
                          <p className="text-xs text-gray-400">Born: {person.birthday}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Form.Item name="persons" label="Update Cast">
                <Select mode="multiple" placeholder="Select actors" optionLabelProp="label">
                  {persons.map((p) => (
                    <Select.Option key={p.id} value={p.id} label={p.name}>
                      <div className="flex items-center gap-2">
                        <Avatar src={p.picture} alt={p.name} />
                        <span>{p.name}</span>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </TabPane>

          <TabPane tab="Media" key="5">
            <Card className="p-4 shadow-md">
              <h3 className="text-lg font-medium mb-4">Current Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {medias.map((media, index) => (
                  <Card key={index} size="small" className="overflow-hidden">
                    <div className="flex flex-col">
                      <div className="relative">
                        {media.type === "TRAILER" || media.type === "FILMVIP" ? (
                          <div className="aspect-video bg-gray-100 flex items-center justify-center">
                            <iframe src={media.url} className="w-full h-full" title={media.name} allowFullScreen />
                          </div>
                        ) : (
                          <img
                            src={media.url || "/placeholder.svg"}
                            alt={media.name}
                            className="w-full aspect-video object-cover"
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          {media.type}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="font-medium truncate">{media.name}</p>
                        <div className="flex justify-between mt-2">
                          <Button size="small" danger onClick={() => removeMedia(index)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <h3 className="text-lg font-medium mb-4">Add New Media</h3>
              <div className="space-y-4">
                {medias
                  .filter((m) => !m.id)
                  .map((media, index) => (
                    <div key={`new-${index}`} className="flex gap-2 mb-2 items-center">
                      <Input
                        placeholder="Media Name"
                        value={media.name}
                        onChange={(e) => handleMediaChange(index, "name", e.target.value)}
                      />
                      <Upload showUploadList={false} beforeUpload={(file) => handleUpload(index, file)}>
                        <Button icon={<UploadOutlined />}>Upload File</Button>
                      </Upload>
                      {media.url && (
                        <img
                          src={media.url || "/placeholder.svg"}
                          alt="media"
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <Select
                        placeholder="Type"
                        value={media.type}
                        onChange={(v) => handleMediaChange(index, "type", v)}
                        className="w-32"
                      >
                        <Option value="POSTER">Poster</Option>
                        <Option value="BANNER">Banner</Option>
                      </Select>
                    </div>
                  ))}
                <Button type="dashed" onClick={addMedia} block icon={<PlusOutlined />}>
                  Add Media
                </Button>
              </div>
            </Card>
          </TabPane>

          <TabPane tab="File Movie" key="6">
            <Card className="p-4 shadow-md">
              <h3 className="text-lg font-medium mb-4">Current File</h3>
              {fileUrl ? (
                <div className="mb-6 p-4 border rounded-md">
                  <p className="font-medium">Current file:</p>
                  <span onClick={handleGetPreUrlTemp} className="text-blue-500 underline cursor-pointer">
                    View current file
                  </span>
                </div>
              ) : (
                <p className="mb-6 text-gray-500">No file currently uploaded</p>
              )}

              <h3 className="text-lg font-medium mb-2">Update File</h3>
              <p className="text-red-500 mb-4">*Please upload a file that identifies this movie as your property.*</p>

              <Dragger
                name="file"
                multiple={false}
                beforeUpload={() => false}
                onChange={handleUploadFile}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">{uploading ? <LoadingOutlined /> : <InboxOutlined />}</p>
                <p className="ant-upload-text">
                  {uploading ? "Uploading..." : "Upload a file to verify your movie ownership."}
                </p>
              </Dragger>

              {file && <p className="mt-2">Selected File: {file.name}</p>}

              {file && fileUrl && (
                <div className="mt-4">
                  <p>Your new file:</p>
                  <span onClick={handleGetPreUrlTemp} className="text-blue-500 underline cursor-pointer">
                    {file.name}
                  </span>
                  <h2 className="text-red-500">* Please check your file carefully before submitting.*</h2>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
        <div className="flex justify-between mt-6">
          {activeTab !== "1" && <Button onClick={() => setActiveTab(String(Number(activeTab) - 1))}>Previous</Button>}
          {activeTab !== "7" ? (
            <Button type="primary" onClick={() => setActiveTab(String(Number(activeTab) + 1))}>
              Next
            </Button>
          ) : (
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Movie
            </Button>
          )}
        </div>
      </Form>
    </div>
  )
}

export default UpdateMoviePublisher

