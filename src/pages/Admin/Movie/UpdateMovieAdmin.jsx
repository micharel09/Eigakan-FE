"use client";

import { useState, useEffect } from "react";
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
  Tooltip,
  Empty,
  Tag,
  Progress,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  InboxOutlined,
  LoadingOutlined,
  DeleteOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import genreService from "../../../apis/Genre/genre";
import personService from "../../../apis/Person/person";
import uploadFileApi from "../../../apis/Upload/upload";
import movieApi from "../../../apis/Movie/movie";
import { extractUrl } from "../../../utils/extractUrl";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const UpdateMovieAdmin = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [genres, setGenres] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const [medias, setMedias] = useState([]);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(null);
  const [moviePersons, setMoviePersons] = useState([]);

  useEffect(() => {
    fetchGenres();
    fetchPersons();
    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  const fetchGenres = async () => {
    try {
      const response = await genreService.getGenres();
      setGenres(response.data);
    } catch (error) {
      console.error("Error fetching genres:", error);
      notification.error({ message: "Failed to fetch genres" });
    }
  };

  const fetchPersons = async (pageNumber = 1, pageSize = 1000) => {
    try {
      const response = await personService.getAllPerson(pageNumber, pageSize);
      setPersons(response.data);
    } catch (error) {
      console.error("Error fetching persons:", error);
      notification.error({ message: "Failed to fetch persons" });
    }
  };

  const fetchMovieDetails = async () => {
    setFetchingData(true);
    try {
      const response = await movieApi.getMovieById(id);
      const movieData = response.data;

      // Extract genre IDs from genreNames string
      const genreIds = await extractGenreIdsFromNames(movieData.genreNames);

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
        status: movieData.status,
        persons: movieData.person.map((p) => p.id),
      });

      // Set file URL
      setFileUrl(movieData.fileUrl || "");

      // Set medias
      setMedias(movieData.medias || []);

      // Set persons
      setMoviePersons(movieData.person || []);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      notification.error({ message: "Failed to fetch movie details" });
    } finally {
      setFetchingData(false);
    }
  };

  // Helper function to extract genre IDs from comma-separated genre names
  const extractGenreIdsFromNames = async (genreNamesString) => {
    if (!genreNamesString) return [];

    const genreNames = genreNamesString.split(", ");
    const matchedGenres = genres.filter((genre) =>
      genreNames.some((name) => name.trim() === genre.name)
    );

    return matchedGenres.map((genre) => genre.id);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const movieData = {
        id,
        ...values,
        medias: medias.filter((media) => media.name && media.url && media.type),
        fileUrl,
      };

      await movieApi.updateMovie(id, movieData);
      notification.success({ message: "Movie updated successfully" });
      navigate(`/admin/movie/${id}`);
    } catch (error) {
      console.error("Error updating movie:", error);
      notification.error({ message: "Failed to update movie" });
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Form validation failed:", errorInfo);
    notification.error({ message: "Please fill out all required fields" });
  };

  const addMedia = () => {
    setMedias([...medias, { name: "", url: "", type: "" }]);
  };

  const handleMediaChange = (index, field, value) => {
    const updatedMedias = [...medias];
    updatedMedias[index][field] = value;
    setMedias(updatedMedias);
  };

  const handleUpload = async (index, file) => {
    setUploading(true);
    setProgress(0);
    setCurrentUploadIndex(index);

    try {
      if (file.type.startsWith("video/")) {
        // Upload Video to Bunny CDN
        const createResponse = await fetch(
          "https://demoapi1-efhhd3b5hrhefagu.canadacentral-01.azurewebsites.net/api/Upload/upload_VideoBunny",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: file.name }),
          }
        );

        const createData = await createResponse.json();
        if (!createResponse.ok) throw new Error("Could not create video");

        const videoId = createData.videoUrl;
        console.log("Video ID:", videoId);

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
          setCurrentUploadIndex(null);
          if (xhr.status === 200) {
            const newVideoUrl = `https://iframe.mediadelivery.net/embed/384568/${videoId}`;
            handleMediaChange(index, "url", newVideoUrl);
            notification.success({
              message: "Success",
              description: "Video uploaded successfully!",
            });
          } else {
            notification.error({
              message: "Error",
              description: "Failed to upload video",
            });
          }
        };

        xhr.onerror = () => {
          setUploading(false);
          setCurrentUploadIndex(null);
          notification.error({
            message: "Error",
            description: "Error uploading video",
          });
        };

        xhr.send(file);
      } else {
        // Upload Image using the existing API
        const url = await uploadFileApi.UploadPicture(file);
        handleMediaChange(index, "url", url.data[0].url);
        setUploading(false);
        setCurrentUploadIndex(null);
        notification.success({
          message: "Success",
          description: "Image uploaded successfully!",
        });
      }
    } catch (error) {
      setUploading(false);
      setCurrentUploadIndex(null);
      console.error(error);
      notification.error({
        message: "Error",
        description: "Failed to upload file: " + error.message,
      });
    }
  };

  const handleUploadFile = async (info) => {
    const selectedFile = info.file;
    setUploading(true);

    try {
      const response = await uploadFileApi.UploadFileTemp(selectedFile);
      const uploadedUrl = response.data[0].url;

      setFile(selectedFile);
      setFileUrl(uploadedUrl);
      notification.success({ message: "File uploaded successfully" });
    } catch (error) {
      console.error("Error uploading file:", error);
      notification.error({ message: "Failed to upload file" });
    } finally {
      setUploading(false);
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
      window.open(response.data.url, "_blank");
    } catch (error) {
      console.error("Error fetching preUrl:", error);
    }
  };

  const removeMedia = (index) => {
    const updatedMedias = [...medias];
    updatedMedias.splice(index, 1);
    setMedias(updatedMedias);
    notification.success({
      message: "Media removed",
      description: "The media has been removed successfully",
    });
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingOutlined style={{ fontSize: 48 }} />
        <span className="ml-4 text-xl">Loading movie data...</span>
      </div>
    );
  }

  // Render Media Picture Tab
  const renderMediaPictureTab = () => {
    const pictureMedias = medias.filter(
      (media) => media.type === "BANNER" || media.type === "POSTER"
    );
    const newMedias = medias.filter((m) => !m.id);

    return (
      <Card className="p-4 shadow-md border-0">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
            <FileImageOutlined className="text-blue-500" />
            Current Media Pictures
          </h3>

          {pictureMedias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {pictureMedias.map((media, index) => (
                <Card
                  key={index}
                  hoverable
                  className="overflow-hidden transition-all duration-300 hover:shadow-lg group"
                  bodyStyle={{ padding: "12px" }}
                  cover={
                    <div className="relative overflow-hidden">
                      <img
                        src={media.url || "/placeholder.svg"}
                        alt={media.name}
                        className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Tag
                        color={media.type === "BANNER" ? "blue" : "purple"}
                        className="absolute top-2 right-2"
                      >
                        {media.type}
                      </Tag>
                    </div>
                  }
                >
                  <div className="flex flex-col">
                    <p className="font-medium truncate text-gray-800">
                      {media.name}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500">
                        {media.type === "BANNER"
                          ? "Website Banner"
                          : "Movie Poster"}
                      </span>
                      <Tooltip title="Remove media">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeMedia(medias.indexOf(media))}
                          className="hover:bg-red-50"
                        />
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              description="No media pictures added yet"
              className="my-8"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
            <PlusOutlined className="text-green-500" />
            Add New Media
          </h3>

          <div className="space-y-4">
            {newMedias.map((media, index) => (
              <Card
                key={`new-${index}`}
                size="small"
                className="bg-gray-50 hover:bg-white transition-colors duration-300"
              >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-grow">
                    <Input
                      placeholder="Media Name"
                      value={media.name}
                      onChange={(e) =>
                        handleMediaChange(
                          medias.indexOf(media),
                          "name",
                          e.target.value
                        )
                      }
                      className="rounded-md"
                      prefix={<span className="text-gray-400 mr-1">Name:</span>}
                    />
                  </div>

                  <div className="flex gap-3 items-center">
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) =>
                        handleUpload(medias.indexOf(media), file)
                      }
                      className="flex-shrink-0"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        className="flex items-center"
                        loading={
                          uploading &&
                          currentUploadIndex === medias.indexOf(media)
                        }
                      >
                        Upload
                      </Button>
                    </Upload>

                    {media.url && (
                      <div className="relative flex-shrink-0">
                        <img
                          src={media.url || "/placeholder.svg"}
                          alt="media"
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 rounded"></div>
                      </div>
                    )}

                    <Select
                      placeholder="Type"
                      value={media.type}
                      onChange={(v) =>
                        handleMediaChange(medias.indexOf(media), "type", v)
                      }
                      className="w-32 flex-shrink-0"
                    >
                      <Option value="POSTER">Poster</Option>
                      <Option value="BANNER">Banner</Option>
                    </Select>
                  </div>
                </div>
                {uploading && currentUploadIndex === medias.indexOf(media) && (
                  <Progress
                    percent={progress}
                    status="active"
                    className="mt-2"
                  />
                )}
              </Card>
            ))}

            <Button
              type="dashed"
              onClick={addMedia}
              block
              icon={<PlusOutlined />}
              className="hover:border-blue-400 hover:text-blue-500 transition-colors duration-300"
            >
              Add Media
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Render Media Video Tab
  const renderMediaVideoTab = () => {
    const videoMedias = medias.filter(
      (media) => media.type === "TRAILER" || media.type === "FILMVIP"
    );
    const newMedias = medias.filter((m) => !m.id);

    return (
      <Card className="p-4 shadow-md border-0">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
            <VideoCameraOutlined className="text-red-500" />
            Current Media Videos
          </h3>

          {videoMedias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {videoMedias.map((media, index) => (
                <Card
                  key={index}
                  hoverable
                  className="overflow-hidden transition-all duration-300 hover:shadow-lg"
                  bodyStyle={{ padding: "12px" }}
                  cover={
                    <div className="relative">
                      <div className="aspect-video bg-gray-100">
                        <iframe
                          src={media.url}
                          className="w-full h-full"
                          title={media.name}
                          allowFullScreen
                        />
                      </div>
                      <Tag
                        color={media.type === "TRAILER" ? "orange" : "green"}
                        className="absolute top-2 right-2"
                      >
                        {media.type}
                      </Tag>
                    </div>
                  }
                >
                  <div className="flex flex-col">
                    <p className="font-medium truncate text-gray-800">
                      {media.name}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500">
                        {media.type === "TRAILER"
                          ? "Movie Trailer"
                          : "Premium Content"}
                      </span>
                      <div className="flex gap-2">
                        <Tooltip title="Preview video">
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => window.open(media.url, "_blank")}
                            className="text-blue-500 hover:bg-blue-50"
                          />
                        </Tooltip>
                        <Tooltip title="Remove media">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeMedia(medias.indexOf(media))}
                            className="hover:bg-red-50"
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              description="No media videos added yet"
              className="my-8"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
            <PlusOutlined className="text-green-500" />
            Add New Media
          </h3>

          <div className="space-y-4">
            {newMedias.map((media, index) => (
              <Card
                key={`new-${index}`}
                size="small"
                className="bg-gray-50 hover:bg-white transition-colors duration-300"
              >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-grow">
                    <Input
                      placeholder="Media Name"
                      value={media.name}
                      onChange={(e) =>
                        handleMediaChange(
                          medias.indexOf(media),
                          "name",
                          e.target.value
                        )
                      }
                      className="rounded-md"
                      prefix={<span className="text-gray-400 mr-1">Name:</span>}
                    />
                  </div>

                  <div className="flex gap-3 items-center flex-wrap md:flex-nowrap">
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) =>
                        handleUpload(medias.indexOf(media), file)
                      }
                      className="flex-shrink-0"
                    >
                      <Button
                        icon={<UploadOutlined />}
                        className="flex items-center"
                        loading={
                          uploading &&
                          currentUploadIndex === medias.indexOf(media)
                        }
                      >
                        Upload Video
                      </Button>
                    </Upload>

                    <Select
                      placeholder="Type"
                      value={media.type}
                      onChange={(v) =>
                        handleMediaChange(medias.indexOf(media), "type", v)
                      }
                      className="w-32 flex-shrink-0"
                    >
                      <Option value="TRAILER">Trailer</Option>
                      <Option value="FILMVIP">Film VIP</Option>
                    </Select>
                  </div>
                </div>
                {uploading && currentUploadIndex === medias.indexOf(media) && (
                  <Progress
                    percent={progress}
                    status="active"
                    className="mt-2"
                  />
                )}
                {media.url && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(media.url, "_blank")}
                      className="text-blue-500"
                    >
                      Preview
                    </Button>
                  </div>
                )}
              </Card>
            ))}

            <Button
              type="dashed"
              onClick={addMedia}
              block
              icon={<PlusOutlined />}
              className="hover:border-blue-400 hover:text-blue-500 transition-colors duration-300"
            >
              Add Media
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Update Movie</h1>
      <Form
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        layout="vertical"
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <TabPane tab="Basic Info" key="1">
            <Card className="p-4 shadow-md">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please input the title!" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="originName"
                label="Origin Name"
                rules={[
                  { required: true, message: "Please input the origin name!" },
                ]}
              >
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
                ]}
                normalize={(value) => value?.toString()}
              >
                <InputNumber className="w-full" />
              </Form.Item>

              <Form.Item
                name="duration"
                label="Duration (minutes)"
                rules={[
                  { required: true, message: "Please input the duration!" },
                ]}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>

              <Form.Item
                name="nation"
                label="Nation"
                rules={[
                  { required: true, message: "Please input the nation!" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="director"
                label="Director"
                rules={[
                  { required: true, message: "Please input the director!" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                rules={[
                  { required: true, message: "Please input the status!" },
                ]}
              >
                <Input readOnly />
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

          <TabPane tab="Persons" key="3">
            <Card className="p-4 shadow-md">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Current Cast</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moviePersons.map((person) => (
                    <Card
                      key={person.id}
                      size="small"
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={person.picture} size={64} />
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.job}</p>
                          <p className="text-xs text-gray-400">
                            Born: {person.birthday}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Form.Item name="persons" label="Update Cast">
                <Select
                  mode="multiple"
                  placeholder="Select actors"
                  optionLabelProp="label"
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

          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <FileImageOutlined />
                <span>Media Pictures</span>
              </span>
            }
            key="4"
          >
            {renderMediaPictureTab()}
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <VideoCameraOutlined />
                <span>Media Videos</span>
              </span>
            }
            key="5"
          >
            {renderMediaVideoTab()}
          </TabPane>

          <TabPane tab="File Movie" key="6">
            <Card className="p-4 shadow-md">
              <h3 className="text-lg font-medium mb-4">Current File</h3>
              {fileUrl ? (
                <div className="mb-6 p-4 border rounded-md bg-gray-50">
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500" />
                    Current file:
                  </p>
                  <Button
                    type="link"
                    onClick={handleGetPreUrlTemp}
                    icon={<EyeOutlined />}
                    className="pl-0"
                  >
                    View current file
                  </Button>
                </div>
              ) : (
                <p className="mb-6 text-gray-500">No file currently uploaded</p>
              )}
            </Card>
          </TabPane>

          <TabPane tab="Eigakan policy movie" key="7">
            <Card className="p-4 shadow-md">
              <p>
                By submitting your movie, you agree to the following policy:
              </p>
              <p>
                If you do not check the box, we will pay you based on the number
                of views your video receives. If you check the box, we will
                create a contract and contact you for further details.
              </p>

              <Form.Item name="isContract" valuePropName="checked">
                <Checkbox disabled>
                  I agree to create a contract and be contacted
                </Checkbox>
              </Form.Item>
              <h2 className="text-red-600">
                *If not just press next button to continue update your movie*
              </h2>
            </Card>
          </TabPane>
        </Tabs>
        <div className="flex justify-between mt-6">
          {activeTab !== "1" && (
            <Button
              onClick={() => setActiveTab(String(Number(activeTab) - 1))}
              className="hover:bg-gray-100"
            >
              Previous
            </Button>
          )}
          {activeTab !== "8" ? (
            <Button
              type="primary"
              onClick={() => setActiveTab(String(Number(activeTab) + 1))}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-green-500 hover:bg-green-600"
              icon={<CheckCircleOutlined />}
            >
              Update Movie
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};

export default UpdateMovieAdmin;
