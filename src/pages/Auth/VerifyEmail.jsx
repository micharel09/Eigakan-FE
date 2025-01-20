import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import authService from "../../apis/Auth/auth";
import { toast } from "react-hot-toast";
import Navbar from "../../components/Header/Navbar";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your account...");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Lấy token từ URL
        let token = "";
        const pathname = location.pathname;

        if (pathname.includes("Auth/Verify/")) {
          token = pathname.split("Auth/Verify/")[1];
        } else {
          // Lấy token trực tiếp từ URL (trường hợp của bạn)
          token = pathname.substring(1); // Bỏ dấu / ở đầu
        }

        // Chuyển token về chữ hoa để match với BE
        token = token.toUpperCase();

        console.log("Token to verify:", token);

        if (!token) {
          setMessage("No verification token found!");
          setIsVerifying(false);
          return;
        }

        // Gọi API verify
        const response = await authService.verifyEmail(token);
        console.log("API Response:", response);

        if (response?.status === 200) {
          setMessage("Email verified successfully!");
          toast.success("Email verified successfully! You can now login.");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setMessage(
            "Verification failed. Please try again or contact support."
          );
          toast.error(response?.data?.message || "Verification failed!");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setMessage("Verification failed. Please try again or contact support.");
        toast.error("Verification failed!");
      } finally {
        setIsVerifying(false);
      }
    };

    // Chỉ verify khi có pathname
    if (location.pathname.length > 1) {
      verifyEmail();
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 rounded-lg bg-gray-800">
          <h2 className="text-2xl font-bold text-white mb-4">{message}</h2>
          {isVerifying && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          )}
          {!isVerifying && message.includes("successfully") && (
            <p className="text-gray-300">
              Redirecting to login page in 3 seconds...
            </p>
          )}
          {!isVerifying && !message.includes("successfully") && (
            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
