import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Import để lấy id từ URL
import { Badge, Descriptions, Button, Modal, Input, Spin, notification } from "antd";
import UserRegisterApi from "../../../apis/UserRegister/UserRegister.js";
import { formatDate } from "../../../utils/dateHelper";
import Link from "antd/es/typography/Link";

const UserRegisterDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [userRegister, setUserRegister] = useState(null);
  const [loading, setLoading] = useState(true); // Trạng thái loading

  const handleReject = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    console.log("Reject Reason:", reason);
    setIsModalVisible(false);
    setReason(""); // Reset input sau khi submit
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setReason(""); // Reset input nếu bấm Cancel
  };

  const handleAccept = async (id) => {
    try {
      const data = { id };
      const response = await UserRegisterApi.acceptedUserRegister(data);
      console.log("Response:", response);

      if (response && response.status === 200) {
        // Cập nhật trạng thái status và thông báo thành công
        setUserRegister((prevUserRegister) => ({
          ...prevUserRegister,
          status: "Accepted",  // Thay đổi status
        }));
        notification.success({ message: response.data.message || 'Accepted successfully!' });
      } else {
        notification.error({ message: response.data.message || 'Failed to accept user.' });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      notification.error({ message: error.message || 'An error occurred!' });
    }
  };

  const handleRejectUser = async (id, reason) => {
    try {
      const data = { id, reasonForRejection: reason };
      const response = await UserRegisterApi.rejectedUserRegister(data);
      console.log("Response:", response);
  
      if (response && response.status === 200) {
        // Cập nhật trạng thái status và lý do từ chối
        setUserRegister((prevUserRegister) => ({
          ...prevUserRegister,
          status: "Rejected",  
          reasonForRejection: reason, 
        }));
        notification.success({ message: response.data.message || 'Rejected successfully!' });
      } else {
        notification.error({ message: response.data.message || 'Failed to reject user.' });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      notification.error({ message: error.message || 'An error occurred!' });
    } finally {
      setIsModalVisible(false);  // Đóng modal sau khi hoàn tất
      setReason("");  // Reset lý do nhập vào
    }
  };
  

  // Hàm lấy dữ liệu từ API
  const fetchUserRegister = async () => {
    if (!id) return; // Nếu không có ID thì không gọi API
    setLoading(true);
    try {
      const response = await UserRegisterApi.getUserRegisterDetail(id);
      console.log("User Data:", response.data);
      setUserRegister(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRegister();
  }, [id]);

  // Nếu đang loading thì hiển thị spinner
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Nếu không có dữ liệu
  if (!userRegister) {
    return <p style={{ textAlign: "center" }}>Không tìm thấy dữ liệu</p>;
  }

  // Cập nhật dữ liệu vào items
  // Cập nhật dữ liệu vào items
const items = [
  { key: "1", label: "Name", children: userRegister.fullName },
  {
    key: "2",
    label: "Email",
    children: (
      <a
        href={`/userRegister/email/${userRegister.email}`}
        className="text-blue-500"
      >
        {userRegister.email}
      </a>
    ),
  },
  { key: "3", label: "Phone Number", children: userRegister.phoneNumber },
  { key: "4", label: "File Name", children: userRegister.fileUrl },
  {
    key: "5",
    label: "Registed Time",
    children: formatDate(userRegister.createDate),
    span: 2,
  },
  { key: "6", label: "Reason", children: userRegister.reason || "N/A", span: 3 },
  {
    key: "7",
    label: "Status",
    children: (
      <Badge
        status={
          userRegister.status === "Accepted"
            ? "success"
            : userRegister.status === "Rejected"
            ? "error"
            : "processing"
        }
        text={userRegister.status}
      />
    ),
    span: 1,
  },
  { key: "8", label: "Reason for rejected", children: userRegister.reasonForRejection || "N/A", span: 1 }, // Thêm lý do từ chối ở đây
];


  return (
    <div style={{ padding: "20px" }}>
      <Descriptions title="User Register Info" bordered items={items} />

      {/* Thêm 2 button ở dưới */}
      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <Button onClick={() => handleAccept(userRegister.id)} type="primary" style={{ marginRight: "10px" }}>
          Approve
        </Button>
        <Button type="danger" onClick={handleReject}>
          Reject
        </Button>
      </div>

      {/* Modal nhập lý do Reject */}
      <Modal
        title="Reject User"
        open={isModalVisible}
        onOk={() => handleRejectUser(userRegister.id, reason)}  // Gọi hàm rejectUser và truyền lý do
        onCancel={handleCancel}
        okText="Confirm Reject"
        cancelText="Cancel"
      >
        <p>Please enter the reason for rejection:</p>
        <Input.TextArea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
        />
    </Modal>
    </div>
  );
};

export default UserRegisterDetail;
