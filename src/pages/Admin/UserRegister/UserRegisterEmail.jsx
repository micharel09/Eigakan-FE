"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Badge, Descriptions, Spin, Pagination, Card, Button } from "antd";
import UserRegisterApi from "../../../apis/UserRegister/UserRegister.js";
import { formatDate } from "../../../utils/dateHelper";
import UserApi from "../../../apis/User/user.jsx";
import uploadFileApi from "../../../apis/Upload/upload.jsx";
import { extractUrl } from "../../../utils/extractUrl";

const UserRegisterEmail = () => {
  const { email } = useParams();
  const [userRegisterList, setUserRegisterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const handleGetPreUrl = async (fileUrl) => {
    try {
      const extractLink = extractUrl(fileUrl);

      if (!extractLink || !extractLink.userId || !extractLink.fileName) {
        throw new Error("Failed to extract userId or fileName from URL");
      }
      const response = await uploadFileApi.getPreFileUrl(
        extractLink.userId,
        extractLink.fileName
      );
      window.open(response.data.url, "_blank");
    } catch (error) {
      s;
      console.error("Error fetching preUrl:", error);
    }
  };

  const fetchUserRegister = useCallback(async () => {
    setLoading(true);
    try {
      const response = await UserRegisterApi.getListUserRegisterByEmail(email);
      console.log("User Data:", response);
      setUserRegisterList(response || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUserRegisterList([]);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchUserRegister();
  }, [fetchUserRegister]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!userRegisterList.length) {
    return <p style={{ textAlign: "center" }}>Không tìm thấy dữ liệu</p>;
  }

  const indexOfLastUser = currentPage * pageSize;
  const indexOfFirstUser = indexOfLastUser - pageSize;
  const currentUsers = userRegisterList.slice(
    indexOfFirstUser,
    indexOfLastUser
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Form Register History
      </h1>
      <h3 style={{ textAlign: "center", marginBottom: "20px", color: "red" }}>
        *Important note: Every form file have status not 'Accepted' will be
        deleted in 30 days*{" "}
      </h3>

      {currentUsers.map((user, index) => (
        <Card key={user.email} style={{ marginBottom: "20px" }}>
          <Descriptions
            title={`Number ${indexOfFirstUser + index + 1}`}
            bordered
            column={{ xs: 1, sm: 2, md: 3 }}
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
                style={{ color: "#1890ff" }}
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
                <Button
                  onClick={() => handleGetPreUrl(user.fileUrl)}
                  type="primary"
                  size="small"
                >
                  View File
                </Button>
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
            <Descriptions.Item label="ReasonForRejection">
              <span
                style={{
                  maxWidth: "200px",
                  display: "inline-block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.reasonForRejection || "N/A"}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ))}

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={userRegisterList.length}
          onChange={(page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          }}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `Tổng ${total} mục`}
        />
      </div>
    </div>
  );
};

export default UserRegisterEmail;
