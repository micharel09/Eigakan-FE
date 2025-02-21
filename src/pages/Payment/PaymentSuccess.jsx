import React, { useEffect, useState, useRef } from "react";
import { Result, Spin, Button } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const navigate = useNavigate();
  const apiCalled = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      // Nếu đã có kết quả thành công hoặc đã gọi API rồi thì không gọi nữa
      if (apiCalled.current) return;

      try {
        apiCalled.current = true; // Đánh dấu là đã gọi API
        const token = localStorage.getItem("token");
        const queryString = Array.from(searchParams.entries())
          .map(([key, value]) => `${key}=${value}`)
          .join("&");

        const response = await axios.get(
          `https://eigakan1111-001-site1.qtempurl.com/api/SubscriptionPurchasePayment/vnpay-return?${queryString}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setPaymentInfo(response.data);

        // Nếu thanh toán thành công, cập nhật user info
        if (response.data.success) {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          user.subscriptionStatus = "Active";
          user.roleName = "VIP MEMBER";
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("role", "VIP MEMBER");

          // Dispatch một custom event
          window.dispatchEvent(new Event("userRoleChanged"));
        }
      } catch (error) {
        setPaymentInfo({
          success: false,
          message:
            error.response?.data?.message || "Payment verification failed",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []); // Chỉ chạy một lần khi component mount

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <Result
          icon={
            paymentInfo?.success ? (
              <CheckCircleFilled className="text-6xl text-green-500" />
            ) : (
              <CloseCircleFilled className="text-6xl text-red-500" />
            )
          }
          title={
            <span className="text-white text-2xl">
              {paymentInfo?.success ? "Payment Successful!" : "Payment Failed"}
            </span>
          }
          subTitle={
            <span className="text-gray-400">{paymentInfo?.message}</span>
          }
          extra={[
            <div key="details" className="text-left mb-6">
              {paymentInfo?.success && paymentInfo?.data && (
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="font-semibold">Transaction ID:</span>{" "}
                    {paymentInfo.data.id}
                  </p>
                  <p>
                    <span className="font-semibold">Amount:</span>{" "}
                    {formatVND(paymentInfo.data.totalPrice)}
                  </p>
                  <p>
                    <span className="font-semibold">Expiry Date:</span>{" "}
                    {new Date(paymentInfo.data.expiredDate).toLocaleDateString(
                      "en-US"
                    )}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {paymentInfo.data.status}
                  </p>
                </div>
              )}
            </div>,
            <Button
              type="primary"
              onClick={() => navigate("/homescreen")}
              className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
              style={{ backgroundColor: "#FF009F" }}
            >
              Back to Home
            </Button>,
          ]}
        />
      </div>
    </div>
  );
}

export default PaymentSuccess;
