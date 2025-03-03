"use client"

import { useState, useEffect } from "react"
import { Form, Input, InputNumber, Select, Button, Upload, Tabs, Card, Avatar, notification, DatePicker, Checkbox } from "antd"
import { UploadOutlined, PlusOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import genreService from "../../../apis/Genre/genre"
import personService from "../../../apis/Person/person"
import uploadFileApi from "../../../apis/Upload/upload"
import movieApi from "../../../apis/Movie/movie"

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const CreateMoviePublisher = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [genres, setGenres] = useState([])
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("1")
  const [medias, setMedias] = useState([{ name: "", url: "", type: "" }])

  useEffect(() => {
    fetchGenres()
    fetchPersons()
  }, [])

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

  const onFinish = async (values) => {
    console.log("Form values:", values)
    console.log("Medias:", medias)
    setLoading(true)
    try {
      const movieData = {
        ...values,
        medias: medias.filter((media) => media.name && media.url && media.type),
      }
      console.log("Movie data to be sent:", movieData)
      const response = await movieApi.createMovie(movieData)
      console.log("Movie created:", response)
      notification.success({ message: "Movie created successfully" })
      navigate("/publisher/movie")
    } catch (error) {
      console.error("Error creating movie:", error)
      notification.error({ message: "Failed to create movie" })
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

  return (
    <div className="p-6 mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Create New Movie</h1>
      <Form form={form} onFinish={onFinish} onFinishFailed={onFinishFailed} layout="vertical">
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          
          <TabPane tab="Basic Info" key="1">
            <Card className="p-4 shadow-md">
              
              <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please input the title!" }]}>
                <Input />
              </Form.Item>

              <Form.Item name="originName" label="OriginName" rules={[{ required: true, message: "Please input the origin name!" }]}>
                <Input />
              </Form.Item>
              
              <Form.Item name="description" label="Description">
                <TextArea rows={4} />
              </Form.Item>
              
              <Form.Item 
                name="releaseYear" 
                label="Release Year" 
                rules={[{ required: true, message: "Please input the release year!" }]}
                normalize={(value) => value?.toString()} // Chuyển số thành string
              >
                <InputNumber className="w-full" />
              </Form.Item>

              
              <Form.Item name="duration" label="Duration (minutes)" rules={[{ required: true, message: "Please input the duration!" }]}>
                <InputNumber min={1} className="w-full" />
              </Form.Item>

              <Form.Item name="nation" label="Nation" rules={[{ required: true, message: "Please input the nation!" }]}>
                <Input />
              </Form.Item>
              
              <Form.Item name="director" label="Director" rules={[{ required: true, message: "Please input the director!" }]}>
                <Input />
              </Form.Item>
            
            </Card>
          </TabPane>

          <TabPane tab="Eigakan policy movie" key="2">
            <Card className="p-4 shadow-md">
              <p>
                By submitting your movie, you agree to the following policy:
              </p>
              <p>
                If you do not check the box, we will pay you based on the number of views your video receives.  
                If you check the box, we will create a contract and contact you for further details.
              </p>

              {/* Checkbox */}
              <Form.Item name="isContract" valuePropName="checked" initialValue={false}>
                <Checkbox>I agree to create a contract and be contacted</Checkbox>
              </Form.Item>
              <h2 className="text-red-600">*If not just press next button to continute create your movie*</h2>
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
              <Form.Item name="persons" label="Actors">
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
              {medias.map((media, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <Input
                    placeholder="Media Name"
                    value={media.name}
                    onChange={(e) => handleMediaChange(index, "name", e.target.value)}
                  />
                  <Upload showUploadList={false} beforeUpload={(file) => handleUpload(index, file)}>
                    <Button icon={<UploadOutlined />}>Upload File</Button>
                  </Upload>
                  {media.url && (
                    <img src={media.url || "/placeholder.svg"} alt="media" className="w-10 h-10 object-cover rounded" />
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
            </Card>
          </TabPane>

        </Tabs>
        <div className="flex justify-between mt-6">
          {activeTab !== "1" && <Button onClick={() => setActiveTab(String(Number(activeTab) - 1))}>Previous</Button>}
          {activeTab !== "6" ? (
            <Button type="primary" onClick={() => setActiveTab(String(Number(activeTab) + 1))}>
              Next
            </Button>
          ) : (
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Movie
            </Button>
          )}
        </div>
      </Form>
    </div>
  )
}

export default CreateMoviePublisher

