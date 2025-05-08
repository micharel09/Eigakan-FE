"use client";

import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Descriptions,
  Button,
  notification,
  Spin,
  Card,
  Avatar,
  Modal,
  Input,
  Typography,
} from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { formatDate } from "../../../utils/dateHelper";
import uploadFileApi from "../../../apis/Upload/upload.jsx";
import { extractUrl } from "../../../utils/extractUrl";
import contractApi from "../../../apis/Contract/contract.js";
import ContractProcessStatus from "../../../components/WorkFlow/ContractWorkflow";

const { Title, Text } = Typography;
const { Meta } = Card;

const ContractDetailPublisher = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(false);
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [signToken, setSignedToken] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  useEffect(() => {
    fetchContractDetail();
  }, []);

  useEffect(() => {
    if (contract?.movieId) {
      fetchMovie(contract.movieId);
    }
  }, [contract?.movieId]);

  const fetchMovie = async (movieId) => {
    setLoadingMovie(true);
    try {
      // Assuming there's an API to fetch movie details
      // const response = await movieApi.getMovieById(movieId);
      // setMovie(response.data);

      // For now, we'll use the movie data from the contract
      setMovie(contract.movie);
    } catch (error) {
      console.error("Error fetching movie:", error);
    } finally {
      setLoadingMovie(false);
    }
  };

  const fetchContractDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await contractApi.getContractById(id);
      console.log("Contract:", response.data);
      setContract(response.data);
    } catch (error) {
      console.error("Error fetching contract:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch contract details.",
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleGetPreUrl = async (isTemp) => {
  //   try {
  //     if (!contract?.fileUrl) {
  //       throw new Error("File URL not found.")
  //     }
  //     const extractLink = extractUrl(contract.fileUrl)
  //     console.log("Extracted link:", extractLink)

  //     if (!extractLink?.userId || !extractLink?.fileName) {
  //       throw new Error("Failed to extract userId or fileName from URL")
  //     }

  //     const response = await uploadFileApi.getPreFileContract(extractLink.userId, extractLink.fileName)

  //     console.log("PreUrl:", response.data)
  //     window.open(response.data.url, "_blank")
  //   } catch (error) {
  //     console.error("Error fetching preUrl:", error)
  //     notification.error({
  //       message: "Error",
  //       description: error.message || "Failed to get file URL.",
  //     })
  //   }
  // }
  const handleGetPreUrl = async () => {
    try {
      if (!contract?.fileUrl) {
        throw new Error("File URL not found.");
      }
      const extractLink = extractUrl(contract.fileUrl);
      console.log("Extracted link:", extractLink);

      if (!extractLink?.userId || !extractLink?.fileName) {
        throw new Error("Failed to extract userId or fileName from URL");
      }

      const response = await uploadFileApi.getPreFileContract(
        extractLink.userId,
        extractLink.fileName
      );

      console.log("PreUrl:", response.data);
      setFileUrl(response.data.url); // 👈 Gán URL
      setShowFileModal(true); // 👈 Mở modal
    } catch (error) {
      console.error("Error fetching preUrl:", error);
      notification.error({
        message: "Error",
        description: error.message || "Failed to get file URL.",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      WAITING_FOR_REVIEWING: {
        text: "Waiting for Review",
        color: "bg-yellow-500 text-white",
      },
      SIGNED: { text: "Signed", color: "bg-green-500 text-white" },
      DENIED: { text: "Denied", color: "bg-red-500 text-white" },
    };
    return (
      statusMap[status] || { text: status, color: "bg-gray-500 text-white" }
    );
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      notification.warning({
        message: "Required",
        description: "Please provide a reason for rejection",
      });
      return;
    }

    const data = { Id: contract.id, reasonForDenying: reason };
    try {
      const denied = await contractApi.deniedContract(data);

      if (denied.status === 200) {
        notification.success({
          message: "Success",
          description: denied.message || "Contract rejected successfully!",
        });
        fetchContractDetail(); // Refresh data
      } else {
        notification.error({
          message: "Error",
          description: denied.message || "Failed to reject contract.",
        });
      }
    } catch (error) {
      console.error("Error rejecting contract:", error);
      notification.error({
        message: "Error",
        description: error.message || "An error occurred!",
      });
    }
    setIsRejectModalVisible(false);
  };

  const handleAccept = async () => {
    if (!signToken.trim()) {
      notification.warning({
        message: "Required",
        description: "Please enter your OTP",
      });
      return;
    }

    const data = { id: contract.id, signToken };

    try {
      const accept = await contractApi.acceptedContract(data);

      if (accept.success === true) {
        notification.success({
          message: "Success",
          description: accept.message || "Contract signed successfully!",
        });
        fetchContractDetail(); // Refresh data
      } else {
        notification.error({
          message: "Error",
          description: accept.message || "Failed to sign contract.",
        });
      }
    } catch (error) {
      console.error("Error accepting contract:", error);
      notification.error({
        message: "Error",
        description: error.message || "An error occurred!",
      });
    }
    setIsAcceptModalVisible(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center text-red-500 font-semibold p-8">
        <Title level={4} type="danger">
          Contract not found
        </Title>
      </div>
    );
  }

  // Check if upload button should be shown
  const showUploadButton =
    contract?.status === "SIGNED" &&
    contract.movie &&
    contract.movie.isFilmVipOrTrailer === false;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <Title level={3} className="text-gray-800 mb-2">
          Contract Details
        </Title>
        <Text type="secondary">View and manage your contract information</Text>
      </div>

      {/* Contract Workflow Status */}
      <div className="mb-6">
        <ContractProcessStatus
          movieStatus={movie?.status}
          contractStatus={contract?.status}
          isFilmVipOrTrailer={
            movie?.isFilmVipOrTrailer ||
            contract?.movie?.isFilmVipOrTrailer ||
            false
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Details Section */}
        <div className="lg:col-span-2">
          <Card
            title={
              <div className="flex items-center">
                <FileTextOutlined className="mr-2 text-blue-500" />
                <span>Contract Information</span>
              </div>
            }
            className="shadow-md hover:shadow-lg transition-shadow duration-300"
            bordered={false}
          >
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2, md: 2, lg: 2 }}
              className="bg-gray-50 rounded-md"
            >
              <Descriptions.Item
                label={<span className="font-semibold">Publisher</span>}
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                <Link
                  to={`/user/${contract?.user?.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {contract.publisherName || "N/A"}
                </Link>
              </Descriptions.Item>

              <Descriptions.Item
                label={<span className="font-semibold">Distributor</span>}
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                <span className="text-blue-600 font-medium">
                  {contract.distributorName || "N/A"}
                </span>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-semibold">
                    <ClockCircleOutlined className="mr-1" />
                    Duration
                  </span>
                }
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                <span className="font-medium">{`${contract.duration} days`}</span>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-semibold">
                    <CalendarOutlined className="mr-1" />
                    Created Date
                  </span>
                }
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                <span>{formatDate(contract.contractDate)}</span>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-semibold">
                    <CalendarOutlined className="mr-1" />
                    Start Date
                  </span>
                }
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                <span>{formatDate(contract.startDate)}</span>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-semibold">
                    <CalendarOutlined className="mr-1" />
                    End Date
                  </span>
                }
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                <span>{formatDate(contract.endDate)}</span>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-semibold">
                    <DollarOutlined className="mr-1" />
                    Price
                  </span>
                }
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                <span className="text-green-600 font-bold">{`${contract.price.toLocaleString()} VND`}</span>
              </Descriptions.Item>

              <Descriptions.Item
                label={<span className="font-semibold">Contract File</span>}
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                {/* <Button
                  type="primary"
                  onClick={() => handleGetPreUrl(false)}
                  icon={<FileTextOutlined />}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  View Contract
                </Button> */}

                <Button
                  type="primary"
                  onClick={handleGetPreUrl}
                  icon={<FileTextOutlined />}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  View Contract
                </Button>
                <Modal
                  title="Contract Preview"
                  open={showFileModal}
                  onCancel={() => setShowFileModal(false)}
                  footer={null}
                  width={{ xs: "95%", sm: "90%", md: "85%", lg: "80%" }}
                  style={{
                    top: "5vh",
                    maxWidth: "1400px",
                    margin: "0 auto",
                  }}
                >
                  {fileUrl ? (
                    <iframe
                      src={fileUrl}
                      title="Contract Preview"
                      width="100%"
                      style={{
                        border: "none",
                        height: "calc(90vh - 120px)",
                        minHeight: "400px",
                      }}
                    />
                  ) : (
                    <div
                      className="flex justify-center items-center"
                      style={{ height: "50vh" }}
                    >
                      <Spin size="large" />
                    </div>
                  )}
                </Modal>
              </Descriptions.Item>

              <Descriptions.Item
                label={<span className="font-semibold">Status</span>}
                labelStyle={{ backgroundColor: "#f9fafb" }}
                span={2}
              >
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusBadge(contract.status).color
                  }`}
                >
                  {getStatusBadge(contract.status).text}
                </span>
              </Descriptions.Item>

              {contract.reasonForDenying && (
                <Descriptions.Item
                  label={
                    <span className="font-semibold">Rejection Reason</span>
                  }
                  labelStyle={{ backgroundColor: "#f9fafb" }}
                  span={2}
                >
                  <div className="p-2 bg-red-50 border border-red-100 rounded text-red-700">
                    {contract.reasonForDenying}
                  </div>
                </Descriptions.Item>
              )}

              <Descriptions.Item
                label={<span className="font-semibold">Updated</span>}
                labelStyle={{ backgroundColor: "#f9fafb" }}
                span={2}
              >
                {contract.updateDate ? formatDate(contract.updateDate) : "N/A"}
              </Descriptions.Item>
            </Descriptions>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end">
              {contract?.status === "SIGNED" ||
              contract?.status === "DENIED" ? (
                <></>
              ) : (
                <>
                  <Button
                    onClick={() => setIsAcceptModalVisible(true)}
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    className="mr-3 bg-green-500 hover:bg-green-600 border-none"
                  >
                    Sign Contract
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setIsRejectModalVisible(true)}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Movie Information Section */}
        <div className="lg:col-span-1">
          <Card
            title={
              <div className="flex items-center">
                <span className="mr-2">🎬</span>
                <span>Movie Information</span>
              </div>
            }
            className="shadow-md hover:shadow-lg transition-shadow duration-300"
            bordered={false}
          >
            {loadingMovie ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : contract?.movie ? (
              <Link
                to={`/publisher/movie/${contract.movie?.id}`}
                className="block"
              >
                <div className="flex flex-col items-center">
                  <div className="w-full h-48 mb-4 overflow-hidden rounded-lg">
                    <img
                      alt={contract.movie?.title || "Movie"}
                      src={
                        contract.movie?.medias?.[0]?.url ||
                        "/placeholder.svg?height=200&width=300"
                      }
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  <Meta
                    avatar={
                      <Avatar
                        src={contract?.user?.picture}
                        icon={!contract?.user?.picture && <UserOutlined />}
                      />
                    }
                    title={
                      <span className="text-lg">
                        {contract.movie?.title || "N/A"}
                      </span>
                    }
                    description={
                      <div className="mt-2">
                        <p>
                          <strong>Publisher:</strong>{" "}
                          {contract?.publisherName || "N/A"}
                        </p>
                        {contract.movie?.isFilmVipOrTrailer !== undefined && (
                          <p>
                            <strong>Type:</strong>{" "}
                            {contract.movie.isFilmVipOrTrailer
                              ? "VIP/Trailer"
                              : "Regular"}
                          </p>
                        )}
                      </div>
                    }
                  />
                </div>
              </Link>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No movie information available
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        title={
          <div className="flex items-center text-red-500">
            <CloseCircleOutlined className="mr-2" />
            <span>Reject Contract</span>
          </div>
        }
        open={isRejectModalVisible}
        onOk={handleReject}
        onCancel={() => setIsRejectModalVisible(false)}
        okText="Confirm Rejection"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2">
          <p className="mb-2">
            Please provide a reason for rejecting this contract:
          </p>
          <Input.TextArea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full"
          />
        </div>
      </Modal>

      {/* Accept Modal */}
      <Modal
        title={
          <div className="flex items-center text-green-500">
            <CheckCircleOutlined className="mr-2" />
            <span>Sign Contract</span>
          </div>
        }
        open={isAcceptModalVisible}
        onOk={handleAccept}
        onCancel={() => setIsAcceptModalVisible(false)}
        okText="Confirm Signing"
        cancelText="Cancel"
        okButtonProps={{
          className: "bg-green-500 hover:bg-green-600 border-none",
        }}
      >
        <div className="py-2">
          <p className="mb-2">Please enter your OTP to sign this contract:</p>
          <Input
            value={signToken}
            onChange={(e) => setSignedToken(e.target.value)}
            placeholder="Enter your OTP"
            className="w-full"
            prefix={<span className="text-gray-400">OTP:</span>}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ContractDetailPublisher;
