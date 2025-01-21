import React, { useState, useEffect } from "react";
import { Table, Button, Space, notification, Switch, Tag  } from "antd";
import UserApi from "../../../apis/User/user";

const User = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });

  // Fetch users with pagination
  const fetchUsers = async (current, pageSize) => {
    setLoading(true);
    try {
      const response = await UserApi.getUsers(current, pageSize);
      setUsers(response.data.users);
      setPagination({
        current,
        pageSize,
        total: response.data.total,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
    fetchUsers(pagination.current, pagination.pageSize);
  };

  const handleStatusChange = async (id, checked) => {
    try {
      const data = {
        id,
        status: checked ? 0 : 1,
      };
      const response = await UserApi.updateActive(data);
      console.log(response)
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

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, []);

  const columns = [
    {
      title: "Avatar",
      dataIndex: "picture",
      key: "picture",
      render: (text) => <img src={text} alt="Avatar" className="w-8 h-8 rounded-full" />,
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
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      filters: [
        { text: "Admin", value: "ADMIN" },
        { text: "User", value: "USER" },
      ],
      filteredValue: filteredInfo.roleName || null,
      onFilter: (value, record) => record.roleName === value,
      render: (roleName) => {
        const color =
          roleName === "ADMIN"
            ? "volcano"
            : roleName === "MEMBER"
            ? "green"
            : roleName === "PUBLISHER"
            ? "blue"
            : roleName === "MANAGER"
            ? "yellow"
            : roleName === "VIP MEMBER"
            ? "purple"
            : "default"; 
        return (
          <Tag color={color} key={roleName}>
            {roleName.toUpperCase()}
          </Tag>
        );
      },
      
      
    },
    
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
      render: (text) => {
        const date = new Date(text); // Tạo đối tượng Date từ chuỗi ISO
        return date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }); // Chuyển sang giờ Việt Nam
      },
    },
    
  ];

  return (
    <>
      <div className="flex justify-between">
          <Space style={{ marginBottom: 16 }}>
            <Button onClick={() => setFilteredInfo({})}>Clear filters</Button>
            <Button onClick={() => setSortedInfo({})}>Clear sorters</Button>
          </Space>

          <Button>Create
            
          </Button>
        </div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey={(record) => record.id}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </>
  );
};

export default User;
