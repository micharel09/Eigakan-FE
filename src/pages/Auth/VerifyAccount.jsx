import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { Helmet } from "react-helmet";
import Navbar from "../../components/Header/Navbar";
import { Spin } from "antd";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    loading: true,
    success: false,
    message: "",
  });
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        const token = searchParams.get("token");
        if (!token) {
          setStatus({
            loading: false,
            success: false,
            message: "Invalid token",
          });
          return;
        }

        await authService.verify(token);
        setStatus({
          loading: false,
          success: true,
          message: "Account verification successful!",
        });
        setTimeout(() => navigate("/homescreen"), 3000);
      } catch (error) {
        setStatus({
          loading: false,
          success: false,
          message: error.message || "Verification failed",
        });
      }
    };

    verifyAccount();
  }, [searchParams, navigate]);

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      await authService.resendVerificationCode();
      setStatus({
        loading: false,
        success: false,
        message: "Verification code resent. Please check your email.",
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: error.message || "Failed to resend verification code",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>Verify Account</title>
      </Helmet>
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md text-center">
          {status.loading ? (
            <div className="w-16 h-16 border-4 border-[#FF009F] border-dashed rounded-full animate-spin mx-auto" />
          ) : status.success ? (
            <AiOutlineCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          ) : (
            <AiOutlineCloseCircle className="w-16 h-16 text-red-500 mx-auto" />
          )}

          <h1 className="text-2xl font-bold text-white">{status.message}</h1>

          {!status.loading && !status.success && (
            <button
              type="submit"
              className="w-full py-3 bg-[#FF009F] hover:bg-[#D1007F] text-white rounded-lg
              transition-colors duration-300 flex items-center justify-center gap-2"
              disabled={status.loading}
            >
              {status.loading ? <Spin size="small" /> : "Verify Account"}
            </button>
          )}

          {!status.loading && !status.success && (
            <button
              onClick={handleResendCode}
              className="text-[#FF009F] hover:text-[#D1007F] transition-colors"
              disabled={resendLoading}
            >
              Resend verification code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
