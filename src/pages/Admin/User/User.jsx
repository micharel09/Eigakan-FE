import React, { useState, useEffect } from "react";
import { Table, Button, Space, notification, Switch, Tag, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import UserApi from "../../../apis/User/user";
import axios from "axios";

const User = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});

  // Fetch tất cả users khi component mount
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan1111-001-site1.qtempurl.com/api/User/GetAllUser?page=0&pageSize=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data) {
        setAllUsers(response.data.users || []);
        setUsers(response.data.users || []);
        setPagination((prev) => ({ ...prev, total: response.data.total || 0 }));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      notification.error({
        message: "Error",
        description: "Could not fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gọi API lần đầu khi component mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Xử lý search
  useEffect(() => {
    if (searchTerm) {
      const filteredResults = allUsers.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filteredResults);
      setPagination((prev) => ({ ...prev, total: filteredResults.length }));
    } else {
      setUsers(allUsers);
      setPagination((prev) => ({ ...prev, total: allUsers.length }));
    }
  }, [searchTerm, allUsers]);

  const handleStatusChange = async (id, checked) => {
    try {
      await UserApi.updateUserStatus(id, checked ? 0 : 1);
      fetchAllUsers(); // Refresh data sau khi update
      notification.success({
        message: "Success",
        description: "User status updated successfully",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to update user status",
      });
    }
  };

  // Thêm các options cho filters
  const roleOptions = [
    { text: "ADMIN", value: "ADMIN" },
    { text: "MEMBER", value: "MEMBER" },
    { text: "PUBLISHER", value: "PUBLISHER" },
    { text: "MANAGER", value: "MANAGER" },
    { text: "VIP MEMBER", value: "VIP MEMBER" },
  ];

  const statusOptions = [
    { text: "NORMAL", value: "NORMAL" },
    { text: "INACTIVE", value: "INACTIVE" },
  ];

  // Thêm hàm xử lý thay đổi của Table
  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "picture",
      key: "avatar",
      render: (text) => (
        <img
          src={text || "default-avatar.png"}
          alt="Avatar"
          style={{ width: 40, height: 40, borderRadius: "50%" }}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "fullName",
      key: "name",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
      filteredValue: filteredInfo.fullName || null,
      onFilter: (value, record) =>
        record.fullName.toLowerCase().includes(value.toLowerCase()),
      filterSearch: true,
      filters: users.map((user) => ({
        text: user.fullName,
        value: user.fullName,
      })),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      filteredValue: filteredInfo.email || null,
      onFilter: (value, record) =>
        record.email.toLowerCase().includes(value.toLowerCase()),
      filterSearch: true,
      filters: users.map((user) => ({
        text: user.email,
        value: user.email,
      })),
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "role",
      filters: [
        { text: "ADMIN", value: "ADMIN" },
        { text: "MEMBER", value: "MEMBER" },
        { text: "PUBLISHER", value: "PUBLISHER" },
        { text: "MANAGER", value: "MANAGER" },
        { text: "VIP MEMBER", value: "VIP MEMBER" },
      ],
      filteredValue: filteredInfo.role || null,
      onFilter: (value, record) => {
        return (
          record.roleName?.trim().toUpperCase() === value.trim().toUpperCase()
        );
      },
      render: (roleName) => {
        const color =
          roleName === "ADMIN"
            ? "volcano"
            : roleName === "MEMBER"
            ? "green"
            : roleName === "PUBLISHER"
            ? "blue"
            : roleName === "VIP MEMBER"
            ? "purple"
            : "default";
        return <Tag color={color}>{roleName}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: statusOptions,
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <Switch
          checkedChildren="NORMAL"
          unCheckedChildren="INACTIVE"
          checked={status === "NORMAL"}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },
    {
      title: "Join Date",
      dataIndex: "createDate",
      key: "joinDate",
      sorter: (a, b) => new Date(a.createDate) - new Date(b.createDate),
      sortOrder: sortedInfo.columnKey === "joinDate" && sortedInfo.order,
      render: (text) =>
        new Date(text).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        }),
      filters: [
        { text: "Last 7 days", value: "7days" },
        { text: "Last 30 days", value: "30days" },
        { text: "Last 90 days", value: "90days" },
      ],
      filteredValue: filteredInfo.createDate || null,
      onFilter: (value, record) => {
        const recordDate = new Date(record.createDate);
        const now = new Date();
        const days = {
          "7days": 7,
          "30days": 30,
          "90days": 90,
        };
        const diffTime = Math.abs(now - recordDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days[value];
      },
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <Space>
          <Button onClick={() => setFilteredInfo({})}>Clear filters</Button>
          <Button onClick={() => setSortedInfo({})}>Clear sorters</Button>
        </Space>
      </div>

      <div className="flex justify-center mb-6">
        <Input
          placeholder="Tìm kiếm theo tên hoặc email..."
          prefix={<SearchOutlined className="text-gray-400" />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="min-w-[400px]"
          size="large"
        />
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey={(record) => record.id}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default User;
