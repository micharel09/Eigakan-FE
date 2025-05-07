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
  Form,
  DatePicker,
  InputNumber,
} from "antd";
import {
  FileTextOutlined,
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
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Meta } = Card;

const ContractDetailAdmin = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(false);

  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);

  useEffect(() => {
    fetchContractDetail();
  }, []);

  useEffect(() => {
    if (contract?.movieId) {
      fetchMovie();
    }
  }, [contract?.movieId]);

  const fetchMovie = async () => {
    setLoadingMovie(true);
    try {
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
      setFileUrl(response.data.url); // Gán URL
      setShowFileModal(true); // Mở modal
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

  const showUpdateModal = () => {
    form.setFieldsValue({
      startDate: contract?.startDate ? dayjs(contract.startDate) : null,
      duration: contract?.duration || 30,
      price: contract?.price || 0,
      publisherName: contract?.publisherName || "",
      distributorName: contract?.distributorName || "",
    });
    setFileList([]);
    setUploadedFileUrl("");
    setUploadError("");
    setIsUpdateModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      if (!uploadedFileUrl && fileList.length > 0) {
        // If file is selected but not uploaded yet, upload it first
        const fileUrl = await handleUpload();
        if (!fileUrl) {
          notification.error({
            message: "Please upload the contract file first",
          });
          return;
        }
      }

      setLoading(true);

      const contractData = {
        id,
        ...values,
        movieId: contract.movie?.id,
        startDate: values.startDate.format("DD/MM/YYYY"),
      };

      await contractApi.updateContract(id, contractData);
      notification.success({ message: "Contract updated successfully" });
      setIsUpdateModalVisible(false);
      await fetchContractDetail(); // Refresh data
    } catch (error) {
      console.error("Error updating contract:", error);
      notification.error({ message: "Failed to update contract" });
    } finally {
      setLoading(false);
    }
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

  if (loading && !isUpdateModalVisible) {
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
  const showUpdateButton = contract?.status === "DENIED" && contract.movie;

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
                <Button
                  type="primary"
                  onClick={handleGetPreUrl}
                  icon={<FileTextOutlined />}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  View Contract
                </Button>
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

              {contract.reasonForRejection && (
                <Descriptions.Item
                  label={
                    <span className="font-semibold">Rejection Reason</span>
                  }
                  labelStyle={{ backgroundColor: "#f9fafb" }}
                  span={2}
                >
                  <div className="p-2 bg-red-50 border border-red-100 rounded text-red-700">
                    {contract.reasonForRejection}
                  </div>
                </Descriptions.Item>
              )}

              <Descriptions.Item
                label={<span className="font-semibold">Created</span>}
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                {formatDate(contract.createDate)}
              </Descriptions.Item>

              <Descriptions.Item
                label={<span className="font-semibold">Updated</span>}
                labelStyle={{ backgroundColor: "#f9fafb" }}
              >
                {contract.updateDate ? formatDate(contract.updateDate) : "N/A"}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-6 flex justify-end">
              {showUpdateButton && (
                <Button
                  type="primary"
                  onClick={showUpdateModal}
                  icon={<UploadOutlined />}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Update Contract
                </Button>
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
              <Link to={`/admin/movie/${contract.movie?.id}`} className="block">
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

      {/* Contract Update Modal */}
      <Modal
        title="Update Contract"
        open={isUpdateModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsUpdateModalVisible(false)}
        okText="Update Contract"
        cancelText="Cancel"
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select a start date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration (days)"
            rules={[{ required: true, message: "Please enter duration" }]}
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
              parser={(value) => value.replace(/,/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="publisherName"
            label="Publisher Name"
            rules={[{ required: true, message: "Please enter publisher name" }]}
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

      {/* Contract Preview Modal */}
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
              height: "calc(90vh - 120px)", // Responsive height based on viewport
              minHeight: "400px", // Minimum height
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
    </div>
  );
};

export default ContractDetailAdmin;
