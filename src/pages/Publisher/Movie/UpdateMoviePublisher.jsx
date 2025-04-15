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
  Alert,
  Tooltip,
  Spin,
  Progress,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  InboxOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  FileImageOutlined,
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

// Define standard dimensions for media types
const MEDIA_STANDARDS = {
  POSTER: {
    width: 1000,
    height: 1500,
    ratio: "2:3",
    description: "Standard Poster (2:3): 1000x1500px or equivalent ratio",
  },
  BANNER: {
    width: 1920,
    height: 1080,
    ratio: "16:9",
    description: "Standard Banner (16:9): 1920x1080px or equivalent ratio",
  },
  TRAILER: {
    description: "Movie trailer video link",
  },
  FILMVIP: {
    description: "High-quality movie file for VIP users",
  },
};

const UpdateMoviePublisher = () => {
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
  const [moviePersons, setMoviePersons] = useState([]);
  const [mediaErrors, setMediaErrors] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(null);

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

  const fetchPersons = async () => {
    try {
      const response = await personService.getAllPerson();
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
        persons: movieData.person.map((p) => p.id),
      });

      // Set file URL
      setFileUrl(movieData.fileUrl || "");

      // Set medias with dimensions and previewUrl
      const formattedMedias = (movieData.medias || []).map((media) => ({
        ...media,
        previewUrl: media.url,
        dimensions: null, // Will be set if we load the image
      }));
      setMedias(formattedMedias);

      // Initialize mediaErrors array
      setMediaErrors(new Array(formattedMedias.length).fill(null));

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
    // Validate all media before submitting
    const errors = validateAllMedia();
    if (errors.length > 0) {
      setActiveTab("5"); // Switch to Media tab
      return;
    }

    setLoading(true);
    try {
      // Upload all media files first
      const uploadedMedia = await uploadAllMedia();

      const movieData = {
        id,
        ...values,
        medias: uploadedMedia,
        fileUrl,
      };

      await movieApi.updateMovie(id, movieData);
      notification.success({ message: "Movie updated successfully" });
      navigate("/publisher/movie");
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
    setMedias([
      ...medias,
      {
        name: "",
        url: "",
        previewUrl: "",
        type: "",
        dimensions: null,
        localFile: null,
      },
    ]);
    setMediaErrors([...mediaErrors, null]);
  };

  const handleMediaChange = (index, field, value) => {
    const updatedMedias = [...medias];
    updatedMedias[index][field] = value;

    // Reset errors when type changes
    if (field === "type") {
      const updatedErrors = [...mediaErrors];
      updatedErrors[index] = null;
      setMediaErrors(updatedErrors);

      // If the media already has a URL and dimensions and the type changes to POSTER or BANNER
      // we need to validate the dimensions against the new media type
      if (
        updatedMedias[index].previewUrl &&
        updatedMedias[index].dimensions &&
        (value === "POSTER" || value === "BANNER")
      ) {
        const { width, height } = updatedMedias[index].dimensions;
        validateExistingImageDimensions(index, value, width, height);
      }
    }

    setMedias(updatedMedias);
  };

  // Validate dimensions of an existing image when media type changes
  const validateExistingImageDimensions = (index, mediaType, width, height) => {
    const standard = MEDIA_STANDARDS[mediaType];

    if (!standard) return;

    // Calculate actual ratio
    const actualRatio = (width / height).toFixed(2);
    const expectedRatio = (standard.width / standard.height).toFixed(2);

    // Allow 5% tolerance
    const ratioTolerance = 0.05;
    const isRatioCorrect =
      Math.abs(actualRatio - expectedRatio) <= ratioTolerance;

    // Update errors if any
    const updatedErrors = [...mediaErrors];

    if (!isRatioCorrect) {
      updatedErrors[
        index
      ] = `Incorrect ratio. Required: ${standard.ratio}, actual: ${width}x${height} (${actualRatio})`;
      setMediaErrors(updatedErrors);

      notification.warning({
        message: "Media type changed with incompatible image",
        description: `Your existing image (${width}x${height}) doesn't match the ${mediaType.toLowerCase()} ratio requirements (${
          standard.ratio
        }). Consider uploading a new image.`,
      });
    } else {
      updatedErrors[index] = null;
      setMediaErrors(updatedErrors);

      notification.success({
        message: "Media type changed successfully",
        description: `Your existing image fits the ${mediaType.toLowerCase()} ratio requirements.`,
      });
    }
  };

  // Check image dimensions to ensure correct ratio
  const checkImageDimensions = (file, index) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const mediaType = medias[index].type;

          // Save actual dimensions and create preview URL
          const updatedMedias = [...medias];
          updatedMedias[index].dimensions = { width, height };
          updatedMedias[index].previewUrl = e.target.result;
          updatedMedias[index].localFile = file;
          setMedias(updatedMedias);

          // Only check dimensions if POSTER or BANNER
          if (mediaType === "POSTER" || mediaType === "BANNER") {
            const standard = MEDIA_STANDARDS[mediaType];

            if (!standard) {
              resolve(true);
              return;
            }

            // Calculate actual ratio
            const actualRatio = (width / height).toFixed(2);
            const expectedRatio = (standard.width / standard.height).toFixed(2);

            // Allow 5% tolerance
            const ratioTolerance = 0.05;
            const isRatioCorrect =
              Math.abs(actualRatio - expectedRatio) <= ratioTolerance;

            // Update errors if any
            const updatedErrors = [...mediaErrors];

            if (!isRatioCorrect) {
              updatedErrors[
                index
              ] = `Incorrect ratio. Required: ${standard.ratio}, actual: ${width}x${height} (${actualRatio})`;
              setMediaErrors(updatedErrors);
              notification.warning({
                message: "Incorrect image dimensions",
                description: `Image ${mediaType.toLowerCase()} should have a ratio of ${
                  standard.ratio
                } (e.g., ${standard.width}x${
                  standard.height
                }px). Your image: ${width}x${height}px.`,
              });
              resolve(false);
            } else {
              updatedErrors[index] = null;
              setMediaErrors(updatedErrors);
              resolve(true);
            }
          } else {
            resolve(true);
          }
        };
      };
    });
  };

  // Upload all media files before submitting
  const uploadAllMedia = async () => {
    const mediaToUpload = medias.filter(
      (media) => media.name && media.localFile && media.type
    );

    if (mediaToUpload.length === 0) {
      return medias.filter((media) => media.name && media.url && media.type);
    }

    setUploadingMedia(true);
    const uploadedMedia = [];

    try {
      for (let i = 0; i < mediaToUpload.length; i++) {
        setCurrentUploadingIndex(i);
        const media = mediaToUpload[i];
        const url = await uploadFileApi.UploadPicture(media.localFile);

        uploadedMedia.push({
          name: media.name,
          url: url.data[0].url,
          type: media.type,
        });
      }

      notification.success({
        message: "Media uploaded successfully",
        description: `Uploaded ${uploadedMedia.length} media files`,
      });

      // Combine newly uploaded media with existing media
      const existingMedia = medias.filter(
        (media) => media.url && !media.localFile
      );
      return [...existingMedia, ...uploadedMedia];
    } catch (error) {
      console.error("Error uploading media:", error);
      notification.error({
        message: "Failed to upload media",
        description:
          "There was an error uploading your media files. Please try again.",
      });
      return [];
    } finally {
      setUploadingMedia(false);
      setCurrentUploadingIndex(null);
    }
  };

  // Validate all media before submitting
  const validateAllMedia = () => {
    const errors = [];

    medias.forEach((media, index) => {
      if (
        media.previewUrl &&
        media.type &&
        (media.type === "POSTER" || media.type === "BANNER")
      ) {
        if (mediaErrors[index]) {
          errors.push({
            index,
            message: mediaErrors[index],
          });
        }

        // Check if dimensions information is missing
        if (!media.dimensions && media.localFile) {
          errors.push({
            index,
            message: `Image ${media.type.toLowerCase()} has not been checked for dimensions`,
          });
        }
      }
    });

    // Show notification if errors exist
    if (errors.length > 0) {
      notification.error({
        message: "Media size errors",
        description:
          "Some images do not match the standard ratio. Please check the Media tab.",
      });
    }

    return errors;
  };

  const handleUpload = async (index, file) => {
    if (!medias[index].type) {
      notification.warning({
        message: "Please select media type before uploading",
      });
      return false;
    }

    // Check image dimensions for POSTER or BANNER
    if (medias[index].type === "POSTER" || medias[index].type === "BANNER") {
      const isValid = await checkImageDimensions(file, index);
      if (!isValid) {
        // Still allow upload but show warning
        notification.warning({
          message: "Continue Upload",
          description:
            "You can still use this image, but it may not display well on the website.",
        });
      }
    } else {
      // For non-image files (like URL inputs), just store the file
      const updatedMedias = [...medias];
      updatedMedias[index].localFile = file;

      // Create a temporary preview URL if possible
      const reader = new FileReader();
      reader.onload = (e) => {
        updatedMedias[index].previewUrl = e.target.result;
        setMedias([...updatedMedias]);
      };
      reader.readAsDataURL(file);
    }

    return false;
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
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingOutlined style={{ fontSize: 48 }} />
        <span className="ml-4 text-xl">Loading movie data...</span>
      </div>
    );
  }

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

          <TabPane tab="Media" key="4">
            <Card className="p-4 shadow-md">
              <div className="mb-6">
                <Alert
                  message="Media Size Standards"
                  description={
                    <div className="space-y-2">
                      <p>
                        <strong>Poster:</strong> Ratio 2:3 (e.g., 1000x1500px)
                      </p>
                      <p>
                        <strong>Banner:</strong> Ratio 16:9 (e.g., 1920x1080px)
                      </p>
                    </div>
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />
              </div>

              <div className="space-y-6">
                {medias.map((media, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-medium text-gray-700">
                          Media Item {index + 1}
                        </h3>
                        {index > 0 && (
                          <Button
                            danger
                            type="text"
                            onClick={() => removeMedia(index)}
                            icon={<DeleteOutlined />}
                          />
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
                              onChange={(e) =>
                                handleMediaChange(index, "name", e.target.value)
                              }
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
                              onChange={(v) =>
                                handleMediaChange(index, "type", v)
                              }
                            >
                              <Option value="POSTER">
                                <div className="flex items-center">
                                  <span>Poster</span>
                                  <Tooltip
                                    title={MEDIA_STANDARDS.POSTER.description}
                                  >
                                    <InfoCircleOutlined className="ml-2 text-gray-400" />
                                  </Tooltip>
                                </div>
                              </Option>
                              <Option value="BANNER">
                                <div className="flex items-center">
                                  <span>Banner</span>
                                  <Tooltip
                                    title={MEDIA_STANDARDS.BANNER.description}
                                  >
                                    <InfoCircleOutlined className="ml-2 text-gray-400" />
                                  </Tooltip>
                                </div>
                              </Option>
                              <Option value="TRAILER">Trailer</Option>
                              <Option value="FILMVIP">VIP Film</Option>
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
                                disabled={!media.type}
                              >
                                {media.previewUrl
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
                                description={`Image: ${
                                  media.dimensions.width
                                }x${media.dimensions.height}px - Ratio: ${
                                  MEDIA_STANDARDS[media.type].ratio
                                }`}
                                type="success"
                                showIcon
                                className="mt-2"
                              />
                            )}

                          {uploadingMedia &&
                            currentUploadingIndex === index && (
                              <div className="mt-4">
                                <div className="flex items-center">
                                  <Spin size="small" className="mr-2" />
                                  <span className="text-blue-600">
                                    Uploading...
                                  </span>
                                </div>
                                <Progress percent={70} status="active" />
                                <p className="mt-1 text-xs text-gray-500">
                                  Please wait while your media is being uploaded
                                </p>
                              </div>
                            )}

                          {media.localFile &&
                            !uploadingMedia &&
                            currentUploadingIndex !== index && (
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
                                {media.type === "TRAILER" ||
                                media.type === "FILMVIP" ? (
                                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                    <iframe
                                      src={media.previewUrl}
                                      className="w-full h-full"
                                      title={media.name || "Media player"}
                                      allowFullScreen
                                    />
                                  </div>
                                ) : (
                                  <img
                                    src={media.previewUrl}
                                    alt={media.name || "Media preview"}
                                    className="w-full aspect-video object-contain bg-gray-50"
                                  />
                                )}
                                {media.localFile && (
                                  <div className="absolute top-2 left-2 bg-yellow-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                                    Pending Upload
                                  </div>
                                )}
                                {!media.localFile && media.previewUrl && (
                                  <div className="absolute top-2 left-2 bg-green-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                                    Uploaded
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                                  {media.type || "No type selected"}
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
                                    <div className="text-xs text-center text-gray-500">
                                      Banner (16:9)
                                    </div>
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
                                          : "media"
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
                                    <div className="text-xs text-center text-gray-500">
                                      Banner (16:9)
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="dashed"
                  onClick={addMedia}
                  className="w-full h-12"
                  icon={<PlusOutlined />}
                >
                  Add Media
                </Button>
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
                    <p className="text-gray-700 mb-3">
                      By submitting your movie, you agree to the following
                      policy:
                    </p>
                    <p className="text-gray-700">
                      If you do not check the box, we will pay you based on the
                      number of views your video receives. If you check the box,
                      we will create a contract and contact you for further
                      details.
                    </p>
                  </div>

                  <Form.Item
                    name="isContract"
                    valuePropName="checked"
                    className="mb-0"
                  >
                    <Checkbox className="font-medium">
                      I agree to create a contract and be contacted for further
                      details
                    </Checkbox>
                  </Form.Item>
                </div>

                {/* File Upload Section */}
                <div>
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-500">
                      <FileImageOutlined />
                    </div>
                    <h3 className="ml-2 text-lg font-semibold text-gray-800">
                      Verification File
                    </h3>
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

                  {fileUrl && (
                    <div className="mb-6 p-4 border rounded-md bg-blue-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 mr-3">
                          <FileImageOutlined />
                        </div>
                        <div>
                          <p className="font-medium text-blue-700">
                            Current Verification File
                          </p>
                          <span
                            onClick={handleGetPreUrlTemp}
                            className="text-blue-600 hover:text-blue-800 underline cursor-pointer mt-1 inline-block"
                          >
                            View current file
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">
                      Update Verification File
                    </h4>
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
                          {uploading
                            ? "Uploading..."
                            : "Click or drag file to upload"}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Upload a new file to verify your movie ownership
                        </p>
                      </div>
                    </Dragger>
                  </div>

                  {file && !fileUrl && (
                    <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-center">
                      <div className="mr-3 text-blue-500">
                        <LoadingOutlined />
                      </div>
                      <div>
                        <p className="text-blue-700">
                          <span className="font-medium">Processing File:</span>{" "}
                          {file.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Please wait while we process your file
                        </p>
                      </div>
                    </div>
                  )}

                  {file && fileUrl && (
                    <div className="mt-4 bg-green-50 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <p className="font-medium text-green-700">
                          File Uploaded Successfully
                        </p>
                      </div>
                      <div className="flex items-center ml-8">
                        <span
                          onClick={handleGetPreUrlTemp}
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer inline-flex items-center"
                        >
                          {file.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          (Click to preview)
                        </span>
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
          {activeTab !== "1" && (
            <Button onClick={() => setActiveTab(String(Number(activeTab) - 1))}>
              Previous
            </Button>
          )}
          {activeTab !== "5" ? (
            <Button
              type="primary"
              onClick={() => setActiveTab(String(Number(activeTab) + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || uploadingMedia}
              size="large"
              className="px-8"
            >
              {uploadingMedia ? "Uploading Media..." : "Update Movie"}
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};

export default UpdateMoviePublisher;
