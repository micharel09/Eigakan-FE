"use client";
import moment from "moment";
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
  Input,
  Form,
  DatePicker,
  InputNumber,
  Divider,
  Table,
  Pagination,
  Tooltip,
} from "antd";
import {
  PlayCircleOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import movieService from "../../../apis/Movie/movie";
import contractApi from "../../../apis/Contract/contract";
import { extractUrl } from "../../../utils/extractUrl";
import uploadFileApi from "../../../apis/Upload/upload.jsx";
import ProcessStatus from "../../../components/WorkFlow/MovieWorkflow.jsx";
import { Link } from "react-router-dom";
import MovieCount from "./MovieCount.jsx";
import movieEarningService from "../../../apis/MovieEarning/movieEarning.js";
import { formatDate } from "../../../utils/dateHelper";

const { Content } = Layout;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

const MovieDetail = () => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: "" });
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isActiveModalVisible, setIsActiveModalVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [movieEarnings, setMovieEarnings] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [fileList, setFileList] = useState([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadError, setUploadError] = useState("");

  const { id } = useParams();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMovieDetails();
    fetchMovieEarningByMovieId(currentPage, pageSize);

    // Initialize form with publisher and distributor names
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    form.setFieldsValue({
      distributorName: loggedInUser.userName || "",
    });
  }, []);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const response = await movieService.getMovieById(id);
      setMovie(response.data);

      // Set publisher name from API response
      form.setFieldsValue({
        publisherName: response.data.userName || "",
      });
    } catch (error) {
      notification.error({ message: "Failed to fetch movie details" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMovieEarningByMovieId = async (page = 1, pageSize = 5) => {
    setLoading(true);
    try {
      const result = await movieEarningService.getMovieEarningByMovieId(
        id,
        page,
        pageSize
      );

      // Kiểm tra nếu có dữ liệu trả về
      if (result) {
        setMovieEarnings(result.movieEarningMovieId || []);
        setTotalEarnings(result.totalEarnings || 0);
        setTotal(result.totalItems || 0);
      }
    } catch (error) {
      console.error("Error fetching movie earnings:", error);
      notification.error({ message: "Failed to fetch movie earnings" });
    } finally {
      setLoading(false);
    }
  };

  const handleActive = async () => {
    setLoading(true);
    try {
      const data = { id: movie?.id };
      const response = await movieService.acceptedMovie(data);
      if (response.status === 200) {
        notification.success({
          message: response.data.message || "Active successfully!",
        });
        await fetchMovieDetails(); // Reload data after successful update
      } else {
        notification.error({
          message: response.data.message || "Failed to active user.",
        });
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      notification.error({ message: error.message || "An error occurred!" });
    } finally {
      setLoading(false);
      setIsActiveModalVisible(false);
    }
  };

  const handleAccept = async () => {
    try {
      setLoading(true); // 🔹 Bật trạng thái loading

      const data = { Id: movie?.id };
      const values = await form.validateFields(); // Lấy giá trị từ form

      const contractData = {
        startDate: values.startDate.format("DD/MM/YYYY"),
        duration: Number(values.duration),
        price: Number(values.price),
        publisherName: values.publisherName,
        distributorName: values.distributorName,
        movieId: movie?.id,
      };

      // Gọi API tạo contract
      await contractApi.createContract(contractData);
      notification.success({ message: "Contract generated successfully!" });

      // Gọi API accept movie
      const response = await movieService.acceptedMovie(data);

      if (response.status === 200) {
        notification.success({ message: "Just one more minus........" });

        setIsAcceptModalVisible(false);
        // Fetch movie details again to update the status
        await fetchMovieDetails();
      } else {
        notification.error({
          message: response.data.message || "Failed to accept movie",
        });
      }
    } catch (error) {
      notification.error({
        message: error.data?.message || "An error occurred",
      });
    } finally {
      setLoading(false); // 🔹 Luôn tắt loading khi xử lý xong
    }
  };

  const handleAcceptNoContract = async () => {
    try {
      setLoading(true);

      const data = { Id: movie?.id };

      const response = await movieService.acceptedMovieNotContract(data);

      if (response.status === 200) {
        notification.success({ message: "Accepted successfull!!!" });

        await fetchMovieDetails();
      } else {
        notification.error({
          message: response.data.message || "Failed to accept movie",
        });
      }
    } catch (error) {
      notification.error({
        message: error.data?.message || "An error occurred",
      });
    } finally {
      setLoading(false); // 🔹 Luôn tắt loading khi xử lý xong
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const data = { id: movie?.id, reasonForRejection: reason };
      const response = await movieService.rejectedMovie(data);
      if (response.status === 200) {
        notification.success({
          message: response.data.message || "Rejected successfully!",
        });
        await fetchMovieDetails(); // Reload data after successful update
      } else {
        notification.error({
          message: response.data.message || "Failed to reject user.",
        });
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      notification.error({ message: error.message || "An error occurred!" });
    } finally {
      setLoading(false);
      setIsRejectModalVisible(false);
      setReason("");
    }
  };

  const handleArchived = async () => {
    setLoading(true);
    try {
      const response = await movieService.archivedMovie(id);
      if (response.status === 200) {
        notification.success({
          message: response.data.message || "Archived successfully!",
        });
        await fetchMovieDetails(); // Reload data after successful update
      } else {
        notification.error({
          message: response.data.message || "Failed to archived.",
        });
      }
    } catch (error) {
      console.error("Error archived movie:", error);
      notification.error({ message: error.message || "An error occurred!" });
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (type) =>
    movie?.medias?.find((m) => m.type === type)?.url || "";

  const renderMedia = (type) => {
    const url = getMediaUrl(type);

    if (type === "DASHBOARD") {
      return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <Title level={3} className="text-gray-800 mb-1">
              Movie Dashboard
            </Title>
            <Text className="text-gray-500">
              Comprehensive analytics and information
            </Text>{" "}
            <br />
            <Text className="text-gray-500">
              This movie from:{" "}
              <Link
                to={`/user/${movie?.userId}`}
                className="text-blue-500 hover:underline"
              >
                {movie?.userName}
              </Link>
            </Text>
          </div>

          {/* Performance Metrics - Bottom Row */}
          <div className="mb-6">
            <Card
              className="shadow-md hover:shadow-lg transition-shadow duration-300"
              title={
                <div className="flex items-center">
                  <div className="bg-green-500 w-1 h-6 mr-3 rounded-full"></div>
                  <span>Performance Metrics</span>
                </div>
              }
              bordered={false}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-green-50 border-0">
                    <Statistic
                      title={
                        <div className="flex items-center text-green-700">
                          <StarOutlined className="mr-1" />
                          <span>User Rating</span>
                        </div>
                      }
                      value={movie?.userRating || 0}
                      suffix="/5"
                      valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
                    />
                  </Card>
                </div>

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
          </div>

          {/* Movie List with Pagination - New Section */}
          <Card
            title={
              <div className="flex items-center">
                <div className="bg-purple-500 w-1 h-6 mr-3 rounded-full"></div>
                <span>
                  Movie Earnings - Total Earnings: {totalEarnings} VND
                </span>
              </div>
            }
            bordered={false}
            className="shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <Table
              columns={columns}
              dataSource={movieEarnings}
              rowKey="id"
              loading={loading}
              pagination={false}
            />

            <div className="flex justify-end mt-4">
              <Pagination
                current={currentPage}
                onChange={handlePageChange}
                total={total}
                pageSize={pageSize}
                showSizeChanger={false}
              />
            </div>
          </Card>
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
        notification.error({ message: "An error occurred!" });
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
        notification.error({ message: "An error occurred!" });
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

  const columns = [
    {
      title: "Week (from - to)",
      dataIndex: "startWeek",
      key: "startWeek",
      render: (_, record) => `${record.startWeek} - ${record.endWeek}`,
    },
    {
      title: "Views",
      dataIndex: "totalView",
      key: "totalView",
    },
    {
      title: "Earnings",
      dataIndex: "totalEarnings",
      key: "totalEarnings",
      render: (value) => Number.parseFloat(value).toLocaleString() + " VND",
    },
    {
      title: "Created At",
      dataIndex: "createDate",
      key: "createDate",
      render: (value) => new Date(value).toLocaleString(),
    },
  ];

  // Bổ sung thêm xử lý pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchMovieEarningByMovieId(page, pageSize);
  };

  const renderContract = () => {
    if (!movie?.contracts || movie.contracts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
          <FileTextOutlined
            style={{ fontSize: 64 }}
            className="text-gray-300 mb-4"
          />
          <Title level={4} className="text-gray-500">
            No Contracts Available
          </Title>
          <Text className="text-gray-400">
            This movie doesn't have any contracts.
          </Text>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <Title level={3} className="text-gray-800 mb-1">
            Movie Contracts
          </Title>
          <Text className="text-gray-500">
            Contract information for this movie
          </Text>
        </div>

        {movie.contracts.map((contract) => {
          const startDate = moment(contract.startDate);
          const today = moment().startOf("day");
          const isFutureDate = startDate.isAfter(today);

          return (
            <Card
              key={contract.id}
              className={`mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 ${
                isFutureDate ? "border-l-4 border-l-yellow-500" : ""
              }`}
              title={
                <div className="flex items-center">
                  <div className="bg-blue-500 w-1 h-6 mr-3 rounded-full"></div>
                  <Link
                    to={`/admin/contract/${contract.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Contract Details
                  </Link>
                  {isFutureDate && (
                    <Tag color="warning" className="ml-2">
                      Upcoming
                    </Tag>
                  )}
                </div>
              }
              extra={
                <Tag
                  color={
                    contract.status === "SIGNED" ? "success" : "processing"
                  }
                >
                  {contract.status}
                </Tag>
              }
              bordered={false}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    <FileTextOutlined className="text-blue-500 mr-2" />
                    <Text strong className="text-gray-700">
                      Contract ID
                    </Text>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <Paragraph className="text-gray-800 m-0 font-mono">
                      {contract.id}
                    </Paragraph>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <UserOutlined className="text-green-500 mr-2" />
                    <Text strong className="text-gray-700">
                      Distributor Name
                    </Text>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <Paragraph className="text-gray-800 m-0">
                      {contract.distributorName}
                    </Paragraph>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <UserOutlined className="text-green-500 mr-2" />
                    <Text strong className="text-gray-700">
                      Start Date
                    </Text>
                  </div>
                  <div
                    className={`bg-gray-50 p-3 rounded-lg ${
                      isFutureDate ? "bg-yellow-50" : ""
                    }`}
                  >
                    <Paragraph
                      className={`m-0 ${
                        isFutureDate
                          ? "text-yellow-700 font-medium"
                          : "text-gray-800"
                      }`}
                    >
                      {formatDate(contract.startDate)}
                      {isFutureDate && (
                        <span className="ml-2 text-yellow-600">
                          (Starts in {startDate.diff(today, "days")} days)
                        </span>
                      )}
                    </Paragraph>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      notification.error({ message: "Please select a contract file" });
      return null;
    }

    setLoading(true);
    setUploadError("");

    try {
      const file = fileList[0].originFileObj || fileList[0];

      // Use the existing API function directly
      const response = await uploadFileApi.UploadFileContractTemp(file);

      if (response?.status == true) {
        setUploadedFileUrl(response.fileUrl);
        notification.success({ message: "File uploaded successfully" });
        return response.fileUrl;
      } else {
        throw new Error("File uploaded but no URL returned");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(error.message || "Failed to upload file");
      notification.error({
        message: "Upload Failed",
        description: error.message || "Failed to upload file",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check if any contract has a future start date
  const isAnyContractInFuture = () => {
    if (!movie?.contracts || movie.contracts.length === 0) return false;

    return movie.contracts.some((contract) => {
      const startDate = moment(contract.startDate); // Parse ISO format date
      const today = moment().startOf("day");
      return startDate.isAfter(today);
    });
  };

  // Get the earliest future contract date for tooltip
  const getEarliestFutureDate = () => {
    if (!movie?.contracts || movie.contracts.length === 0) return null;

    let earliestDate = null;

    movie.contracts.forEach((contract) => {
      const startDate = moment(contract.startDate);
      const today = moment().startOf("day");

      if (startDate.isAfter(today)) {
        if (!earliestDate || startDate.isBefore(earliestDate)) {
          earliestDate = startDate;
        }
      }
    });

    return earliestDate ? earliestDate.format("MMMM D, YYYY") : null;
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <ProcessStatus
          movieStatus={movie?.status}
          contractStatus={movie?.contracts?.[0]?.status}
          isContract={movie?.isContract}
        />
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
                      </div>
                      <div className="mt-2">
                        <Tag
                          color={movie?.isContract === true ? "success" : "red"}
                          className="text-base px-3 py-1"
                        >
                          {movie?.isContract ? "Has Contract" : "No Contract"}
                        </Tag>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!["ACTIVE", "WAITING_FOR_REVIEWING"].includes(
                        movie?.status
                      ) && (
                        <Link
                          key={movie?.id}
                          to={`/admin/updateMovie/${movie?.id}`}
                        >
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="large"
                            className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500 hover:border-yellow-600"
                          >
                            Update
                          </Button>
                        </Link>
                      )}

                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="large"
                        onClick={
                          movie?.status === "WAITING_FOR_REVIEWING"
                            ? handleGetPreUrlTemp
                            : handleGetPreUrl
                        }
                        className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                      >
                        View File Copy-right
                      </Button>

                      {movie?.status === "WAITING_FOR_REVIEWING" && (
                        <>
                          {movie?.isContract === true ? (
                            <Button
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              size="large"
                              onClick={() => setIsAcceptModalVisible(true)}
                              className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
                            >
                              Accept with Contract
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              size="large"
                              onClick={handleAcceptNoContract}
                              className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
                            >
                              Accept without Contract
                            </Button>
                          )}
                          <Button
                            type="primary"
                            danger
                            icon={<CloseCircleOutlined />}
                            size="large"
                            onClick={() => setIsRejectModalVisible(true)}
                            loading={loading}
                            className="hover:bg-red-600 hover:border-red-600"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {(movie?.contracts?.some((c) => c.status === "SIGNED") ||
                        movie?.status === "ACTIVE" ||
                        movie?.status === "ARCHIVED") && (
                        <>
                          {movie?.status === "ACTIVE" ? (
                            <Button
                              type="primary"
                              danger
                              icon={<CloseCircleOutlined />}
                              size="large"
                              onClick={handleArchived}
                              loading={loading}
                              className="hover:bg-red-600 hover:border-red-600"
                            >
                              Inactive
                            </Button>
                          ) : (
                            <Tooltip
                              title={
                                isAnyContractInFuture()
                                  ? `This movie cannot be activated until the contract start date (${getEarliestFutureDate()})`
                                  : "Activate this movie"
                              }
                            >
                              <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                size="large"
                                onClick={() => setIsActiveModalVisible(true)}
                                loading={loading}
                                disabled={isAnyContractInFuture()}
                                style={{
                                  backgroundColor: isAnyContractInFuture()
                                    ? "#d9d9d9"
                                    : "#52c41a",
                                  borderColor: isAnyContractInFuture()
                                    ? "#d9d9d9"
                                    : "#52c41a",
                                  color: isAnyContractInFuture()
                                    ? "rgba(0, 0, 0, 0.25)"
                                    : "#fff",
                                  cursor: isAnyContractInFuture()
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                Active
                              </Button>
                            </Tooltip>
                          )}
                        </>
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
              <Tabs defaultActiveKey="movie">
                <TabPane
                  key="movie"
                  tab={
                    <span>
                      <VideoCameraOutlined /> Movie
                    </span>
                  }
                >
                  <Tabs defaultActiveKey="poster" tabPosition="left">
                    {[
                      "POSTER",
                      "BANNER",
                      "TRAILER",
                      "FILMVIP",
                      "Actor/Acstress",
                    ].map((key) => (
                      <TabPane
                        key={key.toLowerCase()}
                        tab={
                          <span>
                            {key === "TRAILER" ? (
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
                </TabPane>
                <TabPane
                  key="dashboard"
                  tab={
                    <span>
                      <BarChartOutlined /> Dashboard
                    </span>
                  }
                >
                  {renderMedia("DASHBOARD")}
                </TabPane>
                <TabPane
                  key="contract"
                  tab={
                    <span>
                      <FileTextOutlined /> Contract
                    </span>
                  }
                >
                  {renderContract()}
                </TabPane>
              </Tabs>
            </Card>
          </>
        )}

        {/* Contract Generation Modal */}
        <Modal
          title="Accept Movie with Contract"
          open={isAcceptModalVisible}
          onOk={handleAccept}
          onCancel={() => setIsAcceptModalVisible(false)}
          okText="Accept and Generate Contract"
          cancelText="Cancel"
          confirmLoading={loading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[
                { required: true, message: "Please select a start date" },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) =>
                  current && current < moment().startOf("day")
                }
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (days)"
              rules={[{ required: true, message: "Please enter duration" }]}
            >
              <InputNumber style={{ width: "100%" }} min={50} />
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
                parser={(value) => value.replace(/,/g, "")}
              />
            </Form.Item>

            <Form.Item
              name="publisherName"
              label="Publisher Name"
              rules={[
                { required: true, message: "Please enter publisher name" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="distributorName"
              label="Distributor Name"
              rules={[
                { required: true, message: "Please enter distributor name" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Contract File">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFileList([
                      {
                        uid: "-1",
                        name: file.name,
                        status: "done",
                        originFileObj: file,
                      },
                    ]);
                    setUploadedFileUrl("");
                    setUploadError("");
                  }
                }}
                className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
              />

              {fileList.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Selected file: {fileList[0].name}
                  </p>
                  <Button
                    type="link"
                    onClick={() => {
                      setFileList([]);
                      setUploadedFileUrl("");
                      setUploadError("");
                    }}
                    className="text-red-500 p-0"
                  >
                    Remove
                  </Button>
                </div>
              )}

              {uploadError && (
                <div className="mt-2 text-red-500 text-sm">
                  Error: {uploadError}
                </div>
              )}

              <div className="mt-3">
                <Button
                  type="primary"
                  onClick={handleUpload}
                  disabled={fileList.length === 0 || loading}
                  loading={loading}
                >
                  Upload File
                </Button>

                {uploadedFileUrl && (
                  <span className="ml-3 text-green-600">
                    ✓ File uploaded successfully
                  </span>
                )}
              </div>
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

        {/* Active movie */}
        <Modal
          title="Generate Contract"
          open={isActiveModalVisible}
          onOk={handleActive}
          onCancel={() => setIsActiveModalVisible(false)}
          okText="Activate"
          cancelText="Cancel"
          confirmLoading={loading}
        >
          <h1>Are you sure to active this movie and publish on website?</h1>
        </Modal>
      </Content>
    </Layout>
  );
};

export default MovieDetail;
