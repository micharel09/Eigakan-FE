import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  notification,
  Switch,
  Tag,
  Input,
  Modal,
  Select,
} from "antd";
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
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false);
  const [userRegister, setUserRegister] = useState(null);
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [email, setEmail] = useState("");

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan-001-site1.ktempurl.com/api/User/GetAllUser?page=0&pageSize=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data) {
        setAllUsers(response.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
      notification.error({
        message: "Error",
        description: "Could not fetch users for search",
      });
    }
  };

  const fetchUsers = async (page = 1, pageSize = 8) => {
    try {
      setLoading(true);
      const response = await UserApi.getUsers(page, pageSize);
      if (response.data) {
        setUsers(response.data.users || []);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response.data.total || 0,
        }));
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

  const handleCreateUser = async () => {
    setLoading(true); // Bật trạng thái loading khi bắt đầu tạo user

    const newUser = {
      fullName,
      email,
      roleId,
      userRegisterId: null,
    };

    try {
      const response = await UserApi.CreateUser(newUser);

      if (response.status === 200) {
        notification.success({
          message: response.data.message || "Created successfully!",
        });
        setIsAcceptModalVisible(false); // Đóng modal
        window.location.reload(); // Refresh lại trang
      } else {
        notification.error({
          message: response.data.message || "Failed to create user.",
        });
      }
    } catch (error) {
      console.error("Error Create User:", error);
      notification.error({ message: error.message || "An error occurred!" });
    } finally {
      setLoading(false); // Tắt trạng thái loading sau khi xử lý xong
    }
  };

  // Gọi API lần đầu khi component mount
  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filteredResults = allUsers.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filteredResults);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filteredResults.length,
      }));
    } else {
      fetchUsers(pagination.current, pagination.pageSize);
    }
  }, [searchTerm]);

  const handleStatusChange = async (id, checked) => {
    try {
      const data = {
        id,
        status: checked ? 0 : 1,
      };
      const response = await UserApi.updateActive(data);
      if (response && response.status === 200) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id
              ? { ...user, status: data.status === 0 ? "NORMAL" : "INACTIVE" }
              : user
          )
        );
        notification.success({ message: response.data.message });
      } else {
        notification.error({ message: "Failed to update user status." });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      notification.error({ message: "Error updating user status." });
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
  const handleTableChange = (newPagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);

    // Chỉ gọi API phân trang khi không có tìm kiếm
    if (!searchTerm) {
      fetchUsers(newPagination.current, newPagination.pageSize);
    }
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
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      filteredValue: filteredInfo.fullName || null,
      onFilter: (value, record) => record.fullName.includes(value),
      render: (fullName, record) => (
        <a href={`/user/${record.id}`} className="text-blue-400">
          {fullName}
        </a>
      ),
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
            : roleName === "MANAGER"
            ? "yellow"
            : roleName === "ADVERTISER"
            ? "brown"
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
        <Button
          type="primary"
          onClick={() => setIsAcceptModalVisible(true)}
          loading={loading}
        >
          Create User
        </Button>
      </div>

      <div className="flex justify-center mb-6">
        <Input
          placeholder="Search by name or email..."
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

      {/* Create user Modal */}
      <Modal
        title="create account user"
        open={isAcceptModalVisible}
        onOk={handleCreateUser}
        onCancel={() => setIsAcceptModalVisible(false)}
        okText="Confirm Accept"
        cancelText="Cancel"
      >
        <div>
          <div className="mb-4">
            <label>Full Name</label>
            <Input
              value={fullName || ""}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className="mb-4">
            <label>Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div className="mb-4">
            <label>Role </label>
            <Select
              value={roleId}
              onChange={(value) => setRoleId(value)} // Cập nhật giá trị khi chọn
              placeholder="Select a role"
              className="w-52"
            >
              <Select.Option value="13AAA70C">Publisher</Select.Option>
              <Select.Option value="23AAA70C">Advertiser</Select.Option>
              <Select.Option value="33AAA70C">VIP MEMBER</Select.Option>
              <Select.Option value="43AAA70C">MEMBER</Select.Option>
              <Select.Option value="53AAA70C">ADMIN</Select.Option>
              <Select.Option value="63AAA70C">MANAGER</Select.Option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default User;
