import React, { useState, useEffect } from "react";
import { Card, Button, Spin, notification } from "antd";
import subscriptionService from "../../apis/Subscription/subscription";
import { Helmet } from "react-helmet";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const SubscriptionPlans = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isVipMember, setIsVipMember] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkVipStatus();
    fetchPackages();
  }, []);

  const checkVipStatus = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.subscriptionStatus === "Active") {
      setIsVipMember(true);
      setTimeout(() => {
        navigate("/homescreen");
      }, 3000);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
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
        message: "Error",
        description: "Could not fetch subscription packages",
      });
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
        // Lưu subscriptionId vào sessionStorage để dùng cho việc verify sau này
        sessionStorage.setItem('pendingSubscriptionId', packageId);
        // Redirect tới trang thanh toán VNPay
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
        description: error.message || "An error occurred while processing payment",
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
      "Cancel subscription anytime",
    ],
    Premium: [
      "Watch movies in 4K Ultra HD",
      "Watch on 4 devices at a time",
      "Full movies library access",
      "Download movies for offline viewing",
      "Priority customer support",
      "Early access to new releases",
      "Cancel subscription anytime",
    ],
    Standar: [
      "Watch movies in Full HD",
      "Watch on 2 devices at a time",
      "Extended movies access",
      "Standard support",
      "Download selected movies",
      "Cancel subscription anytime",
    ],
  };

  // Sửa lại hàm format tiền VND
  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (isVipMember) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Bạn đã là thành viên VIP!
          </h2>
          <p className="text-gray-400 mb-8">
            Bạn đang có gói subscription đang hoạt động.
            <br />
            Đang chuyển hướng về trang chủ...
          </p>
          <Button
            type="primary"
            onClick={() => navigate("/homescreen")}
            className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
            style={{ backgroundColor: "#FF009F" }}
          >
            Về trang chủ ngay
          </Button>
        </div>
      </div>
    );
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
                      /{pkg.duration} ngày
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
            * Tất cả các gói đều bao gồm quyền truy cập vào thư viện phim
          </p>
          <p className="text-sm">* Giá đã bao gồm thuế VAT</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
