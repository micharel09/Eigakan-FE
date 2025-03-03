import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../../components/Header/Navbar";
import { Helmet } from "react-helmet";
import UserRegisterApi from "../../apis/UserRegister/UserRegister";
import uploadFileApi from "../../apis/Upload/upload.jsx";
import { Spin } from "antd";

const RegisterPage = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const emailValue = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailValue);
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCheckbox, setShowCheckbox] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const navigate = useNavigate();

  const handleCreateUserRegister = async (
    email,
    phoneNumber,
    reason,
    file,
    fullName
  ) => {
    try {
      if (!file) {
        throw new Error("Please upload a file");
      }

      setLoading(true);
      setError("");

      const files = await uploadFileApi.UploadFileTemp(file);

      if (!files || !files.data || files.data.length === 0) {
        throw new Error("Upload failed, file URL is missing");
      }

      const fileUrls = files.data.map((file) => file.url);
      const fileUrl = fileUrls[0];

      const userRegisterResponse = await UserRegisterApi.CreateUserRegister(
        email,
        phoneNumber,
        reason,
        fileUrl,
        fullName
      );

      toast.success("User registered successfully!");
      navigate("/login");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    handleCreateUserRegister(email, phone, reason, file, fullName);
  };

  const handleSignUpClick = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleShowCheckbox = () => {
    setShowCheckbox(true);
  };

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>User Register</title>
      </Helmet>
      <Navbar />

      <div className="flex justify-center items-center mt-20 mx-3">
        <div className="w-full max-w-screen-xl p-8 space-y-6 bg-black/60 rounded-lg shadow-md mx-auto">
          <h1 className="text-center text-white text-2xl font-bold mb-4">
            Sign Up For Publisher
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <form className="space-y-4">
            
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-300 block"
              >
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
                placeholder="you@example.com"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-gray-300 block"
              >
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
                placeholder="John Doe"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-300 block"
              >
                Phone Number
              </label>
              <input
                type="phone"
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
                placeholder="0xxxx"
                id="phoneNumber"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="reason"
                className="text-sm font-medium text-gray-300 block"
              >
                Reason for Registration
              </label>
              <textarea
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
                placeholder="Reason here..."
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="fileUpload"
                className="text-sm font-medium text-gray-300 block"
              >
                Upload File
              </label>
              <input
                type="file"
                className="w-full px-3 py-2 mt-1 border border-gray-700 rounded-md bg-transparent text-white focus:outline-none focus:ring"
                id="fileUpload"
                onChange={(e) => setFile(e.target.files[0])}
                disabled={loading}
                required
              />
            </div>

            <button
              type="button"
              onClick={handleSignUpClick}
              className={`w-full py-3 text-white rounded-lg transition-colors duration-300 
              flex items-center justify-center gap-2
              ${
                loading
                  ? "bg-[#D1007F] cursor-not-allowed"
                  : "bg-[#FF009F] hover:bg-[#D1007F]"
              }`}
              disabled={loading}
            >
              {loading ? (
                <Spin size="default" style={{ color: "white" }} />
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="text-center text-gray-400">
            Already a member?{" "}
            <Link to={"/login"} className="text-[#FF009F] hover:bg-[#D1007F]">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/3 max-h-[80vh] flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-[#FF009F]">
              Terms and Conditions - Eigakan
            </h2>
            <div
              className="flex-grow overflow-y-auto mb-4 pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#FF009F #f0f0f0",
              }}
            >
              <div className="text-gray-700 space-y-2">
                <p>
                  1. By uploading files, you confirm that you own or have the
                  right to use them.
                </p>
                <p>
                  2. You are responsible for the content of the uploaded files
                  and must ensure they do not violate copyright or intellectual
                  property rights.
                </p>
                <p>
                  3. Uploaded files must not contain illegal, harmful, or
                  offensive content.
                </p>
                <p>
                  4. We are not responsible for any content uploaded by users.
                </p>
                <p>
                  5. If any violation is detected, we reserve the right to
                  remove the files without prior notice.
                </p>
                <p>
                  6. You agree that uploaded files may be scanned for violations
                  or harmful content.
                </p>
                <p>
                  7. Uploaded data may be stored and processed for security and
                  compliance purposes.
                </p>
                <p>
                  8. We do not guarantee the availability or backup of uploaded
                  files.
                </p>
                <p>
                  9. Sharing or distributing files that violate our policies may
                  result in account suspension.
                </p>
                <p>
                  10. By using this service, you agree to comply with these
                  terms and all applicable laws.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start mt-4">
              {!showCheckbox && (
                <button
                  onClick={handleShowCheckbox}
                  className="py-2 px-4 bg-[#FF009F] text-white rounded-md hover:bg-[#D1007F] transition-colors duration-300"
                >
                  I have read the terms and conditions
                </button>
              )}
              {showCheckbox && (
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="agree" className="text-sm text-gray-700">
                    I agree to the terms and conditions
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (hasAgreed) {
                    setIsModalOpen(false);
                    handleSubmit();
                  } else {
                    toast.error("You must agree to the terms and conditions.");
                  }
                }}
                className={`py-2 px-4 ${
                  hasAgreed
                    ? "bg-[#FF009F] hover:bg-[#D1007F]"
                    : "bg-gray-400 cursor-not-allowed"
                } text-white rounded-md transition-colors duration-300`}
                disabled={!hasAgreed}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
