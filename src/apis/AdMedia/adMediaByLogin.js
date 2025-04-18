import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_MEDIA;

const adMediaByLoginService = {
  getAdMediaByLogin: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetAdMediaByLogin?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  uploadAdMedia: (file) =>
    makeAuthenticatedRequest(async (headers) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/UploadAdMedia`,
        formData,
        { 
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      return response.data;
    }),
};

export default adMediaByLoginService;
