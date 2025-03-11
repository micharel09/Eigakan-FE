"use client";

import { useState, useEffect } from "react";
import { Input, Button, Card, Pagination, Tag, Spin } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import movieService from "../../../apis/Movie/movie";
import axios from "axios";

const MoviePublisher = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 8;
  const [allMovies, setAllMovies] = useState([]);

  const fetchMovies = async (page = 1, size = 8) => {
    setLoading(true);
    try {
      const response = await movieService.getListMovieByLogin(page, size);
      setMovies(response.movies || []);
      setTotalMovies(response.total || 0);
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMovies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan2222-001-site1.jtempurl.com/api/Movie/GetListMovieByLogin?pageNumber=0&pageSize=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAllMovies(response.data.movies || []);
    } catch (error) {
      console.error("Error fetching all movies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(currentPage, pageSize);
    fetchAllMovies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allMovies.filter((movie) =>
        movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setMovies(filtered);
      setTotalMovies(filtered.length);
      setCurrentPage(1);
    } else {
      fetchMovies(currentPage, pageSize);
    }
  }, [searchTerm]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Movie List</h1>
        <Link to="/publisher/createMovie">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="bg-blue-500 hover:bg-blue-600"
          >
            Create Movie
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Input
          placeholder="Search by title..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {movies.map((movie) => (
            <Link key={movie.id} to={`/publisher/movie/${movie.id}`}>
              <Card
                hoverable
                cover={
                  <div className="relative pt-[56.25%]">
                    <img
                      alt={movie.title}
                      src={movie.medias?.[0]?.url || "/placeholder.svg"}
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2">
                      {movie.status === "ACTIVE" ? (
                        <Tag icon={<CheckCircleOutlined />} color="green">
                          Active
                        </Tag>
                      ) : movie.status === "WAITING_FOR_REVIEWING" ? (
                        <Tag icon={<ClockCircleOutlined />} color="orange">
                          Waiting for Review
                        </Tag>
                      ) : movie.status === "ACCEPTED_NEGOTIATING" ? (
                        <Tag icon={<SyncOutlined spin />} color="blue">
                          Negotiating
                        </Tag>
                      ) : movie.status === "REJECTED" ? (
                        <Tag icon={<CloseCircleOutlined />} color="red">
                          Rejected
                        </Tag>
                      ) : movie.status === "WAITING_FOR_UPLOADING" ? (
                        <Tag icon={<SyncOutlined spin />} color="orange">
                          Waiting for Uploading
                        </Tag>
                      ) : movie.status === "ARCHIVED" ? (
                        <Tag icon={<FolderOutlined />} color="gray">
                          Archived
                        </Tag>
                      ) : (
                        <Tag color="default">Unknown</Tag>
                      )}
                    </div>
                  </div>
                }
                className="rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <Card.Meta
                  title={<span className="font-semibold">{movie.title}</span>}
                  description={
                    <div>
                      <p className="text-gray-500">{movie.releaseYear}</p>
                      <div className="mt-2">{movie.genreNames}</div>
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
          total={totalMovies}
          pageSize={pageSize}
          onChange={(page) => {
            setCurrentPage(page);
            if (!searchTerm) {
              fetchMovies(page, pageSize);
            }
          }}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default MoviePublisher;
