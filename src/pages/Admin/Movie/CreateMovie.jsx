"use client"

import { useState, useEffect } from "react"
import { Form, Input, InputNumber, Select, Button, Upload, Tabs, Card, Avatar, notification, DatePicker, Checkbox} from "antd"
const { Dragger } = Upload;

import { UploadOutlined, PlusOutlined,InboxOutlined,LoadingOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import genreService from "../../../apis/Genre/genre"
import personService from "../../../apis/Person/person"
import uploadFileApi from "../../../apis/Upload/upload"
import movieApi from "../../../apis/Movie/movie"
import { extractUrl } from "../../../utils/extractUrl";

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const CreateMovie = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [genres, setGenres] = useState([])
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("1")
  const [medias, setMedias] = useState([{ name: "", url: "", type: "" }])
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);


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
    setLoading(true);
    try {
      const movieData = {
        ...values,
        medias: medias.filter((media) => media.name && media.url && media.type),
        fileUrl, // Thêm URL file vào payload
      };
      
      await movieApi.createMovie(movieData);
      notification.success({ message: "Movie created successfully" });
      navigate("/");
    } catch (error) {
      console.error("Error creating movie:", error);
      notification.error({ message: "Failed to create movie" });
    } finally {
      setLoading(false);
    }
  };
  

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
    const selectedFile = info.file;
    setUploading(true); // Bắt đầu hiển thị loading
  
    try {
      const response = await uploadFileApi.UploadFileTemp(selectedFile);
      const uploadedUrl = response.data[0].url; // Lấy URL từ API
  
      setFile(selectedFile);
      setFileUrl(uploadedUrl);
      notification.success({ message: "File uploaded successfully" });
    } catch (error) {
      console.error("Error uploading file:", error);
      notification.error({ message: "Failed to upload file" });
    } finally {
      setUploading(false); // Tắt loading khi xong
    }
  };
  
  const handleGetPreUrlTemp = async () => {
    try {
      const extractLink = extractUrl(fileUrl);
      console.log("Extracted link:", extractLink);

      if (!extractLink || !extractLink.userId || !extractLink.fileName) {
        throw new Error("Failed to extract userId or fileName from URL");
      }
      const response = await uploadFileApi.getPreFileUrlTemp(
        extractLink.userId,
        extractLink.fileName
      );
      console.log("PreUrl:", response.data);
      //setPreUrl(response.data.url);
      window.open(response.data.url, "_blank");
    } catch (error) {
      console.error("Error fetching preUrl:", error);
    }
  };
  

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
                rules={[
                  { required: true, message: "Please input the release year!" },
                  {
                    validator: (_, value) => {
                      const currentYear = new Date().getFullYear();
                      if (value && (value > currentYear || value < 1888)) {
                        return Promise.reject(new Error(`Release year must be between 1888 and ${currentYear}.`));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                normalize={(value) => value?.toString()}
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

          <TabPane tab="File Movie" key="6">
            <Card className="p-4 shadow-md">
              
              <h2 className="text-red-500">*Please upload a file that identifies this movie as your property.*</h2>
              
              <Dragger
                name="file"
                multiple={false}
                beforeUpload={() => false}
                onChange={handleUploadFile}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  {uploading ? <LoadingOutlined /> : <InboxOutlined />}
                </p>
                <p className="ant-upload-text">
                  {uploading ? "Uploading..." : "Upload a file to verify your movie ownership."}
                </p>
              </Dragger>

              {file && <p className="mt-2">Selected File: {file.name}</p>}

              {fileUrl && (
                <div className="mt-4">
                  <p>Your file here:</p>
                  <span 
                    onClick={handleGetPreUrlTemp} 
                    style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }}
                  >
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
              Create Movie
            </Button>
          )}
        </div>
      </Form>
    </div>
  )
}

export default CreateMovie

