import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; 
import { Badge, Descriptions, Button, Modal, Input, Spin, notification,Select } from "antd";
import UserRegisterApi from "../../../apis/UserRegister/UserRegister.js";
import { formatDate } from "../../../utils/dateHelper";
import UserApi from "../../../apis/User/user.jsx";
import uploadFileApi from "../../../apis/Upload/Upload.jsx";
import { extractUrl } from "../../../utils/extractUrl";

const UserRegisterDetail = () => {
  const { id } = useParams(); 
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false); // Modal Accept User
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false); // Modal Reject User
  const [reason, setReason] = useState("");
  const [userRegister, setUserRegister] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [email, setEmail] = useState("");

  const handleReject = () => {
    setIsRejectModalVisible(true);
  };

const handleAccept = async () => {
    const data = { Id: userRegister.id };    
    const newUser = { fullName, email, roleId, userRegisterId: userRegister.id };
    
    try {
      const accept = await UserRegisterApi.acceptedUserRegister(data);
      
      if(accept.status === 200){
        const response = await UserApi.CreateUser(newUser); 

        if (response.status === 200) {
          setUserRegister((prevUserRegister) => ({
            ...prevUserRegister,
            status: "Accepted",  
          }));
          notification.success({ message: response.data.message || 'Accepted successfully!' });
        } else {
          notification.error({ message: response.data.message || 'Failed to accept user.' });
        }

      }else{
        notification.error({ message: response.data.message || 'Failed to accept user.' });
      }

    } catch (error) {
      console.error("Error accepting user:", error);
      notification.error({ message: error.message || 'An error occurred!' });
    }
    setIsAcceptModalVisible(false);
  };

  const handleGetPreUrl = async () => {
    try {
      const extractLink = extractUrl(userRegister.fileUrl);  
      console.log("Extracted link:", extractLink);

        if (!extractLink || !extractLink.userId || !extractLink.fileName) {
            throw new Error("Failed to extract userId or fileName from URL");
        }
      const response = await uploadFileApi.getPreFileUrl(extractLink.userId, extractLink.fileName);  
      console.log("PreUrl:", response.data);
      //setPreUrl(response.data.url); 
      window.open(response.data.url, "_blank"); 
    } catch (error) {
      console.error("Error fetching preUrl:", error);
    }
  };

  const handleRejectUser = async () => {
    try {
      const data = { id: userRegister.id, reasonForRejection: reason };
      const response = await UserRegisterApi.rejectedUserRegister(data);
      if (response.status === 200) {
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
      console.error("Error rejecting user:", error);
      notification.error({ message: error.message || 'An error occurred!' });
    }
    setIsRejectModalVisible(false);
    setReason("");
  };


  const fetchUserRegister = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await UserRegisterApi.getUserRegisterDetail(id);
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

  useEffect(() => {
    if (userRegister) {
      setFullName(userRegister.fullName);
      setEmail(userRegister.email) // Cập nhật giá trị fullName từ userRegister
    }
  }, [userRegister]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!userRegister) {
    return <p style={{ textAlign: "center" }}>Không tìm thấy dữ liệu</p>;
  }

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
    {
      key: "4",
      label: "File Name",
      children: (
        <button onClick={handleGetPreUrl} style={{ padding: "5px 10px", background: "blue", color: "white", border: "none", cursor: "pointer" }}>
          View File
        </button>
      ),
    },
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
          status={userRegister.status === "Accepted" ? "success" : userRegister.status === "Rejected" ? "error" : "processing"}
          text={userRegister.status}
        />
      ),
      span: 1,
    },
    { key: "8", label: "Reason for rejected", children: userRegister.reasonForRejection || "N/A", span: 1 },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Descriptions title="User Register Info" bordered items={items} />

      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <Button onClick={() => setIsAcceptModalVisible(true)} type="primary" style={{ marginRight: "10px" }}>
          Approve
        </Button>
        <Button type="danger" onClick={handleReject}>
          Reject
        </Button>
      </div>

      {/* Reject Modal */}
      <Modal
        title="Reject User"
        open={isRejectModalVisible}
        onOk={handleRejectUser}
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
        title="Accept and create account user"
        open={isAcceptModalVisible}
        onOk={handleAccept}
        onCancel={() => setIsAcceptModalVisible(false)}
        okText="Confirm Accept"
        cancelText="Cancel"
      >
        <div>
          <div className="mb-4">
            <label>Full Name</label>
            <Input value={fullName || ''} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" />
          </div>

          <div className="mb-4">
            <label>Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
          </div>

          <div className="mb-4">
          <label>Role  </label>
          <Select
            value={roleId}
            onChange={(value) => setRoleId(value)} // Cập nhật giá trị khi chọn
            placeholder="Select a role"
            className="w-52"
          >
            <Select.Option value="13AAA70C">Publisher</Select.Option>
            <Select.Option value="23AAA70C">Advertiser</Select.Option>
          </Select>
        </div>

        </div>
      </Modal>

    </div>
  );
};

export default UserRegisterDetail;
