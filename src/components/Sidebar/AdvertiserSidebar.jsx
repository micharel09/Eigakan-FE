import { useNavigate, Link, useLocation } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { RiAdvertisementLine, RiSlideshow3Line } from "react-icons/ri";
import {
  FundOutlined,
  FileTextOutlined,
  WalletOutlined,
  DollarOutlined,
  RightOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

function AdvertiserSidebar() {
  const [user, setUser] = useState(authService.getCurrentUser() || {});
  const [adsManagementOpen, setAdsManagementOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auto-open ads management menu if we're on one of its child routes
    const isAdsManagementChildRoute = [
      "/advertiser/ad-management",
      "/advertiser/payment-history",
      "/advertiser/media-management",
    ].some((route) => location.pathname.includes(route));

    if (isAdsManagementChildRoute) {
      setAdsManagementOpen(true);
    }

    const updateUser = () => {
      setUser(authService.getCurrentUser() || {});
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

  const toggleAdsManagement = () => {
    setAdsManagementOpen(!adsManagementOpen);
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
    return location.pathname.includes(path);
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-56 bg-white rounded-r-3xl overflow-hidden">
      <div className="flex flex-col h-full">
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
            ADVERTISER
          </h2>
        </div>

        <ul className="flex flex-col py-4 h-full">
          <li className="flex justify-center items-center">
            <div className="flex flex-col items-center gap-2">
              <img
                src={user?.picture || "/avatar2.jpg"}
                alt="Avatar"
                className="h-16 w-16 rounded-full cursor-pointer border-2 border-gray-300"
              />
              <span className="text-indigo-800 text-sm sm:text-base font-medium mt-2">
                {user?.fullName || "User"}
              </span>
            </div>
          </li>

          <li>
            <Link
              to="/advertiser/dashboard"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <FundOutlined />
              </span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
          </li>

          <li>
            <button
              onClick={toggleAdsManagement}
              className={`flex w-full flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800`}
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <RiSlideshow3Line />
              </span>
              <span className="text-sm font-medium">Ads Management</span>
              <span
                className="ml-auto mr-4 transition-transform duration-300"
                style={{
                  transform: adsManagementOpen
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                }}
              >
                <RightOutlined />
              </span>
            </button>
            <AnimatePresence>
              {adsManagementOpen && (
                <motion.ul
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={menuVariants}
                  className="ml-6 overflow-hidden"
                >
                  <motion.li variants={menuItemVariants}>
                    <Link
                      to="/advertiser/ad-management"
                      className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                        isActive("/advertiser/ad-management")
                          ? "bg-purple-100 text-purple-600 font-medium"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-500 mr-3">
                        <VideoCameraOutlined />
                      </div>
                      <span>Media Management</span>
                    </Link>
                  </motion.li>
                  <motion.li variants={menuItemVariants}>
                    <Link
                      to="/advertiser/payment-history"
                      className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                        isActive("/advertiser/payment-history")
                          ? "bg-blue-100 text-blue-600 font-medium"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-500 mr-3">
                        <FileTextOutlined />
                      </div>
                      <span>Ad Purchase Items</span>
                    </Link>
                  </motion.li>
                  <motion.li variants={menuItemVariants}>
                    <Link
                      to="/advertiser/transactions"
                      className={`flex items-center text-sm py-3 px-4 rounded-lg my-1 ${
                        isActive("/advertiser/transactions")
                          ? "bg-orange-100 text-orange-600 font-medium"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-500 mr-3">
                        <HistoryOutlined />
                      </div>
                      <span>Payment History</span>
                    </Link>
                  </motion.li>
                </motion.ul>
              )}
            </AnimatePresence>
          </li>

          <li>
            <Link
              to="/advertiser/user-wallet"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <WalletOutlined />
              </span>
              <span className="text-sm font-medium">My Wallet</span>
            </Link>
          </li>

          <li>
            <button
              onClick={handleLogout}
              className="flex w-full flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <LogOut className="size-5" />
              </span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </li>

          <li>
            <Link
              to="/homescreen"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
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
              <span className="text-sm font-medium">Back to User Site</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AdvertiserSidebar;
