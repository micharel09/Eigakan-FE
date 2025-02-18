import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../../components/Header/Navbar";
import { Helmet } from "react-helmet";
import UserRegisterApi from "../../apis/UserRegister/UserRegister";
import uploadFileUserRegisterApi from "../../apis/Upload/upload";

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
  const navigate = useNavigate();

  const handleCreateUserRegister = async (email, phoneNumber, reason, file, fullName) => {
    try {
      if (!file) {
        throw new Error("Please upload a file");
      }
  
      setLoading(true);
      setError("");
  
      const files = await uploadFileUserRegisterApi.UploadFile_UserRegister(file);

      if (!files || !files.data || files.data.length === 0) {
        throw new Error("Upload failed, file URL is missing");
      }

      // Lấy tất cả các URL từ mảng data
      const fileUrls = files.data.map(file => file.url);

      // Lấy URL đầu tiên 
      const fileUrl = fileUrls[0]; 

  
      // Gửi request tạo user sau khi upload file thành công
      const userRegisterResponse = await UserRegisterApi.CreateUserRegister(
        email, phoneNumber, reason, fileUrl, fullName
      );
  
      toast.success("User registered successfully!");
      navigate("/login");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCreateUserRegister(email, phone, reason, file, fullName);
  };

  return (
    <div className="min-h-screen pt-20 h-screen w-full hero-bg">
      <Helmet>
        <title>User Register</title>
      </Helmet>
      {/* Navbar */}
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-300 block">
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
              <label htmlFor="fullName" className="text-sm font-medium text-gray-300 block">
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
              <label htmlFor="phone" className="text-sm font-medium text-gray-300 block">
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
              <label htmlFor="reason" className="text-sm font-medium text-gray-300 block">
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
              <label htmlFor="fileUpload" className="text-sm font-medium text-gray-300 block">
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
              className="w-full py-2 bg-red-600 text-white font-semibold rounded-md
              hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          <div className="text-center text-gray-400">
            Already a member?{" "}
            <Link to={"/login"} className="text-red-500 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
