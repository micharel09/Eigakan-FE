import { useNavigate, Link } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { RiAdvertisementLine } from "react-icons/ri";
import { FundOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

function AdvertiserSidebar() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getCurrentUser());
    };

    authService.addListener(updateUser);

    return () => {
      authService.removeListener(updateUser);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
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
                src={user.picture || "/avatar2.jpg"}
                alt="Avatar"
                className="h-16 w-16 rounded-full cursor-pointer border-2 border-gray-300"
              />
              <span className="text-indigo-800 text-sm sm:text-base font-medium mt-2">
                {user.fullName}
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
            <Link
              to="/advertiser/advertisement"
              className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-500 hover:text-gray-800"
            >
              <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                <RiAdvertisementLine />
              </span>
              <span className="text-sm font-medium">Advertisement</span>
            </Link>
          </li>

          <li>
            <Link
              to="#"
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
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
                  />
                </svg>
              </span>
              <span className="text-sm font-medium">Notifications</span>
              <span className="ml-auto mr-6 text-sm bg-red-100 rounded-full px-2 py-px text-red-500">
                5
              </span>
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
