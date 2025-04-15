import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  Input,
  notification,
  Tag,
} from "antd";
import { EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import movieService from "../../../apis/Movie/movie";
import contractApi from "../../../apis/Contract/contract";
const { Title, Text } = Typography;

const PublisherDashboard = () => {
  const [movies, setMovies] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [totalSigned, setTotalSigned] = useState(0);
  const [totalEarning, setTotalEarning] = useState(0);
  const [totalContract, setTotalContract] = useState(0);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await movieService.getListMovieByLogin();
      if (res) {
        const { movies, total, activeMovie } = res;
        setMovies(
          movies.map((m) => ({
            ...m,
            key: m.id,
          }))
        );
        setTotal(total);
        setActive(activeMovie);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to load movies",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await contractApi.getAllContractByLogin();
      if (res) {
        const {contracts, total,totalEarning,totalSigned } = res;
        setContracts(
          contracts.map((m) => ({
            ...m,
            key: m.id,
          }))
        );
        setTotalContract(total);
        setTotalSigned(totalSigned);
        setTotalEarning(totalEarning);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to load movies",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchContracts();
  }, []);



  return (
    <div className="p-6">
      <Helmet>
        <title>Dashboard Management</title>
      </Helmet>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Movie Management
            </Title>
            <Text type="secondary">Browse and manage all movies</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Total Movies"
                value={total}
                prefix={<EyeOutlined className="text-blue-500" />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Active Movies"
                value={active}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>      
      </Card>
      
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-1">
              Contract Management
            </Title>
            <Text type="secondary">Browse and manage all contract</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Total Contracts"
                value={totalContract}
                prefix={<EyeOutlined className="text-blue-500" />}
                loading={loading}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Signed Contracts"
                value={totalSigned}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                loading={loading}
              />
            </Card>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Total Earnings"
                value={totalEarning}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                loading={loading}
              />
            </Card>
          </Col>
        
        </Row>      
      </Card>
      
    </div>
  );
};

export default PublisherDashboard;
