import { Breadcrumb, Tabs, Button, Tag, Spin } from "antd";
import {
  UploadOutlined,
  IdcardOutlined,
  ShoppingCartOutlined,
    HistoryOutlined,
    FormOutlined,
    SolutionOutlined,
    PictureOutlined,
} from "@ant-design/icons";
import UserApi from "../../../apis/User/user";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // ✅ Thêm state quản lý loading

  const fetchUserDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await UserApi.getUserDetail(id);
      console.log("User Data:", response);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [id]); 
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6 text-gray-600">
        <Breadcrumb.Item>User</Breadcrumb.Item>
        <Breadcrumb.Item>User Detail</Breadcrumb.Item>
      </Breadcrumb>

      {loading ? (
        <Spin size="large" className="flex justify-center items-center h-64" />
      ) : (
        <>
        
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-6">
             
              <div className="relative">
                <img
                  src={user?.picture || "https://res.cloudinary.com/dn8bn2sty/image/upload/v1736227358/66a36ea2-317f-4008-a188-3674676d71b2_q395bw.jpg"}
                  alt="Profile"
                  className="w-32 h-32 rounded-lg bg-teal-500"
                />
              </div>

              {/* Profile Info */}
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">
                  {user?.fullName || "Unknown"} 
                </h1>
                <Tag color="orange" className="w-fit">
                    {user?.roleName || "Unknown"}
                </Tag>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            defaultActiveKey="profile"
            items={[
              {
                key: "profile",
                label: (
                  <span className="flex items-center gap-2">
                    <IdcardOutlined />
                    Profile
                  </span>
                ),
              },
              {
                key: "My Orders",
                label: (
                  <span className="flex items-center gap-2">
                    <ShoppingCartOutlined />
                    My Orders
                  </span>
                ),
              },
              {
                key: "Movie History",
                label: (
                  <span className="flex items-center gap-2">
                    <HistoryOutlined />
                    Movie History
                  </span>
                ),
              },
              {
                key: "Form Register",
                label: (
                  <span className="flex items-center gap-2">
                    <FormOutlined />
                    Form Register
                  </span>
                ),
              },
              {
                key: "Contract",
                label: (
                  <span className="flex items-center gap-2">
                    <SolutionOutlined />
                    Contract
                  </span>
                ),
              },
              {
                key: "Movie",
                label: (
                  <span className="flex items-center gap-2">
                    <PictureOutlined />
                    Movie
                  </span>
                ),
              },
            ]}
          />

          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 mt-6 shadow-sm">
            <h2 className="text-xl text-gray-600 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email:</label>
                <p className="text-gray-900">{user?.email || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">DOB:</label>
                <p className="text-gray-900">{user?.birthday || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Joined date:</label>
                <p className="text-gray-900">
                    {user?.createDate
                        ? new Date(user.createDate).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
                        : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Status:</label>
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                  user?.status === "NORMAL"
                    ? "text-green-700 bg-green-100"
                    : "text-red-700 bg-red-100"
                }`}>
                  {user?.status || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDetail;
