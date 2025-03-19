import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Result, notification, Card, Button } from "antd";
import adSlotService from "../../../apis/AdSlot/adslot";
import { CheckCircleOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";

const SelectAdPackage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFetchPackages = async () => {
    try {
      const response = await adSlotService.getAllAdPackages();
      if (!response.success) {
        throw new Error(
          response.message || "Could not load advertising packages"
        );
      }
      setPackages(response.data);
    } catch (err) {
      const errorMessage =
        err.message || "An error occurred while loading packages";
      setError(errorMessage);
      notification.error({
        message: "Error",
        description: errorMessage,
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchPackages();
  }, []);

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
    }).format(price);
  };

  const packageFeatures = {
    default: [
      "Premium Ad Placement",
      "Performance Analytics",
      "Reach Large Audience",
      "24/7 Support",
      "Cancel anytime",
    ],
  };

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

  const renderPackageCard = (pkg) => {
    const isActive = pkg.status === "ACTIVE";
    const features =
      packageFeatures[pkg.packageName] || packageFeatures.default;

    return (
      <div
        key={pkg.id}
        className="transform hover:scale-105 transition-transform duration-300"
      >
        <Card
          className="h-full bg-gray-800 border-gray-700 shadow-xl rounded-2xl overflow-hidden hover:border-[#FF009F]"
          bodyStyle={{ padding: "2rem" }}
          style={{ background: "#1f2937" }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {pkg.packageName}
            </h2>
            <div className="flex justify-center items-baseline mb-4">
              <span className="text-5xl font-extrabold text-[#FF009F]">
                {formatVND(pkg.packPrice)}
              </span>
              <span className="text-gray-400 ml-1">
                /{pkg.duration} {pkg.duration > 1 ? "months" : "month"}
              </span>
            </div>
          </div>

          <ul className="mb-8 space-y-4" role="list">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <CheckCircleOutlined
                  className="text-[#FF009F] mr-3"
                  aria-hidden="true"
                />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
            <li className="flex items-center">
              <CheckCircleOutlined
                className="text-[#FF009F] mr-3"
                aria-hidden="true"
              />
              <span className="text-gray-300">
                {pkg.duration} {pkg.duration > 1 ? "months" : "month"} display
                period
              </span>
            </li>
          </ul>

          <Button
            type="primary"
            size="large"
            block
            disabled={!isActive}
            onClick={() => handleSelectPackage(pkg.id)}
            onKeyDown={(e) => handleKeyDown(e, pkg.id)}
            tabIndex={0}
            aria-label={`Select ${pkg.packageName} package`}
            className={`h-12 text-lg font-semibold transition-all duration-200 ${
              isActive
                ? "bg-[#FF009F] hover:bg-[#D1007F] border-none shadow-lg hover:shadow-[0_5px_15px_rgba(255,0,159,0.4)]"
                : "bg-gray-600 cursor-not-allowed"
            }`}
            style={{
              backgroundColor: isActive ? "#FF009F" : undefined,
            }}
          >
            {isActive ? "Select Package" : "Not Available"}
          </Button>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Advertising Packages - Eigakan</title>
      </Helmet>

      <main className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Advertising Package
          </h1>
          <p className="text-xl text-gray-400">
            Promote your brand to thousands of viewers with our premium
            advertising options
          </p>
        </div>

        {packages.length === 0 ? (
          <Result
            status="info"
            title="No Advertising Packages"
            subTitle="There are currently no advertising packages available. Please check back later."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map(renderPackageCard)}
          </div>
        )}

        <footer className="mt-12 text-center text-gray-400">
          <p className="text-sm">* All prices include VAT</p>
          <p className="text-sm">
            * Advertisements require approval before display
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SelectAdPackage;
