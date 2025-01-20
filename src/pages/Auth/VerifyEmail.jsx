import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import authService from "../../apis/Auth/auth";
import { toast } from "react-hot-toast";
import Navbar from "../../components/Header/Navbar";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your account...");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log("Token from params:", token);

        if (!token) {
          setMessage("No verification token found!");
          setIsVerifying(false);
          return;
        }

        const response = await authService.verifyEmail(token);
        console.log("API Response:", response);

        if (response?.status === 200) {
          setMessage("Email verified successfully!");
          toast.success("Email verified successfully! You can now login.");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setMessage(
            "Verification failed. Please try again or contact support."
          );
          toast.error("Verification failed!");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setMessage("Verification failed. Please try again or contact support.");
        toast.error("Verification failed!");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

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
