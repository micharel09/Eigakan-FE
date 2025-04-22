"use client"

import { useState, useEffect } from "react"
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Upload,
  Tabs,
  Card,
  Avatar,
  notification,
  Checkbox,
  Alert,
  Tooltip,
  Spin,
  Progress,
  Modal,
  DatePicker,
  Tag,
  Empty,
} from "antd"
const { Dragger } = Upload

import {
  UploadOutlined,
  PlusOutlined,
  InboxOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  FileImageOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import genreService from "../../../apis/Genre/genre"
import personService from "../../../apis/Person/person"
import uploadFileApi from "../../../apis/Upload/upload"
import movieApi from "../../../apis/Movie/movie"
import { extractUrl } from "../../../utils/extractUrl"
import dayjs from "dayjs"
import axios from "axios"
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

// Define standard dimensions for media types
const MEDIA_STANDARDS = {
  POSTER: {
    width: 1000,
    height: 1500,
    ratio: "2:3",
    description: "Standard Poster (2:3): 1000x1500px or equivalent ratio",
    label: "Poster",
  },
  BANNER: {
    width: 1920,
    height: 1080,
    ratio: "16:9",
    description: "Standard Banner (16:9): 1920x1080px or equivalent ratio",
    label: "Banner",
  },
  TRAILER: {
    description: "Movie trailer video link",
    label: "Trailer",
  },
  FILMVIP: {
    description: "High-quality movie file for VIP users",
    label: "VIP Film",
  },
}

const CreateMoviePublisher = () => {
  // Add a new form instance specifically for the modal
  const [form] = Form.useForm()
  const [modalForm] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams()
  const [genres, setGenres] = useState([])
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("1")
  const [medias, setMedias] = useState([])
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [mediaErrors, setMediaErrors] = useState([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(null)
  const [countries, setCountries] = useState([])
  const [searchText, setSearchText] = useState("")
  const [creating, setCreating] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newPersonName, setNewPersonName] = useState("") // để prefill tên
  const [isUploading, setIsUploading] = useState(false)
  const [abortController, setAbortController] = useState(null)

  // Track which media types have been used
  const [usedMediaTypes, setUsedMediaTypes] = useState({
    POSTER: false,
    BANNER: false,
    TRAILER: false,
    FILMVIP: false,
  })

  // Video upload states
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    fetchGenres()
    fetchPersons()

    // Initialize with one empty media item
    if (medias.length === 0) {
      setMedias([{ name: "", localFile: null, previewUrl: "", type: "", dimensions: null }])
      setMediaErrors([null])
    }
  }, [])

  // Update usedMediaTypes whenever medias change
  useEffect(() => {
    const newUsedTypes = {
      POSTER: false,
      BANNER: false,
      TRAILER: false,
      FILMVIP: false,
    }

    medias.forEach((media) => {
      if (media.type) {
        newUsedTypes[media.type] = true
      }
    })

    setUsedMediaTypes(newUsedTypes)
  }, [medias])

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => res.json())
      .then((data) => {
        const countryNames = data.map((c) => c.name.common).sort((a, b) => a.localeCompare(b)) // sort alphabetically
        setCountries(countryNames)
      })
  }, [])

  // Calculate estimated time remaining for video uploads
  useEffect(() => {
    if (uploading && startTime && progress > 0) {
      const elapsedSeconds = (Date.now() - startTime) / 1000
      const totalEstimatedSeconds = (elapsedSeconds / progress) * 100
      const remainingSeconds = totalEstimatedSeconds - elapsedSeconds
      setEstimatedTime(Math.round(remainingSeconds))
    }
  }, [progress, startTime, uploading])

  // Update the handleCancel function to reset the modal form
  const handleCancel = () => {
    setIsModalVisible(false)
    setSearchText("")
    modalForm.resetFields()
  }

  // Update the handleUploadp function to work with modalForm
  const handleUploadp = async ({ file, onSuccess, onError }) => {
    setIsUploading(true)
    const controller = new AbortController()
    setAbortController(controller)

    try {
      if (!file) throw new Error("No file selected")
      const response = await personService.uploadImage(file, controller.signal)

      if (!response || !isModalVisible) {
        setIsUploading(false)
        return
      }

      if (response?.data?.status) {
        form.setFieldsValue({
          image: [file],
          picture: response.data.data[0].url,
        })
        notification.success({
          message: "Upload Successful",
          description: "Image has been uploaded successfully",
        })
        onSuccess(response.data)
      } else {
        throw new Error(response?.data?.message || "Upload failed")
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        onError(error)
        notification.error({
          message: "Upload Failed",
          description: error.message || "Failed to upload image",
        })
      }
    } finally {
      setIsUploading(false)
      setAbortController(null)
    }
  }

  // Update the handleSubmit function to use modalForm
  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      const response = await personService.createPerson(values)
      if (response.success) {
        notification.success({
          message: "Created Successfully",
          description: `Added ${values.name} successfully.`,
        })
        modalForm.resetFields()
        handleCancel()
        // Refresh the persons list to include the new director
        fetchPersons()
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      })
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

  const fetchPersons = async (pageNumber, pageSize) => {
    try {
      const response = await personService.getAllPerson((pageNumber = 1), (pageSize = 100))
      setPersons(response.data)
    } catch (error) {
      console.error("Error fetching persons:", error)
      notification.error({ message: "Failed to fetch persons" })
    }
  }

  const onFinish = async (values) => {
    // Check if all required media types are present
    const missingTypes = []
    if (!usedMediaTypes.POSTER) missingTypes.push("Poster")
    if (!usedMediaTypes.BANNER) missingTypes.push("Banner")
    if (!usedMediaTypes.TRAILER) missingTypes.push("Trailer")
    if (!usedMediaTypes.FILMVIP) missingTypes.push("VIP Film")

    if (missingTypes.length > 0) {
      notification.error({
        message: "Missing Required Media",
        description: `Please add the following required media types: ${missingTypes.join(", ")}`,
      })
      setActiveTab("4") // Switch to Media tab
      return
    }

    // Kiểm tra các media trước khi submit
    const errors = validateAllMedia()
    if (errors.length > 0) {
      setActiveTab("4") // Chuyển đến tab Media
      return
    }

    setLoading(true)
    try {
      // Upload all media files first
      const uploadedMedia = await uploadAllMedia()

      const movieData = {
        ...values,
        medias: uploadedMedia, // Use the uploaded media with URLs
        fileUrl, // Thêm URL file vào payload
      }

      await movieApi.createMovie(movieData)
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
    // Check if all media types are already used
    const allTypesUsed =
      usedMediaTypes.POSTER && usedMediaTypes.BANNER && usedMediaTypes.TRAILER && usedMediaTypes.FILMVIP

    if (allTypesUsed) {
      notification.warning({
        message: "All Media Types Added",
        description: "You have already added all required media types (Poster, Banner, Trailer, VIP Film).",
      })
      return
    }

    setMedias([...medias, { name: "", localFile: null, previewUrl: "", type: "", dimensions: null }])
    setMediaErrors([...mediaErrors, null])
  }

  const handleMediaChange = (index, field, value) => {
    const updatedMedias = [...medias]

    // If changing media type
    if (field === "type") {
      // Check if this type is already used by another media item
      const isTypeUsedElsewhere = medias.some((media, i) => i !== index && media.type === value)

      if (isTypeUsedElsewhere) {
        notification.error({
          message: "Media Type Already Used",
          description: `You have already added a ${MEDIA_STANDARDS[value].label}. Each type can only be added once.`,
        })
        return
      }

      // If this media item already had a type, mark the old type as unused
      if (updatedMedias[index].type) {
        setUsedMediaTypes((prev) => ({
          ...prev,
          [updatedMedias[index].type]: false,
        }))
      }

      // Mark the new type as used
      setUsedMediaTypes((prev) => ({
        ...prev,
        [value]: true,
      }))
    }

    updatedMedias[index][field] = value

    // Reset errors when type changes
    if (field === "type") {
      const updatedErrors = [...mediaErrors]
      updatedErrors[index] = null
      setMediaErrors(updatedErrors)

      // If the media already has a URL and dimensions and the type changes to POSTER or BANNER
      // we need to validate the dimensions against the new media type
      if (
        updatedMedias[index].previewUrl &&
        updatedMedias[index].dimensions &&
        (value === "POSTER" || value === "BANNER")
      ) {
        const { width, height } = updatedMedias[index].dimensions
        validateExistingImageDimensions(index, value, width, height)
      }
    }

    setMedias(updatedMedias)
  }

  // Validate dimensions of an existing image when media type changes
  const validateExistingImageDimensions = (index, mediaType, width, height) => {
    const standard = MEDIA_STANDARDS[mediaType]

    if (!standard) return

    // Calculate actual ratio
    const actualRatio = (width / height).toFixed(2)
    const expectedRatio = (standard.width / standard.height).toFixed(2)

    // Allow 5% tolerance
    const ratioTolerance = 0.05
    const isRatioCorrect = Math.abs(actualRatio - expectedRatio) <= ratioTolerance

    // Update errors if any
    const updatedErrors = [...mediaErrors]

    if (!isRatioCorrect) {
      updatedErrors[index] = `Incorrect ratio. Required: ${standard.ratio}, actual: ${width}x${height} (${actualRatio})`
      setMediaErrors(updatedErrors)

      notification.warning({
        message: "Media type changed with incompatible image",
        description: `Your existing image (${width}x${height}) doesn't match the ${mediaType.toLowerCase()} ratio requirements (${
          standard.ratio
        }). Consider uploading a new image.`,
      })
    } else {
      updatedErrors[index] = null
      setMediaErrors(updatedErrors)

      notification.success({
        message: "Media type changed successfully",
        description: `Your existing image fits the ${mediaType.toLowerCase()} ratio requirements.`,
      })
    }
  }

  // Kiểm tra kích thước ảnh để đảm bảo đúng tỷ lệ
  const checkImageDimensions = (file, index) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          const width = img.width
          const height = img.height
          const mediaType = medias[index].type

          // Lưu kích thước thực tế và tạo preview URL
          const updatedMedias = [...medias]
          updatedMedias[index].dimensions = { width, height }
          updatedMedias[index].previewUrl = e.target.result
          updatedMedias[index].localFile = file
          setMedias(updatedMedias)

          // Chỉ kiểm tra kích thước nếu là POSTER hoặc BANNER
          if (mediaType === "POSTER" || mediaType === "BANNER") {
            const standard = MEDIA_STANDARDS[mediaType]

            if (!standard) {
              resolve(true)
              return
            }

            // Tính toán tỷ lệ thực tế
            const actualRatio = (width / height).toFixed(2)
            const expectedRatio = (standard.width / standard.height).toFixed(2)

            // Cho phép sai số 5%
            const ratioTolerance = 0.05
            const isRatioCorrect = Math.abs(actualRatio - expectedRatio) <= ratioTolerance

            // Cập nhật lỗi nếu có
            const updatedErrors = [...mediaErrors]

            if (!isRatioCorrect) {
              updatedErrors[index] =
                `Incorrect ratio. Required: ${standard.ratio}, actual: ${width}x${height} (${actualRatio})`
              setMediaErrors(updatedErrors)
              notification.warning({
                message: "Incorrect image dimensions",
                description: `Image ${mediaType.toLowerCase()} should have a ratio of ${
                  standard.ratio
                } (e.g., ${standard.width}x${standard.height}px). Your image: ${width}x${height}px.`,
              })
              resolve(false)
            } else {
              updatedErrors[index] = null
              setMediaErrors(updatedErrors)
              resolve(true)
            }
          } else {
            resolve(true)
          }
        }
      }
    })
  }

  // Upload all media files before submitting
  const uploadAllMedia = async () => {
    const mediaToUpload = medias.filter((media) => media.name && (media.localFile || media.url) && media.type)

    if (mediaToUpload.length === 0) {
      return []
    }

    setUploadingMedia(true)
    const uploadedMedia = []

    try {
      for (let i = 0; i < mediaToUpload.length; i++) {
        setCurrentUploadingIndex(i)
        const media = mediaToUpload[i]

        // If media already has a URL (from video upload), use that
        if (media.url) {
          uploadedMedia.push({
            name: media.name,
            url: media.url,
            type: media.type,
            movieId: id,
          })
          continue
        }

        // Otherwise upload the local file
        if (media.localFile) {
          const url = await uploadFileApi.UploadPicture(media.localFile)
          uploadedMedia.push({
            name: media.name,
            url: url.data[0].url,
            type: media.type,
            movieId: id,
          })
        }
      }

      notification.success({
        message: "Media uploaded successfully",
        description: `Uploaded ${uploadedMedia.length} media files`,
      })

      return uploadedMedia
    } catch (error) {
      console.error("Error uploading media:", error)
      notification.error({
        message: "Failed to upload media",
        description: "There was an error uploading your media files. Please try again.",
      })
      return []
    } finally {
      setUploadingMedia(false)
      setCurrentUploadingIndex(null)
    }
  }

  // Hàm kiểm tra tất cả media trước khi submit
  const validateAllMedia = () => {
    const errors = []

    medias.forEach((media, index) => {
      if (media.previewUrl && media.type && (media.type === "POSTER" || media.type === "BANNER")) {
        if (mediaErrors[index]) {
          errors.push({
            index,
            message: mediaErrors[index],
          })
        }

        // Kiểm tra nếu chưa có thông tin dimensions (chưa kiểm tra kích thước)
        if (!media.dimensions) {
          errors.push({
            index,
            message: `Image ${media.type.toLowerCase()} has not been checked for dimensions`,
          })
        }
      }
    })

    // Hiển thị thông báo nếu có lỗi
    if (errors.length > 0) {
      notification.error({
        message: "Media size errors",
        description: "Some images do not match the standard ratio. Please check the Media tab.",
      })
    }

    return errors
  }

  // Format time remaining for video uploads
  const formatTimeRemaining = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
  }

  // Handle video upload to Bunny CDN
  const handleVideoUpload = async (index, file) => {
    const updatedMedias = [...medias]
    const mediaType = updatedMedias[index].type

    if (!mediaType || (mediaType !== "TRAILER" && mediaType !== "FILMVIP")) {
      notification.warning({
        message: "Invalid Media Type",
        description: "Please select either TRAILER or FILMVIP for video uploads.",
      })
      return false
    }

    setUploading(true)
    setProgress(0)
    setCurrentUploadingIndex(index)
    setStartTime(Date.now())

    try {
      // Create video in Bunny CDN
      const createResponse = await fetch("https://eigakan2222-001-site1.jtempurl.com/api/Upload/upload_VideoBunny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name }),
      })

      const createData = await createResponse.json()
      if (!createResponse.ok) throw new Error("Couldn't create video")

      const videoId = createData.videoUrl
      console.log("Video ID:", videoId)

      const xhr = new XMLHttpRequest()
      xhr.open("PUT", `https://video.bunnycdn.com/library/384568/videos/${videoId}`, true)
      xhr.setRequestHeader("AccessKey", "5dd7b859-f5cf-4d94-a0b71073f51a-3048-4dfd")
      xhr.setRequestHeader("Content-Type", "application/octet-stream")

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setProgress(percentComplete)
        }
      }

      xhr.onload = () => {
        setUploading(false)
        setCurrentUploadingIndex(null)
        setEstimatedTime(null)

        if (xhr.status === 200) {
          const newVideoUrl = `https://iframe.mediadelivery.net/embed/384568/${videoId}`

          // Update the media item with the video URL
          updatedMedias[index].url = newVideoUrl
          updatedMedias[index].previewUrl = newVideoUrl
          setMedias([...updatedMedias])

          notification.success({
            message: "Upload Successful",
            description: "Your video has been uploaded successfully!",
          })
        } else {
          notification.error({
            message: "Upload Failed",
            description: "There was an error uploading your video.",
          })
        }
      }

      xhr.onerror = () => {
        setUploading(false)
        setCurrentUploadingIndex(null)
        setEstimatedTime(null)
        notification.error({
          message: "Upload Error",
          description: "There was an error connecting to the server.",
        })
      }

      xhr.send(file)
      return false // Prevent default upload behavior
    } catch (error) {
      setUploading(false)
      setCurrentUploadingIndex(null)
      setEstimatedTime(null)
      console.error(error)
      notification.error({
        message: "Upload Error",
        description: "There was an error processing your file.",
      })
      return false
    }
  }

  const handleUpload = async (index, file) => {
    if (!medias[index].type) {
      notification.warning({
        message: "Please select media type before uploading",
      })
      return false
    }

    // Handle video uploads differently
    if (medias[index].type === "TRAILER" || medias[index].type === "FILMVIP") {
      if (file.type.startsWith("video/")) {
        return handleVideoUpload(index, file)
      } else {
        notification.error({
          message: "Invalid File Type",
          description: `Please select a video file for ${medias[index].type.toLowerCase()}.`,
        })
        return false
      }
    }

    // Check image dimensions for POSTER or BANNER
    if (medias[index].type === "POSTER" || medias[index].type === "BANNER") {
      const isValid = await checkImageDimensions(file, index)
      if (!isValid) {
        // Still allow upload but show warning
        notification.warning({
          message: "Continue Upload",
          description: "You can still use this image, but it may not display well on the website.",
        })
      }
    } else {
      // For non-image files (like URL inputs), just store the file
      const updatedMedias = [...medias]
      updatedMedias[index].localFile = file

      // Create a temporary preview URL if possible
      const reader = new FileReader()
      reader.onload = (e) => {
        updatedMedias[index].previewUrl = e.target.result
        setMedias([...updatedMedias])
      }
      reader.readAsDataURL(file)
    }

    return false
  }

  const handleUploadFile = async (info) => {
    const selectedFile = info.file
    setUploading(true) // Bắt đầu hiển thị loading

    try {
      const response = await uploadFileApi.UploadFileTemp(selectedFile)
      const uploadedUrl = response.data[0].url // Lấy URL từ API

      setFile(selectedFile)
      setFileUrl(uploadedUrl)
      notification.success({ message: "File uploaded successfully" })
    } catch (error) {
      console.error("Error uploading file:", error)
      notification.error({ message: "Failed to upload file" })
    } finally {
      setUploading(false) // Tắt loading khi xong
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
      //setPreUrl(response.data.url);
      window.open(response.data.url, "_blank")
    } catch (error) {
      console.error("Error fetching preUrl:", error)
    }
  }

  const removeMedia = (index) => {
    const updatedMedias = [...medias]
    const mediaType = updatedMedias[index].type

    // If removing a media with a type, mark that type as unused
    if (mediaType) {
      setUsedMediaTypes((prev) => ({
        ...prev,
        [mediaType]: false,
      }))
    }

    updatedMedias.splice(index, 1)
    setMedias(updatedMedias)

    const updatedErrors = [...mediaErrors]
    updatedErrors.splice(index, 1)
    setMediaErrors(updatedErrors)

    // If no media items left, add an empty one
    if (updatedMedias.length === 0) {
      setMedias([{ name: "", localFile: null, previewUrl: "", type: "", dimensions: null }])
      setMediaErrors([null])
    }
  }

  // Get available media types (those that haven't been used yet)
  const getAvailableMediaTypes = () => {
    const availableTypes = []

    if (!usedMediaTypes.POSTER) availableTypes.push("POSTER")
    if (!usedMediaTypes.BANNER) availableTypes.push("BANNER")
    if (!usedMediaTypes.TRAILER) availableTypes.push("TRAILER")
    if (!usedMediaTypes.FILMVIP) availableTypes.push("FILMVIP")

    return availableTypes
  }

  // Check if all media types are used
  const allMediaTypesUsed = () => {
    return usedMediaTypes.POSTER && usedMediaTypes.BANNER && usedMediaTypes.TRAILER && usedMediaTypes.FILMVIP
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
                normalize={(value) => value?.toString()} // Chuyển số thành string
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
                <Select
                  showSearch
                  placeholder="Select nation"
                  filterOption={(input, option) => option?.children?.toLowerCase().includes(input.toLowerCase())}
                >
                  {countries.map((country) => (
                    <Select.Option key={country} value={country}>
                      {country}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="director"
                label="Director"
                rules={[{ required: true, message: "Please select the director!" }]}
              >
                <Select
                  showSearch
                  placeholder="Select director"
                  optionLabelProp="label"
                  onSearch={(value) => setSearchText(value)}
                  filterOption={(input, option) => option?.label?.toLowerCase().includes(input.toLowerCase())}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {searchText && !persons.find((p) => p.name === searchText) && (
                        <div className="p-2 border-t text-center">
                          <Button type="link" onClick={() => setIsModalVisible(true)} loading={creating}>
                            Create "{searchText}" as new loading={creating} Create "{searchText}" as new director
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                >
                  
                  {persons.map((p) => (
                    <Select.Option key={p.id} value={p.name} label={p.name}>
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

          <TabPane tab="Genres" key="2">
            <Card className="p-4 shadow-md">
              <Form.Item
                name="genres"
                label="Genres"
                rules={[
                  {
                    required: true,
                    message: "Please select at least one genre!",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Select genres"
                  optionLabelProp="label"
                  filterOption={(input, option) => option?.label?.toLowerCase().includes(input.toLowerCase())}
                >
                  {genres.map((g) => (
                    <Option key={g.id} value={g.id} label={g.name}>
                      {g.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </TabPane>

          <TabPane tab="Persons" key="3">
            <Card className="p-4 shadow-md">
              <Form.Item name="persons" label="Actors">
                <Select
                  showSearch
                  placeholder="Select person"
                  mode="multiple"
                  optionLabelProp="label"
                  onSearch={(value) => setSearchText(value)}
                  filterOption={(input, option) => option?.label?.toLowerCase().includes(input.toLowerCase())}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      {searchText && !persons.find((p) => p.name === searchText) && (
                        <div className="p-2 border-t text-center">
                          <Button type="link" onClick={() => setIsModalVisible(true)} loading={creating}>
                            Create "{searchText}" as new director
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                >
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

          <TabPane tab="Media" key="4">
            <Card className="p-4 shadow-md">
              {/* Media Status Summary */}
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <h3 className="text-lg font-medium mb-3">Required Media Types</h3>
                  <div className="flex flex-wrap gap-2">
                    <Tag color={usedMediaTypes.POSTER ? "success" : "error"} className="px-3 py-1 text-sm">
                      {usedMediaTypes.POSTER ? (
                        <CheckCircleOutlined className="mr-1" />
                      ) : (
                        <CloseCircleOutlined className="mr-1" />
                      )}
                      Poster
                    </Tag>
                    <Tag color={usedMediaTypes.BANNER ? "success" : "error"} className="px-3 py-1 text-sm">
                      {usedMediaTypes.BANNER ? (
                        <CheckCircleOutlined className="mr-1" />
                      ) : (
                        <CloseCircleOutlined className="mr-1" />
                      )}
                      Banner
                    </Tag>
                    <Tag color={usedMediaTypes.TRAILER ? "success" : "error"} className="px-3 py-1 text-sm">
                      {usedMediaTypes.TRAILER ? (
                        <CheckCircleOutlined className="mr-1" />
                      ) : (
                        <CloseCircleOutlined className="mr-1" />
                      )}
                      Trailer
                    </Tag>
                    <Tag color={usedMediaTypes.FILMVIP ? "success" : "error"} className="px-3 py-1 text-sm">
                      {usedMediaTypes.FILMVIP ? (
                        <CheckCircleOutlined className="mr-1" />
                      ) : (
                        <CloseCircleOutlined className="mr-1" />
                      )}
                      VIP Film
                    </Tag>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    All four media types are required. Each type can only be added once.
                  </div>
                </div>

                <Alert
                  message="Media Standards"
                  description={
                    <div className="space-y-2">
                      <p>
                        <strong>Poster:</strong> Ratio 2:3 (e.g., 1000x1500px)
                      </p>
                      <p>
                        <strong>Banner:</strong> Ratio 16:9 (e.g., 1920x1080px)
                      </p>
                      <p>
                        <strong>Trailer:</strong> Video file for movie trailer
                      </p>
                      <p>
                        <strong>VIP Film:</strong> Full movie video file for VIP users
                      </p>
                    </div>
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />
              </div>

              <div className="space-y-6">
                {medias.length === 0 ? (
                  <Empty description="No media items added yet" />
                ) : (
                  medias.map((media, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-medium text-gray-700">Media Item {index + 1}</h3>
                          {index > 0 && (
                            <Button danger type="text" onClick={() => removeMedia(index)} icon={<DeleteOutlined />} />
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Media Name <span className="text-red-500">*</span>
                              </label>
                              <Input
                                className="w-full"
                                placeholder="Media Name"
                                value={media.name}
                                onChange={(e) => handleMediaChange(index, "name", e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Media Type <span className="text-red-500">*</span>
                              </label>
                              <Select
                                className="w-full"
                                placeholder="Type"
                                value={media.type}
                                onChange={(v) => handleMediaChange(index, "type", v)}
                              >
                                {/* Only show media types that haven't been used yet or the current type of this media */}
                                {(!usedMediaTypes.POSTER || media.type === "POSTER") && (
                                  <Option value="POSTER">
                                    <div className="flex items-center">
                                      <span>Poster</span>
                                      <Tooltip title={MEDIA_STANDARDS.POSTER.description}>
                                        <InfoCircleOutlined className="ml-2 text-gray-400" />
                                      </Tooltip>
                                    </div>
                                  </Option>
                                )}

                                {(!usedMediaTypes.BANNER || media.type === "BANNER") && (
                                  <Option value="BANNER">
                                    <div className="flex items-center">
                                      <span>Banner</span>
                                      <Tooltip title={MEDIA_STANDARDS.BANNER.description}>
                                        <InfoCircleOutlined className="ml-2 text-gray-400" />
                                      </Tooltip>
                                    </div>
                                  </Option>
                                )}

                                {(!usedMediaTypes.TRAILER || media.type === "TRAILER") && (
                                  <Option value="TRAILER">
                                    <div className="flex items-center">
                                      <span>Trailer</span>
                                      <Tooltip title={MEDIA_STANDARDS.TRAILER.description}>
                                        <InfoCircleOutlined className="ml-2 text-gray-400" />
                                      </Tooltip>
                                    </div>
                                  </Option>
                                )}

                                {(!usedMediaTypes.FILMVIP || media.type === "FILMVIP") && (
                                  <Option value="FILMVIP">
                                    <div className="flex items-center">
                                      <span>VIP Film</span>
                                      <Tooltip title={MEDIA_STANDARDS.FILMVIP.description}>
                                        <InfoCircleOutlined className="ml-2 text-gray-400" />
                                      </Tooltip>
                                    </div>
                                  </Option>
                                )}
                              </Select>
                            </div>

                            <div className="mt-2">
                              <Upload
                                showUploadList={false}
                                beforeUpload={(file) => handleUpload(index, file)}
                                className="w-full"
                              >
                                <Button
                                  icon={<UploadOutlined />}
                                  type={media.previewUrl ? "default" : "primary"}
                                  className="w-full"
                                  disabled={!media.type || (uploading && currentUploadingIndex === index)}
                                >
                                  {uploading && currentUploadingIndex === index
                                    ? "Uploading..."
                                    : media.previewUrl
                                      ? "Change Media"
                                      : "Select Media"}
                                </Button>
                              </Upload>
                            </div>

                            {mediaErrors[index] && (
                              <Alert
                                message="Size Error"
                                description={mediaErrors[index]}
                                type="warning"
                                showIcon
                                className="mt-2"
                              />
                            )}

                            {media.dimensions &&
                              media.type &&
                              MEDIA_STANDARDS[media.type]?.ratio &&
                              !mediaErrors[index] && (
                                <Alert
                                  message="Valid Dimensions"
                                  description={`Image: ${media.dimensions.width}x${media.dimensions.height}px - Ratio: ${
                                    MEDIA_STANDARDS[media.type].ratio
                                  }`}
                                  type="success"
                                  showIcon
                                  className="mt-2"
                                />
                              )}

                            {/* Video upload progress */}
                            {uploading && currentUploadingIndex === index && (
                              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Uploading...</span>
                                  <span className="text-sm text-gray-600">{progress}%</span>
                                </div>
                                <Progress
                                  percent={progress}
                                  status="active"
                                  strokeColor={{
                                    "0%": "#108ee9",
                                    "100%": "#87d068",
                                  }}
                                />
                                {estimatedTime !== null && (
                                  <div className="mt-2 flex items-center text-sm text-gray-600">
                                    <ClockCircleOutlined className="mr-1" />
                                    Estimated time remaining: {formatTimeRemaining(estimatedTime)}
                                  </div>
                                )}
                              </div>
                            )}

                            {uploadingMedia && currentUploadingIndex === index && !uploading && (
                              <div className="mt-4">
                                <div className="flex items-center">
                                  <Spin size="small" className="mr-2" />
                                  <span className="text-blue-600">Uploading...</span>
                                </div>
                                <Progress percent={70} status="active" />
                                <p className="mt-1 text-xs text-gray-500">
                                  Please wait while your media is being uploaded
                                </p>
                              </div>
                            )}

                            {media.localFile && !uploadingMedia && currentUploadingIndex !== index && !media.url && (
                              <Alert
                                message="Pending Upload"
                                description="File will be uploaded when saving the movie"
                                type="info"
                                showIcon
                                className="mt-2"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-center">
                            {media.previewUrl ? (
                              <div className="relative w-full">
                                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                                  {(media.type === "TRAILER" || media.type === "FILMVIP") && media.url ? (
                                    <div className="aspect-video w-full">
                                      <iframe
                                        src={media.url}
                                        className="w-full h-full rounded-md"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                  ) : (
                                    <img
                                      src={media.previewUrl || "/placeholder.svg"}
                                      alt={media.name || "Media preview"}
                                      className="w-full aspect-video object-contain bg-gray-50"
                                    />
                                  )}
                                  {media.localFile && !media.url && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                                      Pending Upload
                                    </div>
                                  )}
                                  {(!media.localFile && media.previewUrl) || media.url ? (
                                    <div className="absolute top-2 left-2 bg-green-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                                      Uploaded
                                    </div>
                                  ) : null}
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                                    {media.type ? MEDIA_STANDARDS[media.type].label : "No type selected"}
                                  </div>
                                </div>

                                {media.type === "POSTER" && (
                                  <div className="mt-4 flex justify-center">
                                    <div className="w-[120px] h-[180px] border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 rounded">
                                      <div className="text-xs text-center text-gray-500 px-2">
                                        Poster
                                        <br />
                                        (2:3)
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {media.type === "BANNER" && (
                                  <div className="mt-4 flex justify-center">
                                    <div className="w-[160px] h-[90px] border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 rounded">
                                      <div className="text-xs text-center text-gray-500">Banner (16:9)</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full">
                                <div className="w-full aspect-video bg-gray-100 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300">
                                  <div className="text-4xl text-gray-300 mb-2">
                                    <InboxOutlined />
                                  </div>
                                  <p className="text-gray-500 text-center px-4">
                                    {media.type
                                      ? `Select ${
                                          media.type === "POSTER"
                                            ? "poster image (2:3)"
                                            : media.type === "BANNER"
                                              ? "banner image (16:9)"
                                              : media.type === "TRAILER"
                                                ? "trailer video"
                                                : "movie video"
                                        }`
                                      : "Select media type before uploading"}
                                  </p>
                                </div>

                                {media.type === "POSTER" && (
                                  <div className="mt-4 flex justify-center">
                                    <div className="w-[120px] h-[180px] border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 rounded">
                                      <div className="text-xs text-center text-gray-500 px-2">
                                        Poster
                                        <br />
                                        (2:3)
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {media.type === "BANNER" && (
                                  <div className="mt-4 flex justify-center">
                                    <div className="w-[160px] h-[90px] border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 rounded">
                                      <div className="text-xs text-center text-gray-500">Banner (16:9)</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <Button
                  type="dashed"
                  onClick={addMedia}
                  className="w-full h-12"
                  icon={<PlusOutlined />}
                  disabled={allMediaTypesUsed()}
                >
                  {allMediaTypesUsed() ? "All required media types added" : "Add Media"}
                </Button>

                {allMediaTypesUsed() && (
                  <Alert
                    message="All Media Types Added"
                    description="You have added all required media types (Poster, Banner, Trailer, VIP Film)."
                    type="success"
                    showIcon
                    className="mt-4"
                  />
                )}
              </div>
            </Card>
          </TabPane>

          <TabPane tab="File Movie & Policy" key="5">
            <Card className="p-4 shadow-md">
              <div className="space-y-8">
                {/* Policy Section */}
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    <InfoCircleOutlined className="mr-2" /> Eigakan Policy
                  </h3>
                  <div className="pl-2 border-l-4 border-blue-300 py-1 mb-4">
                    <p className="text-gray-700 mb-3">By submitting your movie, you agree to the following policy:</p>
                    <p className="text-gray-700">
                      If you do not check the box, we will pay you based on the number of views your video receives. If
                      you check the box, we will create a contract and contact you for further details.
                    </p>
                  </div>

                  <Form.Item name="isContract" valuePropName="checked" initialValue={false} className="mb-0">
                    <Checkbox className="font-medium">
                      I agree to create a contract and be contacted for further details
                    </Checkbox>
                  </Form.Item>
                </div>

                {/* File Upload Section */}
                <div>
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-500">
                      <FileImageOutlined />
                    </div>
                    <h3 className="ml-2 text-lg font-semibold text-gray-800">Verification File</h3>
                  </div>

                  <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <Alert
                      message="Required Document"
                      description="Please upload a file that identifies this movie as your property. This file helps us verify your ownership of the content."
                      type="info"
                      showIcon
                      className="mb-3"
                    />
                  </div>

                  <Dragger
                    name="file"
                    multiple={false}
                    beforeUpload={() => false}
                    onChange={handleUploadFile}
                    showUploadList={false}
                    className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6"
                  >
                    <div className="text-center">
                      <p className="text-4xl text-gray-400 mb-3">
                        {uploading ? <LoadingOutlined /> : <InboxOutlined />}
                      </p>
                      <p className="text-gray-700 font-medium">
                        {uploading ? "Uploading..." : "Click or drag file to upload"}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">Upload a file to verify your movie ownership</p>
                    </div>
                  </Dragger>

                  {file && !fileUrl && (
                    <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-center">
                      <div className="mr-3 text-blue-500">
                        <LoadingOutlined />
                      </div>
                      <div>
                        <p className="text-blue-700">
                          <span className="font-medium">Processing File:</span> {file.name}
                        </p>
                        <p className="text-xs text-blue-600">Please wait while we process your file</p>
                      </div>
                    </div>
                  )}

                  {fileUrl && (
                    <div className="mt-4 bg-green-50 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <p className="font-medium text-green-700">File Uploaded Successfully</p>
                      </div>
                      <div className="flex items-center ml-8">
                        <span
                          onClick={handleGetPreUrlTemp}
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer inline-flex items-center"
                        >
                          {file.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">(Click to preview)</span>
                      </div>
                      <p className="mt-2 text-red-600 text-sm font-medium ml-8">
                        * Please verify your file before submitting *
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
            <Button type="primary" htmlType="submit" loading={loading || uploadingMedia} size="large" className="px-8">
              {uploadingMedia ? "Uploading Media..." : "Create Movie"}
            </Button>
          )}
        </div>
      </Form>

      {/* Replace the Modal component with this updated version */}
      <Modal
        title="Add New Director"
        open={isModalVisible}
        onCancel={handleCancel}
        maskClosable={true}
        closable={true}
        footer={null}
        width={600}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={(values) => {
            handleSubmit(values)
          }}
          initialValues={{
            name: searchText, // Pre-fill with the searched name
            gender: true,
          }}
        >
          <Form.Item
            name="name"
            label="Director Name"
            rules={[{ required: true, message: "Please input director name!" }]}
          >
            <Input placeholder="Enter director's full name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Biography"
            rules={[{ required: true, message: "Please input biography!" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter director's biography and notable works" />
          </Form.Item>

          <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender!" }]}>
            <Select placeholder="Select gender">
              <Select.Option value={true}>Male</Select.Option>
              <Select.Option value={false}>Female</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="birthday"
            label="Date of Birth"
            rules={[
              { required: true, message: "Please select date of birth!" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  if (!dayjs.isDayjs(value) || !value.isValid()) {
                    return Promise.reject(new Error("Invalid date"))
                  }
                  if (value.isAfter(dayjs())) {
                    return Promise.reject(new Error("Date of birth must be in the past"))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Select date of birth"
              disabledDate={(current) => current && current.isAfter(dayjs())}
              showToday={false}
              allowClear={true}
            />
          </Form.Item>

          <Form.Item name="picture" label="Profile Picture" hidden={true}>
            <Input />
          </Form.Item>

          <Form.Item
            name="image"
            label="Profile Picture"
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList}
            rules={[{ required: true, message: "Please upload a profile picture!" }]}
            extra="Recommended size: 300x300px. Max: 2MB."
          >
            <Upload
              customRequest={({ file, onSuccess, onError }) => handleUploadp({ file, onSuccess, onError })}
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
              }}
              accept="image/*"
              maxCount={1}
              listType="picture-card"
              beforeUpload={(file) => {
                const isImage = file.type.startsWith("image/")
                const isLt2M = file.size / 1024 / 1024 < 2
                if (!isImage) {
                  notification.error({
                    message: "Upload Failed",
                    description: "You can only upload image files!",
                  })
                  return false
                }
                if (!isLt2M) {
                  notification.error({
                    message: "Upload Failed",
                    description: "Image must be smaller than 2MB!",
                  })
                  return false
                }
                return true
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <LoadingOutlined style={{ fontSize: 24 }} />
                  <div className="mt-2">Uploading</div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <PlusOutlined style={{ fontSize: 24 }} />
                  <div className="mt-2">Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-4">
              <Button onClick={handleCancel} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={isUploading}
                className="bg-[#FF009F] hover:bg-[#D1007F]"
              >
                {isUploading ? "Uploading..." : "Create Director"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CreateMoviePublisher
