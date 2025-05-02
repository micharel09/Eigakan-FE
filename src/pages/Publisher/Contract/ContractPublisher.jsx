"use client";

import { useState, useEffect } from "react";
import { Input, Button, Card, Pagination, Tag, Spin } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FolderOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import contractApi from "../../../apis/Contract/contract";
import axios from "axios";

const pageSize = 10; // Số lượng hợp đồng trên mỗi trang

const ContractPublisher = () => {
  const [contracts, setContracts] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalContracts, setTotalContracts] = useState(0);

  // Sửa lại hàm fetchContracts để lấy dữ liệu phân trang
  const fetchContracts = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const response = await contractApi.getAllContractByLogin(page, size);
      console.log("Fetch Contracts Response:", response); // Log để debug
      if (response) {
        setContracts(response.contracts);
        setTotalContracts(response.total);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sửa lại hàm fetchAllContracts cho search
  const fetchAllContracts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan-001-site1.ktempurl.com/api/contracts/GetAllContractUserByLogin?page=0&pageSize=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Fetch All Contracts Response:", response); // Log để debug
      if (response.data && response.data.data) {
        setAllContracts(response.data.data.contracts || []);
      }
    } catch (error) {
      console.error("Error fetching all contracts:", error);
    }
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    fetchContracts(currentPage, pageSize);
    fetchAllContracts();
  }, []);

  // Xử lý search
  useEffect(() => {
    if (searchTerm) {
      const filtered = allContracts.filter(
        (contract) =>
          contract.movie?.title
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.distributorName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setContracts(filtered);
      setTotalContracts(filtered.length);
      setCurrentPage(1);
    } else {
      fetchContracts(currentPage, pageSize);
    }
  }, [searchTerm]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Contracts</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Input
          placeholder="Search by movie name, distributor or email..."
          prefix={<SearchOutlined className="text-gray-400" />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[250px] text-lg"
          size="large"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              to={`/publisher/contract/${contract.id}`}
              className="flex justify-center"
            >
              <Card
                hoverable
                cover={
                  <div className="relative pt-[100%]">
                    <img
                      alt={contract.movie?.title || "Unknown Title"}
                      src={
                        contract.movie?.medias?.length > 0
                          ? contract.movie.medias[0].url
                          : "/placeholder.svg"
                      }
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      {contract.status === "SIGNED" ? (
                        <Tag icon={<CheckCircleOutlined />} color="green">
                          Signed
                        </Tag>
                      ) : contract.status === "WAITING_FOR_REVIEWING" ? (
                        <Tag icon={<ClockCircleOutlined />} color="orange">
                          Waiting for Review
                        </Tag>
                      ) : contract.status === "ACCEPTED_NEGOTIATING" ? (
                        <Tag icon={<SyncOutlined spin />} color="blue">
                          Negotiating
                        </Tag>
                      ) : contract.status === "DENIED" ? (
                        <Tag icon={<CloseCircleOutlined />} color="red">
                          Denied
                        </Tag>
                      ) : contract.status === "WAITING_FOR_UPLOADING" ? (
                        <Tag icon={<SyncOutlined spin />} color="orange">
                          Waiting for Uploading
                        </Tag>
                      ) : contract.status === "ARCHIVED" ? (
                        <Tag icon={<FolderOutlined />} color="gray">
                          Archived
                        </Tag>
                      ) : (
                        <Tag color="default">Unknown</Tag>
                      )}
                    </div>
                  </div>
                }
                className="rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl w-full sm:w-[600px] lg:w-[700px]"
              >
                <Card.Meta
                  title={
                    <span className="font-semibold">
                      Contract of {contract.movie?.title || "Unknown Title"}
                    </span>
                  }
                  description={
                    <div className="text-gray-500 space-y-2">
                      <div className="flex justify-between">
                        <p>
                          <CalendarOutlined /> <strong>Distributor:</strong>{" "}
                          {contract.distributorName || "Unknown"}
                        </p>
                        <p>
                          <CalendarOutlined /> <strong>Email:</strong>{" "}
                          {contract.user?.email || "N/A"}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p>
                          <FieldTimeOutlined /> <strong>Start:</strong>{" "}
                          {new Date(contract.startDate).toLocaleDateString()}
                        </p>
                        <p>
                          <FieldTimeOutlined /> <strong>End:</strong>{" "}
                          {new Date(contract.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p>
                        <ClockCircleOutlined /> <strong>Duration:</strong>{" "}
                        {contract.duration} days
                      </p>
                    </div>
                  }
                />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Pagination
          current={currentPage}
          total={totalContracts}
          pageSize={pageSize}
          onChange={(page) => {
            setCurrentPage(page);
            if (!searchTerm) {
              fetchContracts(page, pageSize);
            }
          }}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default ContractPublisher;
