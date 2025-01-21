import React from "react";
import { Helmet } from "react-helmet";
import Navbar from "../../components/Header/Navbar";
import { AiOutlineMail } from "react-icons/ai";

const SignupSuccess = () => {
  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>Check Your Email</title>
      </Helmet>
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-md p-8 space-y-6 bg-black/60 rounded-lg shadow-md text-center">
          <AiOutlineMail className="mx-auto text-6xl text-red-500" />
          <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
          <p className="text-gray-300">
            We've sent you a verification email. Please check your inbox and
            click the verification link.
          </p>
          <p className="text-sm text-gray-400">
            Don't see the email? Check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupSuccess;
