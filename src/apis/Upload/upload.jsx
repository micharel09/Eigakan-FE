import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Upload";

const uploadFileApi = {
   
    async UploadFile_UserRegister(file) {
        try {
          const formData = new FormData();
          formData.append("formFiles", file); // Đảm bảo key "file" trùng với yêu cầu của backend
    
          // Log FormData để kiểm tra
          for (let pair of formData.entries()) {
            console.log(pair[0] + ": " + pair[1]);
          }
    
          // Gửi request mà không cần set Content-Type
          const res = await axios.post(`${API_URL}/UploadFile_UserRegister`, formData);
    
          console.log("Response từ server:", res.data); // Log kết quả từ server
    
          return res.data; // Trả về kết quả sau khi upload thành công
        } catch (err) {
          console.error("Lỗi upload:", err); // Log lỗi chi tiết
          throw err.response?.data || { message: "Upload failed" };
        }
    },

    async UploadPicture(file) {
      try {
        const formData = new FormData();
        formData.append("formFiles", file); // Đảm bảo key "file" trùng với yêu cầu của backend
  
        const res = await axios.post(`${API_URL}/Upload_Pictures`, formData);
  
        console.log("Response từ server:", res.data); // Log kết quả từ server
  
        return res.data; // Trả về kết quả sau khi upload thành công
      } catch (err) {
        console.error("Lỗi upload:", err); // Log lỗi chi tiết
        throw err.response?.data || { message: "Upload failed" };
      }
  },


    async getPreFileUrl(userId, fileName) {
      try {
        const token = localStorage.getItem('token');
    
        const res = await axios.get(`${API_URL}/GetPreFileUrl`, {
          params: { userId, fileName },  
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
    
        return res.data; 
      } catch (error) {
        console.error("Error fetching PreFileUrl:", error);
        return error.response?.data || "An error occurred"; 
      }
    }
    
};
export default uploadFileApi;
