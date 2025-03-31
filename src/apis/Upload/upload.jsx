import axios from "axios";
import cloudinaryConfig from "../../config/cloudinary";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/Upload";

const uploadFileApi = {
  async UploadFileTemp(file) {
    try {
      const formData = new FormData();
      formData.append("formFiles", file);

      // Log FormData để kiểm tra
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      // Gửi request mà không cần set Content-Type
      const res = await axios.post(`${API_URL}/UploadFileTemp`, formData);

      console.log("Response từ server:", res.data); // Log kết quả từ server

      return res.data; // Trả về kết quả sau khi upload thành công
    } catch (err) {
      console.error("Lỗi upload:", err); // Log lỗi chi tiết
      throw err.response?.data || { message: "Upload failed" };
    }
  },

  async UploadFileContractTemp(file) {
    try {
      const formData = new FormData();
      formData.append("formFiles", file);

      const res = await axios.post(
        `${API_URL}/UploadFileContractTemp`,
        formData
      );

      return res.data;
    } catch (err) {
      console.error("Lỗi upload:", err);
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

  async getPreFileUrlTemp(Id, fileName) {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/GetPreFileTemp`, {
        params: { Id, fileName },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching PreFileUrl:", error);
      return error.response?.data || "An error occurred";
    }
  },

  async getPreFileUrl(userId, fileName) {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/GetPreFileUrl`, {
        params: { userId, fileName },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching PreFileUrl:", error);
      return error.response?.data || "An error occurred";
    }
  },

  async getPreFileUrlMovie(movieId, fileName) {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/GetPreFileUrlMovie`, {
        params: { movieId, fileName },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching PreFileUrl:", error);
      return error.response?.data || "An error occurred";
    }
  },

  async getPreFileContract(userId, fileName) {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/GetPreFileContract`, {
        params: { userId, fileName },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching PreFileUrl:", error);
      return error.response?.data || "An error occurred";
    }
  },

  async UploadVideo(file) {
    return new Promise((resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append("formFiles", file);

        // Log file details
        console.log("Uploading file:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        // Use XMLHttpRequest for more control
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/upload_VideoBunny`, true);

        // Don't set any content type - let the browser set it with the correct boundary

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log("Video upload response:", response);
              resolve(response);
            } catch (e) {
              console.error("Error parsing response:", e);
              console.log("Raw response:", xhr.responseText);
              resolve({
                status: true,
                data: xhr.responseText,
              });
            }
          } else {
            console.error("Upload failed with status:", xhr.status);
            console.error("Response text:", xhr.responseText);
            reject({
              message: `Upload failed with status: ${xhr.status}`,
              response: xhr.responseText,
            });
          }
        };

        xhr.onerror = function () {
          console.error("XHR error");
          reject({
            message: "Network error during upload",
          });
        };

        // Add progress tracking
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            console.log(`Upload progress: ${percentComplete.toFixed(2)}%`);
          }
        };

        // Send the FormData object
        xhr.send(formData);
      } catch (err) {
        console.error("Video upload error:", err);
        reject({ message: err.message || "Video upload failed" });
      }
    });
  },

  async UploadVideoAlternative(file) {
    try {
      const formData = new FormData();
      formData.append("formFiles", file); // Use the same key as image upload

      // Use the same approach as image upload
      const res = await axios.post(`${API_URL}/upload_VideoBunny`, formData, {
        headers: {
          // Let the browser set the content type with boundary
        },
      });

      console.log("Video upload response (axios):", res.data);

      return res.data;
    } catch (err) {
      console.error("Video upload error:", err);
      if (err.response) {
        console.error(
          "Error response:",
          err.response.status,
          err.response.data
        );
      }
      throw err.response?.data || { message: "Video upload failed" };
    }
  },

  async UploadVideoAsBase64(file) {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);

      // Send as JSON instead of FormData
      const payload = {
        fileName: file.name,
        contentType: file.type,
        base64Content: base64,
      };

      console.log("Sending video as base64 JSON");

      const res = await axios.post(`${API_URL}/upload_VideoBunny`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Video upload response (base64):", res.data);

      return res.data;
    } catch (err) {
      console.error("Video upload error (base64):", err);
      if (err.response) {
        console.error(
          "Error response:",
          err.response.status,
          err.response.data
        );
      }
      throw err.response?.data || { message: "Video upload failed" };
    }
  },

  // Helper method to convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        let base64 = reader.result.toString();
        base64 = base64.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  },

  // Thêm phương thức mới để tải video trực tiếp lên Cloudinary
  async UploadVideoToCloudinary(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", cloudinaryConfig.unsignedUploadPreset); // Sử dụng preset đã tạo cho unsigned upload
      formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
      formData.append("resource_type", "video");

      console.log("Tải video lên Cloudinary trực tiếp:", file.name);
      console.log(
        "Sử dụng upload preset:",
        cloudinaryConfig.unsignedUploadPreset
      );

      // Gửi trực tiếp đến Cloudinary API, không qua backend
      // Sử dụng unsigned upload API của Cloudinary (không cần API secret)
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/auto/upload`,
        formData
      );

      console.log("Kết quả tải video lên Cloudinary:", res.data);

      return {
        status: true,
        data: [{ url: res.data.secure_url }],
      };
    } catch (err) {
      console.error("Lỗi khi tải video lên Cloudinary:", err);
      if (err.response) {
        console.error(
          "Thông tin lỗi từ Cloudinary:",
          err.response.status,
          err.response.data
        );
      }
      throw { message: err.message || "Tải video lên thất bại" };
    }
  },
};
export default uploadFileApi;
