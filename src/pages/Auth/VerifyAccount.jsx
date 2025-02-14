import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { Helmet } from "react-helmet";
import Navbar from "../../components/Header/Navbar";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    loading: true,
    success: false,
    message: "",
  });

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        const token = searchParams.get("token");
        console.log("Verifying with token:", token);

        if (!token) {
          setStatus({
            loading: false,
            success: false,
            message: "Invalid token",
          });
          return;
        }

        const response = await authService.verify(token);
        console.log("Verify response:", response);
        if (response.success) {
          setStatus({
            loading: false,
            success: true,
            message: response.message || "Account verification successful!",
          });
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (error) {
        console.error("Verify error:", error);
        setStatus({
          loading: false,
          success: false,
          message: error.message || "Verification failed",
        });
      }
    };

    verifyAccount();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>Verify Account</title>
      </Helmet>
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md text-center">
          {status.loading ? (
            <div className="w-16 h-16 border-4 border-red-500 border-dashed rounded-full animate-spin mx-auto" />
          ) : status.success ? (
            <AiOutlineCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          ) : (
            <AiOutlineCloseCircle className="w-16 h-16 text-red-500 mx-auto" />
          )}

          <h1 className="text-2xl font-bold text-white">{status.message}</h1>

          {!status.loading && !status.success && (
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
