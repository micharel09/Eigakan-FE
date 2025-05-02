import { Breadcrumb, Tabs, Button, Tag, Spin, Empty, Table } from "antd";
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
import { useParams, Link } from "react-router-dom";
import contractApi from "../../../apis/Contract/contract";
import movieService from "../../../apis/Movie/movie";
import axios from "axios";

// Extend movieService với phương thức lấy danh sách phim theo userId
movieService.getListMovieByUserId = async (
  userId,
  pageNumber = 1,
  pageSize = 10
) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `https://eigakan-001-site1.ktempurl.com/api/Movie/GetListMovieByUserId`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          userId,
          pageNumber,
          pageSize,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching movies by userId:", error);
    return { success: false, movies: [], total: 0 };
  }
};

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [tabsData, setTabsData] = useState({
    contract: null,
    movie: null,
  });
  const [tabLoading, setTabLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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

  // Format currency in VND
  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Fetch tab-specific data based on active tab
  const fetchTabData = async (tabKey, page = 1, pageSize = 10) => {
    if (tabLoading) return; // Prevent concurrent fetches

    setTabLoading(true);
    try {
      switch (tabKey) {
        case "contract":
          // Fetch contract data using contractApi với một phương pháp thay thế
          try {
            console.log("Fetching contracts for userId:", id);

            // Gọi API trực tiếp thay vì qua phương thức có thể lỗi
            const token = localStorage.getItem("token");
            const response = await axios.get(
              `https://eigakan-001-site1.ktempurl.com/api/contracts/GetAllContractByUserId`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                params: {
                  userId: id,
                  page,
                  pageSize,
                },
              }
            );

            console.log("Contract API response:", response);

            if (response && response.data) {
              setTabsData((prev) => ({
                ...prev,
                contract: response.data.contracts || [],
              }));
              setPagination({
                current: page,
                pageSize: pageSize,
                total: response.data.total || 0,
              });
            } else {
              setTabsData((prev) => ({ ...prev, contract: [] }));
            }
          } catch (error) {
            console.error("Error fetching contracts:", error);
            setTabsData((prev) => ({ ...prev, contract: [] }));
          }
          break;

        case "movie":
          // Fetch movie data - cũng sử dụng phương pháp trực tiếp
          try {
            console.log("Fetching movies for userId:", id);

            const token = localStorage.getItem("token");
            const response = await axios.get(
              `https://eigakan-001-site1.ktempurl.com/api/Movie/GetListMovieByUserId`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                params: {
                  userId: id,
                  pageNumber: page,
                  pageSize,
                },
              }
            );

            console.log("Movie API response:", response);

            if (response && response.data) {
              setTabsData((prev) => ({
                ...prev,
                movie: response.data.movies || [],
              }));
              setPagination({
                current: page,
                pageSize: pageSize,
                total: response.data.total || 0,
              });
            } else {
              setTabsData((prev) => ({ ...prev, movie: [] }));
            }
          } catch (error) {
            console.error("Error fetching movies:", error);
            setTabsData((prev) => ({ ...prev, movie: [] }));
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching data for tab ${tabKey}:`, error);
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination({
      current: 1,
      pageSize: 10,
      total: 0,
    });

    // Only fetch data for contract and movie tabs
    if (key === "Contract" || key === "Movie") {
      fetchTabData(key.toLowerCase());
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);

    // Get current tab key
    const stateKey = activeTab.toLowerCase();

    // Only fetch data for contract and movie tabs
    if (stateKey === "contract" || stateKey === "movie") {
      fetchTabData(stateKey, newPagination.current, newPagination.pageSize);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  // Function to render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfile();
      case "Contract":
        return renderContract();
      case "Movie":
        return renderMovie();
      default:
        return renderProfile();
    }
  };

  // Tab content renderers
  const renderProfile = () => (
    <div className="bg-white rounded-lg p-6 mt-6 shadow-sm">
      <h2 className="text-xl text-gray-600 mb-6">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Email:
          </label>
          <p className="text-gray-900">{user?.email || "N/A"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            DOB:
          </label>
          <p className="text-gray-900">{user?.birthday || "N/A"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Joined date:
          </label>
          <p className="text-gray-900">
            {user?.createDate
              ? new Date(user.createDate).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })
              : "N/A"}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Status:
          </label>
          <span
            className={`inline-block px-3 py-1 text-sm rounded-full ${
              user?.status === "NORMAL"
                ? "text-green-700 bg-green-100"
                : "text-red-700 bg-red-100"
            }`}
          >
            {user?.status || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );

  const renderContract = () => {
    // Contract columns
    const columns = [
      {
        title: "Contract ID",
        dataIndex: "id",
        key: "id",
        width: "15%",
      },
      {
        title: "Movie",
        dataIndex: "movie",
        key: "movie",
        render: (movie) => <span>{movie?.title || "N/A"}</span>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag
            color={
              status === "ACCEPTED"
                ? "green"
                : status === "PENDING"
                ? "orange"
                : status === "REJECTED"
                ? "red"
                : "default"
            }
          >
            {status}
          </Tag>
        ),
      },
      {
        title: "Creation Date",
        dataIndex: "createdDate",
        key: "createdDate",
        render: (date) => new Date(date).toLocaleString(),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Link to={`/admin/contract/${record.id}`}>
            <Button type="link">View Contract</Button>
          </Link>
        ),
      },
    ];

    return (
      <div className="bg-white rounded-lg p-6 mt-6 shadow-sm">
        <h2 className="text-xl text-gray-600 mb-6">Contracts</h2>
        {tabLoading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={tabsData.contract || []}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} items`,
            }}
            onChange={handleTableChange}
            rowKey="id"
            locale={{
              emptyText: <Empty description="No contracts found" />,
            }}
          />
        )}
      </div>
    );
  };

  const renderMovie = () => {
    // Movie columns
    const columns = [
      {
        title: "Poster",
        dataIndex: "medias",
        key: "poster",
        render: (medias) => (
          <img
            src={medias?.[0]?.url || "/placeholder.jpg"}
            alt="Poster"
            className="w-16 h-24 object-cover rounded"
          />
        ),
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag
            color={
              status === "ACTIVE"
                ? "green"
                : status === "PENDING"
                ? "orange"
                : status === "REJECTED"
                ? "red"
                : "default"
            }
          >
            {status}
          </Tag>
        ),
      },
      {
        title: "Release Date",
        dataIndex: "releaseDate",
        key: "releaseDate",
        render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Link to={`/admin/movie/${record.id}`}>
            <Button type="link">View Movie</Button>
          </Link>
        ),
      },
    ];

    return (
      <div className="bg-white rounded-lg p-6 mt-6 shadow-sm">
        <h2 className="text-xl text-gray-600 mb-6">Movies</h2>
        {tabLoading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={tabsData.movie || []}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} items`,
            }}
            onChange={handleTableChange}
            rowKey="id"
            locale={{
              emptyText: <Empty description="No movies found" />,
            }}
          />
        )}
      </div>
    );
  };

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
                  src={
                    user?.picture ||
                    "https://res.cloudinary.com/dn8bn2sty/image/upload/v1736227358/66a36ea2-317f-4008-a188-3674676d71b2_q395bw.jpg"
                  }
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
            activeKey={activeTab}
            onChange={handleTabChange}
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

          {/* Render the content based on active tab */}
          {renderTabContent()}
        </>
      )}
    </div>
  );
};

export default UserDetail;
