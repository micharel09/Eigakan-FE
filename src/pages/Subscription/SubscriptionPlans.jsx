import React, { useState, useEffect } from "react";
import { Card, Button, Spin, notification, Result } from "antd";
import subscriptionService from "../../apis/Subscription/subscription";
import { Helmet } from "react-helmet";
import { CheckCircleOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const SubscriptionPlans = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVipMember, setIsVipMember] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = localStorage.getItem("role");

    if (user.subscriptionStatus === "Active" || role === "VIP MEMBER") {
      setIsVipMember(true);
      setLoading(false);
      navigate("/homescreen", { replace: true });
      return;
    }

    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await subscriptionService.getAllPackages();
      if (response.success) {
        const activePackages =
          response.data?.subscriptionpackage.filter(
            (pkg) => pkg.status === "Active"
          ) || [];
        setPackages(activePackages);
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể tải thông tin gói đăng ký",
      });
      navigate("/homescreen", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (packageId) => {
    if (loading) return;

    try {
      setLoading(true);
      const response = await subscriptionService.createPayment(packageId);

      if (response.success && response.paymentUrl) {
        sessionStorage.setItem("pendingSubscriptionId", packageId);
        window.location.href = response.paymentUrl;
        return;
      }

      notification.error({
        message: "Error",
        description: response.message || "Could not create payment session",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description:
          error.message || "An error occurred while processing payment",
      });
    } finally {
      setLoading(false);
    }
  };

  const packageFeatures = {
    Basic: [
      "Watch movies in HD quality",
      "Watch on 1 device at a time",
      "Limited movies access",
      "Basic support",
    ],
    Premium: [
      "Watch movies in 4K Ultra HD",
      "Full movies library access",
      "Priority customer support",
      "Early access to new releases",
   
    ],
    Standard: [
      "Watch movies in Full HD",
      "Extended movies access",
      "Standard support",
      "Download selected movies",
    
    ],
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (isVipMember) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Subscription Plans - Eigakan</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Get unlimited access to all features with our subscription plans
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
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
                      {formatVND(pkg.price)}
                    </span>
                    <span className="text-gray-400 ml-1">
                      /{pkg.duration} days
                    </span>
                  </div>
                </div>

                <ul className="mb-8 space-y-4">
                  {packageFeatures[pkg.packageName]?.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircleOutlined className="text-[#FF009F] mr-3" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  onClick={() => handleSubscribe(pkg.id)}
                  className="bg-[#FF009F] hover:bg-[#D1007F] border-none h-12 text-lg font-semibold"
                  style={{
                    backgroundColor: "#FF009F",
                  }}
                >
                  Subscribe Now
                </Button>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-400">
          <p className="text-sm">
            * All plans include access to our movie library
          </p>
          {/* <p className="text-sm">* Prices include VAT</p> */}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
