import React, { useEffect, useState } from "react";
import { Result, Spin, Button } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        // Lấy tất cả query params từ URL
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
      } catch (error) {
        console.error("Payment verification failed:", error);
        setPaymentInfo({ success: false });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  // Thêm hàm format tiền VND
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
            <span className="text-gray-400">
              {paymentInfo?.message || "Transaction has been processed"}
            </span>
          }
          extra={[
            <div key="details" className="text-left mb-6">
              {paymentInfo?.success && paymentInfo?.data && (
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="font-semibold">Mã giao dịch:</span>{" "}
                    {paymentInfo.data.transactionId}
                  </p>
                  <p>
                    <span className="font-semibold">Số tiền:</span>{" "}
                    {formatVND(paymentInfo.data.amount)}
                  </p>
                  <p>
                    <span className="font-semibold">Gói dịch vụ:</span>{" "}
                    {paymentInfo.data.packageName}
                  </p>
                  <p>
                    <span className="font-semibold">Thời hạn:</span>{" "}
                    {paymentInfo.data.duration} ngày
                  </p>
                  <p>
                    <span className="font-semibold">Ngày thanh toán:</span>{" "}
                    {new Date(paymentInfo.data.paymentDate).toLocaleString(
                      "vi-VN"
                    )}
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
};

export default PaymentSuccess;
