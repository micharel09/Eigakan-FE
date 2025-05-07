import { useNavigate, Link, useLocation } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import {
  HistoryOutlined,
  YoutubeOutlined,
  FundOutlined,
  AuditOutlined,
  IdcardOutlined,
  DownOutlined,
  UpOutlined,
  DollarOutlined,
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

// Add CSS for hiding scrollbar while maintaining functionality
const hideScrollbarStyle = {
  /* For Firefox */
  scrollbarWidth: "none",
  /* For IE and Edge */
  msOverflowStyle: "none",
  /* For Chrome, Safari, and Opera */
  "&::-webkit-scrollbar": {
    display: "none",
  },
};

function AdminSidebar() {
  const [user, setUser] = useState(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  }, []);

  useEffect(() => {
    // Auto-open dashboard menu if we're on one of its child routes
    const isDashboardChildRoute = [
      "/dashboard",
      "/admin/subscription-orders",
      "/admin/ad-history",
      "/admin/movie-earning",
      "/admin/user-earning",
    ].some((route) => location.pathname.includes(route));

    if (isDashboardChildRoute) {
      setDashboardOpen(true);
    }

    const updateUser = () => {
      setUser(authService.getCurrentUser());
    };

    authService.addListener(updateUser);

    return () => {
      authService.removeListener(updateUser);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const toggleDashboard = () => {
    setDashboardOpen(!dashboardOpen);
  };

  // Animation variants for dropdown menu
  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  const menuVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
  };

  // Check if current path is active
  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === "/user") {
      return (
        location.pathname.startsWith("/user/") || location.pathname === "/user"
      );
    }

    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-row bg-gray-100">
      <div className="flex flex-col w-56 bg-white rounded-r-3xl overflow-hidden shadow-lg">
        <div className="relative flex items-center justify-center h-20 shadow-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="eigakan-gradient text-[#FF009F] font-bold text-2xl"
          >
            EIGAKAN
          </motion.div>

          <h2 className="absolute bottom-1 right-2 text-gray-500 text-xs">
            ADMIN
          </h2>
        </div>

        {/* Main sidebar structure with flex layout */}
        <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
          {/* Scrollable menu area */}
          <div
            className="flex-grow overflow-y-auto py-4"
            style={hideScrollbarStyle}
          >
            {/* avatar + name */}
            <div className="flex justify-center items-center mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img
                    src={user?.picture || "/avatar2.jpg"}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full cursor-pointer border-2 border-gray-300 object-cover shadow-md hover:shadow-lg transition-all duration-200"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-indigo-800 text-sm sm:text-base font-medium mt-2">
                  {user?.fullName || "User"}
                </span>
              </div>
            </div>

            {/* Menu items */}
            <ul className="flex flex-col">
              <li>
                <button
                  onClick={toggleDashboard}
                  className={`flex w-full flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/dashboard") ||
                    isActive("/admin/subscription-orders") ||
                    isActive("/admin/ad-history") ||
                    isActive("/admin/movie-earning") ||
                    isActive("/admin/user-earning")
                      ? "bg-purple-50 text-purple-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <FundOutlined />
                  </span>
                  <span className="ml-3 text-sm font-medium">Dashboard</span>
                  <span
                    className="ml-auto transition-transform duration-300"
                    style={{
                      transform: dashboardOpen
                        ? "rotate(90deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    <RightOutlined />
                  </span>
                </button>
                <AnimatePresence>
                  {dashboardOpen && (
                    <motion.ul
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={menuVariants}
                      className="ml-6 overflow-hidden"
                    >
                      <motion.li variants={menuItemVariants}>
                        <Link
                          to="/dashboard"
                          className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                            isActive("/dashboard")
                              ? "bg-purple-100 text-purple-600 font-medium"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-500 mr-3">
                            <PieChartOutlined />
                          </div>
                          <span>Overview</span>
                        </Link>
                      </motion.li>
                      <motion.li variants={menuItemVariants}>
                        <Link
                          to="/admin/subscription-orders"
                          className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                            isActive("/admin/subscription-orders")
                              ? "bg-blue-100 text-blue-600 font-medium"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                            <BarChartOutlined />
                          </div>
                          <span>Subscription Orders</span>
                        </Link>
                      </motion.li>
                      <motion.li variants={menuItemVariants}>
                        <Link
                          to="/admin/ad-history"
                          className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                            isActive("/admin/ad-history")
                              ? "bg-orange-100 text-orange-600 font-medium"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-500 mr-3">
                            <HistoryOutlined />
                          </div>
                          <span>Ad History</span>
                        </Link>
                      </motion.li>
                      <motion.li variants={menuItemVariants}>
                        <Link
                          to="/admin/movie-earning"
                          className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                            isActive("/admin/movie-earning")
                              ? "bg-green-100 text-green-600 font-medium"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-500 mr-3">
                            <DollarOutlined />
                          </div>
                          <span>Movie Earning</span>
                        </Link>
                      </motion.li>
                      <motion.li variants={menuItemVariants}>
                        <Link
                          to="/admin/user-earning"
                          className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                            isActive("/admin/user-earning")
                              ? "bg-red-100 text-red-600 font-medium"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-500 mr-3">
                            <LineChartOutlined />
                          </div>
                          <span>User Earning</span>
                        </Link>
                      </motion.li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>

              <li>
                <Link
                  to="/user"
                  className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/user")
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  </span>
                  <span className="ml-3 text-sm font-medium">User</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/userRegister"
                  className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/userRegister")
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <IdcardOutlined />
                  </span>
                  <span className="ml-3 text-sm font-medium">
                    User Register
                  </span>
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/contract"
                  className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/admin/contract")
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <AuditOutlined />
                  </span>
                  <span className="ml-3 text-sm font-medium">Contract</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/movieAdmin"
                  className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/admin/movieAdmin")
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <YoutubeOutlined />
                  </span>
                  <span className="ml-3 text-sm font-medium">Movie</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/genres"
                  className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/admin/genres")
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                      />
                    </svg>
                  </span>
                  <span className="ml-3 text-sm font-medium">Genres</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/persons"
                  className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/admin/persons")
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  </span>
                  <span className="ml-3 text-sm font-medium">Actor</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/payment-policy"
                  className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg my-1 ${
                    isActive("/admin/payment-policy")
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                      />
                    </svg>
                  </span>
                  <span className="ml-3 text-sm font-medium">
                    Payment Policy
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Fixed bottom actions - always visible */}
          <div className="flex-shrink-0 pt-4 pb-3 border-t border-gray-200 bg-white shadow-inner relative z-10">
            <button
              onClick={handleLogout}
              className="flex w-full flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg mb-1 text-gray-600 hover:text-red-500 group"
            >
              <span className="inline-flex items-center justify-center h-8 w-8 text-lg group-hover:text-red-500">
                <LogOut className="size-5" />
              </span>
              <span className="ml-3 text-sm font-medium">Logout</span>
            </button>

            <Link
              to="/homescreen"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 px-4 rounded-lg mt-1 text-gray-600 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-8 w-8 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                  />
                </svg>
              </span>
              <span className="ml-3 text-sm font-medium">
                Back to User Site
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;
