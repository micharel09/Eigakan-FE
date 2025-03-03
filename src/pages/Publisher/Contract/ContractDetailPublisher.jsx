import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Descriptions, Button, notification, Space, Spin, Card, Avatar,Modal,Input } from "antd";
import { formatDate } from "../../../utils/dateHelper";
import uploadFileApi from "../../../apis/Upload/upload.jsx";
import { extractUrl } from "../../../utils/extractUrl";
import contractApi from "../../../apis/Contract/contract.js";
import movieService from "../../../apis/Movie/movie";

const ContractDetailPublisher = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const { Meta } = Card;
  const [movie, setMovie] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(false);  
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false); 
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [signedToken, setSignedToken] = useState("");

  useEffect(() => {
    fetchContractDetail();
  }, [id]);
  
  useEffect(() => {
    if (contract?.movieId) {
      fetchMovie(contract.movieId);
    }
  }, [contract?.movieId]);
  

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

  const fetchMovie = async (movieId) => {
    if (!movieId) return;
    setLoadingMovie(true);
    try {
      const response = await movieService.getMovieById(movieId);
      const movie = response.data;
      const posterMedia = movie.medias.find(media => media.type === "POSTER");
      setMovie({
        ...movie,
        posterUrl: posterMedia ? posterMedia.url : null
      });
    } catch (error) {
      console.error(`Error fetching movie ${movieId}:`, error);
    } finally {
      setLoadingMovie(false);
    }
  };

  const handleGetPreUrl = async (isTemp) => {
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
      window.open(response.data.url, "_blank");
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
      "WAITING_FOR_REVIEWING": { text: "Waiting for Review", color: "bg-yellow-500" },
      "Accepted": { text: "Accepted", color: "bg-green-500" },
      "Rejected": { text: "Rejected", color: "bg-red-500" },
    };
    return statusMap[status] || { text: status, color: "bg-gray-500" };
  };

  const handleReject = async () => {
    const data = { Id: contract.id, reasonForDenying: reason };
  
    try {
      const denied = await contractApi.deniedContract(data);

      if (denied.status === 200) {
       
          notification.success({
            message: response.data.message || "Denied successfully!",
          });    
      
        } else {
        notification.error({
          message: response.data.message || "Failed to denied user.",
        });
      }
    } catch (error) {
      console.error("Error accepting user:", error);
      notification.error({ message: error.message || "An error occurred!" });
    }
    setIsRejectModalVisible(false);
  };

  const handleAccept = async () => {
    const data = { Id: contract.id, signedToken };
  
    try {
      const accept = await contractApi.acceptedContract(data);

      if (accept.status === 200) {
       
          notification.success({
            message: response.data.message || "Accepted successfully!",
          });    
      
        } else {
        notification.error({
          message: response.data.message || "Failed to accept user.",
        });
      }
    } catch (error) {
      console.error("Error accepting user:", error);
      notification.error({ message: error.message || "An error occurred!" });
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
      <div className="text-center text-red-500 font-semibold">
        Contract not found.
      </div>
    );
  }

  return (
    <div className="p-6">
        <Descriptions title="Contract Details" bordered column={3}>
        <Descriptions.Item label="Publisher">
        
        <Link key={contract?.user.id} to={`/user/${contract?.user.id}`} >
            <a className="text-red-500 font-semibold">{contract.publisherName || "N/A"}</a>
        </Link>
        
        </Descriptions.Item>
        <Descriptions.Item label="Distributor">
            <span className="text-red-500 font-semibold">{contract.distributorName || "N/A"}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Duration">{`${contract.duration} days`}</Descriptions.Item>
        <Descriptions.Item label="Contract Created Date">{formatDate(contract.contractDate)}</Descriptions.Item>
        <Descriptions.Item label="Start Date">{formatDate(contract.startDate)}</Descriptions.Item>
        <Descriptions.Item label="End Date">{formatDate(contract.endDate)}</Descriptions.Item>
        <Descriptions.Item label="Price">{`${contract.price.toLocaleString()} VND`}</Descriptions.Item>
        <Descriptions.Item label="File Name">
          <Space>
            <Button onClick={() => handleGetPreUrl(false)}>View Contract</Button>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <span className={`text-white px-4 py-1 rounded-full ${getStatusBadge(contract.status).color}`}>
            {getStatusBadge(contract.status).text}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Reason for Rejection">
          {contract.reasonForRejection || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Created Date">
          {formatDate(contract.createDate)}
        </Descriptions.Item>
        <Descriptions.Item label="Updated Date">
          {contract.updateDate ? formatDate(contract.updateDate) : "N/A"}
        </Descriptions.Item>
      </Descriptions>

       <div style={{ marginTop: "20px", textAlign: "right" }}>
              <Button
                onClick={() => setIsAcceptModalVisible(true)}
                type="primary"
                style={{ marginRight: "10px" }}
              >
                Approve
              </Button>
              <Button type="danger" onClick={() => setIsRejectModalVisible(true)} >
                Reject
              </Button>
            </div>

       {/* Thêm Card bên dưới */}
       <div className="mt-6 flex justify-center">
        <Link key={movie?.id} to={`/admin/movie/${contract.movieId}`}>
        <Card
          style={{ width: 300 }}
          cover={
            <img
              alt="example"
              src={movie?.posterUrl || "/placeholder.svg"}
            />
          }
        >
          <Meta
            avatar={<Avatar src={contract?.user.picture} />}
            title= {movie?.title || "N/A"}
            description={`Publisher: ${contract?.publisherName || "N/A"}`}
          />
        </Card>
        </Link>
      </div>

        {/* Reject Modal */}
        <Modal
          title="Reject contract"
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

      {/* Accept Modal */}
      <Modal
        title="Accept contract"
        open={isAcceptModalVisible}
        onOk={handleAccept}
        onCancel={() => setIsAcceptModalVisible(false)}
        okText="Confirm Accept"
        cancelText="Cancel"
      >
        <div>
          <div className="mb-4">
            <label>Your OTP</label>
            <Input
              value={signedToken || ""}
              onChange={(e) => setSignedToken(e.target.value)}
              placeholder="Enter your otp"
            />
          </div>
        </div>
      </Modal>

    </div>
    
  );
};

export default ContractDetailPublisher;
