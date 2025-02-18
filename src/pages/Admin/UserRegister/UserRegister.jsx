import React, { useState, useEffect } from "react";
import { Table, Button, Space, notification } from "antd";
import UserApi from "../../../apis/User/user";
import UserRegisterApi from "../../../apis/UserRegister/UserRegister.js";
import { Progress } from "antd";


const UserRegister = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });

  // Upload video state
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [progress, setProgress] = useState(0);

  const fetchUsers = async (current, pageSize) => {
    setLoading(true);
    try {
      const response = await UserRegisterApi.getUserRegisters(current, pageSize);
      setUsers(response.data.users);
      setPagination({ current, pageSize, total: response.data.total });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      return notification.error({ message: "Chọn file trước!" });
    }
  
    setUploading(true);
    setProgress(0);
  
    try {
      // 🟢 Gửi yêu cầu tạo video trước (API backend)
      const createResponse = await fetch("https://localhost:7192/api/Upload/upload_VideoBunny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: selectedFile.name }),
      });
  
      const createData = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error("Không thể tạo video");
      }
  
      const videoId = createData.videoUrl;
      console.log("Video ID:", videoId);
  
      // 🟢 Upload video sau khi tạo thành công
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `https://video.bunnycdn.com/library/384568/videos/${videoId}`, true);
      xhr.setRequestHeader("AccessKey", "5dd7b859-f5cf-4d94-a0b71073f51a-3048-4dfd");
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
  
      // 🟢 Cập nhật tiến trình upload
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };
  
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const newVideoUrl = `https://iframe.mediadelivery.net/embed/384568/${videoId}`;
          setVideoUrl(newVideoUrl);
          notification.success({ message: "Upload thành công!" });
        } else {
          notification.error({ message: "Upload thất bại!" });
        }
      };
  
      xhr.onerror = () => {
        setUploading(false);
        notification.error({ message: "Có lỗi xảy ra khi upload!" });
      };
  
      // 🟢 Bắt đầu gửi file
      xhr.send(selectedFile);
    } catch (error) {
      setUploading(false);
      console.error(error);
      notification.error({ message: "Lỗi khi upload video!" });
    }
  };

  return (
    <>
      <div className="flex justify-between">
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={() => setFilteredInfo({})}>Clear filters</Button>
          <Button onClick={() => setSortedInfo({})}>Clear sorters</Button>
        </Space>

        <Button>Create</Button>
      </div>

      {/* 🟢 Upload Video */}
      <div style={{ marginBottom: "20px" }}>
        <input type="file" accept="video/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
        <Button onClick={handleUpload} disabled={uploading}>
  {uploading ? `Đang tải... ${progress}%` : "Tạo & Upload Video"}
</Button>

{uploading && <Progress percent={progress} status="active" />}
{videoUrl && <p>Video URL: <a href={videoUrl} target="_blank">{videoUrl}</a></p>}


      </div>

      {/* 🟢 Hiển thị Video sau khi upload */}
      {videoUrl && (
        <iframe
          src={videoUrl}
          width="640"
          height="360"
          allow="autoplay"
          allowFullScreen
        ></iframe>
      )}

      <Table
        columns={[
          {
            title: "Name",
            dataIndex: "fullName",
            key: "fullName",
            sorter: (a, b) => a.fullName.localeCompare(b.fullName),
            filteredValue: filteredInfo.fullName || null,
            onFilter: (value, record) => record.fullName.includes(value),
            render: (fullName, record) => (
              <a href={`/userRegister/${record.id}`} className="text-blue-400">
                {fullName}
              </a>
            ),
          },
          { title: "Email", dataIndex: "email", key: "email" },
          { title: "Phone Number", dataIndex: "phoneNumber", key: "phoneNumber" },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
              let statusColor = "";
              if (status === "ACCEPTED") {
                statusColor = "#28a745"; 
              }
              else if (status === "REVIEWING") {
                statusColor = "#EFB036"; 
              } else 
              statusColor = "#dc3545"; 
        
              return (
                <span style={{ color: statusColor }}>
                  {status}
                </span>
              );
            },
          },
          {
            title: "Registed Date",
            dataIndex: "createDate",
            key: "joinDate",
            sorter: (a, b) => new Date(a.createDate) - new Date(b.createDate),
            render: (text) => new Date(text).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
          },
        ]}
        dataSource={users}
        rowKey={(record) => record.id}
        pagination={pagination}
        loading={loading}
        onChange={(pagination) => fetchUsers(pagination.current, pagination.pageSize)}
      />
    </>
  );
};

export default UserRegister;
