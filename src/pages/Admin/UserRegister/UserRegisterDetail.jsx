import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Import để lấy id từ URL
import { Badge, Descriptions, Button, Modal, Input, Spin } from "antd";
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
    {
      key: "6",
      label: "Status",
      children: <Badge status="processing" text={userRegister.status} />,
      span: 3,
    },
    { key: "7", label: "Reason", children: userRegister.reason || "N/A" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Descriptions title="User Register Info" bordered items={items} />

      {/* Thêm 2 button ở dưới */}
      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <Button
          type="primary"
          style={{ marginRight: "10px" }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Approve
        </Button>
        <Button
          type="danger"
          onClick={handleReject}
          className="bg-gray-600 hover:bg-gray-700"
        >
          Reject
        </Button>
      </div>

      {/* Modal nhập lý do Reject */}
      <Modal
        title="Reject User"
        open={isModalVisible}
        onOk={handleOk}
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
