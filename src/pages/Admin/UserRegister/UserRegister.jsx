import React, { useState, useEffect } from "react";
import { Table, Button, Space, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import UserApi from "../../../apis/User/user";
import UserRegisterApi from "../../../apis/UserRegister/UserRegister.js";
import { Progress } from "antd";
import axios from "axios";
import { Helmet } from "react-helmet";

const UserRegister = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan-001-site1.ktempurl.com/api/UserRegister/userRegister?page=0&pageSize=1000",
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
      console.error("Error fetching all users:", error);
    }
  };

  const fetchUserRegisters = async (page = 1, pageSize = 8) => {
    try {
      setLoading(true);
      const response = await UserRegisterApi.getUserRegisters(page, pageSize);
      if (response && response.data) {
        setUsers(response.data.users || []);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching user registers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRegisters(pagination.current, pagination.pageSize);
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filteredResults = allUsers.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filteredResults);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filteredResults.length,
      }));
    } else {
      fetchUserRegisters(pagination.current, pagination.pageSize);
    }
  }, [searchTerm]);

  const handleTableChange = (newPagination, filters, sorter) => {
    if (!searchTerm) {
      fetchUserRegisters(newPagination.current, newPagination.pageSize);
    }
  };

  return (
    <div>
      <Helmet>
        <title>UserRegister Management</title>
      </Helmet>
      <div className="flex justify-center mb-6">
        <Input
          placeholder="Search by name, email or phone..."
          prefix={<SearchOutlined className="text-gray-400" />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="min-w-[400px]"
          size="large"
        />
      </div>

      <Table
        columns={[
          {
            title: "Name",
            dataIndex: "fullName",
            key: "fullName",
            sorter: (a, b) => a.fullName.localeCompare(b.fullName),
            render: (fullName, record) => (
              <a href={`/userRegister/${record.id}`} className="text-blue-400">
                {fullName}
              </a>
            ),
          },
          { title: "Email", dataIndex: "email", key: "email" },
          {
            title: "Phone Number",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
              let statusColor = "";
              if (status === "ACCEPTED") {
                statusColor = "#28a745";
              } else if (status === "REVIEWING") {
                statusColor = "#EFB036";
              } else statusColor = "#dc3545";

              return <span style={{ color: statusColor }}>{status}</span>;
            },
          },
          {
            title: "Registed Date",
            dataIndex: "createDate",
            key: "joinDate",
            sorter: (a, b) => new Date(a.createDate) - new Date(b.createDate),
            render: (text) =>
              new Date(text).toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
          },
        ]}
        dataSource={users}
        rowKey={(record) => record.id}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default UserRegister;
