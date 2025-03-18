import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import roomService from "../../apis/Room/room";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import { CrownOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Input, notification } from "antd";
import {
  Menu,
  X,
  Film,
  User,
  Home,
  Search,
  Users,
  Newspaper,
  Bookmark,
  Clock,
  TrendingUp,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";

const navLinks = [
  { path: "/homescreen", label: "Movies", icon: <Film className="w-4 h-4" /> },
  {
    path: "/genres",
    label: "Genres",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  { path: "/", label: "TV Shows", icon: <Home className="w-4 h-4" /> },
  {
    path: "/favorites",
    label: "Favorite",
    icon: <Bookmark className="w-4 h-4" />,
  },
  {
    path: "/people",
    label: "Popular People",
    icon: <Users className="w-4 h-4" />,
  },
  { path: "/news", label: "News", icon: <Newspaper className="w-4 h-4" /> },
  {
    path: "/history",
    label: "Search History",
    icon: <Clock className="w-4 h-4" />,
  },
];

const Navbar = () => {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isJoinRoomModalVisible, setIsJoinRoomModalVisible] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [hostedRooms, setHostedRooms] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.roleName || localStorage.getItem("role");
  const isManager = role === "MANAGER";
  const isAdmin = role === "ADMIN";
  const isPublisher = role === "PUBLISHER";
  const isInManagerPage = location.pathname.includes("/manager");
  const isInAdminPage =
    location.pathname.includes("/dashboard") ||
    location.pathname.includes("/userRegister");
  const isInPublisherPage = location.pathname.includes("/publisher");
  const isVipMember = role === "VIP MEMBER";
  const token = localStorage.getItem("token");
  const isAdvertiser = role === "ADVERTISER";
  const isInAdvertiserPage = location.pathname.includes("/advertiser");

  useEffect(() => {
    const updateUser = () => setUser(authService.getCurrentUser());
    authService.addListener(updateUser);
    return () => authService.removeListener(updateUser);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Lắng nghe sự kiện role thay đổi
    const handleRoleChange = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };

    window.addEventListener("userRoleChanged", handleRoleChange);

    return () => {
      window.removeEventListener("userRoleChanged", handleRoleChange);
    };
  }, []);

  useEffect(() => {
    const fetchHostedRooms = async () => {
      try {
        if (!token || !user) return;

        const response = await roomService.getHostRoom();
        console.log("Host room response:", response);

        if (response.success) {
          // Check if data is an object with properties or an array
          let roomData;
          if (response.data && !Array.isArray(response.data)) {
            // If data is a single object (not in array)
            roomData = [response.data];
          } else {
            // If data is already an array
            roomData = Array.isArray(response.data) ? response.data : [];
          }

          // Filter only active rooms and add to state
          setHostedRooms(
            roomData.filter((room) => room && room.status === "Active")
          );
        }
      } catch (error) {
        console.error("Error fetching hosted rooms:", error);
        setHostedRooms([]); // Reset to empty array on error
      }
    };

    fetchHostedRooms();
  }, [user, token]);

  const handleLogout = () => {
    // Xóa toàn bộ thông tin user trong localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("fullName");
    localStorage.removeItem("avatar");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    // Redirect về trang login
    navigate("/login");

    // Refresh lại trang để đảm bảo state được reset
    window.location.reload();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  // Xác định đường dẫn dashboard dựa trên vai trò
  const getDashboardPath = () => {
    if (isAdmin) return "/dashboard";
    if (isManager) return "/manager/dashboard";
    if (isPublisher) return "/publisher/dashboard";
    if (isAdvertiser) return "/advertiser/dashboard";
    return "";
  };

  // Kiểm tra xem có phải là vai trò cần hiển thị nút Dashboard không
  const shouldShowDashboardButton =
    isAdmin || isManager || isPublisher || isAdvertiser;

  const handleJoinRoom = async () => {
    if (isJoining) return;
    setIsJoining(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notification.error({
          message: "Please login",
          description: "You need to be logged in to join a watch room",
        });
        setIsJoinRoomModalVisible(false);
        navigate("/login");
        return;
      }

      if (!roomId.trim()) {
        notification.error({
          message: "Room ID required",
          description: "Please enter a room ID",
        });
        return;
      }

      // Lấy dữ liệu người dùng từ localStorage nếu không có trong Redux
      let userData = user;
      if (!userData || !userData.userId) {
        const userDataStr = localStorage.getItem("user");
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }

      if (!userData || !userData.userId) {
        notification.error({
          message: "User data missing",
          description:
            "Cannot join room without user data. Please try logging in again.",
        });
        return;
      }

      const userId = userData.userId.replace(/^userid:\s*/i, "");
      console.log("Joining room with userId:", userId);

      // Trước tiên, luôn lấy thông tin phòng để có movieID từ API
      console.log("Fetching room details for room ID:", roomId.trim());
      let movieId;

      try {
        const roomDetails = await roomService.getRoomDetails(roomId.trim());
        console.log("Room details response:", roomDetails);

        if (roomDetails.success && roomDetails.data) {
          movieId = roomDetails.data.movieID;
          console.log("Found movieId in room details:", movieId);
        } else {
          console.warn("Room details success but no data or movieID found");
        }
      } catch (detailsError) {
        console.error("Error fetching room details:", detailsError);
        notification.warning({
          message: "Unable to get room details",
          description:
            "Continuing with join attempt, but movie information may be missing.",
        });
      }

      // Nếu vẫn không có movieId, kiểm tra xem phòng có phải là phòng do người dùng host không
      if (!movieId) {
        const hostedRoom = hostedRooms.find(
          (room) => room && room.id === roomId.trim()
        );
        if (hostedRoom && hostedRoom.movieID) {
          console.log("Using hosted room movieID:", hostedRoom.movieID);
          movieId = hostedRoom.movieID;
        } else {
          console.warn("No movieID found from hosted rooms");
        }
      }

      // Luôn gọi API join room
      const joinResponse = await roomService.joinRoom({
        roomId: roomId.trim(),
        userId: userId,
        movieId: movieId,
      });

      console.log("Join API Response:", joinResponse);

      if (joinResponse.success) {
        notification.success({ message: "Joined room successfully!" });
        setIsJoinRoomModalVisible(false);

        // Nếu vẫn chưa có movieID sau khi kiểm tra các nguồn trước đó,
        // thử từ response join room như một phương án dự phòng cuối cùng
        if (!movieId && joinResponse.data) {
          if (
            Array.isArray(joinResponse.data) &&
            joinResponse.data.length > 0
          ) {
            movieId =
              joinResponse.data[0].movieID || joinResponse.data[0].MovieID;
          } else {
            movieId = joinResponse.data.movieID || joinResponse.data.MovieID;
          }
        }

        console.log("Final movieId to use:", movieId);

        if (!movieId) {
          console.warn("No movieID found from any source. Using 'undefined'");
          notification.warning({
            message: "Movie information missing",
            description: "The room does not have movie information available.",
          });
        }

        // Chuyển hướng với movieId nếu tìm thấy, nếu không thì sử dụng undefined
        navigate(
          `/watch-together/${
            movieId || "undefined"
          }?roomId=${roomId.trim()}&movieId=${movieId || ""}`
        );
      } else {
        notification.error({
          message: "Failed to join room",
          description: joinResponse.message || "Could not join room",
        });
      }
    } catch (error) {
      console.error("Join room error:", error);
      notification.error({
        message: "Failed to join room",
        description:
          error.response?.data?.message ||
          error.message ||
          "Could not join room",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-black/85 backdrop-blur-md shadow-lg"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/homepage" className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[#FF009F] font-bold text-3xl tracking-wider"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r eigakan-gradient text-[#FF009F]">
                  EIGAKAN
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {/* Thêm nút Dashboard nếu là vai trò cần thiết */}
              {shouldShowDashboardButton && (
                <Link
                  to={getDashboardPath()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === getDashboardPath()
                      ? "text-white bg-[#FF009F]/20 border-b-2 border-[#FF009F]"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}

              {navLinks
                .filter(
                  (link) => !["/", "/favorites", "/history"].includes(link.path)
                )
                .map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      location.pathname === link.path
                        ? "text-white bg-[#FF009F]/20 border-b-2 border-[#FF009F]"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              {isAdmin && (
                <Link
                  to="/admin/persons"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === "/admin/persons"
                      ? "text-white bg-[#FF009F]/20 border-b-2 border-[#FF009F]"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Person Management
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Join Room Button */}
              {token && user && (
                <button
                  onClick={() => setIsJoinRoomModalVisible(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF009F]/10 hover:bg-[#FF009F]/20 text-white transition-all duration-300 border border-[#FF009F]/30 hover:border-[#FF009F]/50 shadow-lg hover:shadow-[#FF009F]/10"
                >
                  <UsersRound className="w-4 h-4 text-[#FF009F]" />
                  <span className="text-sm hidden sm:inline">Join Room</span>
                </button>
              )}

              {/* Search Button */}
              <button
                onClick={toggleSearch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-[#FF009F]/10"
              >
                <Search className="w-4 h-4 text-[#FF009F]" />
                <span className="text-sm hidden sm:inline">Search</span>
              </button>

              {/* User Menu or Login Button */}
              {token && user ? (
                <>
                  <ProfileMenu
                    user={user}
                    showProfileMenu={showProfileMenu}
                    handleLogout={handleLogout}
                    handleProfileClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(!showProfileMenu);
                    }}
                  />
                  {(role === "MEMBER" || user.roleName === "MEMBER") && (
                    <Link
                      to="/subscription-plans"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white transition-all
                      duration-300 ease-in-out shadow-md hover:shadow-[0_0_15px_rgba(255,0,159,0.5)]
                      transform hover:translate-y-[-2px]"
                    >
                      <CrownOutlined />
                      <span>Upgrade Plan</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90 
                  text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 
                  shadow-md hover:shadow-[0_0_15px_rgba(255,0,159,0.3)] transform hover:translate-y-[-2px]"
                >
                  Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 text-white hover:text-[#FF009F] transition-colors bg-white/5 rounded-lg"
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md pt-16 md:hidden"
          >
            <div className="container mx-auto px-4 py-8">
              <nav className="flex flex-col space-y-4">
                {token && user && (
                  <button
                    onClick={() => {
                      setIsJoinRoomModalVisible(true);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <UsersRound className="w-5 h-5 text-[#FF009F]" />
                    <span className="text-lg font-medium">Join Room</span>
                  </button>
                )}

                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      location.pathname === link.path
                        ? "bg-[#FF009F]/20 text-white border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.icon}
                    <span className="text-lg font-medium">{link.label}</span>
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin/persons"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      location.pathname === "/admin/persons"
                        ? "bg-[#FF009F]/20 text-white border-l-4 border-[#FF009F]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-lg font-medium">
                      Person Management
                    </span>
                  </Link>
                )}
              </nav>

              <div className="mt-8 border-t border-white/10 pt-6">
                <button
                  onClick={() => {
                    toggleSearch();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Search className="w-5 h-5 text-[#FF009F]" />
                  <span className="text-lg font-medium">Search</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <Modal
        title="Join Watch Room"
        open={isJoinRoomModalVisible}
        onOk={handleJoinRoom}
        onCancel={() => {
          setRoomId("");
          setIsJoinRoomModalVisible(false);
        }}
        okText="Join"
        cancelText="Cancel"
        okButtonProps={{
          loading: isJoining,
          disabled: isJoining || !roomId.trim(),
        }}
        cancelButtonProps={{ disabled: isJoining }}
      >
        <div className="mt-4">
          {hostedRooms.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Your active room:</p>
              {hostedRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2"
                >
                  <span className="font-medium text-sm truncate max-w-[200px]">
                    {room.id}
                  </span>
                  <button
                    className="text-blue-500 text-sm hover:text-blue-700"
                    onClick={() => setRoomId(room.id)}
                  >
                    Use this room
                  </button>
                </div>
              ))}
            </div>
          )}
          <Input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={isJoining}
          />
        </div>
      </Modal>

      {/* Search Overlay */}
      {showSearch && <SearchBar onClose={toggleSearch} />}
    </>
  );
};

export default Navbar;
