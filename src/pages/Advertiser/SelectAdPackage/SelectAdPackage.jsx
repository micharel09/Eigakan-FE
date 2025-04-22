import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Result, notification } from "antd";
import adPackageService from "../../../apis/AdPackage/adpackage";
import { CheckCircleOutlined, StarFilled } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

const SelectAdPackage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFetchPackages = async () => {
    try {
      setLoading(true);
      const response = await adPackageService.getAllAdPackages();
      console.log("API Response:", response); // Debug log

      if (!response || !response.adPackages) {
        throw new Error("Invalid response format from server");
      }

      setPackages(response.adPackages || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching packages:", err);
      const errorMessage =
        err.message || "An error occurred while loading packages";
      setError(errorMessage);
      notification.error({
        message: "Error Loading Packages",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for authentication
    const token = localStorage.getItem("token");
    if (!token) {
      notification.warning({
        message: "Authentication Required",
        description: "Please log in to view advertising packages",
      });
      navigate("/login", { state: { from: "/advertiser/select-adpackage" } });
      return;
    }

    handleFetchPackages();
  }, [navigate]);

  const handleSelectPackage = (packageId) => {
    navigate(`/advertiser/buy-adslot?packageId=${packageId}`);
  };

  const handleKeyDown = (event, packageId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectPackage(packageId);
    }
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price * 1000); // Assuming price is in thousands
  };

  const getPackageFeatures = (pkg) => [
    `${pkg.minView}-${pkg.maxView} views guaranteed`,
    "Premium Ad Placement",
    "Performance Analytics",
    "24/7 Support",
    "Cancel anytime",
    `${formatVND(pkg.pricePerView)} per view`,
  ];

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-900 flex items-center justify-center"
        role="status"
      >
        <Spin size="large" aria-label="Loading advertising packages" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-gray-900 flex items-center justify-center"
        role="alert"
      >
        <Result status="error" title="Error Occurred" subTitle={error} />
      </div>
    );
  }

  const renderPackageCard = (pkg, index) => {
    const isActive = pkg.status.toLowerCase() === "active";
    const isUltra = pkg.packageName.toLowerCase().includes("ultra");
    const features = getPackageFeatures(pkg);

    return (
      <motion.div
        key={pkg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`relative ${isUltra ? "lg:-mt-4" : ""}`}
      >
        <div
          className={`h-full rounded-2xl p-8 ${
            isUltra
              ? "bg-gradient-to-b from-[#FF009F]/10 to-gray-800 border-2 border-[#FF009F]"
              : "bg-gray-800 border border-gray-700"
          } shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,159,0.2)]`}
        >
          {isUltra && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#FF009F] text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                <StarFilled className="mr-1" /> Most Popular
              </span>
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              {pkg.packageName}
            </h2>
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-5xl font-extrabold text-[#FF009F]">
                {formatVND(pkg.pricePerView)}
              </span>
              <span className="text-gray-400">per view</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8" role="list">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center">
                <CheckCircleOutlined
                  className="text-[#FF009F] mr-3"
                  aria-hidden="true"
                />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSelectPackage(pkg.id)}
            onKeyDown={(e) => handleKeyDown(e, pkg.id)}
            disabled={!isActive}
            className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 
              ${
                isActive
                  ? `${
                      isUltra
                        ? "bg-[#FF009F] hover:bg-[#D1007F] text-white shadow-[0_5px_15px_rgba(255,0,159,0.4)]"
                        : "bg-gray-700 hover:bg-[#FF009F] text-white"
                    }`
                  : "bg-gray-600 cursor-not-allowed text-gray-400"
              }`}
            aria-label={`Select ${pkg.packageName} package`}
          >
            {isActive ? "Get Started" : "Not Available"}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Advertising Packages - Eigakan</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-[#FF009F] to-[#FF009F]/60 bg-clip-text text-transparent">
            Choose Your Advertising Package
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Boost your brand visibility with our premium advertising packages.
            Select the perfect plan to reach your target audience effectively.
          </p>
        </div>

        {packages.length === 0 ? (
          <Result
            status="info"
            title="No Advertising Packages"
            subTitle="There are currently no advertising packages available. Please check back later."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {packages.map((pkg, index) => renderPackageCard(pkg, index))}
          </div>
        )}

        <footer className="mt-12 text-center space-y-1">
          <p className="text-gray-400">* All prices include VAT</p>
          <p className="text-gray-400">
            * Advertisements require approval before display
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SelectAdPackage;
