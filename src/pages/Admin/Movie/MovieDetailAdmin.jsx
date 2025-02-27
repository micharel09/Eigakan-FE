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
  Rate,
  Input,
  Form,
  DatePicker,
  InputNumber,
} from "antd"
import {
  PlayCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons"
import { useParams } from "react-router-dom"
import movieService from "../../../apis/Movie/movie"
import contractApi from "../../../apis/Contract/contract"
import { extractUrl } from "../../../utils/extractUrl"
import uploadFileApi from "../../../apis/Upload/upload.jsx";

const { Content } = Layout
const { TabPane } = Tabs
const { Title, Text, Paragraph } = Typography

const MovieDetail = () => {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ visible: false, type: "" })
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false)
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false)
  const [reason, setReason] = useState("");

  const { id } = useParams()
  const [form] = Form.useForm();
  

  useEffect(() => {
    fetchMovieDetails()
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
  
  const handleAccept = async () => {
      const data = { Id: movie?.id };
      const values = await form.validateFields(); // Lấy giá trị từ form
      const contractData = {
        startDate: values.startDate.format("DD/MM/YYYY"), // Chuyển thành chuỗi ngày
        duration: Number(values.duration), 
        price: Number(values.price), 
        publisherName: values.publisherName,
        distributorName: values.distributorName,
        movieId: movie?.id, // Lấy movieId từ movie object
      };
      try {
        const response = await movieService.acceptedMovie(data);
       
        if (response.status === 200) {
          notification.success({ message: "Movie accepted successfully!" });
          
          await contractApi.createContract(contractData);
          
          notification.success({ message: "Contract generated successfully!" });
          setIsAcceptModalVisible(false);
          form.resetFields(); // Reset form sau khi submit

        } else {
          notification.error({ message: response.data.message || "Failed to accept movie" });
        }
    } catch (error) {
      notification.error({ message: "Failed to generate contract" });
    }
  };

  const handleReject = async () => {
    try {
      const data = { id: movie?.id, reasonForRejection: reason };
      const response = await movieService.rejectedMovie(data);
      if (response.status === 200) {
        setUserRegister((prevUserRegister) => ({
          ...prevUserRegister,
          status: "Rejected",
          reasonForRejection: reason,
        }));
        notification.success({
          message: response.data.message || "Rejected successfully!",
        });
      } else {
        notification.error({
          message: response.data.message || "Failed to reject user.",
        });
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      notification.error({ message: error.message || "An error occurred!" });
    }
    setIsRejectModalVisible(false);
    setReason("");
  };
  
  const getMediaUrl = (type) => movie?.medias?.find((m) => m.type === type)?.url || ""

  const renderMedia = (type) => {
    const url = getMediaUrl(type)
    
    if (type === "DASHBOARD") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-lg shadow">
          {/* Thông tin chung */}
          <div className="space-y-4">
            <div>
              <Text strong className="text-gray-600">📅 Submission Date:</Text>
              <Paragraph className="text-gray-800">{movie?.submissionDate || "N/A"}</Paragraph>
            </div>
            <div>
              <Text strong className="text-gray-600">❌ Reason For Rejection:</Text>
              <Paragraph className="text-gray-800">{movie?.reasonForRejection || "N/A"}</Paragraph>
            </div>
          </div>
    
          {/* Thống kê */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            <Card className="w-full md:w-52 shadow-md">
              <Statistic 
                title="👁️ View Count" 
                value={movie?.viewCount || 0} 
                valueStyle={{ fontSize: "1.5rem", fontWeight: "bold" }} 
                prefix={<EyeOutlined className="text-blue-500" />} 
              />
            </Card>
    
            <div className="flex items-center space-x-2">
              <Text strong className="text-gray-600">⭐ User Rating:</Text>
              <Rate disabled defaultValue={movie?.userRating || 0} />
            </div>
    
            <Button type="primary" icon={<EyeOutlined />} className="w-full md:w-auto">
              View Dashboard Details
            </Button>
          </div>
        </div>
      );
    }
    if (["Actor/Acstress"].includes(type)) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {movie?.person?.map((actor) => (
            <div key={actor.id} className="flex flex-col items-center">
              <img
                src={actor.picture}
                alt={actor.name}
                className="w-32 h-48 object-cover rounded-lg"
              />
              <p className="mt-2 font-semibold">{actor.name}</p>
            </div>
          ))}
        </div>
      );
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
      const extractLink = extractUrl(movie?.fileUrl);
      if (extractLink === null) {
        notification.error({ message: error.message || "An error occurred!" });
      }

      if (!extractLink || !extractLink.userId || !extractLink.fileName) {
        throw new Error("Failed to extract userId or fileName from URL");
      }
      const response = await uploadFileApi.getPreFileUrlMovie(
        extractLink.userId,
        extractLink.fileName
      );
      console.log("PreUrl:", response.data);
      //setPreUrl(response.data.url);
      window.open(response.data.url, "_blank");
    } catch (error) {
      notification.error({ message: error.message || "Not found" });
      console.error("Error fetching preUrl:", error);
    }
  };

  const handleGetPreUrlTemp = async () => {
    try {
      const extractLink = extractUrl(movie?.fileUrl);
      if (extractLink === null) {
        notification.error({ message: error.message || "An error occurred!" });
      }

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
      notification.error({ message: error.message || "Not found" });
      console.error("Error fetching preUrl:", error);
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6 md:p-8 max-w-7xl mx-auto w-full">
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
            <Card className="mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <Image width={300} src={getMediaUrl("POSTER") || "/placeholder.svg"} className="rounded-lg" />
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <Title level={2}>{movie?.title}</Title>
                      <Text type="secondary">{movie?.originName}</Text>
                      <div className="flex gap-2 my-2">
                        <Tag color="blue">{movie?.releaseYear}</Tag>
                        <Tag color="green">{movie?.genreNames}</Tag>
                        <Tag color={movie?.status === "ACTIVE" ? "success" : "warning"}>{movie?.status}</Tag>
                        <Tag color={movie?.isContract === true ? "success" : "red"}>
                          {movie?.isContract ? "Contracted" : "Not Contracted"}
                        </Tag>

                      </div>
                    </div>
                    <div className="flex gap-2">
                      
                      <button
                        onClick={movie?.status === "WAITING_FOR_REVIEWING" ? handleGetPreUrlTemp : handleGetPreUrl}
                        style={{
                          padding: "5px 10px",
                          background: "blue",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        View File
                      </button>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={()  => setIsAcceptModalVisible(true)}
                      >
                        Accept
                      </Button>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => setIsRejectModalVisible(true)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  <Paragraph>{movie?.description}</Paragraph>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {["Director", "Duration", "Nation", "Rating"].map((field, index) => (
                      <div key={index}>
                        <Text type="secondary">{field}</Text>
                        <Paragraph strong>{movie?.[field.toLowerCase().replace(/ /g, "")] || "N/A"}</Paragraph>
                      </div>
                    ))}
                  </div>
                  
                </div>
              </div>
            </Card>
            
            <Card className="shadow-sm">
              <Tabs defaultActiveKey="dashboard">
                {["DASHBOARD", "POSTER", "BANNER", "TRAILER", "FILM", "FILMVIP","Actor/Acstress"].map((key) => (
                  <TabPane
                    key={key.toLowerCase()}
                    tab={
                      <span>
                        {key === "DASHBOARD" ? (
                          <EyeOutlined />
                        ) : key === "TRAILER" ? (
                          <PlayCircleOutlined />
                        ) : key === "FILM" ? (
                          <VideoCameraOutlined />
                        ) : key === "FILMVIP" ? (
                          <StarOutlined />
                        ) : (
                          <PictureOutlined />
                        )}{" "}
                        {key}
                      </span>
                    }
                  >
                    {renderMedia(key)}
                  </TabPane>
                ))}
              </Tabs>
            </Card>
          </>
        )}

          {/* Contract Generation Modal */}
          <Modal
            title="Generate Contract"
            open={isAcceptModalVisible}
            onOk={handleAccept}
            onCancel={() => setIsAcceptModalVisible(false)}
            okText="Accept and Generate contract"
            cancelText="Cancel"
          >
            <Form form={form} layout="vertical">
              
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select a start date' }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="duration"
                label="Duration (days)"
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <InputNumber style={{ width: "100%" }} min={1} />
              </Form.Item>

              <Form.Item
                name="price"
                label="Price (VND)"
                rules={[{ required: true, message: "Please enter a price" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(value) =>
                    value ? new Intl.NumberFormat("en-US").format(value) : ""
                  }
                  parser={(value) => value.replace(/,/g, "")} // Xóa dấu `,` khi nhập lại
                />
              </Form.Item>


              <Form.Item
                name="publisherName"
                label="Publisher Name"
                rules={[{ required: true, message: 'Please enter publisher name' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="distributorName"
                label="Distributor Name"
                rules={[{ required: true, message: 'Please enter distributor name' }]}
              >
                <Input />
              </Form.Item>
            
            </Form>
          </Modal>

           {/* Reject Modal */}
          <Modal
            title="Reject Movie"
            open={isRejectModalVisible}
            onOk={handleReject}
            onCancel={() => setIsRejectModalVisible(false)}
            okText="Confirm Reject"
            cancelText="Cancel"
          >
            <Input.TextArea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
            />
          </Modal>

      </Content>
    </Layout>
  )
}

export default MovieDetail