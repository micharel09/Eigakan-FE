"use client";

import { useState, useEffect } from "react";
import { Input, Select, Button, Card, Pagination, Tag, Spin } from "antd";
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
import genreService from "../../../apis/Genre/genre";
import axios from "axios";

const { Option } = Select;

const MovieAdmin = () => {
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]); // Thêm state cho tất cả movies
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 8;

  // Thêm useEffect để fetch genres khi component mount
  useEffect(() => {
    fetchGenres(); // Fetch genres khi component mount
  }, []); // Empty dependency array means it only runs once when mounted

  // Thêm hàm fetchAllMovies
  const fetchAllMovies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan1111-001-site1.qtempurl.com/api/Movie/GetListAllMovie?pageNumber=0&pageSize=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data) {
        setAllMovies(response.data.movies || []);
        setMovies(response.data.movies || []);
        setTotalMovies(response.data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching all movies:", error); // Giữ lại log error để debug khi cần
    }
  };

  // Sửa lại useEffect cho fetchAllMovies
  useEffect(() => {
    fetchAllMovies();
  }, []); // Chỉ gọi 1 lần khi component mount

  // Sửa lại phần xử lý filter
  useEffect(() => {
    if (searchTerm || selectedGenres.length > 0 || selectedStatus) {
      const filteredResults = allMovies.filter((movie) => {
        const matchesSearch =
          !searchTerm ||
          movie.title?.toLowerCase().includes(searchTerm.toLowerCase());

        // Sửa lại logic check genres
        const movieGenresList = movie.genreNames?.split(", ") || [];
        const matchesGenres =
          selectedGenres.length === 0 ||
          selectedGenres.every((selectedGenre) =>
            movieGenresList
              .map((g) => g.trim().toLowerCase())
              .includes(selectedGenre.toLowerCase())
          );

        const matchesStatus =
          !selectedStatus || movie.status === selectedStatus;

        return matchesSearch && matchesGenres && matchesStatus;
      });

      setMovies(filteredResults);
      setTotalMovies(filteredResults.length);
    } else {
      setMovies(allMovies);
      setTotalMovies(allMovies.length);
    }
  }, [searchTerm, selectedGenres, selectedStatus, allMovies]);

  // Status options cho filter
  const statusOptions = [
    { label: "All", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Waiting for Review", value: "WAITING_FOR_REVIEWING" },
    { label: "Waiting for Uploading", value: "WAITING_FOR_UPLOADING" },
    { label: "Negotiating", value: "ACCEPTED_NEGOTIATING" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Archived", value: "ARCHIVED" },
  ];

  const fetchMovies = async (page, size) => {
    setLoading(true);
    try {
      const response = await movieService.getAllListMovies(
        page,
        size,
        searchTerm,
        selectedGenres
      );
      setMovies(response.movies);
      setTotalMovies(response.total); // Lấy tổng số phim từ API
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sửa lại hàm fetchGenres
  const fetchGenres = async () => {
    try {
      const response = await genreService.getGenres();
      if (response.data) {
        setGenres(response.data);
      }
    } catch (error) {
      console.error("Error fetching genres:", error); // Giữ lại log error để debug khi cần
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Movie List</h1>
        <Link to="/admin/createMovie">
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
        <Select
          mode="multiple"
          style={{ minWidth: 200 }}
          placeholder="Filter by genres"
          onChange={setSelectedGenres}
          options={[
            { label: "Action", value: "Action" },
            { label: "Adventure", value: "Adventure" },
            { label: "Animation", value: "Animation" },
            { label: "Comedy", value: "Comedy" },
            { label: "Crime", value: "Crime" },
            { label: "Drama", value: "Drama" },
            { label: "Horror", value: "Horror" },
            { label: "Mystery", value: "Mystery" },
            {
              label: "Science Fiction (Sci-Fi)",
              value: "Science Fiction (Sci-Fi)",
            },
          ]}
          size="large"
          className="text-lg"
        />
        <Select
          style={{ minWidth: 200 }}
          placeholder="Filter by status"
          onChange={setSelectedStatus}
          options={statusOptions}
          size="large"
          className="text-lg"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {movies.map((movie) => (
            <Link key={movie.id} to={`/admin/movie/${movie.id}`}>
              <Card
                hoverable
                cover={
                  <div className="relative pt-[150%]">
                    <img
                      alt={movie.title}
                      src={
                        movie.medias.length > 0
                          ? movie.medias[0].url
                          : "/placeholder.svg"
                      }
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
                      ) : movie.status === "WAITING_FOR_UPLOADING" ? (
                        <Tag icon={<SyncOutlined spin />} color="orange">
                          Waiting for Uploading
                        </Tag>
                      ) : movie.status === "ACCEPTED_NEGOTIATING" ? (
                        <Tag icon={<SyncOutlined spin />} color="blue">
                          Negotiating
                        </Tag>
                      ) : movie.status === "REJECTED" ? (
                        <Tag icon={<CloseCircleOutlined />} color="red">
                          Rejected
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
          total={totalMovies} // Tổng số phim từ API
          pageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default MovieAdmin;
