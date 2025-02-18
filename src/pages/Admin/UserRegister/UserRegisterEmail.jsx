import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge, Descriptions, Spin } from "antd";
import UserRegisterApi from "../../../apis/UserRegister/UserRegister.js";
import { formatDate } from "../../../utils/dateHelper";
import index from "antd/lib/typography/Base";

const UserRegisterEmail = () => {
  const { email } = useParams(); // Lấy email từ URL
  const [userRegisterList, setUserRegisterList] = useState([]); // Lưu danh sách user
  const [loading, setLoading] = useState(true);

  // Hàm lấy danh sách user từ API
  const fetchUserRegister = async () => {
    setLoading(true);
    try {
      const response = await UserRegisterApi.getListUserRegisterByEmail(email);
      console.log("User Data:", response);
      setUserRegisterList(response || []); // Gán danh sách user
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUserRegisterList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRegister();
  }, [email]);

  // Nếu đang loading thì hiển thị spinner
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Nếu không có user nào
  if (!userRegisterList.length) {
    return <p style={{ textAlign: "center" }}>Không tìm thấy dữ liệu</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Form Register</h2>

      {userRegisterList.map((user, index) => (
        <Descriptions
          className="mt-8 border-2 border-gray-700"
          title={`Number ${index + 1}`}
          key={user.email}
          bordered
          column={{ xs: 1, sm: 2, md: 3 }} // Responsive cột
        >
          <Descriptions.Item label="Name">
            <span
              style={{
                maxWidth: "200px",
                display: "inline-block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.fullName}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <a
              href={`/userRegister/email/${user.email}`}
              className="text-blue-500"
            >
              {user.email}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Phone Number">
            {user.phoneNumber}
          </Descriptions.Item>
          <Descriptions.Item label="File Name">
            <span
              style={{
                maxWidth: "200px",
                display: "inline-block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.fileUrl}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Registered Time">
            {formatDate(user.createDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge status="processing" text={user.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Reason">
            <span
              style={{
                maxWidth: "200px",
                display: "inline-block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.reason || "N/A"}
            </span>
          </Descriptions.Item>
        </Descriptions>
      ))}
    </div>
  );
};

export default UserRegisterEmail;
