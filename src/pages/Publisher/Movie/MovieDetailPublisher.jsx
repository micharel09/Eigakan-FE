"use client";

import { useState, useEffect } from "react";
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
  Select,
  Form,
  Avatar,
  Upload,
  Progress,
} from "antd";
import {
  PlayCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  EditOutlined,
  EyeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import movieService from "../../../apis/Movie/movie";
import genreService from "../../../apis/Genre/genre";
import personService from "../../../apis/Person/person";
import ProcessStatus from "../../../components/WorkFlow/MovieWorkflow";
import uploadFileApi from "../../../apis/Upload/upload";
import { extractUrl } from "../../../utils/extractUrl";
import { Link } from "react-router-dom";

const { Content } = Layout;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const hiddenStatuses = [
  "ACTIVE",
  "ACCEPTED_NEGOTIATING",
  "WAITING_FOR_UPLOADING",
  "ARCHIVED",
];

const MovieDetailPublisher = () => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, type: "" });
  const [editMovie, setEditMovie] = useState(null);
  const [genres, setGenres] = useState([]);
  const [persons, setPersons] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [progress, setProgress] = useState(0);

  const { id } = useParams();

  useEffect(() => {
    fetchMovieDetails(), fetchGenres(), fetchPersons();
  }, []);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const response = await movieService.getMovieById(id);
      setMovie(response.data);
    } catch (error) {
      notification.error({ message: "Failed to fetch movie details" });
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await genreService.getGenres();
      setGenres(response.data);
    } catch (error) {
      console.error("Error fetching genres:", error);
      notification.error({ message: "Failed to fetch genres" });
    }
  };

  const fetchPersons = async () => {
    try {
      const response = await personService.getAllPerson();
      console.log("Persons:", response.data);
      setPersons(response.data);
    } catch (error) {
      console.error("Error fetching persons:", error);
      notification.error({ message: "Failed to fetch persons" });
    }
  };

  const handleUpdate = async () => {
    try {
      await movieService.updateMovie(id, editMovie);
      notification.success({ message: "Movie updated successfully" });
      setModal({ visible: false, type: "" });
      fetchMovieDetails();
    } catch (error) {
      notification.error({ message: "Failed to update movie" });
    }
  };

  const openUpdateModal = () => {
    setEditMovie({ ...movie });
    setModal({ visible: true, type: "update" });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return notification.error({ message: "Chọn file trước!" });
    }

    setUploading(true);
    setProgress(0);

    try {
      // 🟢 Gửi yêu cầu tạo video trước (API backend)
      const createResponse = await fetch(
        "https://eigakan2222-001-site1.jtempurl.com/api/Upload/upload_VideoBunny",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: selectedFile.name }),
        }
      );

      const createData = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error("Không thể tạo video");
      }

      const videoId = createData.videoUrl;
      console.log("Video ID:", videoId);

      // 🟢 Upload video sau khi tạo thành công
      const xhr = new XMLHttpRequest();
      xhr.open(
        "PUT",
        `https://video.bunnycdn.com/library/384568/videos/${videoId}`,
        true
      );
      xhr.setRequestHeader(
        "AccessKey",
        "5dd7b859-f5cf-4d94-a0b71073f51a-3048-4dfd"
      );
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      // 🟢 Cập nhật tiến trình upload
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const newVideoUrl = `https://iframe.mediadelivery.net/embed/384568/${videoId}`;
          setVideoUrl(newVideoUrl);
          notification.success({ message: "Upload thành công!" });
        } else {
          notification.error({ message: "Upload thất bại!" });
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        notification.error({ message: "Có lỗi xảy ra khi upload!" });
      };

      // 🟢 Bắt đầu gửi file
      xhr.send(selectedFile);
    } catch (error) {
      setUploading(false);
      console.error(error);
      notification.error({ message: "Lỗi khi upload video!" });
    }
  };

  const getMediaUrl = (type) =>
    movie?.medias?.find((m) => m.type === type)?.url || "";

  const renderMedia = (type) => {
    const url = getMediaUrl(type);

    if (type === "DASHBOARD") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-lg shadow">
          {/* Thông tin chung */}
          <div className="space-y-4">
            <div>
              <Text strong className="text-gray-600">
                📅 Submission Date:
              </Text>
              <Paragraph className="text-gray-800">
                {movie?.submissionDate || "N/A"}
              </Paragraph>
            </div>
            <div>
              <Text strong className="text-gray-600">
                ❌ Reason For Rejection:
              </Text>
              <Paragraph className="text-gray-800">
                {movie?.reasonForRejection || "N/A"}
              </Paragraph>
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
              <Text strong className="text-gray-600">
                ⭐ User Rating:
              </Text>
              <Rate disabled defaultValue={movie?.userRating || 0} />
            </div>

            <Button
              type="primary"
              icon={<EyeOutlined />}
              className="w-full md:w-auto"
            >
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
                src={actor.picture || "/placeholder.svg"}
                alt={actor.name}
                className="w-32 h-48 object-cover rounded-lg"
              />
              <p className="mt-2 font-semibold">{actor.name}</p>
            </div>
          ))}
        </div>
      );
    }
    if (!url) return <p>No {type.toLowerCase()} available</p>;
    if (type === "POSTER")
      return (
        <div className="flex justify-center">
          <Image
            width="30%"
            src={url || "/placeholder.svg"}
            alt={`Movie ${type}`}
          />
        </div>
      );
    if (type === "BANNER")
      return (
        <Image
          width="100%"
          src={url || "/placeholder.svg"}
          alt={`Movie ${type}`}
        />
      );
    if (type === "TRAILER")
      return <iframe width="100%" height="400" src={url} allowFullScreen />;
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
      );
    }
    if (["FILM", "FILMVIP"].includes(type)) {
      return (
        <video width="100%" height="400" controls>
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
  };

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
      <ProcessStatus movieStatus={movie?.status} />
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
                <Image
                  width={300}
                  src={getMediaUrl("POSTER") || "/placeholder.svg"}
                  className="rounded-lg"
                />
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <Title level={2}>{movie?.title}</Title>
                      <Text type="secondary">{movie?.originName}</Text>
                      <div className="flex gap-2 my-2">
                        <Tag color="blue">{movie?.releaseYear}</Tag>
                        <Tag color="green">{movie?.genreNames}</Tag>
                        <Tag
                          color={
                            movie?.status === "ACTIVE" ? "success" : "warning"
                          }
                        >
                          {movie?.status}
                        </Tag>
                        <Tag
                          color={movie?.isContract === true ? "success" : "red"}
                        >
                          {movie?.isContract ? "Contracted" : "Not Contracted"}
                        </Tag>
                      </div>
                    </div>
                    {/* UPLOAD VIDEO */}
                    <div className="flex gap-2">
                      {/* 🟢 Upload Video - Hide if trailer or filmvip URL exists */}
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

                      <button
                        onClick={
                          movie?.status === "WAITING_FOR_REVIEWING"
                            ? handleGetPreUrlTemp
                            : handleGetPreUrl
                        }
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

                      {/* 🟡 Update Button */}
                      {!hiddenStatuses.includes(movie?.status) && (
                        <Link
                          key={movie.id}
                          to={`/publisher/updateMovie/${movie.id}`}
                        >
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="large"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                          >
                            Update
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <Paragraph>{movie?.description}</Paragraph>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {["Director", "Duration", "Nation", "Rating"].map(
                      (field, index) => (
                        <div key={index}>
                          <Text type="secondary">{field}</Text>
                          <Paragraph strong>
                            {movie?.[field.toLowerCase().replace(/ /g, "")] ||
                              "N/A"}
                          </Paragraph>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="shadow-sm">
              <Tabs defaultActiveKey="dashboard">
                {[
                  "DASHBOARD",
                  "POSTER",
                  "BANNER",
                  "TRAILER",
                  "FILM",
                  "FILMVIP",
                  "Actor/Acstress",
                ].map((key) => (
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

        <Modal
          title="Update Movie"
          visible={modal.type === "update" && modal.visible}
          onOk={handleUpdate}
          onCancel={() => setModal({ visible: false, type: "" })}
          width={800} // Tăng chiều rộng modal
        >
          <Form layout="vertical">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Title">
                <Input
                  value={editMovie?.title}
                  onChange={(e) =>
                    setEditMovie((prev) => ({ ...prev, title: e.target.value }))
                  }
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
                onChange={(values) =>
                  setEditMovie((prev) => ({ ...prev, genres: values }))
                }
                className="w-full"
              >
                {genres.map((genre) => (
                  <Option key={genre.id} value={genre.id}>
                    {genre.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Persons">
              <Select
                mode="multiple"
                placeholder="Select Persons"
                value={editMovie?.persons}
                onChange={(values) =>
                  setEditMovie((prev) => ({ ...prev, persons: values }))
                }
                className="w-full"
              >
                {persons.map((person) => (
                  <Option key={person.id} value={person.id}>
                    <div className="flex items-center gap-2">
                      <Avatar src={person.picture} alt={person.name} />
                      <span>{person.name}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default MovieDetailPublisher;
